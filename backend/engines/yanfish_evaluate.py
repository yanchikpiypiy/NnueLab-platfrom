import numpy as np
import chess
from enum import IntFlag
import torch
import torch.nn as nn

# ---------------------------
# Constants and Parameters
# ---------------------------
FEATURE_TRANSFORMER_HALF_DIMENSIONS = 256
DEFAULT_NUM_FEATURES = 41024  # total number of feature indices
SQUARE_NB = 64
SHIFT = 6  # Right shift by 6 => floorDiv(64)
CLAMP_MIN = 0
CLAMP_MAX = 127

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
    END      = W_KING  # pieces without kings
    B_KING   = 11 * SQUARE_NB + 1
    END2     = 12 * SQUARE_NB + 1

    @staticmethod
    def from_piece(p: chess.Piece, is_white_pov: bool):
        """Returns the corresponding piece square value."""
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
    def __init__(self, weights_file="engines/weights/transformer_weights.npy", bias_file="engines/weights/transformer_bias.npy"):
        # Load the transformer's embedding weights & bias
        self.weights = np.load(weights_file)  # shape (41024, 256)
        self.bias = np.load(bias_file)        # shape (256,)
        assert self.weights.shape == (DEFAULT_NUM_FEATURES, FEATURE_TRANSFORMER_HALF_DIMENSIONS)
        assert self.bias.shape == (FEATURE_TRANSFORMER_HALF_DIMENSIONS,)
        self.accum = np.zeros((1,512))
        # Initialize accumulators


    def update(self,accum, turn,move,kings):
        """Incremental update for a new position."""
        from_sq = move[0]
        from_pc = move[1]
        to_sq = move[2]
        to_pc = move[3]
        (our_king, opp_king) = (kings[0], kings[1]) if turn else (kings[1], kings[0])

        self.accum = np.empty_like(accum)
        # Side-to-move
        index_from_w_perspective = self.make_halfkp_index(turn, self.orient(turn,our_king), from_sq, from_pc)
        index_from_b_perspective = self.make_halfkp_index(not turn,self.orient(not turn,opp_king), from_sq, from_pc)
        if (to_pc is not None):
            index_to_w_perspective = self.make_halfkp_index(turn, self.orient(turn, our_king), to_sq, to_pc)
            index_to_b_perspective = self.make_halfkp_index(not turn, self.orient(not turn,opp_king), to_sq, to_pc)
        if((from_pc.piece_type == chess.PAWN) and (to_sq > 55)):     # white pawn reached final rank
            index_to_w_perspective_new = self.make_halfkp_index(turn, self.orient(turn, our_king), to_sq, chess.Piece(chess.QUEEN, chess.WHITE))
            index_to_b_perspective_new = self.make_halfkp_index(not turn, self.orient(not turn, opp_king), to_sq, chess.Piece(chess.QUEEN, chess.WHITE))
        elif((from_pc.piece_type == chess.PAWN) and (to_sq < 8)):
            index_to_w_perspective_new = self.make_halfkp_index(turn, self.orient(turn, our_king), to_sq, chess.Piece(chess.QUEEN, chess.BLACK))
            index_to_b_perspective_new = self.make_halfkp_index(not turn, self.orient(not turn, opp_king), to_sq, chess.Piece(chess.QUEEN, chess.BLACK))
        else:
            index_to_w_perspective_new = self.make_halfkp_index(turn, self.orient(turn, our_king), to_sq, from_pc)
            index_to_b_perspective_new = self.make_halfkp_index(not turn, self.orient(not turn, opp_king), to_sq, from_pc)

        self.accum[0][:256] = accum[0][256:512] + self.weights[index_to_b_perspective_new] - self.weights[index_from_b_perspective]
        self.accum[0][256:512] = accum[0][0:256] + self.weights[index_to_w_perspective_new] - self.weights[index_from_w_perspective]
        if (to_pc is not None):
            self.accum[0][:256] -= self.weights[index_to_b_perspective]
            self.accum[0][256:512] -= self.weights[index_to_w_perspective]
        return self.accum
    def get_halfkp_indices(self,board: chess.Board):
        result = []
        is_white_pov = board.turn
        for i, turn in enumerate([board.turn, not board.turn]):
            indices = []
            for sq, p in board.piece_map().items():
                if p.piece_type == chess.KING:
                    continue
                indices.append(self.make_halfkp_index(turn, self.orient(turn, board.king(turn)), sq, p))
            result.append(indices)

        return np.array(result, dtype=np.intp)
    @staticmethod
    def orient(is_white_pov: bool, sq: int) -> int:
        return (63 * (not is_white_pov)) ^ sq

    @staticmethod
    def make_halfkp_index(is_white_pov: bool, king_sq: int, sq: int, p: chess.Piece) -> int:
        return NNUEAccumulator.orient(is_white_pov, sq) + PieceSquare.from_piece(p, is_white_pov) + PieceSquare.END * king_sq


