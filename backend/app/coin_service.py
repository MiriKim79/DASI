"""Small shared coin ledger helpers. Callers own the surrounding transaction."""
from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models


def grant_coin_once(db: Session, *, user_id: int, amount: int, reason: str, event_key: str) -> bool:
    """Grant only once per event key; returns False when the event was already granted."""
    if amount <= 0:
        raise ValueError("grant amount must be positive")
    if db.query(models.CoinTransaction.id).filter_by(event_key=event_key).first():
        return False
    try:
        with db.begin_nested():
            db.add(models.CoinTransaction(user_id=user_id, amount=amount, reason=reason, event_key=event_key))
            db.flush()
            db.execute(update(models.User).where(models.User.id == user_id).values(coin_balance=models.User.coin_balance + amount))
    except IntegrityError:
        return False
    return True


def spend_coin(db: Session, *, user_id: int, amount: int, reason: str, event_key: str) -> None:
    """Atomically reject insufficient balance and record the corresponding debit."""
    if amount <= 0:
        raise ValueError("spend amount must be positive")
    updated = db.execute(
        update(models.User)
        .where(models.User.id == user_id, models.User.coin_balance >= amount)
        .values(coin_balance=models.User.coin_balance - amount)
    )
    if updated.rowcount != 1:
        raise HTTPException(status_code=400, detail="코인이 부족합니다.")
    db.add(models.CoinTransaction(user_id=user_id, amount=-amount, reason=reason, event_key=event_key))
    db.flush()
