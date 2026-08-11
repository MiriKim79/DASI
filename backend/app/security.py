"""인증 보안 유틸리티."""
from pwdlib import PasswordHash


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """평문 비밀번호를 안전하게 해시한다."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """로그인 구현에서 사용할 비밀번호 검증 함수."""
    return password_hasher.verify(password, password_hash)
