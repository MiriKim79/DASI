"""회원가입 API."""
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..coin_service import grant_coin_once
from ..database import get_db
from ..security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
user_router = APIRouter(prefix="/api", tags=["users"])


@router.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupIn, db: Session = Depends(get_db)):
    """새 사용자를 생성한다."""
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    user = crud.create_user(
        db,
        email=payload.email,
        password_hash=hash_password(payload.password),
        nickname=payload.nickname,
    )
    try:
        db.flush()
        grant_coin_once(
            db,
            user_id=user.id,
            amount=100,
            reason="SIGNUP",
            event_key=f"signup:{user.id}",
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.") from exc

    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    """이메일과 비밀번호를 검증하고 access token을 발급한다."""
    user = crud.get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return schemas.TokenOut(access_token=create_access_token(user.id))


@user_router.get("/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@user_router.get("/me/coins", response_model=schemas.CoinBalanceOut)
def get_my_coins(current_user=Depends(get_current_user)):
    """현재 로그인 사용자의 코인 잔액을 반환한다."""
    return schemas.CoinBalanceOut(coin_balance=current_user.coin_balance)


@user_router.post("/me/coins/charge", response_model=schemas.CoinChargeOut)
def charge_my_coins(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """데모용 가상 충전: 호출할 때마다 코인 +100 (실제 결제 연동 없음).

    충전은 반복 가능해야 하므로 매 호출마다 고유 event_key를 만들어 지급한다.
    """
    amount = 100
    grant_coin_once(
        db,
        user_id=current_user.id,
        amount=amount,
        reason="DEMO_CHARGE",
        event_key=f"demo-charge:{current_user.id}:{uuid4().hex}",
    )
    db.commit()
    db.refresh(current_user)
    return schemas.CoinChargeOut(coin_balance=current_user.coin_balance, charged=amount)
