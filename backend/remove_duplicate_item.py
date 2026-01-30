from sqlalchemy.orm import Session
from database import SessionLocal
import models

def remove_duplicate():
    db = SessionLocal()
    try:
        # User requested removing the duplicate S&T
        # We saw ID 1 and ID 2. We'll remove ID 2.
        item_to_delete = db.query(models.PlaidItem).get(2)
        
        if not item_to_delete:
            print("Item ID 2 not found.")
            return

        print(f"Deleting Item: {item_to_delete.institution_name} (ID: {item_to_delete.id})")
        
        # Delete associated accounts and transactions first?
        # Check accounts linked to this item
        accounts = db.query(models.Account).filter(models.Account.item_id == item_to_delete.id).all()
        for acc in accounts:
            print(f"  - Deleting account: {acc.name}")
            # Delete transactions for this account
            db.query(models.Transaction).filter(models.Transaction.account_id == acc.id).delete()
            db.delete(acc)
            
        db.delete(item_to_delete)
        db.commit()
        print("Deletion successful.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_duplicate()
