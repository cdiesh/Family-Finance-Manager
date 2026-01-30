from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_chase_tx():
    db = SessionLocal()
    # Chase should be Item ID 4 (based on previous logs)
    accts = db.query(models.Account).filter(models.Account.item_id == 4).all()
    print(f"Found {len(accts)} Chase Accounts")
    
    total_tx = 0
    for acc in accts:
        tx_count = db.query(models.Transaction).filter(models.Transaction.account_id == acc.id).count()
        print(f"  - {acc.name}: {tx_count} transactions")
        total_tx += tx_count
        
    print(f"Total Chase Transactions: {total_tx}")
    db.close()

if __name__ == "__main__":
    check_chase_tx()
