from sqlalchemy.orm import Session
from database import SessionLocal
import models
import crud
import schemas
from plaid_client import client
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
import plaid

def deep_sync_loans():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        items = db.query(models.PlaidItem).filter(models.PlaidItem.user_id == user.id).all()
        
        print(f"Deep syncing loans (365 days) for {len(items)} items...")
        
        start_date = (datetime.now() - timedelta(days=365)).date()
        end_date = datetime.now().date()
        
        for item in items:
            print(f"\n--- Item: {item.institution_name} (ID: {item.id}) ---")
            
            # Check if this item HAS any loans/mortgages/credit to justify the deep sync
            accounts = db.query(models.Account).filter(models.Account.item_id == item.id).all()
            target_ids = []
            for acc in accounts:
                if acc.type in ['loan', 'mortgage', 'credit_card']:
                    print(f"  Targeting {acc.name} ({acc.type})")
                    target_ids.append(acc.plaid_account_id)
            
            if not target_ids:
                print("  No liability accounts found. Skipping deep sync.")
                continue

            try:
                request = TransactionsGetRequest(
                    access_token=item.access_token,
                    start_date=start_date,
                    end_date=end_date,
                    options=TransactionsGetRequestOptions(
                        include_personal_finance_category=True,
                        account_ids=target_ids, # Target specific accounts to avoid re-fetching everything
                        count=500
                    )
                )
                response = client.transactions_get(request)
                
                print(f"  Fetched {len(response['transactions'])} transactions from Plaid.")
                
                acct_map = {acc.plaid_account_id: acc.id for acc in accounts}
                synced = 0
                
                for tx in response['transactions']:
                    if tx['account_id'] in acct_map:
                        local_id = acct_map[tx['account_id']]
                        
                        tx_schema = schemas.TransactionCreate(
                            amount=tx['amount'],
                            description=tx['name'],
                            date=tx['date'],
                            category="Uncategorized", 
                            plaid_transaction_id=tx['transaction_id']
                        )
                        crud.upsert_transaction(db, tx_schema, local_id)
                        synced += 1
                
                print(f"  -> Successfully stored {synced} transactions.")
                db.commit()

            except plaid.ApiException as e:
                print(f"  ERROR: {e}")

    except Exception as e:
        print(f"Script Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    deep_sync_loans()
