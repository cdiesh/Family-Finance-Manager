from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import crud, models, schemas
from database import get_db
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Only return transactions for accounts owned by current_user
    # Join Transaction -> Account -> User
    return db.query(models.Transaction)\
             .join(models.Account)\
             .filter(models.Account.owner_id == current_user.id)\
             .order_by(desc(models.Transaction.date))\
             .offset(skip)\
             .limit(limit)\
             .all()

@router.put("/{transaction_id}/tax_deductible")
def update_tax_status(
    transaction_id: int,
    is_tax_deductible: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # TODO: Verify ownership logic strictly, simplified for now
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    tx.is_tax_deductible = is_tax_deductible
    db.commit()
    return {"status": "updated", "is_tax_deductible": is_tax_deductible}
