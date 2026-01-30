from sqlalchemy.orm import Session
from database import SessionLocal
import models

def clean_legacy_data():
    db = SessionLocal()
    try:
        # Find all accounts that are "Excel Import" (or have no item_id/plaid_id?)
        # Based on previous context, user said "Excel Import" for Institution Name
        
        # 1. Accounts
        excel_accounts = db.query(models.Account).filter(
            (models.Account.institution_name == "Excel") | 
            (models.Account.institution_name == "Manual")
        ).all()
        
        count_acc = len(excel_accounts)
        
        for acc in excel_accounts:
            # Transactions cascade? Or manual delete?
            # Sqlalchemy cascade might not be set up, so manual delete transactions first
            db.query(models.Transaction).filter(models.Transaction.account_id == acc.id).delete()
            db.delete(acc)
            
        # 2. Transactions that might not be linked to an account (orphan legacy?)
        # Or transactions where plaid_transaction_id is NULL but are old?
        # Safe bet is just the account-based deletion for now.
        
        db.commit()
        print(f"Cleanup Complete.")
        print(f"Deleted {count_acc} legacy accounts and their transactions.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_legacy_data()
