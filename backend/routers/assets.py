from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from routers.auth import get_current_active_user
import models, crud
from datetime import datetime
import math

router = APIRouter()

# --- Pydantic Models ---
class AssetBase(BaseModel):
    name: str
    type: str # real_estate, investment, vehicle, other
    value: float
    ownership_percentage: float = 100.0
    linked_account_id: Optional[int] = None
    # Manual Mortgage
    manual_mortgage_balance: float = 0.0
    interest_rate: float = 0.0
    monthly_payment: float = 0.0

class AssetCreate(AssetBase):
    pass

class AssetUpdate(AssetBase):
    pass

class AssetRead(AssetBase):
    id: int
    user_id: int
    # Computed fields for convenience?
    equity_value: float = 0.0
    current_balance: float = 0.0

    class Config:
        from_attributes = True

# --- API Endpoints ---

@router.get("/", response_model=List[AssetRead])
def get_assets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    assets = db.query(models.Asset).filter(models.Asset.user_id == current_user.id).all()
    
    # Calculate Equity for display
    results = []
    for asset in assets:
        # Pydantic conversion
        data = AssetRead.from_orm(asset)
        
        # Calculate Equity
        # Equity = (Value - FullLiability) * Ownership%
        # Assuming linked liability is the FULL mortgage amount for the property
        
        gross_value = asset.value
        liability = 0.0
        
        if asset.linked_account_id:
            linked = db.query(models.Account).filter(models.Account.id == asset.linked_account_id).first()
            if linked:
                # Plaid loans are usually positive balance. But if it's a mortgage type, use it.
                # However, Asset 'liability' should be positive number for math: Value - Liability.
                # Plaid balance is usually positive for debt.
                liability = abs(linked.balance)
        
        # Add Manual Mortgage OR Amortization
        # Logic: If linked, use linked. Else if manual balance > 0, use manual. Else if amortization, calc it.
        if liability == 0.0:
            if asset.manual_mortgage_balance > 0:
                liability = asset.manual_mortgage_balance
            elif asset.amortization_start_date and asset.original_principal > 0:
                # Calculate Amortized Balance
                # B = P * [ (1+r)^n - (1+r)^p ] / [ (1+r)^n - 1 ]
                try:
                    p_principal = asset.original_principal
                    r_annual = asset.interest_rate
                    r_monthly = r_annual / 100.0 / 12.0
                    n_months = asset.term_months or 360
                    
                    start_date = asset.amortization_start_date
                    now = datetime.utcnow()
                    
                    # Payments made
                    diff = (now.year - start_date.year) * 12 + (now.month - start_date.month)
                    # Checking day of month? Let's just approximate by month
                    p_payments = max(0, diff)
                    
                    if r_monthly == 0:
                        # Linear? No, just P - (P/n)*p
                        balance = p_principal - (p_principal / n_months * p_payments)
                    else:
                        numerator = ((1 + r_monthly) ** n_months) - ((1 + r_monthly) ** p_payments)
                        denominator = ((1 + r_monthly) ** n_months) - 1
                        balance = p_principal * (numerator / denominator)
                        
                    liability = max(0.0, balance)
                except Exception as e:
                    print(f"Error calculating amortization for asset {asset.id}: {e}")

        # Net Equity for User
        data.equity_value = (gross_value - liability) * (asset.ownership_percentage / 100.0)
        data.current_balance = liability
        
        results.append(data)
        
    return results

@router.post("/", response_model=AssetRead)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_asset = models.Asset(
        user_id=current_user.id,
        name=asset.name,
        type=asset.type,
        value=asset.value,
        ownership_percentage=asset.ownership_percentage,
        linked_account_id=asset.linked_account_id,
        manual_mortgage_balance=asset.manual_mortgage_balance,
        interest_rate=asset.interest_rate,
        monthly_payment=asset.monthly_payment
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset # equity_value defaults 0, frontend can recalc or refresh

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    asset = db.query(models.Asset).filter(
        models.Asset.id == asset_id,
        models.Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(asset)
    db.commit()
    return {"status": "success"}
