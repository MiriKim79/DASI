"""초기 seed 데이터 삽입.

실행: python -m app.seed  (backend 디렉터리에서)
- 8개 카테고리 + 카테고리별 콘텐츠를 넣는다.
- 게임/먹거리는 사진 보고 텍스트로 정답을 맞히는 TEXT_QUIZ (quiz_data.py 참조).
- 그 외 분야는 기존 객관식(QUIZ)/경험형(EXPERIENCE).
- 이미 데이터가 있으면 중복 삽입하지 않는다. (다시 넣으려면 --reset)
"""
import os

from .database import Base, SessionLocal, engine
from . import models
from .quiz_data import (
    GAME as GAME_QUIZ,
    FOOD as FOOD_QUIZ,
    DRAMA as DRAMA_QUIZ,
    MOVIE as MOVIE_QUIZ,
    ANIME_COMIC as ANIME_QUIZ,
    STATIONERY_PLAY as PLAY_QUIZ,
    MEME as MEME_QUIZ,
    MUSIC as MUSIC_QUIZ,
)
from .age_test_seed import seed_age_test

# backend/ 디렉터리 (gameQ, foodQ … 미디어 폴더가 있는 곳)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 사진/음성으로 인정하는 확장자 (앞에 있는 것부터 우선 사용)
MEDIA_EXTS = (
    ".jpg", ".jpeg", ".png", ".webp", ".gif",   # 사진
    ".mp3", ".m4a", ".ogg", ".wav",             # 음성
)

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
# 객관식/경험형 콘텐츠 (현재는 사용 안 함 — 모든 분야를 사진·음성 퀴즈로 출제)
# 각 항목: (category_code, subcategory, title, question, content_type, options)
#   - options: [(text, is_correct), ...]  (EXPERIENCE 형은 정답 없이 경험 선택)
# ---------------------------------------------------------------------------
CONTENTS = [
    # 6개 분야(드라마·영화·애니만화·문방구놀이·유행어밈·음악)는
    # 사진·음성 맞히기(TEXT_QUIZ)로만 출제한다. → quiz_data.py 참조.
    # 객관식/경험형 문제가 다시 필요하면 여기에 항목을 추가하면 된다.
]

# ---------------------------------------------------------------------------
# 사진·음성 텍스트 퀴즈 (8개 분야 전체)
#   (category_code, media 폴더, 질문 문구, quiz_data 목록)
#
# quiz_data 의 파일명은 확장자를 적어도 되고 안 적어도 된다.
#   "겨울연가"      → dramaQ 폴더에서 겨울연가.jpg / .png / … 를 자동으로 찾는다
#   "gta5.png"      → 그 파일을 그대로 쓴다
# 폴더에 파일이 아직 없으면 그 문제는 seed 하지 않고 건너뛴다.
# ---------------------------------------------------------------------------
TEXT_QUIZ_SETS = [
    ("GAME", "gameQ", "이 게임의 이름은?", GAME_QUIZ),
    ("FOOD", "foodQ", "이 추억의 불량식품(간식) 이름은?", FOOD_QUIZ),
    ("DRAMA", "dramaQ", "이 드라마의 제목은?", DRAMA_QUIZ),
    ("MOVIE", "movieQ", "이 영화의 제목은?", MOVIE_QUIZ),
    ("ANIME_COMIC", "animeQ", "이 만화·애니메이션의 제목은?", ANIME_QUIZ),
    ("STATIONERY_PLAY", "playQ", "이 문방구 물건(또는 놀이)의 이름은?", PLAY_QUIZ),
    ("MEME", "memeQ", "이 장면에서 유행한 그 시절 유행어는?", MEME_QUIZ),
    ("MUSIC", "musicQ", "이 노래의 제목이나 가수는?", MUSIC_QUIZ),
]


def resolve_media(folder: str, filename: str) -> str | None:
    """미디어 폴더에서 실제 파일명을 찾아 준다. 없으면 None.

    - filename 에 확장자가 있으면 그 파일이 있는지만 확인한다.
    - 확장자가 없으면 MEDIA_EXTS 를 차례로 붙여 보며 찾는다.
      (덕분에 .jpg 로 넣든 .png 로 넣든 그대로 인식된다)
    """
    folder_path = os.path.join(BACKEND_DIR, folder)
    if not os.path.isdir(folder_path):
        return None

    if os.path.splitext(filename)[1].lower() in MEDIA_EXTS:
        return filename if os.path.isfile(os.path.join(folder_path, filename)) else None

    for ext in MEDIA_EXTS:
        candidate = filename + ext
        if os.path.isfile(os.path.join(folder_path, candidate)):
            return candidate
    return None


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

        # 2) 사진·음성 텍스트 퀴즈
        #    정답이 채워져 있고 + 실제 파일이 폴더에 있는 항목만 문제로 만든다.
        text_count = 0
        skipped = 0
        missing_report = []
        for code, folder, question, items in TEXT_QUIZ_SETS:
            made = 0
            missing = []
            for item in items:
                # (파일명, 정답) 또는 (파일명, 정답, 유튜브영상ID)
                filename, answer, *rest = item
                youtube_id = rest[0].strip() if rest and rest[0] else None

                if not answer or not answer.strip():
                    skipped += 1
                    continue

                if youtube_id:
                    # 음원을 파일로 두지 않고 유튜브 플레이어로 재생한다.
                    # image_url 에 "youtube:<영상ID>" 로 표시 → 프론트가 이를 보고 플레이어를 띄운다.
                    media_url = f"youtube:{youtube_id}"
                else:
                    actual = resolve_media(folder, filename)
                    if actual is None:
                        missing.append(filename)
                        skipped += 1
                        continue
                    media_url = f"/media/{folder}/{actual}"

                content = models.Content(
                    category_id=code_to_category[code].id,
                    subcategory=None,
                    title="",  # 정답 노출 방지 (제목 비움)
                    question=question,
                    image_url=media_url,
                    content_type="TEXT_QUIZ",
                    answer=answer.strip(),
                )
                db.add(content)
                made += 1
                text_count += 1
            missing_report.append((folder, made, len(items), missing))

        db.commit()
        print(
            f"seed 완료: 카테고리 {len(CATEGORIES)}개, "
            f"객관식/경험형 {mc_count}개, 사진·음성 퀴즈 {text_count}개 "
            f"(정답 미입력 또는 파일 없음 {skipped}개는 건너뜀)."
        )
        print("\n[분야별 사진·음성 파일 현황]")
        for folder, made, total, missing in missing_report:
            print(f"  {folder:<8} {made:>3}/{total} 준비됨", end="")
            if missing:
                preview = ", ".join(missing[:5])
                more = f" 외 {len(missing) - 5}개" if len(missing) > 5 else ""
                print(f"  ← 파일 없음: {preview}{more}")
            else:
                print()
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    reset_flag = "--reset" in sys.argv
    seed(reset=reset_flag)
