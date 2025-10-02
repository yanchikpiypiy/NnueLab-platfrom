from ..engines.yanfish import Position, initial, Searcher, process_move, renderFEN


class ChessGameState:
    def __init__(self):
        self.hist = [Position(initial, 0, (True, True), (True, True), 0, 0)]
        self.searcher = Searcher()

    def make_move(self, move: str):
        new_hist, engine_move = process_move(move, self.hist, self.searcher)
        self.hist = new_hist
        return engine_move, renderFEN(self.hist[-1])

    def reset(self):
        self.hist = [Position(initial, 0, (True, True), (True, True), 0, 0)]
        return renderFEN(self.hist[0])

    def get_current_fen(self):
        return renderFEN(self.hist[-1])


# Global game state instance
game_state = ChessGameState()
