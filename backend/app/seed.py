"""초기 seed 데이터 삽입.

실행: python -m app.seed  (backend 디렉터리에서)
- 8개 카테고리 + 카테고리별 5개 이상 콘텐츠(총 40+)를 넣는다.
- 이미 데이터가 있으면 중복 삽입하지 않는다.
- 이미지는 저작권 문제를 피하기 위해 placeholder(빈 image_url)로 둔다.
"""
from .database import Base, SessionLocal, engine
from . import models
from .age_test_seed import seed_age_test

# ---------------------------------------------------------------------------
# 카테고리 정의: code -> (name, theme_color, icon, description)
# ---------------------------------------------------------------------------
CATEGORIES = [
    ("COMEDY", "개그", "#F6A623", "🎤", "아재부터 이과까지, 웃음의 세대차"),
    ("DRAMA", "드라마", "#8E3B46", "📺", "그 시절 본방사수하던 드라마"),
    ("MOVIE", "영화", "#3B2E66", "🎞️", "극장에서 보던 추억의 영화"),
    ("ANIME_COMIC", "애니·만화책", "#5AB0E2", "📚", "만화방과 브라운관의 추억"),
    ("STATIONERY_PLAY", "문방구·놀이", "#38C6A5", "🪀", "학교 앞 문방구와 놀이"),
    ("MEME", "유행어·밈", "#6C5CE7", "💬", "그때 그 말, 지금은 밈"),
    ("FOOD", "먹거리", "#FF7EB3", "🍪", "추억의 과자와 불량식품"),
    ("MUSIC", "음악", "#4A6CF7", "📼", "카세트부터 MP3까지"),
]

