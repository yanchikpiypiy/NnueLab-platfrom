from fastapi import FastAPI, Response, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engines.yanfish import Position, initial, Searcher, process_move, renderFEN
import numpy as np
import matplotlib.pyplot as plt
from random import choice
import io
import uvicorn

###############################################################################
#                              FASTAPI SETUP
###############################################################################
app = FastAPI()
hist = [Position(initial, 0, (True, True), (True, True), 0, 0)]
searcher = Searcher()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.90:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

###############################################################################
#                              MAZE CODE
###############################################################################
class Cell:
    def __init__(self, x, y):
        self.x, self.y = x, y
        self.walls = {'top': True, 'right': True, 'bottom': True, 'left': True}
        self.visited = False

    def check_cell(self, x, y, grid_cells, cols, rows):
        if x < 0 or x >= cols or y < 0 or y >= rows:
            return None
        return grid_cells[y][x]

    def check_neighbors(self, grid_cells, cols, rows):
        neighbors = []
        top = self.check_cell(self.x, self.y - 1, grid_cells, cols, rows)
        right = self.check_cell(self.x + 1, self.y, grid_cells, cols, rows)
        bottom = self.check_cell(self.x, self.y + 1, grid_cells, cols, rows)
        left = self.check_cell(self.x - 1, self.y, grid_cells, cols, rows)
        if top and not top.visited:
            neighbors.append(top)
        if right and not right.visited:
            neighbors.append(right)
        if bottom and not bottom.visited:
            neighbors.append(bottom)
        if left and not left.visited:
            neighbors.append(left)
        return choice(neighbors) if neighbors else None

def remove_walls(current, next_cell):
    dx = current.x - next_cell.x
    if dx == 1:
        current.walls['left'] = False
        next_cell.walls['right'] = False
    elif dx == -1:
        current.walls['right'] = False
        next_cell.walls['left'] = False
    dy = current.y - next_cell.y
    if dy == 1:
        current.walls['top'] = False
        next_cell.walls['bottom'] = False
    elif dy == -1:
        current.walls['bottom'] = False
        next_cell.walls['top'] = False

def generate_maze(width: int, height: int, tile: int = 2):
    cols = width // tile
    rows = height // tile
    grid_cells = [[Cell(x, y) for x in range(cols)] for y in range(rows)]
    current_cell = grid_cells[0][0]
    stack = []
    visited_count = 1
    total_cells = cols * rows
    while visited_count < total_cells:
        current_cell.visited = True
        next_cell = current_cell.check_neighbors(grid_cells, cols, rows)
        if next_cell:
            next_cell.visited = True
            visited_count += 1
            stack.append(current_cell)
            remove_walls(current_cell, next_cell)
            current_cell = next_cell
        elif stack:
            current_cell = stack.pop()
    return grid_cells

def convert_maze_to_array(grid_cells):
    rows = len(grid_cells)
    cols = len(grid_cells[0])
    maze = np.ones((rows * 2 + 1, cols * 2 + 1), dtype=int)
    for y in range(rows):
        for x in range(cols):
            cell = grid_cells[y][x]
            maze[y * 2 + 1][x * 2 + 1] = 0
            if not cell.walls['top']:
                maze[y * 2][x * 2 + 1] = 0
            if not cell.walls['right']:
                maze[y * 2 + 1][x * 2 + 2] = 0
            if not cell.walls['bottom']:
                maze[y * 2 + 2][x * 2 + 1] = 0
            if not cell.walls['left']:
                maze[y * 2 + 1][x * 2] = 0
    maze[1][0] = 0
    maze[-2][-1] = 0
    return maze

def maze_to_string(maze_array):
    return "\n".join("".join("0" if cell == 0 else "1" for cell in row) for row in maze_array)

@app.get("/api/maze", response_class=PlainTextResponse)
def get_maze(width: int = 40, height: int = 20, tile: int = 2):
    grid_cells = generate_maze(width, height, tile)
    maze_array = convert_maze_to_array(grid_cells)
    maze_str = maze_to_string(maze_array)
    return maze_str

@app.get("/api/maze/image")
def get_maze_image(width: int = 40, height: int = 20, tile: int = 2):
    grid_cells = generate_maze(width, height, tile)
    maze_array = convert_maze_to_array(grid_cells)
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.imshow(maze_array, cmap="binary")
    ax.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")

###############################################################################
#                              CHESS ENGINE
###############################################################################
# Pydantic models for incoming data (all moves are in UCI format, e.g. "e2e4")
class ChessMove(BaseModel):
    move: str

class FenRequest(BaseModel):
    fen: str




@app.post("/chess/makemove")
def chess_makemove(body: ChessMove):
    try:
        # Use the process_move function instead of engine.make_move.
        new_hist, engine_move = process_move(body.move, hist, searcher)
        return {
            "status": "ok",
            "engine_move": engine_move,
            "fen": renderFEN(new_hist[-1])
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# @app.post("/chess/bestmove")
# def chess_bestmove():
#     bestmove = engine.find_best_move()
#     fen_after = engine.current_fen()
#     return {"status": "ok", "bestmove": bestmove, "fen": fen_after}

@app.post("/chess/reset")
def chess_reset():
    global hist
    # Reset the game state to the initial position.
    hist = [Position(initial, 0, (True, True), (True, True), 0, 0)]
    return {"status": "ok", "fen": renderFEN(hist[0])}
###############################################################################
#                              MAIN ENTRY
###############################################################################
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
