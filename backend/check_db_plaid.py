from database import SessionLocal
import models

db = SessionLocal()
items = db.query(models.PlaidItem).all()
print(f"Plaid Items Linked: {len(items)}")
for item in items:
    print(f"- Item ID: {item.id}, Institution: {item.institution_name}")

transactions = db.query(models.Transaction).count()
print(f"Total Transactions: {transactions}")
