"""나이 맞히기(Age Test) 초기 seed 데이터.

실행 경로: backend/app/seed.py 의 seed() 안에서 자동으로 호출된다
(즉 `python -m app.seed` 한 번으로 Playground + Age Test 데이터가 함께 들어간다).

- weight(Question) / representative_age(Option)는 통계로 검증된 값이 아니라,
  시대 특정성 / 직접 경험성 / 세대 특정성 / 현재 보편성 / 질문 명확성을 기준으로
  팀 내부에서 판단한 MVP 초기 휴리스틱 값이다. 추후 #7(보류)에서 실사용자 데이터로 보정한다.
- 이미 데이터가 있으면 다시 넣지 않는다(idempotent).
- 질문 수/선택지 수는 고정이 아니다(#76) — 질문마다 3~5개의 가변 선택지를 가진다.
- v4.1(exploratory): 실사용자 1명의 exploratory feedback + 규칙 기반 sanity check를
  근거로, 기존 12문항 세트의 older 편향(옛날 기기/서비스 경험 = 무조건 나이 많음)과
  일부 문항 신호 중복을 보정해 7문항으로 재구성했다. 이는 실제 사용자 정확도 검증이
  아니다. representative_age는 "이 서비스가 유행하던 시절 이용자의 현재 나이"가 아니라
  질문이 지정한 생애 시점(예: 초등학교 5~6학년 무렵)을 기준으로 추정한 값이다.
- type: EXPERIENCE(강한 세대 신호, weight 1.2~1.5) / ANCHOR(보정, weight 0.4~1.1)
"""
from .database import SessionLocal
from . import age_test_models as models

# 각 항목: (질문, subtitle 또는 None, type, weight, [(선택지, representative_age), ...])
# order_index는 이 리스트 순서(1부터)로 그대로 부여된다.
QUESTIONS = [
    (
        "초등학교 5~6학년쯤, 주변에서 휴대폰은 어떤 느낌이었어?",
        "친구들과 학교 주변에서 가장 흔했던 모습을 떠올려봐.",
        "EXPERIENCE",
        1.3,
        [
            ("휴대폰 자체가 아직 매우 낯설었다", 52),
            ("어른들은 쓰기 시작했지만 친구가 가진 경우는 거의 없었다", 43),
            ("친구들 사이에서도 폴더폰·슬라이드폰 같은 피처폰이 흔했다", 34),
            ("피처폰과 스마트폰을 쓰는 친구가 섞여 있었다", 26),
            ("대부분 스마트폰을 쓰고 있었다", 18),
        ],
    ),
    (
        "중학교 1~2학년쯤, 친구랑 가장 많이 연락하던 방법은?",
        "써본 적이 있는 게 아니라 가장 자주 썼던 방법으로 골라줘.",
        "EXPERIENCE",
        1.5,
        [
            ("집전화·공중전화로 약속을 잡았다", 48),
            ("문자(SMS)가 가장 익숙했다", 38),
            ("버디버디·MSN·네이트온 같은 PC 메신저", 32),
            ("카카오톡·페이스북 메신저", 24),
            ("인스타 DM·디스코드 같은 SNS/커뮤니티 메시지", 18),
        ],
    ),
    (
        "초등학교 5~6학년쯤, 숙제할 때 자료는 어디서 찾았어?",
        "평소 가장 자주 썼던 방법을 떠올려봐.",
        "EXPERIENCE",
        1.3,
        [
            ("백과사전이나 도서관 책", 45),
            ("야후·다음·네이버 같은 포털 검색", 35),
            ("네이버 지식iN·블로그·카페", 26),
            ("검색과 함께 유튜브 영상도 자연스럽게 찾아봤다", 19),
        ],
    ),
    (
        "중학교 1~2학년쯤, 음악은 주로 어떻게 들었어?",
        "가장 자주 사용했던 방식을 골라줘.",
        "EXPERIENCE",
        1.2,
        [
            ("CD·CDP·MP3 플레이어", 38),
            ("휴대폰에 MP3 파일을 넣어서", 30),
            ("멜론 같은 음원 스트리밍 앱", 24),
            ("유튜브·유튜브뮤직 중심", 18),
        ],
    ),
    (
        "처음 인터넷에 '내 공간'을 만들고 놀던 곳은?",
        "내 취향이나 일상을 올리던 첫 온라인 공간을 떠올려봐.",
        "ANCHOR",
        1.1,
        [
            ("개인 홈페이지·PC통신", 45),
            ("싸이월드·블로그·카페", 35),
            ("페이스북·카카오스토리", 25),
            ("인스타그램·틱톡", 18),
        ],
    ),
    (
        "학교에서 만든 파일을 다른 컴퓨터로 옮겨야 한다. 뭐가 제일 익숙해?",
        "초등학교 고학년~중학생 무렵을 떠올려봐.",
        "ANCHOR",
        0.8,
        [
            ("플로피디스크", 49),
            ("CD·디스크에 굽기", 39),
            ("USB 메모리", 28),
            ("이메일·클라우드·기기간 전송", 18),
        ],
    ),
    (
        "중학교 1~2학년쯤, 친구들이랑 게임하면 어떤 풍경이 제일 익숙해?",
        "게임을 많이 안 했다면 주변 친구들에게 가장 흔했던 풍경으로 골라줘.",
        "ANCHOR",
        0.4,
        [
            ("오락실·콘솔 게임기 앞에 모였다", 37),
            ("PC방이나 집 PC로 온라인게임을 했다", 26),
            ("모바일게임을 하면서 음성채팅까지 같이 했다", 18),
        ],
    ),
]


def seed_age_test():
    """나이맞히기 질문 7개(v4.1) + 선택지(문항당 3~5개, 총 29개) 삽입.

    이미 질문 데이터가 있으면 건너뛴다. 테이블 자체의 reset(drop/create)은
    호출자인 seed.py의 seed(reset=...)가 Base.metadata 단위로 처리한다.
    """
    db = SessionLocal()
    try:
        if db.query(models.Question).count() > 0:
            print("age_test seed: 이미 질문 데이터가 존재합니다. 건너뜁니다.")
            return

        for order_index, (text, subtitle, qtype, weight, options) in enumerate(
            QUESTIONS, start=1
        ):
            question = models.Question(
                text=text,
                subtitle=subtitle,
                type=qtype,
                weight=weight,
                order_index=order_index,
            )
            db.add(question)
            db.flush()  # question.id 확보
            for option_text, representative_age in options:
                db.add(
                    models.Option(
                        question_id=question.id,
                        text=option_text,
                        representative_age=representative_age,
                    )
                )

        db.commit()
        total_options = sum(len(options) for _, _, _, _, options in QUESTIONS)
        print(f"age_test seed 완료: 질문 {len(QUESTIONS)}개, 선택지 {total_options}개 삽입.")
    finally:
        db.close()
