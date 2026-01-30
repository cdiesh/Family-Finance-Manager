from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from database import get_db
from routers.auth import get_current_active_user
import models
import schemas

router = APIRouter()

@router.get("/spending")
def get_spending_insights(
    time_range: str = "365d",
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns aggregated spending data for charts.
    """
    # Determine date range
    end_date = datetime.now()
    
    if month and year:
        # Specific Month View
        import calendar
        start_date = datetime(year, month, 1)
        # Last day of month
        last_day = calendar.monthrange(year, month)[1]
        end_date_filter = datetime(year, month, last_day, 23, 59, 59)
    elif time_range == "30d":
        start_date = end_date - timedelta(days=30)
        end_date_filter = end_date
    elif time_range == "ytd":
        start_date = datetime(end_date.year, 1, 1)
        end_date_filter = end_date
    else: # Default match historical sync
        start_date = end_date - timedelta(days=365)
        end_date_filter = end_date

    # Fetch User Accounts
    account_ids = [a.id for a in current_user.accounts if not a.is_hidden]
    if not account_ids:
        return {"trend": [], "distribution": []}

    # 1. Category Distribution (Pie Chart)
    # Filter: Expenses only (negative amounts on some banks, positive on others? 
    # Usually Plaid: positive = expense. But we check TransactionType or just sum positive vs negative?
    # Plaid standard: positive amount = money leaving account. Negative = refund.
    # We should exclude TRANSFERS and INCOME categories.
    
    # Query: Sum amount by category
    cat_distribution = db.query(
        models.Transaction.category, 
        func.sum(models.Transaction.amount).label("total")
    ).filter(
        models.Transaction.account_id.in_(account_ids),
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date_filter,
        models.Transaction.amount > 0, # Expenses
        models.Transaction.category.notin_(["Transfer", "Credit Card Payment", "Income", "Deposit"]),
        ~models.Transaction.description.ilike("%Payment to Chase%"),
        ~models.Transaction.description.ilike("%Payment to Amex%"),
        ~models.Transaction.description.ilike("%Payment to Citi%"),
        ~models.Transaction.description.ilike("%Payment to Discover%"),
        ~models.Transaction.description.ilike("%Credit Card Payment%")
    ).group_by(models.Transaction.category).all()
    
    pie_data = [{"name": c[0] or "Uncategorized", "value": round(c[1], 2)} for c in cat_distribution]

    # 2. Spending Trend (Bar Chart: Fixed vs Variable per Month)
    # SQLite doesn't have easy date truncation functions like Postgres date_trunc.
    # We'll fetch raw and aggregate in Python for flexibility with SQLite.
    transactions = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(account_ids),
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date_filter,
        models.Transaction.amount > 0, # Expenses
        models.Transaction.category.notin_(["Transfer", "Credit Card Payment", "Income", "Deposit"]),
        ~models.Transaction.description.ilike("%Payment to Chase%"),
        ~models.Transaction.description.ilike("%Payment to Amex%"),
        ~models.Transaction.description.ilike("%Payment to Citi%"),
        ~models.Transaction.description.ilike("%Payment to Discover%"),
        ~models.Transaction.description.ilike("%Credit Card Payment%")
    ).all()
    
    # Aggregate by Month -> Fixed/Variable
    trend_map = {} # "Jan 2024": {fixed: 0, variable: 0}
    
    for tx in transactions:
        month_key = tx.date.strftime("%b %Y") # e.g. "Jan 2025"
        if month_key not in trend_map:
            trend_map[month_key] = {"name": month_key, "fixed": 0.0, "variable": 0.0}
            
        if tx.is_fixed:
            trend_map[month_key]["fixed"] += tx.amount
        else:
            trend_map[month_key]["variable"] += tx.amount
            
    # Convert to list and sort chronologically (hacky sort by date string, proper way is likely simpler)
    # We iterate properly based on start_date to end_date to ensure gaps are filled?
    # For now, just return what we have.
    trend_data = list(trend_map.values())
    
    return {
        "distribution": pie_data,
        "trend": trend_data
    }

@router.post("/auto_categorize")
def run_auto_categorization(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Smart Agent: Tags transactions based on History-Based Learning + Rules.
    """
    account_ids = [a.id for a in current_user.accounts if not a.is_hidden]
    
    # --- PHASE 1: BUILD KNOWLEDGE BASE (History Learning) ---
    # Fetch all *categorized* transactions for this user
    history = db.query(models.Transaction.description, models.Transaction.category, models.Transaction.is_fixed, models.Transaction.tags).filter(
        models.Transaction.account_id.in_(account_ids),
        models.Transaction.category != "Uncategorized",
        models.Transaction.category != None
    ).all()
    
    # Map: "description (lower)" -> {category, is_fixed, tag}
    knowledge_base = {}
    for desc, cat, fixed, tag in history:
        clean_desc = desc.lower().strip()
        # Store the most recent or frequent rule? For simplicity, we just overwrite, assuming recent usage is best.
        knowledge_base[clean_desc] = {"category": cat, "is_fixed": fixed, "tags": tag}

    # --- PHASE 2: APPLY KNOWLEDGE TO UNCATEGORIZED ---
    # Fetch targets
    targets = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(account_ids),
        (models.Transaction.category == "Uncategorized") | (models.Transaction.category == None) | (models.Transaction.tags == None)
    ).all()
    
    updates_count = 0
    
    fixed_keywords = ["mortgage", "loan", "netflix", "spotify", "hulu", "insurance", "verizon", "at&t", "comcast", "xfinity", "gym", "hoa"]
    work_keywords = ["doordash", "uber", "lyft", "wework", "aws", "github"]
    
    for tx in targets:
        desc = tx.description.lower().strip()
        
        # 0. Detect Credit Card Payments (Transfers) - Always Priority
        if "payment to chase" in desc or "payment to amex" in desc or "credit card payment" in desc or "payment to citi" in desc or "payment to discover" in desc:
            tx.category = "Credit Card Payment"
            updates_count += 1
            continue

        # 1. HISTORY MATCHING (Smart Learning)
        # Check for exact match first
        if desc in knowledge_base:
            rule = knowledge_base[desc]
            if tx.category == "Uncategorized" or not tx.category:
                tx.category = rule["category"]
            if not tx.is_fixed and rule["is_fixed"]:
                tx.is_fixed = True
            if not tx.tags and rule["tags"]:
                tx.tags = rule["tags"]
            updates_count += 1
            continue
        
        # Check for partial match (e.g. "Uber 0725" matches known "Uber")
        # heuristic: if a known key is a substring of current desc
        found_history = False
        for known_desc, rule in knowledge_base.items():
            if len(known_desc) > 4 and known_desc in desc: # Avoid short partials like "the"
                 if tx.category == "Uncategorized" or not tx.category:
                    tx.category = rule["category"]
                    found_history = True
                    break
        
        if found_history:
            updates_count += 1
            continue

        # 2. RULE FALLBACKS
        if any(k in desc for k in fixed_keywords):
            tx.is_fixed = True
            updates_count += 1
            
        if any(k in desc for k in work_keywords):
            tx.tags = "Work"
            updates_count += 1
            
        # 3. Simple Keywords
        if tx.category == "Uncategorized" or not tx.category:
            if "uber" in desc or "lyft" in desc:
                tx.category = "Transportation"
            elif "market" in desc or "grocery" in desc or "whole foods" in desc:
                tx.category = "Food"
            elif "restaurant" in desc or "bar" in desc:
                tx.category = "Dining"
            elif "travel" in desc or "airline" in desc or "hotel" in desc or "airbnb" in desc:
                tx.category = "Travel"
    
    db.commit()
    db.commit()
    return {"status": "success", "processed": len(targets), "updated": updates_count, "knowledge_size": len(knowledge_base)}

@router.get("/transactions")
def get_insights_transactions(
    month: int = None,
    year: int = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Drill-down: Get individual transactions for a specific period/category.
    """
    account_ids = [a.id for a in current_user.accounts if not a.is_hidden]
    
    query = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(account_ids),
        models.Transaction.amount > 0 # Expenses only
    )
    
    if month and year:
        import calendar
        start_date = datetime(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime(year, month, last_day, 23, 59, 59)
        query = query.filter(models.Transaction.date >= start_date, models.Transaction.date <= end_date)
        
    if category and category != "All":
        query = query.filter(models.Transaction.category == category)
        
    # Exclude payments/hidden types if needed
    query = query.filter(
        models.Transaction.category.notin_(["Transfer", "Credit Card Payment", "Income", "Deposit"]),
        ~models.Transaction.description.ilike("%Payment to Chase%"),
        ~models.Transaction.description.ilike("%Payment to Amex%"),
        ~models.Transaction.description.ilike("%Payment to Citi%"),
        ~models.Transaction.description.ilike("%Payment to Discover%"),
        ~models.Transaction.description.ilike("%Credit Card Payment%")
    )
        
    transactions = query.order_by(models.Transaction.date.desc()).all()
    return transactions
