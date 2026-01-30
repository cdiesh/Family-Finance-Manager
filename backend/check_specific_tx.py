from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_db_tx():
    db = SessionLocal()
    try:
        # Check Account ID 2 (LOC)
        tx_loc = db.query(models.Transaction).filter(models.Transaction.account_id == 2).all()
        print(f"Account 2 (LOC) Transactions: {len(tx_loc)}")
        for t in tx_loc:
            print(f"  - {t.date} | {t.amount} | {t.description}")

        # Check Account ID 4 (Checking)
        tx_chk = db.query(models.Transaction).filter(models.Transaction.account_id == 4).all()
        print(f"\nAccount 4 (Checking) Transactions: {len(tx_chk)}")
        for t in tx_chk:
            print(f"  - {t.date} | {t.amount} | {t.description}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db_tx()
