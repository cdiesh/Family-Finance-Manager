from sqlalchemy.orm import Session
from database import SessionLocal
import models

def audit_accounts():
    db = SessionLocal()
    accounts = db.query(models.Account).all()
    print(f"Index | ID | Name | Institution | Type | Balance")
    print("-" * 60)
    for acc in accounts:
        print(f"  {acc.id} | {acc.name} | {acc.institution_name} | {acc.type} | ${acc.balance}")
    db.close()

if __name__ == "__main__":
    audit_accounts()
