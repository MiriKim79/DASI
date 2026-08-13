"""배포 DB에서 '옛(삭제된) 퀴즈 문항'만 안전하게 제거한다.

문제 배경:
    seed 를 `--reset` 없이 다시 돌리면 새 문항만 추가되고, 코드에서 지운
    옛 문항은 DB에 그대로 남는다. 그래서 배포 서버 놀이터에 지웠던 문제가
    계속 나온다(문방구·유행어·음악).

이 스크립트는 `--reset`(전체 초기화)과 달리, 현재 quiz_data.py 기준으로
'더 이상 존재하지 않는 문항'만 골라 지운다.
    → 회원(users)·코인(coin_transactions)·피드백(feedbacks/반응)·
      랭킹 기록(ranking_records)·도전 기록(ranking_challenges)은 모두 보존한다.

지우는 것(옛 문항에 딸린 것만):
    - contents (옛 문항)
    - content_options (그 문항의 선택지)
    - ranking_questions (그 문항을 가리키는 랭킹 후보)
    - ranking_challenge_items (그 랭킹 후보를 참조하던 과거 도전의 문항 매핑)
      ※ 점수/정답률/소요시간이 담긴 ranking_records 는 challenge_id 만
        참조하므로 그대로 남는다 → 리더보드는 보존된다.

사용법 (backend 디렉터리에서):
    .venv/bin/python -m app.cleanup_stale_quiz          # 미리보기(변경 없음)
    .venv/bin/python -m app.cleanup_stale_quiz --apply  # 실제 삭제

안전장치: 인자 없이 실행하면 무엇이 지워질지 요약만 출력하고 끝난다.
"""
import sys

from . import models
from .database import SessionLocal
from .seed import TEXT_QUIZ_SETS, canonical_media_url

# 문항 교체가 있었던 분야만 대상으로 한다(다른 분야는 절대 건드리지 않는다).
TARGET_CODES = ("STATIONERY_PLAY", "MEME", "MUSIC")


def _valid_urls_by_code() -> dict[str, set[str]]:
    """현재 quiz_data.py 가 기대하는 유효 image_url 집합(분야별)."""
    valid: dict[str, set[str]] = {}
    for code, folder, _question, items in TEXT_QUIZ_SETS:
        if code not in TARGET_CODES:
            continue
        urls = set()
        for item in items:
            url = canonical_media_url(folder, item)
            if url:
                urls.add(url)
        valid[code] = urls
    return valid


def main(apply: bool) -> None:
    db = SessionLocal()
    valid = _valid_urls_by_code()

    categories = {
        category.code: category.id
        for category in db.query(models.Category)
        .filter(models.Category.code.in_(TARGET_CODES))
        .all()
    }

    stale_ids: list[int] = []
    print("대상 분야별 현황:")
    for code in TARGET_CODES:
        category_id = categories.get(code)
        if category_id is None:
            print(f"  {code:<16} 카테고리 없음 — 건너뜀")
            continue
        rows = (
            db.query(models.Content)
            .filter(
                models.Content.category_id == category_id,
                models.Content.content_type == "TEXT_QUIZ",
            )
            .all()
        )
        stale = [c for c in rows if c.image_url not in valid.get(code, set())]
        stale_ids.extend(c.id for c in stale)
        print(f"  {code:<16} 전체 {len(rows):>3}개 · 유효 {len(valid.get(code, set())):>3}개 · 삭제대상 {len(stale):>3}개")
        for c in stale:
            print(f"        - {c.image_url}")

    if not stale_ids:
        print("\n지울 옛 문항이 없습니다. (이미 깨끗함)")
        return

    # 딸린 참조 집계 (삭제 순서: challenge_items → ranking_questions → options → contents)
    rqs = (
        db.query(models.RankingQuestion)
        .filter(models.RankingQuestion.content_id.in_(stale_ids))
        .all()
    )
    rq_ids = [r.id for r in rqs]
    item_count = (
        db.query(models.RankingChallengeItem)
        .filter(models.RankingChallengeItem.ranking_question_id.in_(rq_ids))
        .count()
        if rq_ids
        else 0
    )
    option_count = (
        db.query(models.ContentOption)
        .filter(models.ContentOption.content_id.in_(stale_ids))
        .count()
    )

    print("\n[삭제 예정 요약]")
    print(f"  옛 문항(contents)            : {len(stale_ids)}")
    print(f"  선택지(content_options)      : {option_count}")
    print(f"  랭킹 후보(ranking_questions) : {len(rq_ids)}")
    print(f"  과거 도전 매핑(challenge_items): {item_count}  ← 점수/리더보드(ranking_records)는 보존")

    if not apply:
        print("\n※ 미리보기 모드입니다. 실제로 지우려면 --apply 를 붙여 다시 실행하세요.")
        return

    if rq_ids:
        db.query(models.RankingChallengeItem).filter(
            models.RankingChallengeItem.ranking_question_id.in_(rq_ids)
        ).delete(synchronize_session=False)
        db.query(models.RankingQuestion).filter(
            models.RankingQuestion.id.in_(rq_ids)
        ).delete(synchronize_session=False)
    db.query(models.ContentOption).filter(
        models.ContentOption.content_id.in_(stale_ids)
    ).delete(synchronize_session=False)
    db.query(models.Content).filter(
        models.Content.id.in_(stale_ids)
    ).delete(synchronize_session=False)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    print("\n삭제 완료. 분야별 남은 문항 수:")
    for code in TARGET_CODES:
        category_id = categories.get(code)
        if category_id is None:
            continue
        remaining = (
            db.query(models.Content)
            .filter(
                models.Content.category_id == category_id,
                models.Content.content_type == "TEXT_QUIZ",
            )
            .count()
        )
        print(f"  {code:<16} {remaining}개 (기대 {len(valid.get(code, set()))}개)")
    print("\n백엔드는 DB를 매 요청마다 읽으므로 재시작 없이 바로 반영됩니다.")


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
