# # class SunfishEngine:
# #     """
# #     A Sunfish-based engine that always plays as 'Black' from the user's perspective.
# #     The incoming FEN is assumed to be in user perspective (active color 'b').
# #     Since Sunfish’s search expects to work with "white to move", we rotate the board
# #     upon loading so that internally the engine always sees itself as white.
# #     Then, when processing moves, we flip between user and engine coordinates.
# #     """
# #     def __init__(self):
# #         self.searcher = Searcher()  # Your Sunfish searcher
# #         self.position = None
# #         self.history = []
# #         # We assume incoming FEN is always "b" (black to move from user's view)
# #         self.original_fen_color = 'b'

# #     def new_game(self, fen=None):
# #         """
# #         Start a new game. If fen is None, use the standard starting FEN with active color 'b'.
# #         """
# #         self.searcher.tp_score.clear()
# #         self.searcher.tp_move.clear()

# #         if fen is None:
# #             # Standard starting position, but with active color 'b'
# #             fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"
# #         self.set_fen(fen)

# #     def set_fen(self, fen: str):
# #         """
# #         Load a position from FEN.
# #         Since the incoming FEN is assumed to be in user perspective (active color 'b'),
# #         we rotate it so that internally the engine (which is designed to play as white)
# #         sees the board as white-to-move.
# #         """
# #         parts = fen.split()
# #         board_str = parts[0]
# #         active_color = parts[1]  # Should be 'b'
# #         castling = parts[2]
# #         ep = parts[3]

# #         self.original_fen_color = active_color  # expected to be 'b'
# #         pos = fen_to_position(board_str, active_color, castling, ep)
# #         # Rotate unconditionally so that internally the engine is "white to move"
# #         pos = pos.rotate()
# #         self.position = pos
# #         self.history = [pos]
# #         print("Set FEN -> Sunfish internal FEN:", renderFEN(self.position))

# #     def current_fen(self):
# #         """
# #         Return the FEN in the user's perspective.
# #         Since the internal board is rotated, we rotate it back for display.
# #         """
# #         if self.original_fen_color == 'b':
# #             return renderFEN(self.position.rotate())
# #         else:
# #             return renderFEN(self.position)

# #     def make_move(self, move_uci: str):
# #         """
# #         Process a move from the user (in UCI format).
# #         Since the internal board is rotated relative to the user perspective,
# #         flip the incoming move coordinates from user -> engine.
# #         """
# #         match = re.match(r'([a-h][1-8])([a-h][1-8])', move_uci)
# #         if not match:
# #             raise ValueError("Invalid move string")

# #         from_sq = parse(match.group(1))
# #         to_sq = parse(match.group(2))
# #         # Convert user coordinates to engine coordinates by flipping.
# #         if self.original_fen_color == 'b':
# #             from_sq = flip_square(from_sq)
# #             to_sq = flip_square(to_sq)
# #         move_tuple = (from_sq, to_sq)

# #         if move_tuple not in self.position.gen_moves():
# #             raise ValueError("Illegal move from user")

# #         # Apply the move (Position.move() returns a rotated board)
# #         self.position = self.position.move(move_tuple)
# #         self.history.append(self.position)
# #         return self.current_fen()

# #     def find_best_move(self, time_limit=1.0):
# #         """
# #         Find and return the engine's best move in UCI format.
# #         The searcher returns a move in engine coordinates.
# #         Convert it back to user coordinates before returning.
# #         """
# #         start_time = time.time()
# #         best_move = None

# #         for depth, mv, score, _ in self.searcher.search(
# #             self.position, use_classical=False, history=self.history, movetime=time_limit
# #         ):
# #             best_move = mv
# #             if time.time() - start_time >= time_limit:
# #                 break

# #         if best_move is None:
# #             return None

# #         # Convert the engine move (in engine coordinates) to user coordinates.
# #         if self.original_fen_color == 'b':
# #             converted_move = (flip_square(best_move[0]), flip_square(best_move[1]))
# #         else:
# #             converted_move = best_move

# #         # Apply the move internally.
# #         self.position = self.position.move(best_move)
# #         self.history.append(self.position)

# #         # Return the move in UCI notation.
# #         return move_render_py(self.position, converted_move, 'w')

# #     def evaluate_position(self):
# #         # Return the raw evaluation score.
# #         return self.position.score
# # CODE FOR FASTAPI
# # CODE FOR FASTAPI
# # CODE FOR FASTAPI
# class SunfishEngine:
#     """
#     A Sunfish-based engine that ALWAYS plays as 'Black' from the user's perspective.
#     Internally, we keep Sunfish's perspective at 'White to move.' That 'White' is our real Black.
#     """

