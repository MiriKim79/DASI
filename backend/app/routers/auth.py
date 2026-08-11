"""회원가입 API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


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
