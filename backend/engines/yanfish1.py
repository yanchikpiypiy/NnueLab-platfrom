#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import re
from collections import namedtuple
from itertools import count

###############################################################################
# 1) Piece-Square Tables
###############################################################################
piece_value = {"P": 100, "N": 280, "B": 320, "R": 479, "Q": 929, "K": 60000}

# Original 64-element PSTs for each piece
pst_64 = {
    'P': (
         0,   0,   0,   0,   0,   0,   0,   0,
        78,  83,  86,  73, 102,  82,  85,  90,
         7,  29,  21,  44,  40,  31,  44,   7,
       -17,  16,  -2,  15,  14,   0,  15, -13,
       -26,   3,  10,   9,   6,   1,   0, -23,
       -22,   9,   5, -11, -10,  -2,   3, -19,
       -31,   8,  -7, -37, -36, -14,   3, -31,
         0,   0,   0,   0,   0,   0,   0,   0),
    'N': (
       -66, -53, -75, -75, -10, -55, -58, -70,
        -3,  -6, 100, -36,   4,  62,  -4, -14,
        10,  67,   1,  74,  73,  27,  62,  -2,
        24,  24,  45,  37,  33,  41,  25,  17,
        -1,   5,  31,  21,  22,  35,   2,   0,
       -18,  10,  13,  22,  18,  15,  11, -14,
       -23, -15,   2,   0,   2,   0, -23, -20,
       -74, -23, -26, -24, -19, -35, -22, -69),
    'B': (
       -59, -78, -82, -76, -23,-107, -37, -50,
       -11,  20,  35, -42, -39,  31,   2, -22,
        -9,  39, -32,  41,  52, -10,  28, -14,
        25,  17,  20,  34,  26,  25,  15,  10,
        13,  10,  17,  23,  17,  16,   0,   7,
        14,  25,  24,  15,   8,  25,  20,  15,
        19,  20,  11,   6,   7,   6,  20,  16,
        -7,   2, -15, -12, -14, -15, -10, -10),
    'R': (
        35,  29,  33,   4,  37,  33,  56,  50,
        55,  29,  56,  67,  55,  62,  34,  60,
        19,  35,  28,  33,  45,  27,  25,  15,
         0,   5,  16,  13,  18,  -4,  -9,  -6,
       -28, -35, -16, -21, -13, -29, -46, -30,
       -42, -28, -42, -25, -25, -35, -26, -46,
       -53, -38, -31, -26, -29, -43, -44, -53,
       -30, -24, -18,   5,  -2, -18, -31, -32),
    'Q': (
         6,   1,  -8,-104,  69,  24,  88,  26,
        14,  32,  60, -10,  20,  76,  57,  24,
        -2,  43,  32,  60,  72,  63,  43,   2,
         1, -16,  22,  17,  25,  20, -13,  -6,
       -14, -15,  -2,  -5,  -1, -10, -20, -22,
       -30,  -6, -13, -11, -16, -11, -16, -27,
       -36, -18,   0, -19, -15, -15, -21, -38,
       -39, -30, -31, -13, -31, -36, -34, -42),
    'K': (
         4,  54,  47, -99, -99,  60,  83, -62,
       -32,  10,  55,  56,  56,  55,  10,   3,
       -62,  12, -57,  44, -67,  28,  37, -31,
       -55,  50,  11,  -4, -19,  13,   0, -49,
       -55, -43, -52, -28, -51, -47,  -8, -50,
       -47, -42, -43, -79, -64, -32, -29, -32,
        -4,   3, -14, -50, -57, -18,  13,   4,
        17,  30,  -3, -14,   6,  -1,  40,  18),
}

# We'll build a 120-based PST for each piece
A1, H1, A8, H8 = 91, 98, 21, 28

def pad_64_to_120(pk, arr64):
    base_val = piece_value[pk]
    new_data = []
    for row in range(8):
        row_slice = arr64[row*8:(row+1)*8]
        # pad left+right with 0, and add 'base_val' to each cell
        row_slice = (0,) + tuple(x+base_val for x in row_slice) + (0,)
        new_data.extend(row_slice)
    # then top & bottom with 20 zeros
    new_data = (0,)*20 + tuple(new_data) + (0,)*20
    return new_data

pst = {}
for k in pst_64:
    pst[k] = pad_64_to_120(k, pst_64[k])

# Mating constants
MATE_LOWER = piece_value["K"] - 10*piece_value["Q"]  # e.g. 60000 - 9290=50710
MATE_UPPER = piece_value["K"] + 10*piece_value["Q"]  # e.g. 60000+9290=69290

###############################################################################
# 2) Basic Board Setup
###############################################################################
WHITE, BLACK = 0, 1

def get_color(pos):
    """0=WHITE, 1=BLACK if pos.board starts with newline => BLACK."""
    return BLACK if pos.board.startswith('\n') else WHITE

###############################################################################
# 3) The Position class
###############################################################################
Move = namedtuple("Move","i j")

