from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_types():
    db = SessionLocal()
    try:
        # Get all accounts
        accounts = db.query(models.Account).all()
        print(f"Scanning {len(accounts)} accounts...")
        
        for acc in accounts:
            # Handle Enum or String
            if hasattr(acc.type, 'value'):
                old_type = acc.type.value
            else:
                old_type = str(acc.type)
                
            new_type = old_type
            name = acc.name.lower()
            
            # Heuristic Logic
            if "mortgage" in name:
                new_type = "mortgage"
            elif "savings" in name:
                new_type = "savings"
            elif "card" in name or "visa" in name or "mastercard" in name or "amex" in name:
                new_type = "credit_card"
            elif "loan" in name or "loc" in name:
                # Distinguish LOC from Mortgage if possible, but loan is fine
                if new_type != "mortgage":
                    new_type = "loan"
            
            if new_type != old_type:
                print(f"Updating {acc.name}: {old_type} -> {new_type}")
                acc.type = new_type
            
        db.commit()
        print("All account types updated.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_types()
