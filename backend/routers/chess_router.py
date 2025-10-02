from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..logic.chess_logic import game_state

router = APIRouter(prefix="/chess", tags=["chess"])


# Pydantic models for incoming data (all moves are in UCI format, e.g. "e2e4")
class ChessMove(BaseModel):
    move: str


class FenRequest(BaseModel):
    fen: str


@router.post("/makemove")
def chess_makemove(body: ChessMove):
    try:
        engine_move, fen = game_state.make_move(body.move)
        return {"status": "ok", "engine_move": engine_move, "fen": fen}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset")
def chess_reset():
    fen = game_state.reset()
    return {"status": "ok", "fen": fen}
