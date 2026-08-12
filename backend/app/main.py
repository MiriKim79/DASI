"""FastAPI 앱 진입점 (추억 놀이터)."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import age_test, auth, categories, chat, chat_gag, contents, playground

# backend/ 디렉터리 (이미지 폴더 gameQ, foodQ 가 위치한 곳)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 앱 시작 시 테이블이 없으면 생성 (개발 편의)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="나이 맞혀봇 - 추억 놀이터 API", version="1.0.0")

default_cors_origins = "http://localhost:5173,http://127.0.0.1:5173"
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", default_cors_origins).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(age_test.router)
app.include_router(categories.router)
app.include_router(contents.router)
app.include_router(playground.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(auth.user_router)
app.include_router(chat_gag.router)

# 퀴즈 사진·음성 정적 서빙: /media/gameQ/*, /media/dramaQ/*, /media/musicQ/* …
# (분야를 추가하면 seed.py 의 TEXT_QUIZ_SETS 와 이 목록에 폴더 이름을 함께 넣어 준다)
MEDIA_FOLDERS = (
    "gameQ",
    "foodQ",
    "dramaQ",
    "movieQ",
    "animeQ",
    "playQ",
    "memeQ",
    "musicQ",
)
for _folder in MEDIA_FOLDERS:
    _path = os.path.join(BACKEND_DIR, _folder)
    if os.path.isdir(_path):
        app.mount(f"/media/{_folder}", StaticFiles(directory=_path), name=_folder)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "memory-playground"}
