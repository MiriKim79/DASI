"""세대별 AI 챗봇 라우터 — 3번 담당 (@MiriKim79).

F3-1: 세대 목록 조회. 세대는 DB로 관리하지 않는 고정 값(1990s~2020s 4종 확정,
docs/FEATURES.md F3 참고)이라 정적 데이터로 둔다.
F3-2: 채팅 API. 세대별 persona(personas.py)로 system prompt를 구성해
OpenAI Responses API를 호출한다. 프론트는 API Key를 절대 모른다 — 항상 이 라우터를 거친다.
"""
import os

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI, OpenAIError
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..personas import GENERATION_PROFILES, build_system_prompt
from ..security import get_current_user_optional

router = APIRouter(prefix="/api", tags=["chat"])

# docs/FEATURES.md F3-1 응답 스펙 그대로.
GENERATIONS = [
    {"id": "1990s", "display_name": "1990년대", "character": "1990s_retro"},
    {"id": "2000s", "display_name": "2000년대", "character": "2000s_y2k"},
    {"id": "2010s", "display_name": "2010년대", "character": "2010s_campus"},
    {"id": "2020s", "display_name": "2020년대", "character": "2020s_digital"},
]
CHARACTER_BY_GENERATION = {g["id"]: g["character"] for g in GENERATIONS}

CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")


@router.get("/generations", response_model=list[schemas.GenerationOut])
def list_generations():
    """세대 목록 조회 — docs/FEATURES.md F3-1."""
    return GENERATIONS


@router.post("/chat", response_model=schemas.ChatOut)
def chat(
    payload: schemas.ChatIn,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user_optional),
):
    """세대별 모리와 대화 — docs/FEATURES.md F3-2.

    history는 F3-3 정책대로 클라이언트(비로그인) 또는 DB(로그인, #31)에서 관리한
    대화 목록을 그대로 받는다 — 이 요청 자체는 응답 생성에만 쓴다.
    로그인 사용자(Authorization: Bearer 토큰)면 이번 턴(질문+답변)을 DB에 남긴다(#31).
    비로그인 사용자는 저장하지 않는다(프론트 state만 유지, 새로고침 시 사라짐).
    """
    if payload.generation not in GENERATION_PROFILES:
        raise HTTPException(status_code=400, detail="지원하지 않는 세대예요.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY가 설정되지 않았어요. backend/.env를 확인해주세요.",
        )

    system_prompt = build_system_prompt(payload.generation)
    input_messages = [{"role": "system", "content": system_prompt}]
    input_messages.extend({"role": h.role, "content": h.content} for h in payload.history)
    input_messages.append({"role": "user", "content": payload.message})

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(model=CHAT_MODEL, input=input_messages)
    except OpenAIError as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI 호출에 실패했어요: {exc}") from exc

    if current_user is not None:
        crud.save_chat_turn(
            db,
            user_id=current_user.id,
            generation=payload.generation,
            user_message=payload.message,
            assistant_message=response.output_text,
        )

    return schemas.ChatOut(
        generation=payload.generation,
        character=CHARACTER_BY_GENERATION[payload.generation],
        message=response.output_text,
    )
