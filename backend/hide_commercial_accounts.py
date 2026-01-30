from database import SessionLocal
import models

db = SessionLocal()

# Find Meridian Bank accounts
accounts = db.query(models.Account).filter(
    models.Account.institution_name.ilike("%Meridian%") | models.Account.name.ilike("%Meridian%")
).all()

print(f"Found {len(accounts)} Meridian/Commercial accounts.")

for acc in accounts:
    print(f"Hiding Account: {acc.name} (ID: {acc.id}) - {acc.institution_name}")
    acc.is_hidden = True

db.commit()
print("Success. All Meridian accounts are now hidden.")
