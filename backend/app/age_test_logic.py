"""나이 맞히기(Age Test) 나이 추정 로직 — #5.

- estimated_age = Σ(선택지 대표 나이 × 질문 가중치) / Σ(질문 가중치), 반올림 1세 단위
- weight(Question)/representative_age(Option)는 MVP 초기 휴리스틱 값이며, 통계로
  검증된 값이 아니다 (추후 #7에서 실사용자 데이터로 보정 예정, 현재 MVP에서는 보류).
- 정신연령은 별도로 두지 않는다. estimated_age 하나로 통일한다.

DB 세션/모델에 의존하지 않는 순수 함수로 유지해서, #4(제출 API)가 DB에서 값을
조회해 넘겨주기만 하면 그대로 재사용할 수 있게 한다.
"""
import math
from dataclasses import dataclass

DEFAULT_TOP_REASONS_COUNT = 3

# top_reasons 후보 최소 weight. 재미/리듬용 문항(weight 0.2~0.4)은 estimated_age 계산에는
# 그대로 포함하되, 결과 화면의 "결정적 답변"으로는 노출하지 않기 위한 기준(#76).
# 역할군별 weight 범위(재미 0.2~0.4 / 보정 0.7~1.1 / 강한신호 1.2~1.5)가 겹치지 않게
# 설계돼 있어 이 하나의 상수로 충분히 구분된다.
MIN_REASON_WEIGHT = 0.5


@dataclass
class AnsweredOption:
    """가중평균/영향도 계산에 필요한 최소 정보. question_text는 top_reasons를
    사람이 읽을 수 있는 형태로 만들기 위해 포함한다."""

    question_text: str
    option_text: str
    representative_age: int
    weight: float
    order_index: int


def _validate(answered_options: list[AnsweredOption]) -> None:
    if not answered_options:
        raise ValueError("answered_options는 비어 있을 수 없습니다.")
    if any(a.weight < 0 for a in answered_options):
        raise ValueError("weight는 음수일 수 없습니다.")
    if sum(a.weight for a in answered_options) == 0:
        raise ValueError("weight 합이 0이라 가중평균을 계산할 수 없습니다.")


def _calculate_weighted_average(answered_options: list[AnsweredOption]) -> float:
    """반올림하지 않은 raw weighted average.

    leave-one-out influence 계산에서 매번 반올림하면 오차가 왜곡되므로,
    반올림은 최종 estimated_age를 낼 때(calculate_estimated_age)만 적용한다.
    """
    weight_sum = sum(a.weight for a in answered_options)
    weighted_sum = sum(a.representative_age * a.weight for a in answered_options)
    return weighted_sum / weight_sum


def calculate_estimated_age(answered_options: list[AnsweredOption]) -> int:
    """raw weighted average를 1세 단위로 반올림한다.

    파이썬 기본 round()는 banker's rounding(0.5를 짝수로)이라 나이 계산엔
    직관과 다르게 동작할 수 있어, "0.5 이상이면 올림"이 명확한
    math.floor(x + 0.5)를 사용한다. (나이는 항상 양수이므로 이 식이 안전하다)
    """
    _validate(answered_options)
    raw_age = _calculate_weighted_average(answered_options)
    return math.floor(raw_age + 0.5)


def calculate_top_reasons(
    answered_options: list[AnsweredOption],
    top_n: int = DEFAULT_TOP_REASONS_COUNT,
) -> list[str]:
    """leave-one-out 방식으로 결정적 답변 top_n개를 사람이 읽을 수 있는 문구로 반환한다.

    각 답변을 하나씩 제외하고 raw weighted average를 다시 계산해,
    influence = |전체 raw_age - 제외 후 raw_age|
    로 "이 답변이 최종 결과를 얼마나 움직였는가"를 구한다. 반올림은 여기서 하지 않는다.
    influence 계산 자체는 전체 답변(재미 문항 포함) 기준으로 하되, 최종 후보는
    weight >= MIN_REASON_WEIGHT인 답변으로만 제한한다(#76) — 재미 문항이 결과 화면의
    "결정적 이유"로 노출되지 않게 하기 위함. 답변이 1개뿐이면 leave-one-out 자체가
    불가능하므로, 그 답변이 기준을 만족할 때만 그대로 반환한다.

    정렬 기준:
    1. influence desc
    2. weight desc (동점 시 가중치 높은 질문 우선)
    3. order_index asc (그래도 동점이면 질문 순서가 앞선 것 우선)
    """
    _validate(answered_options)

    if len(answered_options) == 1:
        only = answered_options[0]
        if only.weight < MIN_REASON_WEIGHT:
            return []
        return [f"{only.question_text}: {only.option_text}"]

    full_raw_age = _calculate_weighted_average(answered_options)

    scored = []
    for i, answer in enumerate(answered_options):
        remaining = answered_options[:i] + answered_options[i + 1 :]
        without_raw_age = _calculate_weighted_average(remaining)
        influence = abs(full_raw_age - without_raw_age)
        scored.append((influence, answer))

    eligible = [pair for pair in scored if pair[1].weight >= MIN_REASON_WEIGHT]
    eligible.sort(key=lambda pair: (-pair[0], -pair[1].weight, pair[1].order_index))

    n = min(top_n, len(eligible))
    return [f"{a.question_text}: {a.option_text}" for _, a in eligible[:n]]


def estimate_age(
    answered_options: list[AnsweredOption],
) -> tuple[int, list[str]]:
    """#4가 쓸 단일 진입점. (estimated_age, top_reasons)를 반환한다."""
    estimated_age = calculate_estimated_age(answered_options)
    top_reasons = calculate_top_reasons(answered_options)
    return estimated_age, top_reasons
