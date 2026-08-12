"""나이 맞히기(Age Test) 라우터."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from .. import age_test_logic as logic
from .. import age_test_models as models
from .. import age_test_schemas as schemas
from .. import models as core_models
from ..coin_service import grant_coin_once
from ..database import get_db
from ..security import get_current_user_optional

router = APIRouter(prefix="/api/age-test", tags=["age-test"])


@router.get("/questions", response_model=list[schemas.AgeTestQuestionOut])
def list_questions(db: Session = Depends(get_db)):
    """질문을 order_index 순서대로 반환한다. 문항 수/선택지 수는 고정이 아니다(#76).

    representative_age/weight는 서버 내부(#5) 계산 전용이라 응답에 내려주지 않는다.
    """
    return (
        db.query(models.Question)
        .options(selectinload(models.Question.options))
        .order_by(models.Question.order_index)
        .all()
    )


@router.post("/submit", response_model=schemas.AgeTestSubmitOut)
def submit_answers(
    payload: schemas.AgeTestSubmitIn,
    db: Session = Depends(get_db),
    current_user: Optional[core_models.User] = Depends(get_current_user_optional),
):
    """답변을 검증한 뒤 #5 계산 로직으로 전달해 예상 나이/결정적 답변을 반환한다.

    문항 수는 하드코딩하지 않고, 현재 age_test_questions 테이블에 존재하는 질문
    전체(Question 모델에 is_active 같은 활성/비활성 구분 필드는 없음)와 제출된
    question_id 집합을 비교해서 검증한다(#76 원칙 유지).

    로그인 상태(#9): JWT가 유효하면 방금 계산한 estimated_age를 그대로 저장한다.
    별도 저장 엔드포인트는 두지 않는다(클라이언트가 값을 직접 보내 저장을 요청하는
    경로 없음 — 위변조 방지). 비로그인이면 계산 결과만 반환하고 저장하지 않는다.
    """
    if not payload.answers:
        raise HTTPException(status_code=400, detail="answers가 비어 있습니다.")

    submitted_ids = [a.question_id for a in payload.answers]
    if len(submitted_ids) != len(set(submitted_ids)):
        raise HTTPException(status_code=400, detail="중복된 question_id가 있습니다.")

    questions = (
        db.query(models.Question)
        .options(selectinload(models.Question.options))
        .order_by(models.Question.order_index)
        .all()
    )
    questions_by_id = {q.id: q for q in questions}
    active_question_ids = set(questions_by_id.keys())
    submitted_ids_set = set(submitted_ids)

    unknown_ids = submitted_ids_set - active_question_ids
    if unknown_ids:
        raise HTTPException(
            status_code=400,
            detail=f"존재하지 않는 question_id가 있습니다: {sorted(unknown_ids)}",
        )

    if len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"답변 개수({len(payload.answers)})가 현재 문항 수({len(questions)})와 다릅니다.",
        )

    missing_ids = active_question_ids - submitted_ids_set
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"일부 질문에 대한 답변이 누락되었습니다: {sorted(missing_ids)}",
        )

    answered_options = []
    for answer in payload.answers:
        question = questions_by_id[answer.question_id]
        option = next((o for o in question.options if o.id == answer.option_id), None)
        if option is None:
            raise HTTPException(
                status_code=400,
                detail=f"option_id {answer.option_id}는 question_id {answer.question_id}에 속하지 않습니다.",
            )
        answered_options.append(
            logic.AnsweredOption(
                question_text=question.text,
                option_text=option.text,
                representative_age=option.representative_age,
                weight=question.weight,
                order_index=question.order_index,
            )
        )

    estimated_age, top_reasons = logic.estimate_age(answered_options)

    if current_user is not None:
        db.add(models.Result(user_id=current_user.id, estimated_age=estimated_age))
        # 나이맞히기 완료 보상 +10 (사용자당 1회 — 재테스트로 무한 지급되지 않도록 멱등 처리)
        grant_coin_once(
            db,
            user_id=current_user.id,
            amount=10,
            reason="AGE_TEST",
            event_key=f"age-test:{current_user.id}",
        )
        db.commit()

    return schemas.AgeTestSubmitOut(estimated_age=estimated_age, top_reasons=top_reasons)
