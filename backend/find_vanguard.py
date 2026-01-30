from sqlalchemy.orm import Session
from database import SessionLocal
import models
from sqlalchemy import or_

def find_vanguard():
    db = SessionLocal()
    # Search by name or institution name
    accounts = db.query(models.Account).filter(
        or_(
            models.Account.institution_name.ilike("%vanguard%"),
            models.Account.name.ilike("%vanguard%")
        )
    ).all()
    
    if not accounts:
        print("No Vanguard accounts found.")
    else:
        for acc in accounts:
            print(f"ID: {acc.id} | Name: {acc.name} | Inst: {acc.institution_name} | Type: {acc.type}")

    db.close()

if __name__ == "__main__":
    find_vanguard()