# ---------------------------------------------------------------------------
# 콘텐츠 정의
# 각 항목: (category_code, subcategory, title, question, content_type, options)
#   - options: [(text, is_correct), ...]  (EXPERIENCE 형은 정답 없이 경험 선택)
# ---------------------------------------------------------------------------
CONTENTS = [
    # ---------------- 개그 (COMEDY) ----------------
    ("COMEDY", "DAD", "세상에서 가장 뜨거운 과일",
     "세상에서 가장 뜨거운 과일은?", "QUIZ",
     [("천도(千度)복숭아", True), ("수박", False), ("바나나", False)]),
    ("COMEDY", "DAD", "왕이 넘어지면",
     "왕이 넘어지면?", "QUIZ",
     [("킹콩", True), ("폭삭", False), ("쿵", False)]),
    ("COMEDY", "HUMANITIES", "가장 억울한 도형",
     "가장 억울한 도형은?", "QUIZ",
     [("원통(억울)", True), ("삼각형", False), ("마름모", False)]),
    ("COMEDY", "HUMANITIES", "세종대왕이 만든 우유",
     "세종대왕이 만든 우유는?", "QUIZ",
     [("아야어여(우유)", False), ("훈민정‘음’메", True), ("한글우유", False)]),
    ("COMEDY", "SCIENCE", "개발자가 싫어하는 음료",
     "개발자가 가장 싫어하는 음료는?", "QUIZ",
     [("버그가 들어간 음료", True), ("탄산음료", False), ("에너지 드링크", False)]),
    ("COMEDY", "SCIENCE", "프로그래머의 인사",
     "프로그래머끼리 아침에 하는 인사는?", "QUIZ",
     [("Hello, World!", True), ("굿모닝", False), ("반가워요", False)]),
    ("COMEDY", "SCIENCE", "이과생의 사랑고백",
     "이과생이 좋아하는 사람에게 하는 고백은?", "QUIZ",
     [("너와 나의 반응은 발열반응이야", True), ("사랑해", False), ("좋아해", False)]),
    ("COMEDY", "GENERATION", "삐삐 8282",
     "삐삐에 '8282'를 남기면?", "QUIZ",
     [("빨리빨리 연락해줘", True), ("사랑해", False), ("잘 자", False)]),
     

    # ---------------- 드라마 (DRAMA) ----------------
    ("DRAMA", None, "겨울연가",
     "'겨울연가'의 상징적인 아이템으로 기억나는 것은?", "EXPERIENCE",
     [("폴라리스 목걸이", False), ("눈사람", False), ("남이섬 배경", False)]),
    ("DRAMA", None, "대장금",
     "'대장금'에서 장금이가 어린 시절 외치던 명대사는?", "QUIZ",
     [("홍시 맛이 났는데…", True), ("맛있사옵니다", False), ("성은이 망극하옵니다", False)]),
    ("DRAMA", None, "야인시대",
     "'야인시대'에서 '4달러' 밈으로 유명한 인물은?", "QUIZ",
     [("심영", True), ("김두한", False), ("구마적", False)]),
    ("DRAMA", None, "커피프린스 1호점",
     "'커피프린스 1호점'의 주요 배경 장소는?", "QUIZ",
     [("커피 전문점", True), ("병원", False), ("방송국", False)]),
    ("DRAMA", None, "주몽 본방사수",
     "온 가족이 모여 '주몽'을 본방사수하던 기억, 어땠나요?", "EXPERIENCE",
     [("매주 챙겨봤지", False), ("가끔 봤어", False), ("잘 몰라", False)]),
    

    # ---------------- 영화 (MOVIE) ----------------
    ("MOVIE", None, "엽기적인 그녀",
     "'엽기적인 그녀'의 주연 배우는?", "QUIZ",
     [("전지현", True), ("김태희", False), ("송혜교", False)]),
    ("MOVIE", None, "친구 니가 가라",
     "영화 '친구'의 명대사 '니가 가라 ○○○'?", "QUIZ",
     [("하와이", True), ("부산", False), ("제주도", False)]),
    ("MOVIE", None, "괴물",
     "한강에 나타난 괴물을 다룬 봉준호 감독 영화는?", "QUIZ",
     [("괴물", True), ("기생충", False), ("설국열차", False)]),
    ("MOVIE", None, "태극기 휘날리며",
     "'태극기 휘날리며'의 배경이 된 전쟁은?", "QUIZ",
     [("6·25 전쟁", True), ("임진왜란", False), ("베트남전", False)]),
    ("MOVIE", None, "왕의 남자",
     "'왕의 남자'로 스타가 된 배우는?", "QUIZ",
     [("이준기", True), ("강동원", False), ("원빈", False)]),
    ("MOVIE", None, "극장 팝콘",
     "친구들과 극장에서 영화 보던 기억이 있나요?", "EXPERIENCE",
     [("자주 갔지", False), ("가끔", False), ("잘 안 갔어", False)]),

    # ---------------- 애니·만화책 (ANIME_COMIC) ----------------
    ("ANIME_COMIC", None, "포켓몬 1호",
     "포켓몬 도감 1번 포켓몬은?", "QUIZ",
     [("이상해씨", True), ("피카츄", False), ("파이리", False)]),
    ("ANIME_COMIC", None, "짱구 별명",
     "'짱구는 못말려'의 짱구가 좋아하는 것은?", "QUIZ",
     [("액션가면·초코비", True), ("숙제", False), ("피망", False)]),
    ("ANIME_COMIC", None, "명탐정 코난 명대사",
     "명탐정 코난의 명대사는?", "QUIZ",
     [("진실은 언제나 하나!", True), ("포기하면 편해", False), ("나는 신이다", False)]),
    ("ANIME_COMIC", None, "마법천자문",
     "한자를 배우며 봤던 학습만화 '마법천자문'의 주문은?", "QUIZ",
     [("불 화(火)! 나와라~", True), ("아브라카다브라", False), ("얍!", False)]),
    ("ANIME_COMIC", None, "코믹 메이플스토리",
     "게임을 학습만화로 만든 시리즈는?", "QUIZ",
     [("코믹 메이플스토리", True), ("Why 시리즈", False), ("먼나라 이웃나라", False)]),
    ("ANIME_COMIC", None, "만화방 추억",
     "만화방이나 대여점에서 만화책 빌려본 적 있나요?", "EXPERIENCE",
     [("자주 빌렸어", False), ("가끔", False), ("잘 몰라", False)]),

    # ---------------- 문방구·놀이 (STATIONERY_PLAY) ----------------
    ("STATIONERY_PLAY", None, "딱지치기",
     "상대 딱지를 뒤집으면 일어나는 일은?", "QUIZ",
     [("그 딱지를 내가 가진다", True), ("한 판 진다", False), ("다시 접는다", False)]),
    ("STATIONERY_PLAY", None, "공기놀이 마지막",
     "공기놀이에서 마지막에 손등에 올렸다 잡는 단계는?", "QUIZ",
     [("꺾기(년 따기)", True), ("한 알", False), ("두 알", False)]),
    ("STATIONERY_PLAY", None, "팽이 배틀",
     "탑블레이드로 유행했던 놀이는?", "QUIZ",
     [("팽이 돌리기 대결", True), ("구슬치기", False), ("고무줄놀이", False)]),
    ("STATIONERY_PLAY", None, "학교 앞 문방구",
     "문방구 앞 뽑기·쫀드기 사 먹던 기억 있나요?", "EXPERIENCE",
     [("매일 갔지", False), ("가끔", False), ("잘 몰라", False)]),
    ("STATIONERY_PLAY", None, "오락기 100원",
     "문방구 앞 오락기는 보통 한 판에 얼마였을까요?", "QUIZ",
     [("100원", True), ("500원", False), ("1000원", False)]),
    ("STATIONERY_PLAY", None, "구슬치기",
     "구슬치기에서 상대 구슬을 맞히면?", "QUIZ",
     [("그 구슬을 딴다", True), ("한 번 쉰다", False), ("무효", False)]),

    # ---------------- 유행어·밈 (MEME) ----------------
    ("MEME", None, "무한도전 유행어",
     "무한도전에서 나온 '무한~○○'?", "QUIZ",
     [("무한이기주의", False), ("무야호", True), ("무한긍정", False)]),
    ("MEME", None, "1등만 기억하는",
     "개그콘서트 유행어 '1등만 기억하는 ○○○ 세상'?", "QUIZ",
     [("더러운", True), ("아름다운", False), ("행복한", False)]),
    ("MEME", None, "부장님 개그",
     "'~하지 말입니다'가 유행한 드라마는?", "QUIZ",
     [("태양의 후예", True), ("도깨비", False), ("응답하라 1988", False)]),
    ("MEME", None, "즐 채팅",
     "옛날 온라인 게임 채팅에서 '즐'의 뜻은?", "QUIZ",
     [("비꼬는 인사(꺼져)", True), ("즐겁다", False), ("고맙다", False)]),
    ("MEME", None, "레알",
     "'진짜'를 뜻하던 2000년대 인터넷 유행어는?", "QUIZ",
     [("레알", True), ("가즈아", False), ("실화냐", False)]),
    ("MEME", None, "당시 유행어",
     "친구들과 유행어 따라 하던 기억 있나요?", "EXPERIENCE",
     [("엄청 따라 했지", False), ("가끔", False), ("잘 몰라", False)]),

    # ---------------- 먹거리 (FOOD) ----------------
    ("FOOD", None, "허니버터칩 대란",
     "허니버터칩 대란 기억나?", "EXPERIENCE",
     [("당연하지", False), ("먹어는 봤어", False), ("잘 모르겠는데?", False)]),
    ("FOOD", None, "포켓몬빵 스티커",
     "포켓몬빵에 들어있던 것은?", "QUIZ",
     [("띠부띠부씰(스티커)", True), ("장난감", False), ("쿠폰", False)]),
    ("FOOD", None, "아폴로",
     "가느다란 빨대에 든 가루 불량식품은?", "QUIZ",
     [("아폴로", True), ("쫀드기", False), ("문방구 쫀드기", False)]),
    ("FOOD", None, "쫀드기",
     "연탄불·라이터에 구워 먹던 납작한 간식은?", "QUIZ",
     [("쫀드기", True), ("아폴로", False), ("뽑기", False)]),
    ("FOOD", None, "피카츄 돈까스",
     "캐릭터 모양으로 유명했던 냉동 돈까스는?", "QUIZ",
     [("피카츄 돈까스", True), ("공룡알", False), ("별사탕", False)]),
    ("FOOD", None, "달고나 뽑기",
     "설탕 녹여 모양 찍어 먹던 문방구 간식은?", "QUIZ",
     [("달고나(뽑기)", True), ("솜사탕", False), ("젤리", False)]),

    # ---------------- 음악 (MUSIC) ----------------
    ("MUSIC", None, "싸이월드 BGM",
     "미니홈피에서 노래 들으려면 사야 했던 것은?", "QUIZ",
     [("도토리", True), ("코인", False), ("포인트", False)]),
    ("MUSIC", None, "MP3 플레이어",
     "CD 없이 파일로 음악 듣던 휴대 기기는?", "QUIZ",
     [("MP3 플레이어(아이리버 등)", True), ("워크맨", False), ("라디오", False)]),
    ("MUSIC", None, "컬러링",
     "전화 걸면 상대에게 들리던 음악 서비스는?", "QUIZ",
     [("컬러링", True), ("벨소리", False), ("문자", False)]),
    ("MUSIC", None, "노래방 점수",
     "노래방에서 100점 나오면 어땠나요?", "EXPERIENCE",
     [("환호했지", False), ("가끔 나왔어", False), ("잘 몰라", False)]),
    ("MUSIC", None, "카세트 테이프",
     "테이프 늘어지면 무엇으로 감았을까요?", "QUIZ",
     [("볼펜(연필)", True), ("가위", False), ("자석", False)]),
    ("MUSIC", None, "CD 플레이어",
     "CD로 음악 듣던 휴대용 기기는?", "QUIZ",
     [("CDP(씨디플레이어)", True), ("턴테이블", False), ("스피커", False)]),
]


