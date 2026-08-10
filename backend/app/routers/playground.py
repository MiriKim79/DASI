"""추억 놀이터 결과 처리 라우터 (아재력 측정).

콘텐츠를 푼 결과(맞힌 개수/전체)를 받아 '아재력' 점수와 등급을 계산한다.
랭킹 담당자가 이 결과를 그대로 집계에 활용할 수 있도록 계산 로직을 서버에 둔다.
"""
from fastapi import APIRouter

from .. import schemas

router = APIRouter(prefix="/api/playground", tags=["playground"])


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
def compute_result(payload: schemas.ResultIn):
    """아재력 결과 계산."""
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
        )

    score = round(correct / total * 100)
    level, message = _grade(score)
    return schemas.ResultOut(
        correct=correct,
        total=total,
        score=score,
        level=level,
        message=message,
        category=payload.category,
    )
