from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import maze_router, chess_router
import uvicorn


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.0.90:3000",
        "https://nnuelab-platfrom-front.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(maze_router.router)
app.include_router(chess_router.router)


@app.get("/")
def read_root():
    return {"message": "FastAPI is running!"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
