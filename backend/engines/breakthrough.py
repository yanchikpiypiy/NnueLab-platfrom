#!/usr/bin/env python3 -u
# -*- coding: utf-8 -*-
from __future__ import print_function
import sys
import time, math
from itertools import count
from collections import namedtuple, defaultdict
# from pain import NNUEAccumulator, MyNNUE
from backend.engines.HalfKav2Yan import *
import re
import itertools
import torch
# nnue_accumulator = NNUEAccumulator()
# nnue_model = MyNNUE()
# If we could rely on the env -S argument, we could just use "pypy3 -u"
# as the shebang to unbuffer stdout. But alas we have to do this instead:
from functools import partial
print = partial(print, flush=True)

version = "sunfish 2023"

###############################################################################
# Piece-Square tables. Tune these to change sunfish's behaviour
###############################################################################

# With xz compression this whole section takes 652 bytes.
# That's pretty good given we have 64*6 = 384 values.
# Though probably we could do better...
# For one thing, they could easily all fit into int8.
piece = {"P": 100, "N": 280, "B": 320, "R": 479, "Q": 929, "K": 60000}
pst = {
    'P': (   0,   0,   0,   0,   0,   0,   0,   0,
            78,  83,  86,  73, 102,  82,  85,  90,
             7,  29,  21,  44,  40,  31,  44,   7,
           -17,  16,  -2,  15,  14,   0,  15, -13,
           -26,   3,  10,   9,   6,   1,   0, -23,
           -22,   9,   5, -11, -10,  -2,   3, -19,
           -31,   8,  -7, -37, -36, -14,   3, -31,
             0,   0,   0,   0,   0,   0,   0,   0),
    'N': ( -66, -53, -75, -75, -10, -55, -58, -70,
            -3,  -6, 100, -36,   4,  62,  -4, -14,
            10,  67,   1,  74,  73,  27,  62,  -2,
            24,  24,  45,  37,  33,  41,  25,  17,
            -1,   5,  31,  21,  22,  35,   2,   0,
           -18,  10,  13,  22,  18,  15,  11, -14,
           -23, -15,   2,   0,   2,   0, -23, -20,
           -74, -23, -26, -24, -19, -35, -22, -69),
    'B': ( -59, -78, -82, -76, -23,-107, -37, -50,
           -11,  20,  35, -42, -39,  31,   2, -22,
            -9,  39, -32,  41,  52, -10,  28, -14,
            25,  17,  20,  34,  26,  25,  15,  10,
            13,  10,  17,  23,  17,  16,   0,   7,
            14,  25,  24,  15,   8,  25,  20,  15,
            19,  20,  11,   6,   7,   6,  20,  16,
            -7,   2, -15, -12, -14, -15, -10, -10),
    'R': (  35,  29,  33,   4,  37,  33,  56,  50,
            55,  29,  56,  67,  55,  62,  34,  60,
            19,  35,  28,  33,  45,  27,  25,  15,
             0,   5,  16,  13,  18,  -4,  -9,  -6,
           -28, -35, -16, -21, -13, -29, -46, -30,
           -42, -28, -42, -25, -25, -35, -26, -46,
           -53, -38, -31, -26, -29, -43, -44, -53,
           -30, -24, -18,   5,  -2, -18, -31, -32),
    'Q': (   6,   1,  -8,-104,  69,  24,  88,  26,
            14,  32,  60, -10,  20,  76,  57,  24,
            -2,  43,  32,  60,  72,  63,  43,   2,
             1, -16,  22,  17,  25,  20, -13,  -6,
           -14, -15,  -2,  -5,  -1, -10, -20, -22,
           -30,  -6, -13, -11, -16, -11, -16, -27,
           -36, -18,   0, -19, -15, -15, -21, -38,
           -39, -30, -31, -13, -31, -36, -34, -42),
    'K': (   4,  54,  47, -99, -99,  60,  83, -62,
           -32,  10,  55,  56,  56,  55,  10,   3,
           -62,  12, -57,  44, -67,  28,  37, -31,
           -55,  50,  11,  -4, -19,  13,   0, -49,
           -55, -43, -52, -28, -51, -47,  -8, -50,
           -47, -42, -43, -79, -64, -32, -29, -32,
            -4,   3, -14, -50, -57, -18,  13,   4,
            17,  30,  -3, -14,   6,  -1,  40,  18),
}
# Pad tables and join piece and pst dictionaries
for k, table in pst.items():
    padrow = lambda row: (0,) + tuple(x + piece[k] for x in row) + (0,)
    pst[k] = sum((padrow(table[i * 8 : i * 8 + 8]) for i in range(8)), ())
    pst[k] = (0,) * 20 + pst[k] + (0,) * 20

