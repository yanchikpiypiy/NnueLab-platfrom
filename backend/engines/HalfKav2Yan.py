#!/usr/bin/env python3
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import chess
from enum import IntFlag
import random
# ---------------------------
# Constants and Parameters
# ---------------------------
FEATURE_TRANSFORMER_HALF_DIMENSIONS = 520
DEFAULT_NUM_FEATURES = 45056  # total number of feature indices
SQUARE_NB = 64
SHIFT = 6  # for bit-shift if needed
CLAMP_MIN = 0
CLAMP_MAX = 127
L1 = 512  # Here, the input transformer produces 520 features per side (1040 total)
L2 = 16
L3 = 32
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.cuda.manual_seed(SEED)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False  # Ensures no random optimizations
# ---------------------------
# PieceSquare Class
# ---------------------------
class PieceSquare(IntFlag):
    NONE     = 0
    W_PAWN   = 1
    B_PAWN   = 1 * SQUARE_NB + 1
    W_KNIGHT = 2 * SQUARE_NB + 1
    B_KNIGHT = 3 * SQUARE_NB + 1
    W_BISHOP = 4 * SQUARE_NB + 1
    B_BISHOP = 5 * SQUARE_NB + 1
    W_ROOK   = 6 * SQUARE_NB + 1
    B_ROOK   = 7 * SQUARE_NB + 1
    W_QUEEN  = 8 * SQUARE_NB + 1
    B_QUEEN  = 9 * SQUARE_NB + 1
    W_KING   = 10 * SQUARE_NB + 1
    END      = W_KING
    B_KING   = 11 * SQUARE_NB + 1
    END2     = 12 * SQUARE_NB + 1

    @staticmethod
    def from_piece(p: chess.Piece, is_white_pov: bool):
        if p is None:
            return PieceSquare.NONE
        return {
            chess.WHITE: {
                chess.PAWN:   PieceSquare.W_PAWN,
                chess.KNIGHT: PieceSquare.W_KNIGHT,
                chess.BISHOP: PieceSquare.W_BISHOP,
                chess.ROOK:   PieceSquare.W_ROOK,
                chess.QUEEN:  PieceSquare.W_QUEEN,
                chess.KING:   PieceSquare.W_KING,
            },
            chess.BLACK: {
                chess.PAWN:   PieceSquare.B_PAWN,
                chess.KNIGHT: PieceSquare.B_KNIGHT,
                chess.BISHOP: PieceSquare.B_BISHOP,
                chess.ROOK:   PieceSquare.B_ROOK,
                chess.QUEEN:  PieceSquare.B_QUEEN,
                chess.KING:   PieceSquare.B_KING,
            }
        }[p.color == is_white_pov][p.piece_type]

