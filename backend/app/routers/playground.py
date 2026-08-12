"""추억 놀이터 결과 처리 라우터 (아재력 측정).

콘텐츠를 푼 결과(맞힌 개수/전체)를 받아 '아재력' 점수와 등급을 계산한다.
랭킹 담당자가 이 결과를 그대로 집계에 활용할 수 있도록 계산 로직을 서버에 둔다.
"""
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..coin_service import grant_coin_once, spend_coin
from ..database import get_db
from ..security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/playground", tags=["playground"])

# 분야 퀴즈 1회 플레이 비용(코인). 랭킹 도전(100)과는 별개 정책이다.
CATEGORY_PLAY_COST = 50


def _maybe_reward_first_completion(
    db: Session, user: Optional[models.User], category_code: Optional[str], total: int
) -> int:
    """로그인 사용자가 실제 분야 퀴즈를 완료(total>0)했을 때 분야당 1회 +5 지급.

    - 랭킹 도전과는 무관한 별개 정책(#94).
    - 존재하는 분야 코드일 때만 지급한다("CHALLENGE" 등 가짜 코드 방지).
    - event_key로 분야당 1회만 지급되도록 멱등 처리한다.
    반환값: 이번 호출에서 새로 지급한 코인(이미 받았으면 0).
    """
    if user is None or not category_code or total <= 0:
        return 0
    exists = (
        db.query(models.Category.id)
        .filter(models.Category.code == category_code)
        .first()
    )
    if exists is None:
        return 0
    granted = grant_coin_once(
        db,
        user_id=user.id,
        amount=5,
        reason="CATEGORY_FIRST",
        event_key=f"category-first:{user.id}:{category_code}",
    )
    if granted:
        db.commit()
        return 5
    return 0


@router.post("/categories/{code}/start", response_model=schemas.CategoryPlayStartOut)
def start_category_play(
    code: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """분야 퀴즈 플레이 시작 — 코인 50개를 차감한다(로그인 필요).

    플레이할 때마다 매번 차감하므로 event_key는 호출마다 고유하게 만든다.
    코인이 부족하면 spend_coin이 400을 낸다.
    """
    category = db.query(models.Category).filter(models.Category.code == code).first()
    if category is None:
        raise HTTPException(status_code=404, detail="분야를 찾을 수 없습니다.")

    try:
        spend_coin(
            db,
            user_id=current_user.id,
            amount=CATEGORY_PLAY_COST,
            reason="CATEGORY_PLAY",
            event_key=f"category-play:{current_user.id}:{code}:{uuid4().hex}",
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(current_user)
    return schemas.CategoryPlayStartOut(
        category_code=code,
        coin_cost=CATEGORY_PLAY_COST,
        remaining_coin=current_user.coin_balance,
    )


def _grade(score: int) -> tuple[str, str]:
    """정답률(score) -> (등급 라벨, 멘트)"""
    if score >= 90:
        return ("레전드 아재 🏆", "이 시절을 완벽하게 기억하는군요! 찐 세대 인정!")
    if score >= 70:
        return ("찐 추억러 😎", "그때 그 시절, 확실히 겪으셨네요!")
    if score >= 40:
        return ("어렴풋 세대 🤔", "몇 개는 아련하게 기억나죠?")
    return ("요즘 세대 인정 🐣", "이건 좀 옛날 얘기였나 봐요!")


@router.post("/result", response_model=schemas.ResultOut)
def compute_result(
    payload: schemas.ResultIn,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    """아재력 결과 계산 + (로그인 시) 분야 최초 완료 보상 +5 지급."""
    total = max(payload.total, 0)
    correct = min(max(payload.correct, 0), total) if total else 0

    if total == 0:
        # 정답이 있는 문제를 풀지 않은 경우(경험형만 참여 등)
        return schemas.ResultOut(
            correct=0,
            total=0,
            score=0,
            level="추억 여행자 🚀",
            message="정답 맞히기보다 추억을 즐기셨네요!",
            category=payload.category,
            coin_reward=0,
        )

    score = round(correct / total * 100)
    level, message = _grade(score)
    coin_reward = _maybe_reward_first_completion(
        db, current_user, payload.category, total
    )
    return schemas.ResultOut(
        correct=correct,
        total=total,
        score=score,
        level=level,
        message=message,
        category=payload.category,
        coin_reward=coin_reward,
    )
