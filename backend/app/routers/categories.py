"""카테고리(분야) 라우터."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """전체 카테고리 조회."""
    return crud.get_categories(db)


@router.get("/{category_id}", response_model=schemas.CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """특정 카테고리 조회 (id 기준)."""
    category = crud.get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    return category
