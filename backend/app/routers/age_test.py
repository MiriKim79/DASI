"""나이 맞히기(Age Test) 라우터."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from .. import age_test_models as models
from .. import age_test_schemas as schemas
from ..database import get_db

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
