"""피드백 작성 API (#45)."""
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from typing import Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user, get_current_user_optional


router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# 좋아요가 이 개수 이상이면 '인기 피드백'
POPULAR_LIKE_THRESHOLD = 3
# 인기 피드백 중 목록 맨 위에 따로 노출할 최대 개수
PINNED_LIMIT = 3

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


def _reaction_counts(db: Session) -> dict[int, tuple[int, int]]:
    """피드백별 (좋아요 수, 싫어요 수)를 한 번의 집계 쿼리로 구한다."""
    rows = (
        db.query(
            models.FeedbackReaction.feedback_id,
            func.sum(case((models.FeedbackReaction.reaction == "LIKE", 1), else_=0)),
            func.sum(case((models.FeedbackReaction.reaction == "DISLIKE", 1), else_=0)),
        )
        .group_by(models.FeedbackReaction.feedback_id)
        .all()
    )
    return {feedback_id: (int(likes or 0), int(dislikes or 0)) for feedback_id, likes, dislikes in rows}


def _my_reactions(db: Session, user: Optional[models.User]) -> dict[int, str]:
    """현재 사용자가 각 피드백에 누른 반응. 비로그인이면 빈 dict."""
    if user is None:
        return {}
    rows = (
        db.query(models.FeedbackReaction.feedback_id, models.FeedbackReaction.reaction)
        .filter(models.FeedbackReaction.user_id == user.id)
        .all()
    )
    return {feedback_id: reaction for feedback_id, reaction in rows}


@router.get("", response_model=list[schemas.FeedbackListItemOut])
def get_feedbacks(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """등록된 피드백 목록.

    정렬: 인기 피드백(좋아요 3개 이상) 중 좋아요가 많은 상위 3개를 맨 위에 고정하고,
    나머지는 최신순으로 잇는다.

    로그인 상태면 is_mine(본인 글 여부)과 my_reaction(내가 누른 반응)을 채운다.
    작성자 user_id 자체는 응답에 내려주지 않는다.
    """
    rows = (
        db.query(models.Feedback, models.User.nickname)
        .join(models.User, models.User.id == models.Feedback.user_id)
        .order_by(models.Feedback.created_at.desc(), models.Feedback.id.desc())
        .all()
    )
    counts = _reaction_counts(db)
    mine = _my_reactions(db, current_user)

    items = []
    for feedback, nickname in rows:
        like_count, dislike_count = counts.get(feedback.id, (0, 0))
        items.append(
            schemas.FeedbackListItemOut(
                id=feedback.id,
                nickname=nickname,
                content=feedback.content,
                created_at=feedback.created_at,
                is_mine=current_user is not None and feedback.user_id == current_user.id,
                like_count=like_count,
                dislike_count=dislike_count,
                my_reaction=mine.get(feedback.id),
                is_popular=like_count >= POPULAR_LIKE_THRESHOLD,
            )
        )

    # rows가 이미 최신순이라, 아래 정렬은 동점일 때 최신 글이 앞에 오도록 유지된다.
    pinned = sorted(
        (item for item in items if item.is_popular),
        key=lambda item: item.like_count,
        reverse=True,
    )[:PINNED_LIMIT]
    pinned_ids = {item.id for item in pinned}
    for item in pinned:
        item.is_pinned = True

    rest = [item for item in items if item.id not in pinned_ids]
    return pinned + rest


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


@router.post("/{feedback_id}/reaction", response_model=schemas.FeedbackReactionOut)
def react_to_feedback(
    feedback_id: int,
    payload: schemas.FeedbackReactionIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """피드백에 좋아요/싫어요를 남긴다(본인 글 포함).

    토글 방식이다.
      - 같은 반응을 다시 누르면 취소된다.
      - 반대 반응을 누르면 그쪽으로 바뀐다.
    사용자당 피드백 하나에 반응은 최대 1개다(DB 유니크 제약).
    """
    feedback = db.get(models.Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="피드백을 찾을 수 없습니다.",
        )

    existing = (
        db.query(models.FeedbackReaction)
        .filter_by(feedback_id=feedback_id, user_id=current_user.id)
        .first()
    )
    if existing is None:
        db.add(
            models.FeedbackReaction(
                feedback_id=feedback_id,
                user_id=current_user.id,
                reaction=payload.reaction,
            )
        )
        my_reaction = payload.reaction
    elif existing.reaction == payload.reaction:
        db.delete(existing)  # 같은 걸 다시 눌렀다 = 취소
        my_reaction = None
    else:
        existing.reaction = payload.reaction
        my_reaction = payload.reaction

    try:
        db.commit()
    except IntegrityError:
        # 같은 사용자가 동시에 두 번 눌러 유니크 제약에 걸린 경우
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="반응 처리 중 충돌이 발생했습니다. 다시 시도해주세요.",
        )
    except Exception:
        db.rollback()
        raise

    like_count, dislike_count = _reaction_counts(db).get(feedback_id, (0, 0))
    return schemas.FeedbackReactionOut(
        feedback_id=feedback_id,
        like_count=like_count,
        dislike_count=dislike_count,
        my_reaction=my_reaction,
        is_popular=like_count >= POPULAR_LIKE_THRESHOLD,
    )


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """본인이 작성한 피드백만 삭제한다.

    남의 글을 지우려는 시도는 403으로 막는다. 존재 여부를 403/404로 구분해
    노출해도 문제되는 정보가 아니라(피드백 목록은 공개), 그대로 알려준다.
    """
    feedback = db.get(models.Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="피드백을 찾을 수 없습니다.",
        )
    if feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인이 작성한 피드백만 삭제할 수 있습니다.",
        )

    db.delete(feedback)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return None
