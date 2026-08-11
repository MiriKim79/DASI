"""회원가입 API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..security import hash_password

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
