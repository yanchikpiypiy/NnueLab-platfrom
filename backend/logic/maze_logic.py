import numpy as np
from random import choice


class Cell:
    def __init__(self, x, y):
        self.x, self.y = x, y
        self.walls = {"top": True, "right": True, "bottom": True, "left": True}
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
        current.walls["left"] = False
        next_cell.walls["right"] = False
    elif dx == -1:
        current.walls["right"] = False
        next_cell.walls["left"] = False
    dy = current.y - next_cell.y
    if dy == 1:
        current.walls["top"] = False
        next_cell.walls["bottom"] = False
    elif dy == -1:
        current.walls["bottom"] = False
        next_cell.walls["top"] = False


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
            if not cell.walls["top"]:
                maze[y * 2][x * 2 + 1] = 0
            if not cell.walls["right"]:
                maze[y * 2 + 1][x * 2 + 2] = 0
            if not cell.walls["bottom"]:
                maze[y * 2 + 2][x * 2 + 1] = 0
            if not cell.walls["left"]:
                maze[y * 2 + 1][x * 2] = 0
    maze[1][0] = 0
    maze[-2][-1] = 0
    return maze


def maze_to_string(maze_array):
    return "\n".join(
        "".join("0" if cell == 0 else "1" for cell in row) for row in maze_array
    )
