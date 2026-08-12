"""피드백 작성 API (#45)."""
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user


router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# MVP 범위의 최소 정적 금칙어 목록. 공백·기호를 제거한 뒤 검사한다.
FORBIDDEN_WORDS = (
    "씨발",
    "시발",
    "병신",
    "개새끼",
    "좆",
    "꺼져",
    "죽어",
)


def _normalize_forbidden_word_check(content: str) -> str:
    return re.sub(r"[\s\W_]+", "", content.casefold())


def _contains_forbidden_word(content: str) -> bool:
    normalized_content = _normalize_forbidden_word_check(content)
    return any(word in normalized_content for word in FORBIDDEN_WORDS)


@router.post("", response_model=schemas.FeedbackOut, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: schemas.FeedbackCreateIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 로그인 사용자의 피드백을 저장한다."""
    if _contains_forbidden_word(payload.content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="부적절한 표현이 포함되어 있습니다.",
        )

    feedback = models.Feedback(user_id=current_user.id, content=payload.content)
    db.add(feedback)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(feedback)
    return feedback
