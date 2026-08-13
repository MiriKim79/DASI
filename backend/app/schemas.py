"""Pydantic 스키마 (요청/응답 DTO)."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------- Auth / User ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nickname: str = Field(min_length=1, max_length=50)

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_blank(cls, value: str) -> str:
        nickname = value.strip()
        if not nickname:
            raise ValueError("닉네임을 입력해주세요.")
        return nickname


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nickname: str
    coin_balance: int
    created_at: datetime


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class CoinBalanceOut(BaseModel):
    coin_balance: int


class CoinChargeOut(BaseModel):
    coin_balance: int
    charged: int


class CategoryPlayStartOut(BaseModel):
    category_code: str
    coin_cost: int
    remaining_coin: int


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


# ---------- Feedback ----------
class FeedbackCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str

    @field_validator("content")
    @classmethod
    def content_must_be_valid(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("피드백 내용을 입력해주세요.")
        if len(content) > 500:
            raise ValueError("피드백은 최대 500자까지 입력할 수 있습니다.")
        return content


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    created_at: datetime


class FeedbackListItemOut(BaseModel):
    id: int
    nickname: str
    content: str
    created_at: datetime
    # 조회한 사람이 이 피드백의 작성자인지(비로그인이면 항상 False).
    # 프론트는 이 값으로 삭제 버튼 노출을 결정한다.
    is_mine: bool = False
    like_count: int = 0
    dislike_count: int = 0
    # 조회한 사람이 누른 반응: "LIKE" | "DISLIKE" | None(안 누름/비로그인)
    my_reaction: Optional[str] = None
    # 좋아요 5개 이상이면 인기 피드백
    is_popular: bool = False
    # 인기 피드백 중 좋아요 상위 3개 — 목록 맨 위에 따로 노출된다
    is_pinned: bool = False


class FeedbackReactionIn(BaseModel):
    reaction: Literal["LIKE", "DISLIKE"]


class FeedbackReactionOut(BaseModel):
    feedback_id: int
    like_count: int
    dislike_count: int
    my_reaction: Optional[str] = None
    is_popular: bool = False


# ---------- Category ----------
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    theme_color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


# ---------- ContentOption ----------
class ContentOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    option_text: str
    # 정답 노출 방지를 위해 목록/단건 조회 응답에서는 is_correct 를 내려주지 않는다.


# ---------- Content ----------
class ContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    subcategory: Optional[str] = None
    title: str
    question: str
    image_url: Optional[str] = None
    content_type: str
    created_at: datetime
    options: list[ContentOptionOut] = []


# ---------- Answer (객관식) ----------
class AnswerIn(BaseModel):
    option_id: int


# ---------- Answer (텍스트 입력형: 사진/노래 보고 정답 작성) ----------
class TextAnswerIn(BaseModel):
    text: str


class TextAnswerOut(BaseModel):
    content_id: int
    is_correct: bool
    correct_answer: Optional[str] = None
    message: str


class AnswerOut(BaseModel):
    content_id: int
    selected_option_id: int
    is_correct: bool
    correct_option_id: Optional[int] = None
    correct_option_text: Optional[str] = None
    message: str


# ---------- Generation (세대별 챗봇, 3번 담당) ----------
class GenerationOut(BaseModel):
    id: str
    display_name: str
    character: str


# ---------- Chat (세대별 챗봇, 3번 담당) ----------
class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatIn(BaseModel):
    generation: str
    message: str
    history: list[ChatMessage] = []


class ChatOut(BaseModel):
    generation: str
    character: str
    message: str


# ---------- 개그 콘텐츠 + 퀴즈 (F3-4, 3번 담당) ----------
class GagItemOut(BaseModel):
    id: int
    prompt: str
    hint1: str
    hint2: str
    # 정답 자체는 조회 응답에 포함하지 않는다 (채점 API에서만 공개).
    # 힌트는 정답을 완전히 드러내지 않는 보조 정보라 목록 조회 때 같이 내려준다 —
    # 프론트에서 언제 보여줄지(단계적으로)만 결정하면 된다.


class GagAnswerIn(BaseModel):
    answer: str


class GagAnswerOut(BaseModel):
    item_id: int
    is_correct: bool
    correct_answer: str


# ---------- 아재력 결과 처리 ----------
class ResultIn(BaseModel):
    correct: int          # 맞힌 QUIZ 개수
    total: int            # 푼 QUIZ 개수
    category: Optional[str] = None  # 분야 코드 (선택)


class ResultOut(BaseModel):
    correct: int
    total: int
    score: int            # 0~100 점수(정답률)
    level: str            # 아재력 등급 라벨
    message: str          # 결과 멘트
    category: Optional[str] = None
    coin_reward: int = 0  # 이번 완료로 새로 지급된 코인(분야 최초 완료 시 5, 아니면 0)


class RankingQuestionOut(BaseModel):
    content_id: int
    position: int
    question: str
    image_url: Optional[str] = None
    content_type: str


class RankingChallengeOut(BaseModel):
    challenge_id: int
    coin_cost: int
    remaining_coin: int
    official_eligible: bool
    questions: list[RankingQuestionOut]


class RankingAnswerIn(BaseModel):
    content_id: int
    answer: str


class RankingSubmitIn(BaseModel):
    challenge_id: int
    answers: list[RankingAnswerIn]


class RankingSubmitOut(BaseModel):
    correct_count: int
    total_count: int
    accuracy: float
    elapsed_seconds: int
    official_recorded: bool


class RankingListItemOut(BaseModel):
    rank: int
    nickname: str
    correct_count: int
    total_count: int
    accuracy: float
    elapsed_seconds: int
