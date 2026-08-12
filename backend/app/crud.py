"""DB 접근 로직 (라우터에서 재사용)."""
import random
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from . import models


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(
    db: Session,
    *,
    email: str,
    password_hash: str,
    nickname: str,
) -> models.User:
    user = models.User(
        email=email,
        password_hash=password_hash,
        nickname=nickname,
    )
    db.add(user)
    return user


def _random_order(db: Session):
    """DB 방언에 맞는 랜덤 정렬 함수 반환 (SQLite: random(), MySQL: rand())."""
    dialect = db.bind.dialect.name if db.bind is not None else "sqlite"
    return func.rand() if dialect in ("mysql", "mariadb") else func.random()


# ---------- Category ----------
def get_categories(db: Session) -> list[models.Category]:
    return db.query(models.Category).order_by(models.Category.id).all()


def get_category_by_id(db: Session, category_id: int) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_category_by_code(db: Session, code: str) -> Optional[models.Category]:
    return (
        db.query(models.Category)
        .filter(models.Category.code == code.upper())
        .first()
    )


# ---------- Content ----------
def _content_query(db: Session):
    return db.query(models.Content).options(selectinload(models.Content.options))


def get_contents(
    db: Session,
    category_code: Optional[str] = None,
    subcategory: Optional[str] = None,
) -> list[models.Content]:
    query = _content_query(db)
    if category_code:
        category = get_category_by_code(db, category_code)
        if category is None:
            return []
        query = query.filter(models.Content.category_id == category.id)
    if subcategory:
        query = query.filter(models.Content.subcategory == subcategory.upper())
    return query.order_by(models.Content.id).all()


def get_random_content(
    db: Session,
    category_code: Optional[str] = None,
    subcategory: Optional[str] = None,
) -> Optional[models.Content]:
    query = _content_query(db)
    if category_code:
        category = get_category_by_code(db, category_code)
        if category is None:
            return None
        query = query.filter(models.Content.category_id == category.id)
    if subcategory:
        query = query.filter(models.Content.subcategory == subcategory.upper())
    return query.order_by(_random_order(db)).first()


def get_challenge_contents(
    db: Session,
    per_category: int = 2,
    total: int = 20,
) -> list[models.Content]:
    """랭킹용 통합 도전 문제 세트.

    8개 분야에서 각각 per_category개(랜덤)를 먼저 뽑아 모든 분야가 반드시 들어가게 하고,
    total에 못 미치면 남은 문제 중 랜덤으로 채운다. 마지막에 순서를 섞어 분야가
    한곳에 몰리지 않게 한다. (예: per_category=2, total=20 → 8분야×2 + 랜덤 4)
    """
    picked: list[models.Content] = []
    picked_ids: set[int] = set()

    for category in get_categories(db):
        rows = (
            _content_query(db)
            .filter(models.Content.category_id == category.id)
            .order_by(_random_order(db))
            .limit(per_category)
            .all()
        )
        for row in rows:
            if row.id not in picked_ids:
                picked.append(row)
                picked_ids.add(row.id)

    if len(picked) < total:
        extra = (
            _content_query(db)
            .filter(~models.Content.id.in_(picked_ids))
            .order_by(_random_order(db))
            .limit(total - len(picked))
            .all()
        )
        picked.extend(extra)

    picked = picked[:total]
    random.shuffle(picked)
    return picked


def get_content_by_id(db: Session, content_id: int) -> Optional[models.Content]:
    return (
        _content_query(db)
        .filter(models.Content.id == content_id)
        .first()
    )


def get_option(db: Session, option_id: int) -> Optional[models.ContentOption]:
    return (
        db.query(models.ContentOption)
        .filter(models.ContentOption.id == option_id)
        .first()
    )


def get_correct_option(db: Session, content_id: int) -> Optional[models.ContentOption]:
    return (
        db.query(models.ContentOption)
        .filter(
            models.ContentOption.content_id == content_id,
            models.ContentOption.is_correct.is_(True),
        )
        .first()
    )


# ---------- Chat (세대별 챗봇, #31 대화 저장) ----------
def save_chat_turn(
    db: Session,
    *,
    user_id: int,
    generation: str,
    user_message: str,
    assistant_message: str,
) -> None:
    """로그인 사용자의 질문/답변 한 턴을 각각 한 행씩 저장한다."""
    db.add(
        models.ChatMessage(
            user_id=user_id,
            generation=generation,
            role="user",
            content=user_message,
        )
    )
    db.add(
        models.ChatMessage(
            user_id=user_id,
            generation=generation,
            role="assistant",
            content=assistant_message,
        )
    )
    db.commit()