# ---------------------------
# NNUEAccumulator Class
# ---------------------------
class NNUEAccumulator:
    """
    A simplified accumulator that holds the dense 1040-dimensional vector,
    arranged as 520 features for each side.
    Each 520 is split into 512 main features and 8 PSQT features.
    """
    def __init__(self, weights_file="weights/input.weight.npy", bias_file="weights/input.bias.npy"):
        self.weights = np.load(weights_file)  # shape (41024, 256)
        self.bias = np.load(bias_file)          # shape (256,)
        # Initial accumulator: dense vector of 1040 dimensions.
        self.accum = np.zeros((1, 1040), dtype=np.float32)

    def update(self, accum, turn, move, kings):
        from_sq = move[0]
        from_pc = move[1]
        to_sq = move[2]
        to_pc = move[3]
        (our_king, opp_king) = (kings[0], kings[1]) if turn else (kings[1], kings[0])
        self.accum = np.empty_like(accum)
        index_from_w_perspective = self.make_halfka_index(turn, self.orient(turn, our_king), from_sq, from_pc)
        index_from_b_perspective = self.make_halfka_index(not turn, self.orient(not turn, opp_king), from_sq, from_pc)
        if (to_pc is not None):
            index_to_w_perspective = self.make_halfka_index(turn, self.orient(turn, our_king), to_sq, to_pc)
            index_to_b_perspective = self.make_halfka_index(not turn, self.orient(not turn, opp_king), to_sq, to_pc)
        if ((from_pc.piece_type == chess.PAWN) and (to_sq > 55)):
            index_to_w_perspective_new = self.make_halfka_index(turn, self.orient(turn, our_king), to_sq, chess.Piece(chess.QUEEN, chess.WHITE))
            index_to_b_perspective_new = self.make_halfka_index(not turn, self.orient(not turn, opp_king), to_sq, chess.Piece(chess.QUEEN, chess.WHITE))
        elif ((from_pc.piece_type == chess.PAWN) and (to_sq < 8)):
            index_to_w_perspective_new = self.make_halfka_index(turn, self.orient(turn, our_king), to_sq, chess.Piece(chess.QUEEN, chess.BLACK))
            index_to_b_perspective_new = self.make_halfka_index(not turn, self.orient(not turn, opp_king), to_sq, chess.Piece(chess.QUEEN, chess.BLACK))
        else:
            index_to_w_perspective_new = self.make_halfka_index(turn, self.orient(turn, our_king), to_sq, from_pc)
            index_to_b_perspective_new = self.make_halfka_index(not turn, self.orient(not turn, opp_king), to_sq, from_pc)
        self.accum[0][:520] = accum[0][520:1040] + self.weights[index_to_b_perspective_new] - self.weights[index_from_b_perspective]
        self.accum[0][520:1040] = accum[0][0:520] + self.weights[index_to_w_perspective_new] - self.weights[index_from_w_perspective]
        if (to_pc is not None):
            self.accum[0][:520] -= self.weights[index_to_b_perspective]
            self.accum[0][520:1040] -= self.weights[index_to_w_perspective]
        return self.accum

    def get_halfka_indices(self, board: chess.Board):
        result = []
        is_white_pov = board.turn
        for i, turn in enumerate([board.turn, not board.turn]):
            indices = []
            for sq, p in board.piece_map().items():
                if p.piece_type == chess.KING:
                    continue
                indices.append(self.make_halfka_index(turn, self.orient(turn, board.king(turn)), sq, p))
            result.append(indices)
        return np.array(result, dtype=np.intp)

    @staticmethod
    def orient(is_white_pov: bool, sq: int) -> int:
        return (63 * (not is_white_pov)) ^ sq

    @staticmethod
    def make_halfka_index(is_white_pov: bool, king_sq: int, sq: int, p: chess.Piece):
        return NNUEAccumulator.orient(is_white_pov, sq) + \
               PieceSquare.from_piece(p, is_white_pov) + \
               (11 * SQUARE_NB + 1) * king_sq

# ---------------------------
# Stub: DoubleFeatureTransformerSlice
# ---------------------------
class DoubleFeatureTransformerSlice(nn.Module):
    def __init__(self, num_features, out_features):
        super().__init__()
        self.num_features = num_features
        self.out_features = out_features  # For each side, we want 520 features.
        self.linear = nn.Linear(num_features, out_features)
    def forward(self, white_indices, white_values, black_indices, black_values):
        B = white_indices.shape[0]
        white_out = torch.sigmoid(self.linear(torch.zeros(B, self.num_features, device=white_indices.device)))
        black_out = torch.sigmoid(self.linear(torch.zeros(B, self.num_features, device=white_indices.device)))
        return white_out, black_out

