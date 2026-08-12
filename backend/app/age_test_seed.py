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
- v5b(exploratory): v4.1의 자료검색/파일이동/게임환경 3문항을 빼고, 재미(회상 유발) 축을
  강화한 사진문화(Q5)/놓친 방송(Q6)/학창시절 유행어(Q7)로 교체했다. 휴대폰·연락·SNS·음악
  4문항은 v4.1 수치를 그대로 재사용한다(카피만 일부 재미있게 다듬음, representative_age는
  불변). Q6/Q7은 weight를 MIN_REASON_WEIGHT(0.5) 아래로 둬서 estimated_age 계산에는
  약하게 참여하되 top_reasons에는 노출되지 않는 "약한 보조 신호"로 설계했다. Q5/Q6/Q7의
  representative_age는 실사용자 데이터가 아니라 문화 전환 시점 조사(대중화 시기 추정)를
  근거로 한 초기 휴리스틱이며, synthetic profile regression으로 20대/30대 MAE가 v4.1
  대비 크게 악화되지 않는지만 확인했다(Q5 weight=0 ablation으로 Q5가 30대 오차의 원인이
  아님을 확인 — 오히려 Q5를 빼면 20대/30대 MAE가 더 나빠짐). 실사용자 정확도 검증이
  아니므로 추후 #7에서 재보정 예정이다.
- type: EXPERIENCE(강한 세대 신호, weight 1.2~1.5) / ANCHOR(보정, weight 0.4~1.1) /
  FUN(재미용 약한 보조 신호, weight 0.2~0.4, MIN_REASON_WEIGHT 미만이라 top_reasons 제외)
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
        "좋아하는 애한테 연락했다. 제일 초조했던 순간은?",
        "중학교 무렵, 답장 기다리던 그때를 떠올려봐.",
        "EXPERIENCE",
        1.5,
        [
            ("집으로 전화했는데 부모님이 받을까 조마조마했다", 48),
            ("문자 보내고 답장이 오기만 기다렸다", 38),
            ("메신저 접속 상태를 보면서 답장을 기다렸다", 32),
            ("카톡 '1'이 없어지는지 계속 확인했다", 24),
            ("스토리는 봤는데 DM 답장이 없었다", 18),
        ],
    ),
    (
        "그 시절 온라인에서 괜히 내 기분을 티 내고 싶었다. 내가 건드리는 건?",
        "말은 안 해도 은근히 다 티 나던 그 방식.",
        "ANCHOR",
        1.1,
        [
            ("개인 홈페이지·PC통신에 의미심장한 글을 남긴다", 45),
            ("싸이월드 BGM이나 상태메시지를 바꾼다", 35),
            ("페이스북·카카오스토리에 글을 올린다", 25),
            ("인스타 스토리에 슬쩍 올린다", 18),
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
        "중학생 때, 친구들이랑 놀다가 사진을 찍었다. 그 사진은 보통 어떻게 남겼어?",
        "그 시절 가장 자주 했던 방법을 골라줘.",
        "ANCHOR",
        0.8,
        [
            ("스티커사진으로 바로 뽑아서 보관", 39),
            ("디카로 찍어서 PC로 옮기고 미니홈피에 올림", 33),
            ("휴대폰으로 찍고 카카오스토리·페이스북에 올림", 26),
            ("휴대폰으로 찍고 인스타그램에 바로 공유", 20),
        ],
    ),
    (
        "보고 싶던 방송을 놓쳤다. 그 시절 나는 어떻게 했을까?",
        "가장 익숙했던 방법을 골라줘.",
        "FUN",
        0.3,
        [
            ("TV 편성표를 확인하고 재방송을 기다렸다", 36),
            ("인터넷에서 다시보기·다운로드를 찾아봤다", 29),
            ("방송사 홈페이지·포털·유튜브 클립으로 찾아봤다", 24),
            ("OTT에서 원하는 회차를 바로 틀었다", 19),
        ],
    ),
    (
        "학창시절 반 친구들이 실제로 제일 많이 쓰던 표현에 가장 가까운 건?",
        "내가 직접 쓰거나, 반 친구들이 실제로 자주 쓰던 표현을 골라줘.",
        "FUN",
        0.2,
        [
            ("안습", 34),
            ("레알", 31),
            ("인정?(ㅇㅈ)", 25),
            ("킹받다", 21),
        ],
    ),
]


def seed_age_test():
    """나이맞히기 질문 7개(v5b) + 선택지(문항당 4~5개, 총 30개) 삽입.

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
