#!/usr/bin/env python3
import torch
import torch.nn as nn
import numpy as np
import chess

# --------------------------------------------------
# Constants
# --------------------------------------------------
DEFAULT_NUM_FEATURES = 45056  # halfKAv2 max features
SQUARE_NB = 64
SHIFT = 6
CLAMP_MIN = 0
CLAMP_MAX = 127

L1 = 512  # each side has 512 main + 8 psqt => 520
L2 = 16
L3 = 32

# --------------------------------------------------
# halfkav2_orient & halfkav2_index
# --------------------------------------------------
@torch.jit.script  # (Optional) JIT-compile for speed
def halfkav2_orient(is_white_pov: bool, sq: int) -> int:
    """If white POV, return sq. If black POV, return (56 ^ sq)."""
    if is_white_pov:
        return sq
    else:
        return 56 ^ sq

@torch.jit.script
def halfkav2_index(is_white_pov: bool, king_sq: int, sq: int, piece_type: int, piece_color_white: bool) -> int:
    """
    Compute halfKAv2 index for piece (type!=KING).
      piece_type in [1..6]
      piece_color_white = True if piece is white, else False
    Return -1 if the piece is a king or if something invalid.

    p_idx = (piece_type-1)*2 + (piece_color != is_white_pov)
    if p_idx == 11 => skip it (king plane)
    """
    # Exclude king
    if piece_type == 6:
        return -1  # no king

    p_idx = (piece_type - 1) * 2
    if piece_color_white != is_white_pov:
        p_idx += 1
    # skip 12th plane
    if p_idx == 11:
        p_idx -= 1  # skip the actual king plane

    oriented_sq = halfkav2_orient(is_white_pov, sq)
    oriented_kingsq = halfkav2_orient(is_white_pov, king_sq)

    # 11 piece planes * 64 squares = 704
    # final = oriented_sq + p_idx*64 + oriented_kingsq*(64*11)
    return oriented_sq + p_idx*64 + oriented_kingsq*704

