"""세대별 AI 챗봇 라우터 — 3번 담당 (@MiriKim79).

F3-1: 세대 목록 조회. 세대는 DB로 관리하지 않는 고정 값(1990s~2020s 4종 확정,
docs/FEATURES.md F3 참고)이라 정적 데이터로 둔다.
채팅 API(F3-2, POST /api/chat)는 OpenAI 연동 이슈(#26~#28)에서 이어서 구현한다.
"""
from fastapi import APIRouter

from .. import schemas

router = APIRouter(prefix="/api", tags=["chat"])

# docs/FEATURES.md F3-1 응답 스펙 그대로.
GENERATIONS = [
    {"id": "1990s", "display_name": "1990년대", "character": "1990s_retro"},
    {"id": "2000s", "display_name": "2000년대", "character": "2000s_y2k"},
    {"id": "2010s", "display_name": "2010년대", "character": "2010s_campus"},
    {"id": "2020s", "display_name": "2020년대", "character": "2020s_digital"},
]


@router.get("/generations", response_model=list[schemas.GenerationOut])
def list_generations():
    """세대 목록 조회 — docs/FEATURES.md F3-1."""
    return GENERATIONS