###############################################################################
# Global constants
###############################################################################

# Our board is represented as a 120 character string. The padding allows for
# fast detection of moves that don't stay within the board.
A1, H1, A8, H8 = 91, 98, 21, 28
initial = (
    "         \n"  #   0 -  9
    "         \n"  #  10 - 19
    " rnbqkbnr\n"  #  20 - 29
    " pppppppp\n"  #  30 - 39
    " ........\n"  #  40 - 49
    " ........\n"  #  50 - 59
    " ........\n"  #  60 - 69
    " ........\n"  #  70 - 79
    " PPPPPPPP\n"  #  80 - 89
    " RNBQKBNR\n"  #  90 - 99
    "         \n"  # 100 -109
    "         \n"  # 110 -119
)

# Lists of possible moves for each piece type.
N, E, S, W = -10, 1, 10, -1
directions = {
    "P": (N, N+N, N+W, N+E),
    "N": (N+N+E, E+N+E, E+S+E, S+S+E, S+S+W, W+S+W, W+N+W, N+N+W),
    "B": (N+E, S+E, S+W, N+W),
    "R": (N, E, S, W),
    "Q": (N, E, S, W, N+E, S+E, S+W, N+W),
    "K": (N, E, S, W, N+E, S+E, S+W, N+W)
}

# Mate value must be greater than 8*queen + 2*(rook+knight+bishop)
# King value is set to twice this value such that if the opponent is
# 8 queens up, but we got the king, we still exceed MATE_VALUE.
# When a MATE is detected, we'll set the score to MATE_UPPER - plies to get there
# E.g. Mate in 3 will be MATE_UPPER - 6
MATE_LOWER = piece["K"] - 10 * piece["Q"]
MATE_UPPER = piece["K"] + 10 * piece["Q"]

TABLE_SIZE = 1e7
# Constants for tuning search

QS_LIMIT = 219
QS_A = 140
EVAL_ROUGHNESS = 13
OPENING_BOOK = False
DRAW_TEST = True
# minifier-hide start
opt_ranges = dict(
    QS = (0, 300),
    QS_A = (0, 300),
    EVAL_ROUGHNESS = (0, 50),
)
# minifier-hide end
WHITE, BLACK = range(2)

def get_color(pos):
    """Returns the color of the player whose turn it is."""
    return BLACK if pos.board.startswith('\n') else WHITE
def renderFEN(pos, half_move_clock=0, full_move_clock=1):
    color = 'wb'[get_color(pos)]
    if get_color(pos) == BLACK:
        pos = pos.rotate()
    board = '/'.join(pos.board.split())
    board = re.sub(r'\.+', (lambda m: str(len(m.group(0)))), board)
    castling = ''.join(itertools.compress('KQkq', pos.wc[::-1]+pos.bc)) or '-'
    ep = render(pos.ep) if not pos.board[pos.ep].isspace() else '-'
    clock = '{} {}'.format(half_move_clock, full_move_clock)
    return ' '.join((board, color, castling, ep, clock))

pychess_piece = { 'P': chess.PAWN, 'N': chess.KNIGHT, 'B': chess.BISHOP, 'R': chess.ROOK, 'Q': chess.QUEEN, 'K': chess.KING, '.': None }
def chess_move_from_to (pos, m):

    turn = 0 if pos.board.startswith('\n') else 1
    m_side = m if turn else (119-m[0], 119-m[1])

    rank1, fil1 = divmod(m_side[0] - A1, 10)
    rank2, fil2 = divmod(m_side[1] - A1, 10)
    
    #yanfish assumes this side's pieces are always in capital
    from_p = chess.Piece(pychess_piece[pos.board[m[0]]], turn)

    if(pos.board[m[1]] != '.'):
        to_p = chess.Piece(pychess_piece[pos.board[m[1]].upper()], not turn)
    else:
        to_p = None

    return (-(rank1)*8 + fil1, from_p , -(rank2)*8 + fil2, to_p)
