"""나이 맞히기(Age Test) 초기 seed 데이터.

실행 경로: backend/app/seed.py 의 seed() 안에서 자동으로 호출된다
(즉 `python -m app.seed` 한 번으로 Playground + Age Test 데이터가 함께 들어간다).

- weight(Question) / representative_age(Option)는 통계로 검증된 값이 아니라,
  시대 특정성 / 직접 경험성 / 세대 특정성 / 현재 보편성 / 질문 명확성을 기준으로
  팀 내부에서 판단한 MVP 초기 휴리스틱 값이다. 추후 #7(보류)에서 실사용자 데이터로 보정한다.
- 이미 데이터가 있으면 다시 넣지 않는다(idempotent).
- 질문 수/선택지 수는 고정이 아니다(#76) — 질문마다 3~5개의 가변 선택지를 가진다.
- type: EXPERIENCE(강한 세대 신호, weight 1.2~1.5) / ANCHOR(보정, weight 0.7~1.1) /
  FUN(재미·리듬용 추억 질문, weight 0.2~0.4 — 정확도보다 재미/템포가 목적)
"""
from .database import SessionLocal
from . import age_test_models as models

# 각 항목: (질문, subtitle 또는 None, type, weight, [(선택지, representative_age), ...])
# order_index는 이 리스트 순서(1부터)로 그대로 부여된다.
QUESTIONS = [
    (
        "내 첫 휴대폰, 뭐였지?",
        '처음으로 "내 폰"이라고 부를 수 있었던 휴대폰을 떠올려봐.',
        "EXPERIENCE",
        1.5,
        [
            ("안테나가 있거나 막대형이었던 휴대폰", 52),
            ("폴더폰", 41),
            ("슬라이드폰·피처폰·초기 터치폰", 34),
            ("초기 스마트폰", 27),
            ("처음부터 스마트폰", 18),
        ],
    ),
    (
        "학교 끝! 주머니에 용돈이 조금 남았다. 어디로 갈래?",
        None,
        "FUN",
        0.3,
        [
            ("문방구나 분식집부터 간다", 45),
            ("편의점에서 간식·컵라면을 산다", 29),
            ("SNS에서 본 신상 디저트나 먹거리를 찾아간다", 18),
        ],
    ),
    (
        '친구한테 "야 지금 어디야?" 연락하려면?',
        "중학생 무렵을 떠올려봐.",
        "EXPERIENCE",
        1.5,
        [
            ("집전화·공중전화", 50),
            ("문자(SMS)", 42),
            ("버디버디·MSN·네이트온 같은 PC 메신저", 35),
            ("카카오톡 ／ 페이스북메신저", 27),
            ("인스타 DM·디스코드 같은 SNS/커뮤니티 메시지", 18),
        ],
    ),
    (
        "수행평가 발표가 내일이다. 자료를 어디서 찾지?",
        "중학생 무렵을 떠올려봐.",
        "EXPERIENCE",
        1.4,
        [
            ("백과사전·도서관 책", 50),
            ("야후·다음 같은 초기 포털", 41),
            ("네이버 지식iN·블로그·카페", 34),
            ("구글·유튜브", 25),
            ("ChatGPT 같은 생성형 AI", 17),
        ],
    ),
    (
        '친구가 "야 이거 요즘 완전 유행이래!" 하면?',
        "나는 이미 어디서 봤을 가능성이 높을까?",
        "FUN",
        0.2,
        [
            ("TV 광고나 주변 친구에게 들었다", 43),
            ("포털·블로그·온라인 커뮤니티에서 봤다", 31),
            ("유튜브·인스타·틱톡·릴스에서 봤다", 19),
        ],
    ),
    (
        "등굣길, 귀에는 뭐가 있었어?",
        "중학생 무렵의 음악 생활을 떠올려봐.",
        "EXPERIENCE",
        1.4,
        [
            ("카세트·CD·CDP", 47),
            ("MP3 플레이어", 36),
            ("휴대폰에 MP3 파일을 넣어 들었다", 31),
            ("멜론 같은 스트리밍 앱", 24),
            ("유튜브·유튜브뮤직 중심", 18),
        ],
    ),
    (
        "인터넷에 '내 공간' 하나 만든다면 뭐가 떠올라?",
        "처음 인터넷에서 나를 표현하던 시절을 떠올려봐.",
        "ANCHOR",
        1.1,
        [
            ("개인 홈페이지·PC통신 같은 나만의 공간", 47),
            ("싸이월드·블로그·카페", 37),
            ("페이스북·카카오스토리", 28),
            ("인스타그램·틱톡", 18),
        ],
    ),
    (
        "친구들이랑 사진 한 장 찍었다. 그 다음은?",
        "중학생 무렵을 떠올려봐.",
        "ANCHOR",
        0.9,
        [
            ("인화해서 나눠 갖는다", 48),
            ("디지털카메라에서 PC로 옮긴다", 39),
            ("미니홈피·페이스북·카카오스토리에 올린다", 29),
            ("찍자마자 스토리·DM으로 공유한다", 18),
        ],
    ),
    (
        "소풍 전날 밤. 간식 준비하는 내 모습은?",
        None,
        "FUN",
        0.3,
        [
            ("부모님과 동네 슈퍼에서 과자를 하나씩 고른다", 44),
            ("마트·편의점에서 친구들이 먹는 간식을 잔뜩 산다", 29),
            ("SNS에서 본 간식이나 디저트까지 찾아본다", 18),
        ],
    ),
    (
        '선생님이 "공지 확인해!" 했다. 어디를 봐야 하지?',
        "중학생 무렵을 떠올려봐.",
        "EXPERIENCE",
        1.2,
        [
            ("칠판·종이 유인물·가정통신문", 47),
            ("학교 홈페이지·온라인 게시판", 36),
            ("단체 카톡·학교 앱", 25),
            ("온라인 클래스·LMS·태블릿", 17),
        ],
    ),
    (
        "보고 싶은 방송을 놓쳤다. 어떡하지?",
        "중학생 무렵을 떠올려봐.",
        "ANCHOR",
        1.0,
        [
            ("재방송 시간을 기다린다", 47),
            ("녹화하거나 케이블TV를 뒤진다", 38),
            ("인터넷 다시보기·다운로드·유튜브를 찾는다", 28),
            ("OTT나 숏폼에서 바로 찾아본다", 18),
        ],
    ),
    (
        "친구들이랑 게임 한 판! 익숙한 풍경은?",
        "게임을 많이 안 했다면 주변 친구들에게 가장 익숙했던 풍경으로 골라줘.",
        "ANCHOR",
        0.7,
        [
            ("오락실이나 게임기 앞에 모였다", 46),
            ("PC방이나 집 PC로 온라인게임을 했다", 32),
            ("모바일게임·온라인게임을 하면서 음성채팅도 켰다", 19),
        ],
    ),
]


def seed_age_test():
    """나이맞히기 질문 12개(강한신호 5 + 보정 4 + 재미 3) + 선택지(문항당 3~5개, 총 48개) 삽입.

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
