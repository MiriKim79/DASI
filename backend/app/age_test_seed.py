"""나이 맞히기(Age Test) 초기 seed 데이터.

실행 경로: backend/app/seed.py 의 seed() 안에서 자동으로 호출된다
(즉 `python -m app.seed` 한 번으로 Playground + Age Test 데이터가 함께 들어간다).

- weight(Question) / representative_age(Option)는 통계로 검증된 값이 아니라,
  시대 특정성 / 직접 경험성 / 세대 특정성 / 현재 보편성 / 질문 명확성을 기준으로
  팀 내부에서 판단한 MVP 초기 휴리스틱 값이다. 추후 #7(보류)에서 실사용자 데이터로 보정한다.
- 이미 질문 데이터가 있으면 다시 넣지 않는다(idempotent).
"""
from .database import SessionLocal
from . import age_test_models as models

# 각 항목: (질문, type, weight, [(선택지, representative_age), ...])
# order_index는 이 리스트 순서(1부터)로 그대로 부여된다.
QUESTIONS = [
    (
        "처음 내 폰으로 자주 사용했던 휴대폰은 어떤 형태였나요?",
        "EXPERIENCE",
        1.5,
        [
            ("안테나가 있거나 막대형이었던 초기 휴대폰", 52),
            ("폴더폰", 41),
            ("슬라이드폰 또는 스마트폰 이전 터치폰", 34),
            ("초기 스마트폰", 28),
            ("처음부터 스마트폰", 20),
        ],
    ),
    (
        "학창시절 친구들과 연락할 때 가장 익숙했던 방식은?",
        "EXPERIENCE",
        1.5,
        [
            ("전화나 문자 위주", 48),
            ("버디버디 / MSN 메신저", 40),
            ("네이트온", 34),
            ("카카오톡", 27),
            ("인스타 DM / 디스코드 등", 20),
        ],
    ),
    (
        "학생 때 음악을 가장 많이 들었던 방식은?",
        "EXPERIENCE",
        1.3,
        [
            ("카세트테이프 / CD / CDP", 47),
            ("MP3 플레이어", 36),
            ("휴대폰에 MP3 파일을 넣어서", 31),
            ("멜론 같은 음원 스트리밍", 25),
            ("유튜브 / 유튜브 뮤직 중심", 20),
        ],
    ),
    (
        "친구들과 사진을 공유할 때 가장 익숙했던 방법은?",
        "EXPERIENCE",
        1.2,
        [
            ("사진을 인화해서 직접 나눴다", 50),
            ("디지털카메라 사진을 컴퓨터로 옮겼다", 41),
            ("싸이월드 미니홈피에 올렸다", 36),
            ("페이스북 / 카카오스토리에 올렸다", 29),
            ("인스타그램 / 스토리에 올렸다", 21),
        ],
    ),
    (
        "인터넷에서 내 취향이나 일상을 꾸미던 공간으로 가장 익숙한 것은?",
        "EXPERIENCE",
        1.4,
        [
            ("PC통신 / 개인 홈페이지", 49),
            ("싸이월드 미니홈피", 38),
            ("네이버 블로그 / 카페", 33),
            ("페이스북", 28),
            ("인스타그램 / 틱톡", 20),
        ],
    ),
    (
        "학생 때 가장 익숙했던 휴대용 전자기기는?",
        "EXPERIENCE",
        1.1,
        [
            ("워크맨 / CDP", 47),
            ("MP3 플레이어", 37),
            ("전자사전 / PMP", 33),
            ("아이팟 / 초기 스마트폰", 29),
            ("스마트폰 / 태블릿", 21),
        ],
    ),
    (
        "친구들과 게임할 때 가장 익숙했던 환경은?",
        "EXPERIENCE",
        1.0,
        [
            ("오락실", 47),
            ("PC방에서 온라인게임", 37),
            ("집 PC에서 온라인게임", 32),
            ("스마트폰 모바일게임", 25),
            ("모바일/온라인 플랫폼에서 음성채팅까지 함께", 20),
        ],
    ),
    (
        "학생 때 숙제나 발표 자료를 찾을 때 가장 익숙했던 방식은?",
        "ANCHOR",
        1.0,
        [
            ("백과사전 / 도서관 책", 49),
            ("야후 / 다음 같은 초기 포털 검색", 41),
            ("네이버 지식인 / 블로그", 34),
            ("구글 / 유튜브", 25),
            ("생성형 AI", 18),
        ],
    ),
    (
        "학생 때 영상 콘텐츠를 가장 많이 보던 방식은?",
        "ANCHOR",
        0.9,
        [
            ("지상파 TV / 재방송을 기다렸다", 48),
            ("케이블 TV", 39),
            ("다운로드 / 웹하드 / 인터넷 다시보기", 32),
            ("유튜브", 25),
            ("OTT / 숏폼 플랫폼", 20),
        ],
    ),
    (
        "파일을 옮기거나 보관할 때 가장 익숙했던 방법은?",
        "ANCHOR",
        0.9,
        [
            ("플로피디스크", 51),
            ("CD-R / 디스크", 41),
            ("USB 메모리", 33),
            ("이메일 / 클라우드", 26),
            ("AirDrop / Quick Share 같은 기기간 전송", 20),
        ],
    ),
]


def seed_age_test():
    """나이맞히기 질문 10개(경험형 7 + 앵커 3) + 선택지 50개 삽입.

    이미 질문 데이터가 있으면 건너뛴다. 테이블 자체의 reset(drop/create)은
    호출자인 seed.py의 seed(reset=...)가 Base.metadata 단위로 처리한다.
    """
    db = SessionLocal()
    try:
        if db.query(models.Question).count() > 0:
            print("age_test seed: 이미 질문 데이터가 존재합니다. 건너뜁니다.")
            return

        for order_index, (text, qtype, weight, options) in enumerate(QUESTIONS, start=1):
            question = models.Question(
                text=text, type=qtype, weight=weight, order_index=order_index
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
        print(f"age_test seed 완료: 질문 {len(QUESTIONS)}개 삽입.")
    finally:
        db.close()
