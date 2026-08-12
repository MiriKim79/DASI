"""개그 콘텐츠 + 퀴즈 라우터 — 3번 담당 (@MiriKim79).

F3-4에 따라 개그는 콘텐츠 데이터부터 API·채점까지 챗봇(3번)이 전부 소유한다.
추억 놀이터 화면에는 노출하지 않고, 챗봇 팝업의 "개그 퀴즈" 모드에서만 쓴다.

MVP 콘텐츠는 예시용 오리지널 문항 몇 개를 정적으로 둔다(실제 콘텐츠 수집/검증 계획은
docs/랭킹코인기획.md 참고). 실제 콘텐츠를 모으면 gag_data.py의 GAG_ITEMS만 채우면 된다
— 이 라우터 파일은 건드릴 필요 없음.
"""
import random
import re

from fastapi import APIRouter, HTTPException

from .. import schemas
from ..gag_data import GAG_ITEMS

router = APIRouter(prefix="/api", tags=["gag"])

GAG_ITEMS_BY_ID = {item["id"]: item for item in GAG_ITEMS}

# 공백/대소문자뿐 아니라 흔한 문장부호(물음표·느낌표·물결·따옴표 등)도 무시하고 비교한다.
_STRIP_CHARS = re.compile(r"[\s'\"~!?.…,]")


def _normalize(text: str) -> str:
    return _STRIP_CHARS.sub("", text.strip().lower())


def _accepted_answers(answer_field: str) -> list[str]:
    """quiz_data.py와 같은 컨벤션: '정답1|정답2'로 복수 정답을 표기한다."""
    return [a for a in answer_field.split("|") if a]


def _primary_answer(item: dict) -> str:
    return _accepted_answers(item["answer"])[0]


def _hint1(item: dict) -> str:
    """gag_data.py에 hint1이 직접 있으면 그걸 쓰고, 없으면 자동 생성(글자 수).
    96개 전부 손으로 힌트를 쓰기엔 이번 4일 범위에서 비효율적이라 자동 생성을
    기본값으로 둔다 — 나중에 특정 문항에 더 좋은 힌트를 주고 싶으면 gag_data.py에
    "hint1" 키만 추가하면 이 자동 생성보다 우선한다."""
    if item.get("hint1"):
        return item["hint1"]
    length = len(_primary_answer(item).replace(" ", ""))
    return f"정답은 총 {length}글자예요!"


def _hint2(item: dict) -> str:
    if item.get("hint2"):
        return item["hint2"]
    first = _primary_answer(item).replace(" ", "")[:1] or "?"
    return f"첫 글자는 '{first}'예요!"


@router.get("/gag", response_model=list[schemas.GagItemOut])
def list_gag_items():
    """개그 문항 목록 — docs/FEATURES.md F3-4. 매번 랜덤 순서로 반환한다.
    힌트 2단계(hint1/hint2)를 함께 내려준다 — 정답 자체는 여전히 포함하지 않는다."""
    shuffled = random.sample(GAG_ITEMS, len(GAG_ITEMS))
    return [
        {
            "id": item["id"],
            "prompt": item["prompt"],
            "hint1": _hint1(item),
            "hint2": _hint2(item),
        }
        for item in shuffled
    ]


@router.post("/gag/{item_id}/answer", response_model=schemas.GagAnswerOut)
def check_gag_answer(item_id: int, payload: schemas.GagAnswerIn):
    """개그 정답 판정 — 서버에서 채점하고 정답을 공개한다(#35)."""
    item = GAG_ITEMS_BY_ID.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="존재하지 않는 문항이에요.")

    accepted = _accepted_answers(item["answer"])
    user_norm = _normalize(payload.answer)
    is_correct = any(_normalize(alt) == user_norm for alt in accepted)
    # TODO(F4-3 연동): 4번의 POST /api/ranking/submit이 준비되면 정답일 때
    # 서버-투-서버로 { "category": "chatbot-gag", "score": 1 } 제출을 여기서 호출한다.
    return schemas.GagAnswerOut(
        item_id=item_id,
        is_correct=is_correct,
        correct_answer=accepted[0],  # 대표 정답 하나만 사용자에게 보여준다
    )
