from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse
import matplotlib.pyplot as plt
import io
from ..logic.maze_logic import generate_maze, convert_maze_to_array, maze_to_string

router = APIRouter(prefix="/api/maze", tags=["maze"])


@router.get("", response_class=PlainTextResponse)
def get_maze(width: int = 40, height: int = 20, tile: int = 2):
    grid_cells = generate_maze(width, height, tile)
    maze_array = convert_maze_to_array(grid_cells)
    maze_str = maze_to_string(maze_array)
    return maze_str


@router.get("/image")
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
