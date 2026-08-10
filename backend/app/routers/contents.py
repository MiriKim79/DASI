"""콘텐츠 라우터."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/contents", tags=["contents"])


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