def seed(reset: bool = False):
    """seed 데이터 삽입.

    reset=False: DB가 비어 있을 때만 넣는다(이미 있으면 건너뜀).
    reset=True : 기존 테이블을 모두 지우고 파일 내용대로 다시 만든다.
    """
    if reset:
        print("기존 데이터를 모두 삭제하고 다시 만듭니다… (--reset)")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    # 나이맞히기(age_test) 데이터는 Playground와 별개 테이블이라 독립적으로 시딩한다.
    # (Playground 데이터 존재 여부와 무관하게, 자체적으로 idempotent하게 동작한다)
    seed_age_test()

    db = SessionLocal()
    try:
        if db.query(models.Category).count() > 0:
            print("이미 seed 데이터가 존재합니다. 건너뜁니다. (다시 넣으려면 --reset)")
            return

        code_to_category = {}
        for code, name, color, icon, desc in CATEGORIES:
            category = models.Category(
                code=code, name=name, theme_color=color, icon=icon, description=desc
            )
            db.add(category)
            code_to_category[code] = category
        db.flush()  # id 확보

        content_count = 0
        for code, sub, title, question, ctype, options in CONTENTS:
            content = models.Content(
                category_id=code_to_category[code].id,
                subcategory=sub,
                title=title,
                question=question,
                image_url=None,  # placeholder (프론트에서 아이콘/영역으로 대체)
                content_type=ctype,
            )
            db.add(content)
            db.flush()
            for text, is_correct in options:
                db.add(
                    models.ContentOption(
                        content_id=content.id,
                        option_text=text,
                        is_correct=is_correct,
                    )
                )
            content_count += 1

        db.commit()
        print(
            f"seed 완료: 카테고리 {len(CATEGORIES)}개, 콘텐츠 {content_count}개 삽입."
        )
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    reset_flag = "--reset" in sys.argv
    seed(reset=reset_flag)