# ---------------------------
# LayerStacks with Buckets
# ---------------------------
class LayerStacks(nn.Module):
    def __init__(self, count):
        super(LayerStacks, self).__init__()
        self.count = count
        # This version expects an input of dimension 2 * L1 (i.e. 2 * 1024 = 2048).
        # Typically, if you have a dense accumulator of main features (e.g. white and black features concatenated),
        # then 2048 would be the expected input. If your accumulator has 1024 features, adjust accordingly.
        self.l1 = nn.Linear(2 * L1, L2 * count)  
        self.l2 = nn.Linear(L2, L3 * count)
        self.output = nn.Linear(L3, 1 * count)
        # For caching the bucket offset.
        self.idx_offset = None

        # Initialization: you might want to load trained weights here.
        # For now, weights are assumed to be set externally or by a different routine.
        
    def forward(self, x, layer_stack_indices):
    # If no layer_stack_indices are provided, default to zeros.
        if layer_stack_indices is None:
            layer_stack_indices = torch.zeros(x.shape[0], dtype=torch.long, device=x.device)
        elif not torch.is_tensor(layer_stack_indices):
            layer_stack_indices = torch.tensor(layer_stack_indices, dtype=torch.long, device=x.device)
        
        # Precompute and cache the offset for gathers using x.device
        if self.idx_offset is None or self.idx_offset.shape[0] != x.shape[0]:
            self.idx_offset = torch.arange(0, x.shape[0] * self.count, self.count, device=x.device)
        
        indices = layer_stack_indices.flatten() + self.idx_offset

        # First layer: project input x.
        l1s_ = self.l1(x)  # shape [B, L2 * count]
        # Reshape to [B, count, L2] so that each bucket gets L2 outputs.
        l1s_ = l1s_.reshape(-1, self.count, L2)
        # Now flatten to [B*count, L2] and select the bucket for each sample.
        l1c_ = l1s_.view(-1, L2)[indices]
        # Apply clamping to keep activations in [0,1].
        l1y_ = torch.clamp(l1c_, 0.0, 1.0)

        # Second layer: project l1y_ to dimension L3 * count.
        l2s_ = self.l2(l1y_)  # shape [B*count, L3]
        # Reshape to [B, count, L3] and select each sample's bucket.
        l2s_ = l2s_.reshape(-1, self.count, L3)
        l2c_ = l2s_.view(-1, L3)[indices]
        l2y_ = torch.clamp(l2c_, 0.0, 1.0)

        # Third (output) layer: produce final output.
        l3s_ = self.output(l2y_)  # shape [B*count, 1]
        l3s_ = l3s_.reshape(-1, self.count, 1)
        l3y_ = l3s_.view(-1, 1)[indices]

        return l3y_
    def shift_and_clamp_torch(self, x: torch.Tensor) -> torch.Tensor:
        x = x.to(torch.int32)
        x = torch.clamp(x, 0, 1)
        return x.to(torch.float32)
    def load_extracted_weights(self):
        # For testing, initialize weights randomly or zeros.
        w1 = np.load("weights/layer_stacks.l1.weight.npy")
        b1 = np.load("weights/layer_stacks.l1.bias.npy")
        w2 = np.load("weights/layer_stacks.l2.weight.npy")
        b2 = np.load("weights/layer_stacks.l2.bias.npy")
        w_out = np.load("weights/layer_stacks.output.weight.npy")
        b_out = np.load("weights/layer_stacks.output.bias.npy")
        f = np.load("weights/layer_stacks.l1_fact.weight.npy")
        
        self.l1.weight.data = torch.tensor(w1, dtype=torch.float32)
        self.l1.bias.data   = torch.tensor(b1, dtype=torch.float32)
        self.l1_fact.weight.data = torch.tensor(f, dtype=torch.float32)
        self.l2.weight.data = torch.tensor(w2, dtype=torch.float32)
        self.l2.bias.data   = torch.tensor(b2, dtype=torch.float32)
        self.output.weight.data = torch.tensor(w_out, dtype=torch.float32)
        self.output.bias.data   = torch.tensor(b_out, dtype=torch.float32)
        print("Layer 1 weights mean:", self.l1.weight.data.mean().item())
        print("Layer 1 bias mean:", self.l1.bias.data.mean().item())
        # self.l1.weight.data = torch.randn(self.l1.weight.data.shape) * 0.01
        # self.l1.bias.data = torch.randn(self.l1.bias.data.shape) * 0.01
        # self.l1_fact.weight.data = torch.zeros(self.l1_fact.weight.data.shape)
        # self.l2.weight.data = torch.randn(self.l2.weight.data.shape) * 0.01
        # self.l2.bias.data = torch.randn(self.l2.bias.data.shape) * 0.01
        # self.output.weight.data = torch.randn(self.output.weight.data.shape) * 0.01
        # self.output.bias.data = torch.zeros(self.output.bias.data.shape)
        # print("Layer 1 weights mean:", self.l1.weight.data.mean().item())
        # print("Layer 1 bias mean:", self.l1.bias.data.mean().item())

