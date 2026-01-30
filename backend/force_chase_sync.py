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

def force_chase():
    db = SessionLocal()
    try:
        # Chase is Item 4
        item = db.query(models.PlaidItem).filter(models.PlaidItem.id == 4).first()
        if not item:
            print("Chase Item (ID 4) not found!")
            return

        print(f"Syncing transactions for Item: {item.institution_name} (ID: 4)...")
        
        all_categories = db.query(models.Category).all()
        start_date = (datetime.now() - timedelta(days=90)).date()
        end_date = datetime.now().date()
        
        try:
            request = TransactionsGetRequest(
                access_token=item.access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(
                    include_personal_finance_category=True,
                    count=100
                )
            )
            response = client.transactions_get(request)
            
            # Map to local accounts
            db_accounts = db.query(models.Account).filter(models.Account.item_id == item.id).all()
            acct_map = {acc.plaid_account_id: acc.id for acc in db_accounts}
            
            print(f"  Fetched {len(response['transactions'])} transactions from Plaid.")
            
            synced = 0
            for tx in response['transactions']:
                if tx['account_id'] in acct_map:
                    local_id = acct_map[tx['account_id']]
                    
                    tx_schema = schemas.TransactionCreate(
                        amount=tx['amount'],
                        description=tx['name'],
                        date=tx['date'],
                        category="Uncategorized", # Simplification needed to be fast
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
    force_chase()
