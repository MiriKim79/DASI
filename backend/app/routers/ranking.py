from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..coin_service import spend_coin
from ..database import get_db
from ..ranking_service import has_official_record_today, is_text_answer_correct, kst_today, select_challenge_questions, utcnow_naive
from ..security import get_current_user

router = APIRouter(prefix="/api/ranking", tags=["ranking"])


@router.post("/challenge", response_model=schemas.RankingChallengeOut)
def start_challenge(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    questions = select_challenge_questions(db)  # validate pool before any debit
    try:
        challenge = models.RankingChallenge(user_id=current_user.id, coin_cost=10)
        db.add(challenge)
        db.flush()
        spend_coin(db, user_id=current_user.id, amount=10, reason="RANKING_CHALLENGE", event_key=f"ranking-challenge:{challenge.id}")
        for position, ranking_question in enumerate(questions, start=1):
            db.add(models.RankingChallengeItem(challenge_id=challenge.id, ranking_question_id=ranking_question.id, position=position))
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(current_user)
    return schemas.RankingChallengeOut(
        challenge_id=challenge.id, coin_cost=10, remaining_coin=current_user.coin_balance,
        official_eligible=not has_official_record_today(db, current_user.id),
        questions=[schemas.RankingQuestionOut(content_id=row.content_id, position=index, question=row.content.question, image_url=row.content.image_url, content_type=row.content.content_type) for index, row in enumerate(questions, start=1)],
    )


@router.post("/challenge/submit", response_model=schemas.RankingSubmitOut)
def submit_challenge(payload: schemas.RankingSubmitIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    challenge = db.query(models.RankingChallenge).filter_by(id=payload.challenge_id).first()
    if challenge is None or challenge.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="랭킹 도전을 찾을 수 없습니다.")
    if challenge.status != "ACTIVE":
        raise HTTPException(status_code=409, detail="이미 제출한 랭킹 도전입니다.")
    if len(payload.answers) != 20:
        raise HTTPException(status_code=400, detail="답변은 정확히 20개여야 합니다.")
    content_ids = [answer.content_id for answer in payload.answers]
    if len(set(content_ids)) != 20:
        raise HTTPException(status_code=400, detail="중복된 문제 답변은 제출할 수 없습니다.")
    items = (
        db.query(models.RankingChallengeItem)
        .options(joinedload(models.RankingChallengeItem.ranking_question).joinedload(models.RankingQuestion.content))
        .filter_by(challenge_id=challenge.id).all()
    )
    item_by_content = {item.ranking_question.content_id: item for item in items}
    if len(items) != 20 or set(content_ids) != set(item_by_content):
        raise HTTPException(status_code=400, detail="출제된 20문제와 답변이 일치하지 않습니다.")
    answers = {answer.content_id: answer.answer for answer in payload.answers}
    correct_count = sum(is_text_answer_correct(item.ranking_question.content, answers[content_id]) for content_id, item in item_by_content.items())
    total_count = 20
    submitted_at = utcnow_naive()
    elapsed_seconds = max(0, int((submitted_at - challenge.started_at).total_seconds()))
    challenge.status = "SUBMITTED"
    challenge.submitted_at = submitted_at
    official_recorded = False
    if not has_official_record_today(db, current_user.id):
        try:
            with db.begin_nested():
                db.add(models.RankingRecord(user_id=current_user.id, challenge_id=challenge.id, correct_count=correct_count, total_count=total_count, accuracy=correct_count / total_count, elapsed_seconds=elapsed_seconds, official_date=kst_today()))
                db.flush()
                official_recorded = True
        except IntegrityError:
            official_recorded = False
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return schemas.RankingSubmitOut(correct_count=correct_count, total_count=total_count, accuracy=correct_count / total_count, elapsed_seconds=elapsed_seconds, official_recorded=official_recorded)
