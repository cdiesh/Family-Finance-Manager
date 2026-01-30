import pandas as pd
from datetime import datetime
import models
from database import SessionLocal, engine
from sqlalchemy.orm import Session

# Setup DB
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

FILE_PATH = r"C:\Users\charl\Downloads\Master Financial Forcast (1).xlsx"
SHEET_NAME = '2026'

def parse_date(date_val):
    # Handle various date formats or pandas Timestamp
    if isinstance(date_val, str):
        try:
            # Format appears to be 9.1.25 (M.D.YY)
            parts = date_val.split('.')
            if len(parts) == 3:
                return datetime.strptime(date_val, "%m.%d.%y").date()
        except:
            pass
    if isinstance(date_val, datetime):
        return date_val.date()
    return datetime.now().date() # Fallback

def import_transactions():
    print(f"Reading {FILE_PATH}...")
    try:
        df = pd.read_excel(FILE_PATH, sheet_name=SHEET_NAME, header=None)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Ensure 'Excel Import' account exists
    account = db.query(models.Account).filter(models.Account.name == "Excel Import").first()
    if not account:
        print("Creating 'Excel Import' account...")
        account = models.Account(
            name="Excel Import",
            type="depository",
            balance=0.0,
            owner_id=1 # Correct field name
        )
        db.add(account)
        db.commit()
        db.refresh(account)

    print(f"Importing transactions to Account ID: {account.id}")

    # Rows 25 to 39 (indices 25..39 inclusive? python slice is exclusive)
    # Excel Row 25 is index 24?
    # Step 756 output showed index 25 for Wavecrest Rent.
    # Let's iterate 25 to 40.
    
    count = 0
    for idx in range(25, 41):
        row = df.iloc[idx]
        
        # Extract matches
        # Col 1: Amount
        # Col 2: Name
        # Col 3: Date
        # Col 4: Bank
        
        raw_amt = row[1]
        name = row[2]
        raw_date = row[3]
        bank = row[4]

        # Validation
        if pd.isna(name) or str(name).strip() == "":
            continue
            
        try:
            amount = float(raw_amt)
        except:
            continue
            
        tx_date = parse_date(raw_date)
        
        # Check duplicate
        existing = db.query(models.Transaction).filter(
            models.Transaction.description == name, # Correct field
            models.Transaction.amount == amount,
            models.Transaction.date == tx_date
        ).first()
        
        if existing:
            print(f"Skipping duplicate: {name} - {amount}")
            continue

        # Auto-tagging logic (simplified)
        category = "Uncategorized"
        # query categories
        cat_match = db.query(models.Category).filter(models.Category.name == name).first()
        if cat_match:
            category = cat_match.name
        
        tx = models.Transaction(
            account_id=account.id,
            plaid_transaction_id=f"excel_{idx}", # Fake ID
            description=name, # Correct field
            amount=amount,
            date=tx_date,
            category=category,
            # pending=False, # Model default? No, not in schema, let's omit or add column?
            # 'pending' is NOT in Transaction model in Step 773. 
            # 'payment_channel' is NOT in Transaction model in Step 773.
            # Removing invalid fields.
            is_tax_deductible=False
        )
        db.add(tx)
        print(f"Imported: {name} | ${amount} | {tx_date}")
        count += 1
        
    db.commit()
    print(f"Success! Imported {count} transactions.")

if __name__ == "__main__":
    import_transactions()