# --------------------------------------------------
# NNUEAccumulator
# --------------------------------------------------
class NNUEAccumulator:
    """
    Maintains a single [1, 1040] float32 array:
      [white_main=512 + white_psqt=8 + black_main=512 + black_psqt=8]
    Provides an incremental 'update()' that adds/subtracts piece features.
    """

    def __init__(self,
                 weights_file="weights1/raw_input_weight_i16.npy",
                 bias_file="weights1/raw_input_bias_i16.npy",
                 psqt_file="weights1/raw_input_psqt_i32.npy"):
        # Load integer-based arrays
        self.weights = np.load(weights_file).astype(np.int16)  # shape: (num_features, ?)
        self.bias    = np.load(bias_file).astype(np.int16)     # shape: (?)
        self.psqt    = np.load(psqt_file).astype(np.int32)     # shape: (num_features,) or similar

        # The accumulator
        self.accum = np.zeros((1, 1040), dtype=np.float32)

    def update(self, accum, turn: bool, move, kings):
        """
        Incrementally update 'accum' based on the move made.
          move = (from_sq, from_piece, to_sq, to_piece/captured)
          kings = (our_king_sq, opp_king_sq) from the perspective of 'turn'
                  e.g. if turn=True (white), kings[0] = white_king, kings[1] = black_king
        Returns new_accum shape [1, 1040].
        """
        from_sq, from_pc, to_sq, to_pc = move
        our_king, opp_king = kings

        new_accum = np.empty_like(accum, dtype=np.float32)

        # Slices
        WM_SLICE = slice(0, 512)
        WP_SLICE = slice(512, 520)
        BM_SLICE = slice(520, 1032)
        BP_SLICE = slice(1032, 1040)

        # Get piece info as integers so we can JIT or vectorize
        from_type = from_pc.piece_type  # 1..6
        from_white = from_pc.color      # True/False
        # 'to_pc' might be None => handle safely
        to_type = to_pc.piece_type if to_pc else -1
        to_white = to_pc.color if to_pc else True

        # Indices "FROM"
        idx_from_w = halfkav2_index(turn, our_king, from_sq, from_type, from_white)
        idx_from_b = halfkav2_index(not turn, opp_king, from_sq, from_type, from_white)

        # Indices "TO"
        if to_pc is not None:
            idx_to_w = halfkav2_index(turn, our_king, to_sq, to_type, to_white)
            idx_to_b = halfkav2_index(not turn, opp_king, to_sq, to_type, to_white)
        else:
            idx_to_w = -1
            idx_to_b = -1

        # Promotions? If from_pc is a Pawn moving to last rank, we handle new "queen" index
        # We'll define a small helper to produce the "promoted queen" index
        def promotion_index(is_white_pov, king_sq, sq, is_white):
            # piece_type=5 => queen
            return halfkav2_index(is_white_pov, king_sq, sq, 5, is_white)

        # White promotion
        if from_type == chess.PAWN and turn and (from_sq // 8 == 6):
            idx_to_w_new = promotion_index(turn, our_king, to_sq, True)
            idx_to_b_new = promotion_index(not turn, opp_king, to_sq, True)
        # Black promotion
        elif from_type == chess.PAWN and (not turn) and (from_sq // 8 == 1):
            idx_to_w_new = promotion_index(turn, our_king, to_sq, False)
            idx_to_b_new = promotion_index(not turn, opp_king, to_sq, False)
        else:
            # Normal move => 'to' piece is from_pc
            idx_to_w_new = halfkav2_index(turn, our_king, to_sq, from_type, from_white)
            idx_to_b_new = halfkav2_index(not turn, opp_king, to_sq, from_type, from_white)

        # A fast vectorized "add_sub" using NumPy indexing
        # We do checks inline for speed.
        def add_sub(base, add_idx, sub_idx, array_):
            out = base.copy()
            if 0 <= add_idx < array_.shape[0]:
                out += array_[add_idx]
            if 0 <= sub_idx < array_.shape[0]:
                out -= array_[sub_idx]
            return out

        # White main is old = accum[0][BM_SLICE], plus minus "opponent perspective" indexes
        new_accum[0, WM_SLICE] = add_sub(
            accum[0, BM_SLICE],
            idx_to_b_new,
            idx_from_b,
            self.weights
        )
        # White psqt
        new_accum[0, WP_SLICE] = add_sub(
            accum[0, BP_SLICE],
            idx_to_b_new,
            idx_from_b,
            self.psqt
        )

        # Black main is old = accum[0][WM_SLICE]
        new_accum[0, BM_SLICE] = add_sub(
            accum[0, WM_SLICE],
            idx_to_w_new,
            idx_from_w,
            self.weights
        )
        # Black psqt
        new_accum[0, BP_SLICE] = add_sub(
            accum[0, WP_SLICE],
            idx_to_w_new,
            idx_from_w,
            self.psqt
        )

        # Capture logic: if to_pc exists, subtract the captured piece's feature
        if to_pc is not None:
            if 0 <= idx_to_b < self.weights.shape[0]:
                new_accum[0, WM_SLICE] -= self.weights[idx_to_b]
                new_accum[0, WP_SLICE] -= self.psqt[idx_to_b]
            if 0 <= idx_to_w < self.weights.shape[0]:
                new_accum[0, BM_SLICE] -= self.weights[idx_to_w]
                new_accum[0, BP_SLICE] -= self.psqt[idx_to_w]

        self.accum = new_accum
        return self.accum

    def get_halfka_indices(self, board: chess.Board):
        """
        Build arrays of halfKAv2 indices for [side-to-move, not-side-to-move].
        Skip kings (since halfKAv2 doesn't use them).
        """
        results = []
        for is_white_pov in [board.turn, not board.turn]:
            ksq = board.king(is_white_pov)
            if ksq is None:
                results.append([])
                continue

            idx_list = []
            # Vectorize by collecting piece data in one pass
            for sq, p in board.piece_map().items():
                if p is None or p.piece_type == chess.KING:
                    continue
                idx = halfkav2_index(is_white_pov, ksq, sq, p.piece_type, p.color)
                if idx >= 0:
                    idx_list.append(idx)

            results.append(np.array(idx_list, dtype=np.intp))
        return results

# --------------------------------------------------
# Minimal LayerStacks
# --------------------------------------------------
class LayerStacks(nn.Module):
    def __init__(self, count=1):
        super().__init__()
        self.count = count
        self.l1 = nn.Linear(2*L1, L2*self.count)  # input=1024 => L2=16 => shape=16*count
        self.l2 = nn.Linear(L2, L3*self.count)
        self.output = nn.Linear(L3, 1*self.count)
        self.relu = nn.ReLU()
        self.idx_offset = None

    @torch.no_grad()  # No gradient => faster
    def forward(self, x, layer_stack_indices=None):
        # If you truly need multiple "stacks," keep this logic.
        # If not, you can remove indexing for a speed boost.
        if layer_stack_indices is None:
            layer_stack_indices = torch.zeros(x.shape[0], dtype=torch.long, device=x.device)
        if self.idx_offset is None or self.idx_offset.shape[0] != x.shape[0]:
            self.idx_offset = torch.arange(0, x.shape[0]*self.count, self.count, device=x.device)
        indices = layer_stack_indices + self.idx_offset
        # layer 1
        print(indices)
        l1s_ = self.l1(x)
        # If count=1, no reshape needed. If count>1, do the slice logic.
        l1s_ = l1s_.view(-1, self.count, L2)
        l1c_ = l1s_.view(-1, L2)[indices]
        l1c_ = self.shift_and_clamp(l1c_)
        l1c_ = self.relu(l1c_)

        # layer 2
        l2s_ = self.l2(l1c_)

        l2s_ = l2s_.view(-1, self.count, L3)
        l2c_ = l2s_.view(-1, L3)[indices]


        l2c_ = self.shift_and_clamp(l2c_)
        l2c_ = self.relu(l2c_)

        # output
        l3s_ = self.output(l2c_)
        l3s_ = l3s_.view(-1, self.count, 1)
        l3y_ = l3s_.view(-1, 1)[indices]


        return l3y_

    @staticmethod
    def shift_and_clamp(x: torch.Tensor) -> torch.Tensor:
        # approximate integer logic
        x_int = x.to(torch.int32)
        x_int = x_int >> SHIFT
        x_int = torch.clamp(x_int, CLAMP_MIN, CLAMP_MAX)
        return x_int.to(torch.float32)

    def load_extracted_weights(self):
        # Example if you have extracted .npy weights:
        w1 = np.load("weights1/raw_l1_weight.npy").astype(np.float32)
        b1 = np.load("weights1/raw_l1_bias.npy").astype(np.float32)
        w2 = np.load("weights1/raw_l2_weight.npy").astype(np.float32)
        b2 = np.load("weights1/raw_l2_bias.npy").astype(np.float32)
        w_out = np.load("weights1/raw_out_weight.npy").astype(np.float32)
        b_out = np.load("weights1/raw_out_bias.npy").astype(np.float32)

        self.l1.weight.data = torch.from_numpy(w1)
        self.l1.bias.data   = torch.from_numpy(b1)
        self.l2.weight.data = torch.from_numpy(w2)
        self.l2.bias.data   = torch.from_numpy(b2)
        self.output.weight.data = torch.from_numpy(w_out)
        self.output.bias.data   = torch.from_numpy(b_out)

# --------------------------------------------------
# MyNNUE
# --------------------------------------------------
class MyNNUE(nn.Module):
    """
    A minimal PyTorch NNUE that takes accum=[B,1040] => produces score=[B,1].
    If you do not truly need 'count=8' or multiple stacks, set count=1 for speed.
    """
    def __init__(self, count=1):
        super().__init__()
        self.count = count
        self.layer_stacks = LayerStacks(count=self.count)

    @torch.no_grad()
    def forward(self, accum, psqt_indices=None, layer_stack_indices=None, us=None):
        """
        accum shape: [B, 1040] => first 520 = white side, next 520 = black side.
          each 520 => (512 main + 8 psqt).
        """
        # 1) Split
        w_side = accum[:, :520]   # (B, 520)
        b_side = accum[:, 520:]   # (B, 520)

        # 2) main(512) vs psqt(8)
        w_main, w_psqt = torch.split(w_side, [512, 8], dim=1)
        b_main, b_psqt = torch.split(b_side, [512, 8], dim=1)

        # 3) Combine main => shape (B, 1024)
        main_accum = torch.cat([w_main, b_main], dim=1)
        main_accum = torch.clamp(main_accum, 0, CLAMP_MAX)

        # 4) simple psqt
        # if you do not actually need psqt_indices logic, omit for speed
        if psqt_indices is None:
            # fallback
            psqt_indices = main_accum.new_zeros((main_accum.shape[0],), dtype=torch.long)
        psqt_indices = torch.full((main_accum.shape[0],),
                                    psqt_indices, dtype=torch.long, device=main_accum.device)
        psqt_indices_unsq = psqt_indices.unsqueeze(1)  # (B,1)
        wpsqt = w_psqt.gather(1, psqt_indices_unsq)
        bpsqt = b_psqt.gather(1, psqt_indices_unsq)

        # 5) pass main_accum to layer stacks
        net_out = self.layer_stacks(main_accum, layer_stack_indices=layer_stack_indices)

        # 6) combine with psqt
        if us is None:
            us_ = 0.5
        else:
            us_ = us.view(-1, 1).float()
        # final = net_out + (wpsqt - bpsqt)*(us_ - 0.5)
        final_out = net_out + (wpsqt - bpsqt) * (us_ - 0.5)

        return final_out

# --------------------------------------------------
# Usage Example
# --------------------------------------------------
# if __name__ == "__main__":
#     device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
#     model = MyNNUE(count=1).to(device)
#     model.layer_stacks.load_extracted_weights()
#
#     accum_example = torch.zeros((1, 1040), dtype=torch.float32, device=device)
#     output = model(accum_example)
#     print("Output:", output)