###############################################################################
# Chess logic
###############################################################################


Move = namedtuple("Move", "i j prom")


class Position(namedtuple('Position', 'board score wc bc ep kp')):
    """ A state of a chess game
    board -- a 120 char representation of the board
    score -- the board evaluation
    wc -- the castling rights, [west/queen side, east/king side]
    bc -- the opponent castling rights, [west/king side, east/queen side]
    ep - the en passant square
    kp - the king passant square
    """

    def gen_moves(self):
        # For each of our pieces, iterate through each possible 'ray' of moves,
        # as defined in the 'directions' map. The rays are broken e.g. by
        # captures or immediately in case of pieces such as knights.
        for i, p in enumerate(self.board):
            if not p.isupper(): continue
            for d in directions[p]:
                for j in count(i+d, d):
                    q = self.board[j]
                    # Stay inside the board, and off friendly pieces
                    if q.isspace() or q.isupper(): break
                    # Pawn move, double move and capture
                    if p == 'P' and d in (N, N+N) and q != '.': break
                    if p == 'P' and d == N+N and (i < A1+N or self.board[i+N] != '.'): break
                    if p == 'P' and d in (N+W, N+E) and q == '.' \
                            and j not in (self.ep, self.kp, self.kp-1, self.kp+1): break
                    # Move it
                    yield (i, j)
                    # Stop crawlers from sliding, and sliding after captures
                    if p in 'PNK' or q.islower(): break
                    # Castling, by sliding the rook next to the king
                    if i == A1 and self.board[j+E] == 'K' and self.wc[0]: yield (j+E, j+W)
                    if i == H1 and self.board[j+W] == 'K' and self.wc[1]: yield (j+W, j+E)

    def rotate(self):
        ''' Rotates the board, preserving enpassant '''
        return Position(
            self.board[::-1].swapcase(), -self.score, self.bc, self.wc,
            119-self.ep if self.ep else 0,
            119-self.kp if self.kp else 0)

    def nullmove(self):
        ''' Like rotate, but clears ep and kp '''
        return Position(
            self.board[::-1].swapcase(), -self.score,
            self.bc, self.wc, 0, 0)

    def move(self, move):
        i, j = move
        p, q = self.board[i], self.board[j]
        put = lambda board, i, p: board[:i] + p + board[i+1:]
        # Copy variables and reset ep and kp
        board = self.board
        wc, bc, ep, kp = self.wc, self.bc, 0, 0
        score = self.score + self.value(move)
        # Actual move
        board = put(board, j, board[i])
        board = put(board, i, '.')
        # Castling rights, we move the rook or capture the opponent's
        if i == A1: wc = (False, wc[1])
        if i == H1: wc = (wc[0], False)
        if j == A8: bc = (bc[0], False)
        if j == H8: bc = (False, bc[1])
        # Castling
        if p == 'K':
            wc = (False, False)
            if abs(j-i) == 2:
                kp = (i+j)//2
                board = put(board, A1 if j < i else H1, '.')
                board = put(board, kp, 'R')
        # Pawn promotion, double move and en passant capture
        if p == 'P':
            if A8 <= j <= H8:
                board = put(board, j, 'Q')
            if j - i == 2*N:
                ep = i + N
            if j == self.ep:
                board = put(board, j+S, '.')
        # We rotate the returned position, so it's ready for the next player
        return Position(board, score, wc, bc, ep, kp).rotate()

    def value(self, move):
        i, j = move
        p, q = self.board[i], self.board[j]
 
        # Actual move
        score = pst[p][j] - pst[p][i]      
        # Capture
        if q.islower():
            score += pst[q.upper()][119-j]
        # Castling check detection
        if abs(j-self.kp) < 2:
            score += pst['K'][119-j]
        # Castling
        if p == 'K' and abs(i-j) == 2:
            score += pst['R'][(i+j)//2]
            score -= pst['R'][A1 if j < i else H1]
        # Special pawn stuff
        if p == 'P':
            if A8 <= j <= H8:
                score += pst['Q'][j] - pst['P'][j]
            if j == self.ep:
                score += pst['P'][119-(j+S)]
        return score

###############################################################################
# Search logic
###############################################################################

# lower <= s(pos) <= upper
Entry = namedtuple("Entry", "lower upper")


class Searcher:
    def __init__(self):
        self.tp_score = {}
        self.tp_move = {}
        self.history = set()
        self.nodes = 0
        self.use_classical = False

    def bound(self, pos, gamma, depth, kings, accum_root, accum_up, pos_prev, move_prev, root=True):
        """ returns r where
                s(pos) <= r < gamma    if gamma > s(pos)
                gamma <= r <= s(pos)   if gamma <= s(pos)"""
        self.nodes += 1

        # Depth <= 0 is QSearch. Here any position is searched as deeply as is needed for
        # calmness, and from this point on there is no difference in behaviour depending on
        # depth, so so there is no reason to keep different depths in the transposition table.
        depth = max(depth, 0)

        # Numbfish is a king-capture engine, so we should always check if we
        # still have a king. Notice since this is the only termination check,
        # the remaining code has to be comfortable with being mated, stalemated
        # or able to capture the opponent king.
        if pos.score <= -MATE_LOWER:
            return -MATE_UPPER

        #check if pos is in history. Positions are added in uci.py. However this checks for 2-fold repetitions.
        if not root and pos.board in self.history:
            return 0

        # Look in the table if we have already searched this position before.
        # We also need to be sure, that the stored search was over the same
        # nodes as the current search.
        entry = self.tp_score.get((pos, depth, root), Entry(-MATE_UPPER, MATE_UPPER))
        
        if entry.lower >= gamma and (not root or self.tp_move.get(pos) is not None):
            return entry.lower
        if entry.upper < gamma:
            return entry.upper
        nnue = MyNNUE()
        # nnue.eval()
        # Generator of moves to search in order.
        # This allows us to define the moves, but only calculate them if needed.
        # def process_accum_for_nn(accum: np.ndarray) -> torch.Tensor:
        #     # Apply the same shift/clamp logic:
        #     accum_clamped = np.clip(accum, 0, 1)
        #     print("Accum shape:", accum.shape)
        #     # Split the clamped accumulator into 4 equal parts along the feature dimension.
        #     parts = np.split(accum_clamped, 4, axis=1)
            
        #     # Multiply the first two parts and the last two parts elementwise.
        #     prod1 = parts[0] * parts[1]
        #     prod2 = parts[2] * parts[3]
            
        #     # Concatenate the products along the feature dimension.
        #     concatenated = np.concatenate([prod1, prod2], axis=1)
            
        #     # Scale the concatenated result by 127/128.
        #     processed = concatenated * (127/128)
            
        #     # Convert to a torch.Tensor with dtype float32.
        #     return torch.tensor(processed, dtype=torch.float32)
        def compute_piece_count(pos):
            # pos.board is your 120-character string representation.
            # The chess library’s Board.piece_map() returns a dictionary mapping square indices to pieces.
            board = chess.Board(renderFEN(pos))
            # Option 1: count all pieces (both sides)
            piece_count = len(board.piece_map())
            # Option 2: if you want to exclude kings (since they are always there),
            # you could subtract 2 (one king per side)
            # piece_count = len(board.piece_map()) - 2
            return piece_count
        def moves():
            # First try not moving at all. We only do this if there is at least one major
            # piece left on the board, since otherwise zugzwangs are too dangerous.
            if depth > 0 and not root and any(c in pos.board for c in 'RBNQ'):
                yield None, -self.bound(pos.nullmove(), 1-gamma, depth-3, kings, cur_accum, accum_up, pos, None, root=False)
            # For QSearch we have a different kind of null-move, namely we can just stop
            # and not capture anything else.
        
            if depth == 0:
                if not self.use_classical:
                    with torch.no_grad():
                        piece_count = compute_piece_count(pos)
                        computed_index = (piece_count - 1) // 4
                        
                        # Process the accumulator using our helper.
                        us = torch.tensor([1.0]) if get_color(pos) == WHITE else torch.tensor([0.0])
                        x = torch.tensor(cur_accum, dtype=torch.float32) # now x has shape [1, 512] as float32
                        
                        score_tensor = nnue(accum=x, us=us, psqt_indices=computed_index)
                    # Convert the output to a Python float and apply final scaling.
                    raw_score = (score_tensor.item())
                    score = raw_score 
                    print(score)
                else:
                    score = pos.score
                yield None, score
                
            # Then killer move. We search it twice, but the tp will fix things for us.
            # Note, we don't have to check for legality, since we've already done it
            # before. Also note that in QS the killer must be a capture, otherwise we
            # will be non deterministic.
            killer = self.tp_move.get(pos)
            if killer and (depth > 0 or pos.value(killer) >= QS_LIMIT):
                #if it's king move, mark the accum_up flag to update accum later
                move_king_t = pos.board[killer[0]] == 'K'
                yield killer, -self.bound(pos.move(killer), 1-gamma, depth-1, kings, cur_accum, move_king_t, pos, killer, root=False)

            # Then all the other moves
            for move in sorted(pos.gen_moves(), key=pos.value, reverse=True):
                if depth > 0 or pos.value(move) >= QS_LIMIT:
                    #if it's king move, mark the accum_up flag to update accum later
                    move_king_t = pos.board[move[0]] == 'K'              
                    yield move, -self.bound(pos.move(move), 1-gamma, depth-1, kings, cur_accum, move_king_t, pos, move, root=False)

        # Run through the moves, shortcutting when possible
        best = -MATE_UPPER
        nnue_accum = NNUEAccumulator()
        #create new empty np.array because changes are reflected to the root and we don't want that        
        cur_accum = np.empty([1, 1040], dtype=np.float32)
        if(not self.use_classical):      
          # here we update accumulator because king moved  
          if accum_up:                 
              board = chess.Board(renderFEN(pos))
              turn = board.turn
              
              # save both kings position to use later when accum_up=False. always put white king first
              kings = (board.king(turn), board.king(not turn)) if turn else (board.king(not turn), board.king(turn))      
              # get indices of chess pieces      
              ind = nnue_accum.get_halfka_indices(board)
              print("Feature Indices:", ind)
              # do efficient update gathering and summing up the "active" transformer_weights according to the indices of pieces (for white and black).
              cur_accum[0][:520] = np.sum(nnue_accum.weights[ind[0]],axis=0) 
              cur_accum[0][520:] = np.sum(nnue_accum.weights[ind[1]],axis=0)  
              cur_accum[0][:520] += nnue_accum.bias
              cur_accum[0][520:] += nnue_accum.bias
             
              accum_up = False

          else: 
            if(move_prev):
                move_chess = chess_move_from_to(pos_prev, move_prev) 
                turn = False if pos_prev.board.startswith('\n') else True
                
                #incremental update of the accumulator using the last move and 
                cur_accum = nnue_accum.update(accum_root, turn, move_chess, kings)

            else:  #for null move cases we just reverse the two halfs of the accumulator                
                cur_accum[0][0:520] = accum_root[0][520:]
                cur_accum[0][520:] = accum_root[0][0:520]
      
        for move, score in moves():
            best = max(best, score)
            if best >= gamma:
                # Clear before setting, so we always have a value
                if len(self.tp_move) > TABLE_SIZE: self.tp_move.clear()
                # Save the move for pv construction and killer heuristic
                self.tp_move[pos] = move
                break

        # Stalemate checking is a bit tricky: Say we failed low, because
        # we can't (legally) move and so the (real) score is -infty.
        # At the next depth we are allowed to just return r, -infty <= r < gamma,
        # which is normally fine.
        # However, what if gamma = -10 and we don't have any legal moves?
        # Then the score is actaully a draw and we should fail high!
        # Thus, if best < gamma and best < 0 we need to double check what we are doing.
        # This doesn't prevent numbfish from making a move that results in stalemate,
        # but only if depth == 1, so that's probably fair enough.
        # (Btw, at depth 1 we can also mate without realizing.)
        if best < gamma and best < 0 and depth > 0:
            is_dead = lambda pos: any(pos.value(m) >= MATE_LOWER for m in pos.gen_moves())
            if all(is_dead(pos.move(m)) for m in pos.gen_moves()):
                in_check = is_dead(pos.nullmove())
                best = -MATE_UPPER if in_check else 0

        # Clear before setting, so we always have a value
        if len(self.tp_score) > TABLE_SIZE: self.tp_score.clear()
        # Table part 2
        if best >= gamma:
            self.tp_score[pos, depth, root] = Entry(best, entry.upper)
        if best < gamma:
            self.tp_score[pos, depth, root] = Entry(entry.lower, best)

        return best

    def search(self, pos, movetime, use_classical = False, history=()):
        """ Iterative deepening MTD-bi search """
        self.nodes = 0
        if DRAW_TEST:
            self.history = history
            self.tp_score.clear()
        
        self.use_classical = use_classical
        global OPENING_BOOK
        
        if OPENING_BOOK:
            try:
                with chess.polyglot.open_reader("Perfect2021.bin") as opening_book:  
                    time.sleep(0.01)  #may need delay for some chess guis, i.e. cutechess              
                    opening = opening_book.choice(chess.Board(renderFEN(pos)))
                    opening_book.close()
                    print('Found book move')
                    yield 1, opening.move, 0, True
                    return 
            except:
                OPENING_BOOK = False
                

        for depth in range (1,100):
            lower, upper = -MATE_UPPER, MATE_UPPER
            while lower < upper - EVAL_ROUGHNESS:
                gamma = (lower+upper+1)//2   
                score = self.bound(pos, gamma, depth, None, np.empty([1, 1040], dtype=np.float32) , True, pos, None)
                if score >= gamma:
                    lower = score
                if score < gamma:
                    upper = score  
            self.bound(pos, lower, depth, None, np.empty([1, 1040], dtype=np.float32), True, pos, None)

            yield depth, self.tp_move.get(pos), self.tp_score.get((pos, depth, True)).lower, False
            


###############################################################################
# User interface
###############################################################################       
    
# Python 2 compatability
if sys.version_info[0] == 2:
    input = raw_input


def parse(c):
    fil, rank = ord(c[0]) - ord('a'), int(c[1]) - 1
    
    return A1 + fil - 10*rank


def move_render(pos, m):
    # Numbfish always assumes promotion to queen
    p = 'q' if A8 <= m[1] <= H8 and pos.board[m[0]] == 'P' else ''
    m = m if get_color(pos) == 0 else (119-m[0], 119-m[1])
    
    
    rank1, fil1 = divmod(m[0] - A1, 10)
    rank2, fil2 = divmod(m[1] - A1, 10)
    
    return chr(fil1 + ord('a')) + str(-rank1 + 1) + chr(fil2 + ord('a')) + str(-rank2 + 1) + p

def render(i):
    rank, fil = divmod(i - A1, 10)
    return chr(fil + ord('a')) + str(-rank + 1)


def print_pos(pos):
    print()
    uni_pieces = {'R':'♜', 'N':'♞', 'B':'♝', 'Q':'♛', 'K':'♚', 'P':'♟',
                  'r':'♖', 'n':'♘', 'b':'♗', 'q':'♕', 'k':'♔', 'p':'♙', '.':'·'}
    for i, row in enumerate(pos.board.split()):
        print(' ', 8-i, ' '.join(uni_pieces.get(p, p) for p in row))
    print('    a b c d e f g h \n\n')


def main():
    hist = [Position(initial, 0, (True,True), (True,True), 0, 0)]
    searcher = Searcher()
    start = time.time()
    for _depth, move, score, extra in searcher.search(hist[-1], hist):
        print(f"Initial board evaluation: {score}")
        break  # We only want the evaluation of the initial position

    while True:
        print_pos(hist[-1])

        if hist[-1].score <= -MATE_LOWER:
            print("You lost")
            break

        # We query the user until she enters a (pseudo) legal move.
        move = None
        while move not in hist[-1].gen_moves():
            match = re.match('([a-h][1-8])'*2, input('Your move: '))
            if match:
                move = parse(match.group(1)), parse(match.group(2))
            else:
                # Inform the user when invalid input (e.g. "help") is entered
                print("Please enter a move like g8f6")
        hist.append(hist[-1].move(move))

        # After our move we rotate the board and print it again.
        # This allows us to see the effect of our move.
        print_pos(hist[-1].rotate())

        if hist[-1].score <= -MATE_LOWER:
            print("You won")
            break

        # Fire up the engine to look for a move.
        start = time.time()
        for _depth, move, score,extra in searcher.search(hist[-1], hist):
            if time.time() - start > 1:
                break
        print(score)
        if score == MATE_UPPER:
            print("Checkmate!")

        # The black player moves from a rotated position, so we have to
        # 'back rotate' the move before printing it.
        # print("My move:", render(119 - move.from_square) + render(119 - move.to_square))
        hist.append(hist[-1].move(move))


if __name__ == '__main__':
    main()
