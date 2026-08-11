"""개그 콘텐츠 + 퀴즈 라우터 — 3번 담당 (@MiriKim79).

F3-4에 따라 개그는 콘텐츠 데이터부터 API·채점까지 챗봇(3번)이 전부 소유한다.
추억 놀이터 화면에는 노출하지 않고, 챗봇 팝업의 "개그 퀴즈" 모드에서만 쓴다.

MVP 콘텐츠는 예시용 오리지널 문항 몇 개를 정적으로 둔다(실제 콘텐츠 수집/검증 계획은
docs/랭킹코인기획.md 참고). 나중에 문항을 늘리거나 DB로 옮길 때 이 파일의 GAG_ITEMS만
바꾸면 된다.
"""
import random

from fastapi import APIRouter, HTTPException

from .. import schemas

router = APIRouter(prefix="/api", tags=["gag"])

# id, prompt(모리가 먼저 던지는 앞부분), answer(정답 뒷부분) — 오리지널 예시 문항.
GAG_ITEMS = [
    {"id": 1, "prompt": "모리가 제일 좋아하는 계절은? 겨울, 왜냐면 눈이", "answer": "와서"},
    {"id": 2, "prompt": "냉장고 안에 있는데 아무도 못 먹는 건? 냉장고", "answer": "불빛"},
    {"id": 3, "prompt": "도둑이 제일 싫어하는 아이스크림은? 폴리스", "answer": "콘"},
    {"id": 4, "prompt": "세상에서 가장 억울한 문자는? 아무 잘못 없는데 자꾸 혼나는", "answer": "느낌표"},
    {"id": 5, "prompt": "귀신이 제일 잘 타는 놀이기구는?", "answer": "롤러코스터"},
]

GAG_ITEMS_BY_ID = {item["id"]: item for item in GAG_ITEMS}


def _normalize(text: str) -> str:
    return text.strip().replace(" ", "").lower()


@router.get("/gag", response_model=list[schemas.GagItemOut])
def list_gag_items():
    """개그 문항 목록 — docs/FEATURES.md F3-4. 매번 랜덤 순서로 반환한다."""
    shuffled = random.sample(GAG_ITEMS, len(GAG_ITEMS))
    return [{"id": item["id"], "prompt": item["prompt"]} for item in shuffled]


@router.post("/gag/{item_id}/answer", response_model=schemas.GagAnswerOut)
def check_gag_answer(item_id: int, payload: schemas.GagAnswerIn):
    """개그 정답 판정 — 서버에서 채점하고 정답을 공개한다(#35)."""
    item = GAG_ITEMS_BY_ID.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="존재하지 않는 문항이에요.")

    is_correct = _normalize(payload.answer) == _normalize(item["answer"])
    # TODO(F4-3 연동): 4번의 POST /api/ranking/submit이 준비되면 정답일 때
    # 서버-투-서버로 { "category": "chatbot-gag", "score": 1 } 제출을 여기서 호출한다.
    return schemas.GagAnswerOut(
        item_id=item_id,
        is_correct=is_correct,
        correct_answer=item["answer"],
    )
