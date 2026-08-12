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

# Ranking candidates are references to seed data, never auto-increment IDs.
# The two FOOD ambiguities are excluded; MOVIE's media-less Matrix row is not
# among the selected candidates.
RANKING_CANDIDATE_ITEMS = {
    "GAME": GAME_QUIZ[:17], "DRAMA": DRAMA_QUIZ[:17], "MOVIE": MOVIE_QUIZ[:17],
    "ANIME_COMIC": ANIME_QUIZ[:17], "STATIONERY_PLAY": PLAY_QUIZ[:17],
    "MEME": MEME_QUIZ[:17], "MUSIC": MUSIC_QUIZ[:17],
    "FOOD": [item for item in FOOD_QUIZ if item[0] not in {"꾀돌이(깐돌이,초코면,꺼벙이).png", "뽑기.jpeg"}][:17],
}


def seed_ranking_questions(db):
    """Create only missing mapping rows; return missing Content identifiers."""
    missing, created = [], 0
    for code, items in RANKING_CANDIDATE_ITEMS.items():
        category = db.query(models.Category).filter(models.Category.code == code).first()
        for item in items:
            folder = next(folder for category_code, folder, _question, _items in TEXT_QUIZ_SETS if category_code == code)
            media_key = canonical_media_url(folder, item)
            content = None if category is None else db.query(models.Content).filter(
                models.Content.category_id == category.id,
                models.Content.content_type == "TEXT_QUIZ",
                models.Content.image_url == media_key,
            ).first()
            if content is None:
                missing.append(f"{code}:{item[0]}")
            elif not db.query(models.RankingQuestion.id).filter_by(content_id=content.id).first():
                db.add(models.RankingQuestion(content_id=content.id, is_active=True))
                created += 1
    db.flush()
    print(f"[ranking_questions] created={created}, expected=136, missing={len(missing)}")
    if missing:
        print("[ranking_questions] missing Content: " + ", ".join(missing))
    return missing


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


def canonical_media_url(folder: str, item) -> str | None:
    """Return exactly the image_url representation used by Content seed."""
    filename, _answer, *rest = item
    youtube_id = rest[0].strip() if rest and rest[0] else None
    if youtube_id:
        start_sec = int(rest[1]) if len(rest) > 1 and rest[1] else 0
        return f"youtube:{youtube_id}:{start_sec}" if start_sec > 0 else f"youtube:{youtube_id}"
    actual = resolve_media(folder, filename)
    return f"/media/{folder}/{actual}" if actual else None


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
        code_to_category = {category.code: category for category in db.query(models.Category).all()}
        for code, name, color, icon, desc in CATEGORIES:
            if code in code_to_category:
                continue
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
            already = 0  # 이번 실행 전에 이미 DB에 있던 개수(재실행 시 "0개 추가"만 보고 "없다"고 착각하지 않도록 별도 집계)
            missing = []
            for item in items:
                # (파일명, 정답)
                # 또는 (파일명, 정답, 유튜브영상ID[, 시작초])
                #   시작초: 하이라이트(후렴) 지점부터 재생하고 싶을 때 초 단위로 지정
                filename, answer, *rest = item
                youtube_id = rest[0].strip() if rest and rest[0] else None
                start_sec = int(rest[1]) if len(rest) > 1 and rest[1] else 0

                if not answer or not answer.strip():
                    skipped += 1
                    continue

                if youtube_id:
                    # 음원을 파일로 두지 않고 유튜브 플레이어로 재생한다.
                    # image_url 에 "youtube:<영상ID>" (또는 ":<시작초>") 로 표시
                    #  → 프론트가 이를 보고 플레이어를 띄운다.
                    media_url = f"youtube:{youtube_id}"
                    if start_sec > 0:
                        media_url += f":{start_sec}"
                else:
                    actual = resolve_media(folder, filename)
                    if actual is None:
                        missing.append(filename)
                        skipped += 1
                        continue
                    media_url = f"/media/{folder}/{actual}"

                existing = db.query(models.Content.id).filter(
                    models.Content.category_id == code_to_category[code].id,
                    models.Content.content_type == "TEXT_QUIZ",
                    models.Content.image_url == media_url,
                ).first()
                if existing is not None:
                    already += 1
                    continue

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
            missing_report.append((folder, made, already, len(items), missing))

        # Make newly backfilled Content visible to the mapping query in this run.
        db.flush()
        seed_ranking_questions(db)
        db.commit()
        print(
            f"seed 완료: 카테고리 {len(CATEGORIES)}개, "
            f"객관식/경험형 {mc_count}개, 사진·음성 퀴즈 {text_count}개 "
            f"(정답 미입력 또는 파일 없음 {skipped}개는 건너뜀)."
        )
        print("\n[분야별 사진·음성 파일 현황] (실제 DB 총 개수 = 이번에 새로 추가 + 이미 있던 것)")
        for folder, made, already, total, missing in missing_report:
            ready = made + already
            print(f"  {folder:<8} {ready:>3}/{total} 준비됨 (신규 {made}, 기존 {already})", end="")
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
