from sqlalchemy.orm import Session
from database import SessionLocal
import models

def inspect_data():
    db = SessionLocal()
    accounts = db.query(models.Account).all()
    print(f"Total Accounts: {len(accounts)}")
    for acc in accounts:
        print(f"ID: {acc.id}, Name: {acc.name}, Inst: '{acc.institution_name}', Hidden: {acc.is_hidden}")
        
    transactions = db.query(models.Transaction).all()
    print(f"Total Transactions: {len(transactions)}")
    # Just print first 5
    for tx in transactions[:5]:
        print(f"ID: {tx.id}, Desc: {tx.description}, Cat: {tx.category}, AcctID: {tx.account_id}")

if __name__ == "__main__":
    inspect_data()
