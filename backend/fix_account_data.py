from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def fix_data():
    acc = db.query(models.Account).filter(models.Account.name == "Excel Import").first()
    if acc:
        print(f"Found account: {acc.name}")
        changed = False
        
        # Flix Type
        if acc.type == "depository":
            acc.type = "checking"
            changed = True
            print("Fixed type to 'checking'.")
            
        # Fix Institution Name (Mandatory in Schema)
        if not acc.institution_name:
            acc.institution_name = "Excel"
            changed = True
            print("Fixed institution_name to 'Excel'.")
            
        if changed:
            db.commit()
            print("Commited changes.")
        else:
            print("No changes needed.")
    else:
        print("Account not found.")

if __name__ == "__main__":
    fix_data()