#     def __init__(self):
#         self.searcher = Searcher()  # Your Sunfish searcher
#         # By default, let's start with the standard initial position
#         # but we rotate so that from Sunfish's perspective it's White-to-move = our black.
#         # The standard FEN is White to move. So we actually want to do NO rotation here
#         # if we truly want black to move in real life. Let's keep a method to set it from FEN:
#         self.position = None
#         self.history = []
#         self.engine_plays_black = True  # flag to remind us
#         # We'll store the original FEN color here, but typically we rely on the logic in set_fen.
#         self.original_fen_color = 'w'

#         # Single TT for the entire session. We'll NOT forcibly clear each move.
#         # If you want a truly fresh start, call new_game() or set_fen().

#     def new_game(self, fen=None):
#         """
#         Start a new game. If fen is None, use standard initial FEN
#         with the assumption engine is black to move second.
#         """
#         self.searcher.tp_score.clear()
#         self.searcher.tp_move.clear()

#         if fen is None:
#             # Standard start position in standard FEN: White to move
#             # But we want the engine to be black. That means in real life it's White's turn.
#             # So we rotate once so Sunfish sees "white." i.e. no rotation needed if we want black to move next.
#             # Actually, standard start FEN is "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
#             # That means White is about to move in real life. We want our engine (Black) to move second.
#             fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

#         self.set_fen(fen)

#     def set_fen(self, fen: str):
#         """
#         Load a position from FEN. If the FEN says 'b', that means it's Black's move in real life;
#         that's exactly when we want Sunfish to see it as 'white' to move. So we do NO rotation.
#         If FEN says 'w', that means it's White's move in real life. But we are playing black,
#         so from the engine's perspective (white=our black) we must rotate once.
#         """
#         parts = fen.split()
#         board_str = parts[0]
#         active_color = parts[1]  # 'w' or 'b'
#         castling = parts[2]
#         ep = parts[3]
#         # half_moves = parts[4]
#         # full_moves = parts[5]
#         self.original_fen_color = active_color

#         pos = fen_to_position(board_str, active_color, castling, ep)
#         # If the real FEN says 'b' -> that means real black is about to move. Perfect for us:
#         #  from Sunfish's perspective, that means "White to move" internally. So do nothing.
#         # If real FEN says 'w' -> that means real white is about to move, but we are the black engine.
#         #  So from Sunfish perspective, we want "white=our black." We must rotate once:
#         self.position = pos
#         self.history = [pos]  # fresh history for detection
#         print("Set FEN -> Sunfish internal FEN:", renderFEN(self.position))

#     def current_fen(self):
#         """
#         Return the FEN in the user's real perspective (white on bottom).
#         That means if Sunfish is storing 'white to move' internally but that is our black,
#         we rotate back if the real board says 'w'.
#         But typically if the original fen color was 'b', no rotation is needed.
#         """
#         # If we said 'b' originally, that means no rotation was done. So let's just do nothing.
#         # If we said 'w', we DID rotate, so to produce the user perspective, we rotate back.
#         return renderFEN(self.position)

#     def make_move(self, move_uci: str):
#         """
#         A user (who is White, in real life) made a move like 'e2e4'.
#         But from the engine's perspective, it is 'white to move' for black pieces if the FEN said 'w',
#         or if the position is currently black's turn in real life. So we must flip squares if the
#         engine is controlling black.

#         We then apply the move to the internal position, which rotates automatically in sunfish code.
#         """
#         match = re.match(r'([a-h][1-8])([a-h][1-8])', move_uci)
#         if not match:
#             raise ValueError("Invalid move string")

#         from_sq = parse(match.group(1))
#         to_sq   = parse(match.group(2))

#         # If from the FEN's perspective it is currently White to move (like normal chess),
#         # but our engine is black, that means we are "rotated" once.
#         # So we always flip squares from the user perspective to Sunfish perspective:
#         from_sq = flip_square(from_sq)
#         to_sq   = flip_square(to_sq)

#         move_tuple = (from_sq, to_sq)
#         if move_tuple not in self.position.gen_moves():
#             raise ValueError("Illegal move from user")

#         # Make the move, rotating the position internally
#         self.position = self.position.move(move_tuple)
#         self.history.append(self.position)
#         return self.current_fen()

#     def find_best_move(self, time_limit=1.0):
#         start_time = time.time()
#         best_move = None

#         for depth, mv, score, _ in self.searcher.search(
#             self.position, use_classical=False, history=self.history, movetime=time_limit,
#         ):
#             best_move = mv
#             if time.time() - start_time >= time_limit:
#                 break

#         if best_move is None:
#             return None
#         # No conversion is needed bec   ause the internal board is in user perspective.
#         self.position = self.position.move(best_move)
#         self.history.append(self.position)

#         return move_render_py(self.position, best_move, 'b')  # 'b' signals no flip in move_render_py

#     def evaluate_position(self):
#         # Return the raw sunfish score of the current internal position
#         return self.position.score
