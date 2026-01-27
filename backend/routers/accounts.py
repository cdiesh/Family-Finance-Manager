from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud, models, schemas
from database import get_db
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Account])
def read_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.household_id:
        return crud.get_household_accounts(db, household_id=current_user.household_id)
    else:
        # Fallback to user's own accounts
        return db.query(models.Account).filter(models.Account.owner_id == current_user.id).all()
