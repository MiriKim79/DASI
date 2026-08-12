"""DB 접근 로직 (라우터에서 재사용)."""
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
