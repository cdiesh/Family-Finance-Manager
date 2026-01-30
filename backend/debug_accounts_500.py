import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
from models import User
from routers import accounts
from schemas import Account as AccountSchema
from typing import List

db = SessionLocal()
user = db.query(User).filter(User.email.ilike("%diesh%")).first()

print(f"User: {user.email}")

try:
    # 1. Fetch from DB (ORM)
    print("Fetching accounts from DB...")
    db_accounts = accounts.read_accounts(db=db, current_user=user)
    print(f"Got {len(db_accounts)} accounts.")
    
    # 2. explicit Pydantic Validation (This is what FastAPI does)
    print("Validating via Pydantic...")
    for acc in db_accounts:
        print(f"Validating {acc.name}...")
        # Trigger lazy load of transactions
        # print(f"  Transactions: {len(acc.transactions)}")
        # Validate
        model = AccountSchema.model_validate(acc)
        print("  OK")
        
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