N,E,S,W = -10,1,10,-1
directions_map = {
    "P": (N, N+N, N+W, N+E),
    "N": (N+N+E, E+N+E, E+S+E, S+S+E, S+S+W, W+S+W, W+N+W, N+N+W),
    "B": (N+E, S+E, S+W, N+W),
    "R": (N, E, S, W),
    "Q": (N, E, S, W, N+E, S+E, S+W, N+W),
    "K": (N, E, S, W, N+E, S+E, S+W, N+W),
}

class Position(namedtuple('Position','board score wc bc ep kp')):
    """
    board: 120 chars
    score: integer eval
    wc, bc: castling rights
    ep: en-passant
    kp: 'king passant'
    """

    def rotate(self):
        return Position(
            self.board[::-1].swapcase(),
            -self.score,
            self.bc,
            self.wc,
            119-self.ep if self.ep else 0,
            119-self.kp if self.kp else 0
        )

    def nullmove(self):
        return Position(
            self.board[::-1].swapcase(),
            -self.score,
            self.bc,
            self.wc,
            0,
            0
        )

    def move(self, mv):
        i,j= mv
        p,q= self.board[i], self.board[j]
        def put(b, idx, pc):
            return b[:idx] + pc + b[idx+1:]
        brd= self.board
        wc, bc, ep, kp= self.wc, self.bc, 0, 0
        delta= self.value(mv)
        new_score= self.score+ delta

        # place piece
        brd= put(brd, j, brd[i])
        brd= put(brd, i, '.')

        # castling rights
        if i==A1: wc=(False,wc[1])
        if i==H1: wc=(wc[0],False)
        if j==A8: bc=(bc[0],False)
        if j==H8: bc=(False,bc[1])

        # castling
        if p=='K':
            wc=(False,False)
            if abs(j-i)==2:
                kp= (i+j)//2
                if j<i:
                    brd= put(brd,A1,'.')
                    brd= put(brd,kp,'R')
                else:
                    brd= put(brd,H1,'.')
                    brd= put(brd,kp,'R')

        # Pawn logic
        if p=='P':
            if A8<= j<= H8:
                brd= put(brd,j,'Q')
            if j-i==2*N:
                ep= i+ N
            if j== self.ep:
                brd= put(brd, j+ S, '.')

        return Position(brd, new_score, wc, bc, ep, kp).rotate()

    def value(self, mv):
        i,j= mv
        p,q= self.board[i], self.board[j]
        P= p.upper()
        sc= pst[P][j] - pst[P][i]
        if q.isalpha():
            Q= q.upper()
            sc+= pst[Q][119-j]
        # castling
        if abs(j- self.kp)<2:
            sc+= pst['K'][119-j]
        if p=='K' and abs(i-j)==2:
            sc+= pst['R'][(i+j)//2]
            sc-= pst['R'][A1 if j<i else H1]

        if p=='P':
            if A8<= j<=H8:
                sc+= pst['Q'][j] - pst['P'][j]
            if j== self.ep:
                sc+= pst['P'][119-(j+S)]
        return sc

    def gen_pseudo(self):
        """Generate pseudo-legal moves ignoring check/pin."""
        side= get_color(self)
        for i,ch in enumerate(self.board):
            if side==WHITE:
                if not ch.isupper(): 
                    continue
            else:
                if not ch.islower():
                    continue

            P= ch.upper()
            if P not in directions_map:
                continue
            if P=='P':
                # pawn logic
                for d in directions_map['P']:
                    step= d
                    j= i+ step
                    if d in (N,S):
                        if self.board[j]=='.':
                            yield Move(i,j)
                            # double push if rank 2(white) or 7(black)
                            if side==WHITE and (80<= i<=89):
                                j2= j+ step
                                if self.board[j2]=='.':
                                    yield Move(i,j2)
                            if side==BLACK and (30<= i<=39):
                                j2= j+ step
                                if self.board[j2]=='.':
                                    yield Move(i,j2)
                    else:
                        if not self.board[j].isspace() and self.board[j] != '.':
                            # capture if opposite color
                            if side==WHITE and self.board[j].islower():
                                yield Move(i,j)
                            if side==BLACK and self.board[j].isupper():
                                yield Move(i,j)
                        else:
                            # en-pass
                            if j== self.ep:
                                yield Move(i,j)
            else:
                # sliding
                for d in directions_map[P]:
                    cur= i
                    while True:
                        cur+= d
                        if self.board[cur].isspace():
                            break
                        # same color => break
                        if (side==WHITE and self.board[cur].isupper()) or \
                           (side==BLACK and self.board[cur].islower()):
                            break
                        yield Move(i,cur)
                        if P in 'PNK' or \
                           (side==WHITE and self.board[cur].islower()) or \
                           (side==BLACK and self.board[cur].isupper()):
                            break

###############################################################################
# 4) Checking pinned logic: we do in_check, gen_legal
###############################################################################
def in_check(pos):
    """If side-to-move's king is attacked by opponent => True."""
    side= get_color(pos)
    k_char= 'K' if side==WHITE else 'k'
    k_idx= pos.board.find(k_char)
    if k_idx<0:
        return True
    opp= pos.rotate()
    rot_k= 119- k_idx
    for mv in opp.gen_pseudo():
        if mv.j== rot_k:
            return True
    return False

def gen_legal(pos):
    """Yield only moves that do NOT leave your own king in check => pinned logic."""
    for mv in pos.gen_pseudo():
        nxt= pos.move(mv)
        if not in_check(nxt):
            yield mv

###############################################################################
# 5) parseFEN
###############################################################################
def parse_square(s):
    f= ord(s[0]) - ord('a')
    r= int(s[1]) -1
    return A1 + f - 10*r

def parseFEN(fen):
    """Convert fen to Position."""
    b_str, side, cstl, enps, halfc, fullm= fen.split()
    b_str= re.sub(r'\d', lambda m: '.'* int(m.group(0)), b_str)
    row_data= (" "*21)+ "  ".join(b_str.split('/'))+(" "*21)
    row_list= list(row_data)
    row_list[9::10]= ["\n"]*12
    final_board= "".join(row_list)

    wc= ('Q' in cstl, 'K' in cstl)
    bc= ('k' in cstl, 'q' in cstl)
    if enps=='-':
        ep= 0
    else:
        ep= parse_square(enps)

    sc=0
    for i,ch in enumerate(final_board):
        if ch.isupper():
            sc+= pst[ch][i]
        elif ch.islower():
            sc-= pst[ch.upper()][119-i]

    pos= Position(final_board, sc, wc, bc, ep, 0)
    if side=='w':
        return pos
    else:
        return pos.rotate()

###############################################################################
# 6) Alpha-beta Search to Depth=6
###############################################################################
Entry= namedtuple("Entry","lower upper")

class Searcher:
    def __init__(self):
        self.tp_score={}
        self.tp_move={}
        self.nodes=0

    def alpha_beta(self, pos, alpha, beta, depth):
        """
        Normal alpha-beta. Depth=0 => return pos.score.
        If no legal => checkmate or stalemate.
        """
        self.nodes+=1
        if depth==0:
            return pos.score

        # If we've lost the king => huge negative
        if pos.score<= -MATE_LOWER:
            return -MATE_UPPER

        # transposition
        key= (pos, depth)
        entry= self.tp_score.get(key, Entry(-MATE_UPPER,MATE_UPPER))
        if entry.lower>= beta:
            return entry.lower
        if entry.upper<= alpha:
            return entry.upper

        best= -MATE_UPPER
        moves= list(gen_legal(pos))
        if not moves:
            # checkmate or stalemate
            if in_check(pos):
                return -MATE_UPPER
            else:
                return 0

        # sort by move "value"
        moves.sort(key= pos.value, reverse=True)
        orig_alpha= alpha

        for mv in moves:
            score= -self.alpha_beta(pos.move(mv), -beta, -alpha, depth-1)
            if score> best:
                best= score
                self.tp_move[pos]= mv
            if best> alpha:
                alpha= best
                if alpha>= beta:
                    break
        # store
        if best>= beta:
            self.tp_score[key]= Entry(best, entry.upper)
        elif best> entry.lower:
            self.tp_score[key]= Entry(entry.lower, best)
        return best

    def search(self, pos, depth=6):
        """
        Single call alpha-beta to 'depth'.
        Return (score, bestmove).
        """
        alpha, beta= -MATE_UPPER, MATE_UPPER
        sc= self.alpha_beta(pos, alpha,beta, depth)
        mv= self.tp_move.get(pos)
        return sc, mv

###############################################################################
# 7) Reconstruct line up to 'depth' plies
###############################################################################
def build_pv(searcher, pos, depth):
    line= []
    current= pos
    for _ply in range(depth):
        mv= searcher.tp_move.get(current)
        if not mv:
            break
        line.append(mv)
        current= current.move(mv)
    return line

def move_render(pos, mv):
    """Like 'b6b7' possibly with 'q' if promotion, adjusting if black to move."""
    p= ''
    if pos.board[mv.i]=='P' and A8<= mv.j <=H8:
        p='q'
    color= get_color(pos)
    i, j= mv
    if color==1:  # black
        i= 119-i
        j= 119-j
    r1,f1= divmod(i- A1, 10)
    r2,f2= divmod(j- A1, 10)
    return (
        chr(f1+ ord('a'))+ str(-r1+1) +
        chr(f2+ ord('a'))+ str(-r2+1) + p
    )

###############################################################################
# 8) Solve the puzzle
###############################################################################
def main():
    fen= "kbK5/pp6/1P6/8/8/8/8/R7 w - - 0 1"  # your puzzle
    pos= parseFEN(fen)
    searcher= Searcher()
    score, best_move= searcher.search(pos, depth=6)  # up to 6 plies
    print("Score:", score, "Nodes:", searcher.nodes)
    print("Best move at root:", move_render(pos,best_move) if best_move else None)

    # Reconstruct the line up to 6 half-moves
    line_moves= build_pv(searcher, pos, 6)
    rendered= []
    cur= pos
    for mv in line_moves:
        rendered.append( move_render(cur, mv) )
        cur= cur.move(mv)

    print("Line:", rendered)
    # Check if mate
    is_mate= (score>= MATE_UPPER-200)
    print("Mate found?", is_mate)

if __name__=="__main__":
    main()
