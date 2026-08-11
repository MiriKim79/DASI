"""나이 맞히기(Age Test) Pydantic 스키마 (요청/응답 DTO)."""
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------- Question 목록 조회 ----------
class AgeTestOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    # representative_age는 서버 내부(#5 계산) 전용이라 응답에 포함하지 않는다.


class AgeTestQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    subtitle: Optional[str] = None
    options: list[AgeTestOptionOut] = []
    # weight는 서버 내부(#5 계산) 전용이라 응답에 포함하지 않는다.
