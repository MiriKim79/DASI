"""Integrated, category-free Ranking Challenge domain logic."""
import random
import re
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from . import models

RANKING_CATEGORY_CODES = ("GAME", "DRAMA", "MOVIE", "ANIME_COMIC", "STATIONERY_PLAY", "MEME", "FOOD", "MUSIC")
# Korea has no DST, so a fixed offset avoids requiring the optional tzdata
# package on Windows development environments.
KST = timezone(timedelta(hours=9), name="KST")


def kst_today():
    return datetime.now(KST).date()


def normalize_answer(text: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", (text or "").lower())


def is_text_answer_correct(content: models.Content, answer: str) -> bool:
    normalized = normalize_answer(answer)
    return bool(normalized) and any(normalized == normalize_answer(value) for value in (content.answer or "").split("|") if value.strip())


def ranking_pool_by_category(db: Session) -> dict[str, list[models.RankingQuestion]]:
    rows = (
        db.query(models.RankingQuestion)
        .join(models.RankingQuestion.content)
        .join(models.Content.category)
        .options(joinedload(models.RankingQuestion.content).joinedload(models.Content.category))
        .filter(models.RankingQuestion.is_active.is_(True), models.Content.content_type == "TEXT_QUIZ", models.Category.code.in_(RANKING_CATEGORY_CODES))
        .all()
    )
    pools = {code: [] for code in RANKING_CATEGORY_CODES}
    for row in rows:
        pools[row.content.category.code].append(row)
    return pools


def select_challenge_questions(db: Session) -> list[models.RankingQuestion]:
    pools = ranking_pool_by_category(db)
    insufficient = [code for code, pool in pools.items() if len(pool) < 3]
    if insufficient:
        raise HTTPException(status_code=503, detail=f"랭킹 문제 풀이 부족합니다: {', '.join(insufficient)}")
    three_question_codes = set(random.sample(RANKING_CATEGORY_CODES, 4))
    selected = []
    for code in RANKING_CATEGORY_CODES:
        selected.extend(random.sample(pools[code], 3 if code in three_question_codes else 2))
    random.shuffle(selected)
    return selected


def has_official_record_today(db: Session, user_id: int) -> bool:
    return db.query(models.RankingRecord.id).filter_by(user_id=user_id, official_date=kst_today()).first() is not None


def top_records_query(db: Session, limit: int = 5):
    record_order = (
        models.RankingRecord.accuracy.desc(),
        models.RankingRecord.correct_count.desc(),
        models.RankingRecord.elapsed_seconds.asc(),
        models.RankingRecord.created_at.asc(),
        models.RankingRecord.id.asc(),
    )
    ranked_records = (
        db.query(
            models.RankingRecord.id.label("record_id"),
            func.row_number()
            .over(partition_by=models.RankingRecord.user_id, order_by=record_order)
            .label("user_record_order"),
        )
        .subquery()
    )
    return (
        db.query(models.RankingRecord, models.User.nickname)
        .join(ranked_records, models.RankingRecord.id == ranked_records.c.record_id)
        .join(models.User, models.User.id == models.RankingRecord.user_id)
        .filter(ranked_records.c.user_record_order == 1)
        .order_by(*record_order)
        .limit(limit)
    )


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