# ---------------------------
# MyNNUE Class
# ---------------------------

class MyNNUE(nn.Module):
    def __init__(self):
        super(MyNNUE, self).__init__()
        # Suppose your final architecture is 512->32->32->1
        self.layer1 = nn.Linear(512, 32)
        self.layer2 = nn.Linear(32, 32)
        self.output_layer = nn.Linear(32, 1)
        self.relu = nn.ReLU()
        self.load_extracted_weights()

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.shift_and_clamp_torch(x)
        x = self.relu(self.layer2(x))
        x = self.shift_and_clamp_torch(x)
        x = self.output_layer(x)
        return x  # shape (batch_size, 1)

    def shift_and_clamp_torch(self, x: torch.Tensor) -> torch.Tensor:
        """Bit-shifts and clamps values to [0, 127] while ensuring correct data types."""
        x = x.to(torch.int32)  # Convert to int32 before bit-shifting
        x = x >> SHIFT  # Apply bit-shift
        x = torch.clamp(x, CLAMP_MIN, CLAMP_MAX)  # Clamp to [0, 127]
        return x.to(torch.float32)  # Convert back to float32 for the neural network

    def load_extracted_weights(self):
        w1 = np.load("engines/numpy_weights/hidden_layer_1_weights.npy")   # shape (32, 512)
        b1 = np.load("engines/numpy_weights/hidden_layer_1_bias.npy")      # shape (32,)
        w2 = np.load("engines/numpy_weights/hidden_layer_2_weights.npy")   # shape (32, 32)
        b2 = np.load("engines/numpy_weights/hidden_layer_2_bias.npy")      # shape (32,)
        w_out = np.load("engines/numpy_weights/output_layer_weights.npy")  # shape (1, 32)
        b_out = np.load("engines/numpy_weights/output_layer_bias.npy")     # shape (1,)

        self.layer1.weight.data = torch.tensor(w1, dtype=torch.float32)
        self.layer1.bias.data   = torch.tensor(b1, dtype=torch.float32)
        self.layer2.weight.data = torch.tensor(w2, dtype=torch.float32)
        self.layer2.bias.data   = torch.tensor(b2, dtype=torch.float32)
        self.output_layer.weight.data = torch.tensor(w_out, dtype=torch.float32)
        self.output_layer.bias.data   = torch.tensor(b_out, dtype=torch.float32)

# class MyNNUE: 
#     def __init__(self, model_path="nnue_data/hidden_layers.tflite"):
#         """Load TFLite model"""
#         self.interpreter = tf.lite.Interpreter(model_path=model_path)
#         self.interpreter.allocate_tensors()

#         self.input_details = self.interpreter.get_input_details()
#         self.output_details = self.interpreter.get_output_details()

#     def predict(self, input_data):
#         """Run the model on input_data."""
        
#         # Ensure that input_data is a float32 tensor
#         input_data = np.array(input_data, dtype=np.float32)
        
#         # Set the input tensor with the correct type (FLOAT32)
#         self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        
#         # Run inference
#         self.interpreter.invoke()

#         # Retrieve result
#         output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
#         return output_data