# ---------------------------
# MyNNUE Network
# ---------------------------
class MyNNUE(nn.Module):
    def __init__(self, count=8, feature_set=None):
        super().__init__()
        self.count = count
        # Input transformer projects 45056-dim sparse features into 520 per side (1040 total).
        self.input = DoubleFeatureTransformerSlice(DEFAULT_NUM_FEATURES, 520)
        self.layer_stacks = LayerStacks(count=self.count)
        self.nnue2score = 600.0
        self.weight_scale_hidden = 64.0
        self.weight_scale_out = 16.0
        self.quantized_one = 127.0
    # def quantize_psqt(self, psqt_tensor, scale, shift=SHIFT, clamp_min=CLAMP_MIN, clamp_max=CLAMP_MAX):
    #     quantized = (psqt_tensor * scale).round().to(torch.int32)
    #     quantized = quantized >> shift
    #     quantized = torch.clamp(quantized, 0, 1)
    #     return quantized.to(torch.float32)
    def forward(self, accum, psqt_indices=None, layer_stack_indices=None, us=None, piece_count=None):
        # Expect accum to be a dense accumulator of shape [B,1040]
        # Split into white and black halves.
        w_side = accum[:, :520]   # shape (B,520)
        b_side = accum[:, 520:]   # shape (B,520)
        # Split each half: first 512 are main features, last 8 are PSQT.
        w_main, w_psqt = torch.split(w_side, [512, 8], dim=1)
        b_main, b_psqt = torch.split(b_side, [512, 8], dim=1)
        # Concatenate main features: shape (B,1024)
        main_accum = torch.cat([w_main, b_main], dim=1)
        # Handle PSQT indices.
        if psqt_indices is None:
            if piece_count is None:
                piece_count = 32  # default if not provided
            computed_index = (piece_count - 1) // 4
            psqt_indices = torch.full((main_accum.shape[0],), computed_index, dtype=torch.long, device=main_accum.device)
        elif isinstance(psqt_indices, int):
            psqt_indices = torch.full((main_accum.shape[0],), psqt_indices, dtype=torch.long, device=main_accum.device)
        elif not torch.is_tensor(psqt_indices):
            psqt_indices = torch.tensor(psqt_indices, dtype=torch.long, device=main_accum.device)
        
        # Now psqt_indices should be a 1-D tensor of shape [B]; unsqueeze to get shape [B,1]
        psqt_indices_unsq = psqt_indices.unsqueeze(dim=1)
        # Do not wrap psqt_indices again if it is already a tensor.
        psqt_indices_unsq = psqt_indices.unsqueeze(dim=1)  # shape (B,1)
        wpsqt = w_psqt.gather(1, psqt_indices_unsq)  # shape (B,1)
        bpsqt = b_psqt.gather(1, psqt_indices_unsq)  # shape (B,1)
        print("Accumulator before evaluation:")
        print(accum)
        print("Main Accumulator Input to LayerStacks:")
        print(main_accum)
        net_out = self.layer_stacks(main_accum, layer_stack_indices)  # shape (B,1)
        print("LayerStacks output:")
        print(net_out)
        us_ = us.view(-1, 1).float() if us is not None else 0.5 * torch.ones((main_accum.shape[0], 1), device=main_accum.device)
        final_out = net_out + (wpsqt - bpsqt) * (us_ - 0.5)
        print("Final NNUE Output Before Returning:")
        print(final_out)
        return final_out

