"""인증 보안 유틸리티."""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from . import crud, models
from .database import get_db


password_hasher = PasswordHash.recommended()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
bearer_scheme = HTTPBearer(auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="인증 정보를 확인할 수 없습니다.",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    """평문 비밀번호를 안전하게 해시한다."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """로그인 구현에서 사용할 비밀번호 검증 함수."""
    return password_hasher.verify(password, password_hash)


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if not secret or secret == "replace_with_a_long_random_value":
        raise RuntimeError("JWT_SECRET 환경변수를 설정해주세요.")
    return secret


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """사용자 식별 정보만 담은 JWT access token을 생성한다."""
    expires_at = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        _get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """JWT 서명과 만료 시간을 검증해 payload를 반환한다."""
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if not payload.get("sub"):
            raise credentials_exception
        return payload
    except InvalidTokenError as exc:
        raise credentials_exception from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Bearer token으로 현재 로그인 사용자를 조회한다."""
    if credentials is None:
        raise credentials_exception

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = db.get(models.User, user_id)
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User | None:
    """토큰이 있으면 검증해서 사용자를 반환하고, 없으면 None(비로그인 허용) — #31.

    토큰이 있는데 유효하지 않은 경우는 그대로 401을 낸다(로그인 사칭 방지).
    """
    if credentials is None:
        return None
    return get_current_user(credentials=credentials, db=db)
