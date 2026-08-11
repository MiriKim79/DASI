"""FastAPI 앱 진입점 (추억 놀이터)."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import age_test, categories, chat, contents, playground

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


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "memory-playground"}
