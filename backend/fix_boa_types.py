from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_types():
    db = SessionLocal()
    try:
        # Get all BoA accounts (Item ID 3)
        # Based on previous inspection, ID 3 is BoA
        item_id = 3 
        accounts = db.query(models.Account).filter(models.Account.item_id == item_id).all()
        
        print(f"Found {len(accounts)} accounts for Item {item_id}")
        
        for acc in accounts:
            # Handle Enum or String
            if hasattr(acc.type, 'value'):
                old_type = acc.type.value
            else:
                old_type = str(acc.type)
                
            new_type = old_type
            
            if "savings" in acc.name.lower():
                new_type = "savings"
            elif "card" in acc.name.lower() or "visa" in acc.name.lower() or "mastercard" in acc.name.lower():
                new_type = "credit_card"
            
            # Default checking for others (Adv Plus Banking) is fine
            
            if new_type != old_type:
                print(f"Updating {acc.name}: {old_type} -> {new_type}")
                acc.type = new_type
                # Ensure balance is negative for liabilities? 
                # No, database stores raw amount. Display handles negativity.
                # However, for Net Worth calc, we rely on Type.
            else:
                print(f"Skipping {acc.name}: {old_type}")
                
        db.commit()
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_types()
