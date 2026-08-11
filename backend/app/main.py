"""FastAPI 앱 진입점 (추억 놀이터)."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import categories, contents, playground

# backend/ 디렉터리 (이미지 폴더 gameQ, foodQ 가 위치한 곳)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 앱 시작 시 테이블이 없으면 생성 (개발 편의)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="나이 맞혀봇 - 추억 놀이터 API", version="1.0.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(contents.router)
app.include_router(playground.router)

# 퀴즈 이미지 정적 서빙: /media/gameQ/*, /media/foodQ/*
for _folder in ("gameQ", "foodQ"):
    _path = os.path.join(BACKEND_DIR, _folder)
    if os.path.isdir(_path):
        app.mount(f"/media/{_folder}", StaticFiles(directory=_path), name=_folder)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "memory-playground"}
