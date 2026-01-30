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
    query = db.query(models.Transaction).join(models.Account).join(models.User, models.Account.owner_id == models.User.id)
    
    if current_user.household_id:
        query = query.filter(models.User.household_id == current_user.household_id)
    else:
        query = query.filter(models.Account.owner_id == current_user.id)

    # Filter out hidden accounts
    query = query.filter(models.Account.is_hidden == False)
        
    return query.order_by(desc(models.Transaction.date))\
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

class TransactionUpdate(schemas.BaseModel):
    category: str | None = None
    tags: str | None = None
    is_fixed: bool | None = None

@router.put("/{transaction_id}/update")
def update_transaction_details(
    transaction_id: int,
    updates: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Simple ownership check
    if tx.account.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if updates.category is not None:
        tx.category = updates.category
    if updates.tags is not None:
        tx.tags = updates.tags
    if updates.is_fixed is not None:
        tx.is_fixed = updates.is_fixed
        
    db.commit()
    return {"status": "success", "id": tx.id}
