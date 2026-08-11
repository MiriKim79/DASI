"""콘텐츠 라우터."""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/contents", tags=["contents"])


def _normalize(text: str) -> str:
    """정답 비교용 정규화: 공백/문장부호 제거 + 소문자화."""
    if text is None:
        return ""
    # 한글/영문/숫자만 남기고 나머지(공백, 특수문자 등) 제거
    return re.sub(r"[^0-9a-z가-힣]", "", text.lower())


@router.get("", response_model=list[schemas.ContentOut])
def list_contents(
    category: Optional[str] = Query(None, description="카테고리 코드 (예: FOOD)"),
    subcategory: Optional[str] = Query(
        None, description="개그 하위분류 (DAD/HUMANITIES/SCIENCE/GENERATION)"
    ),
    db: Session = Depends(get_db),
):
    """해당 분야 콘텐츠 조회. category, subcategory 로 필터링."""
    return crud.get_contents(db, category, subcategory)


@router.get("/random", response_model=schemas.ContentOut)
def random_content(
    category: Optional[str] = Query(None, description="카테고리 코드 (예: FOOD)"),
    subcategory: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """해당 분야 랜덤 콘텐츠 조회."""
    content = crud.get_random_content(db, category, subcategory)
    if content is None:
        raise HTTPException(status_code=404, detail="콘텐츠가 없습니다.")
    return content


@router.get("/{content_id}", response_model=schemas.ContentOut)
def get_content(content_id: int, db: Session = Depends(get_db)):
    """특정 콘텐츠 조회."""
    content = crud.get_content_by_id(db, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="콘텐츠를 찾을 수 없습니다.")
    return content


@router.post("/{content_id}/answer", response_model=schemas.AnswerOut)
def answer_content(
    content_id: int,
    payload: schemas.AnswerIn,
    db: Session = Depends(get_db),
):
    """사용자의 답변 처리. 선택지 정답 여부와 정답을 반환."""
    content = crud.get_content_by_id(db, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="콘텐츠를 찾을 수 없습니다.")

    selected = crud.get_option(db, payload.option_id)
    if selected is None or selected.content_id != content_id:
        raise HTTPException(status_code=400, detail="올바르지 않은 선택지입니다.")

    # 경험 공유형(EXPERIENCE)은 정답이 없으므로 항상 정답 처리 + 공감 메시지
    if content.content_type == "EXPERIENCE":
        return schemas.AnswerOut(
            content_id=content_id,
            selected_option_id=selected.id,
            is_correct=True,
            correct_option_id=None,
            correct_option_text=None,
            message="그 시절 추억이네요! 🥲",
        )

    correct = crud.get_correct_option(db, content_id)
    is_correct = bool(selected.is_correct)
    return schemas.AnswerOut(
        content_id=content_id,
        selected_option_id=selected.id,
        is_correct=is_correct,
        correct_option_id=correct.id if correct else None,
        correct_option_text=correct.option_text if correct else None,
        message="정답이에요! 🎉" if is_correct else "아쉬워요, 다시 도전!",
    )


@router.post("/{content_id}/answer-text", response_model=schemas.TextAnswerOut)
def answer_text(
    content_id: int,
    payload: schemas.TextAnswerIn,
    db: Session = Depends(get_db),
):
    """사진/노래를 보고 작성한 텍스트 정답을 채점한다(TEXT_QUIZ)."""
    content = crud.get_content_by_id(db, content_id)
    if content is None:
        raise HTTPException(status_code=404, detail="콘텐츠를 찾을 수 없습니다.")

    # 허용 정답 목록: content.answer 를 '|'로 나눈 것 (+ 객관식 정답 옵션 겸용)
    raw = content.answer or ""
    accepted = [a for a in raw.split("|") if a.strip()]
    user_norm = _normalize(payload.text)
    is_correct = bool(user_norm) and any(
        user_norm == _normalize(a) for a in accepted
    )
    # 대표 정답(첫 번째)만 노출
    correct_answer = accepted[0] if accepted else None
    return schemas.TextAnswerOut(
        content_id=content_id,
        is_correct=is_correct,
        correct_answer=correct_answer,
        message="정답이에요! 🎉" if is_correct else f"아쉬워요! 정답은 '{correct_answer}'였어요.",
    )
