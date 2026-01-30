from sqlalchemy.orm import Session
from database import SessionLocal
import models

def inspect_items():
    db = SessionLocal()
    items = db.query(models.PlaidItem).all()
    print(f"Total Plaid Items: {len(items)}")
    for item in items:
        print(f"ID: {item.id}, Inst: {item.institution_name}, Status: {item.status}, UserID: {item.user_id}")

    # Also check accounts again just in case
    accounts = db.query(models.Account).all()
    print(f"Total Accounts: {len(accounts)}")

if __name__ == "__main__":
    inspect_items()
