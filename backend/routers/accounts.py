from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud, models, schemas
from database import get_db
from routers.auth import get_current_active_user

from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

@router.put("/{account_id}/toggle_visibility")
def toggle_visibility(
    account_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    account.is_hidden = not account.is_hidden
    db.commit()
    db.refresh(account)
    return account

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
