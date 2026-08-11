"""초기 seed 데이터 삽입.

실행: python -m app.seed  (backend 디렉터리에서)
- 8개 카테고리 + 카테고리별 콘텐츠를 넣는다.
- 게임/먹거리는 사진 보고 텍스트로 정답을 맞히는 TEXT_QUIZ (quiz_data.py 참조).
- 그 외 분야는 기존 객관식(QUIZ)/경험형(EXPERIENCE).
- 이미 데이터가 있으면 중복 삽입하지 않는다. (다시 넣으려면 --reset)
"""
from .database import Base, SessionLocal, engine
from . import models
from .quiz_data import GAME as GAME_QUIZ, FOOD as FOOD_QUIZ

# ---------------------------------------------------------------------------
# 카테고리 정의: code -> (name, theme_color, icon, description)
# ---------------------------------------------------------------------------
CATEGORIES = [
    ("GAME", "게임", "#3AA76D", "🎮", "밤새 하던 그 시절 게임, 사진 보고 맞히기"),
    ("DRAMA", "드라마", "#8E3B46", "📺", "그 시절 본방사수하던 드라마"),
    ("MOVIE", "영화", "#3B2E66", "🎞️", "극장에서 보던 추억의 영화"),
    ("ANIME_COMIC", "애니·만화책", "#5AB0E2", "📚", "만화방과 브라운관의 추억"),
    ("STATIONERY_PLAY", "문방구·놀이", "#38C6A5", "🪀", "학교 앞 문방구와 놀이"),
    ("MEME", "유행어·밈", "#6C5CE7", "💬", "그때 그 말, 지금은 밈"),
    ("FOOD", "먹거리", "#FF7EB3", "🍪", "추억의 과자와 불량식품, 사진 보고 맞히기"),
    ("MUSIC", "음악", "#4A6CF7", "📼", "카세트부터 MP3까지"),
]

# ---------------------------------------------------------------------------
# 객관식/경험형 콘텐츠 (게임·먹거리 제외 분야)
# 각 항목: (category_code, subcategory, title, question, content_type, options)
#   - options: [(text, is_correct), ...]  (EXPERIENCE 형은 정답 없이 경험 선택)
# ---------------------------------------------------------------------------
CONTENTS = [
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

# ---------------------------------------------------------------------------
# 사진 텍스트 퀴즈 (게임/먹거리)
#   category_code -> (media 폴더, 질문 문구, quiz_data 목록)
# ---------------------------------------------------------------------------
TEXT_QUIZ_SETS = [
    ("GAME", "gameQ", "이 게임의 이름은?", GAME_QUIZ),
    ("FOOD", "foodQ", "이 추억의 불량식품(간식) 이름은?", FOOD_QUIZ),
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

        # 1) 객관식/경험형 콘텐츠
        mc_count = 0
        for code, sub, title, question, ctype, options in CONTENTS:
            content = models.Content(
                category_id=code_to_category[code].id,
                subcategory=sub,
                title=title,
                question=question,
                image_url=None,
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
            mc_count += 1

        # 2) 사진 텍스트 퀴즈 (정답이 채워진 항목만 생성)
        text_count = 0
        skipped = 0
        for code, folder, question, items in TEXT_QUIZ_SETS:
            for filename, answer in items:
                if not answer or not answer.strip():
                    skipped += 1
                    continue
                content = models.Content(
                    category_id=code_to_category[code].id,
                    subcategory=None,
                    title="",  # 정답 노출 방지 (제목 비움)
                    question=question,
                    image_url=f"/media/{folder}/{filename}",
                    content_type="TEXT_QUIZ",
                    answer=answer.strip(),
                )
                db.add(content)
                text_count += 1

        db.commit()
        print(
            f"seed 완료: 카테고리 {len(CATEGORIES)}개, "
            f"객관식/경험형 {mc_count}개, 사진퀴즈 {text_count}개 "
            f"(정답 미입력 {skipped}개는 건너뜀)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    reset_flag = "--reset" in sys.argv
    seed(reset=reset_flag)
