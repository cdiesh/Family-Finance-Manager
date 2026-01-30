from sqlalchemy.orm import Session
from database import SessionLocal
import models
from plaid_client import client
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta

def debug_sync():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            print("User not found")
            return

        items = db.query(models.PlaidItem).filter(models.PlaidItem.user_id == user.id).all()
        print(f"Found {len(items)} Plaid Items for user {user.email}")

        start_date = (datetime.now() - timedelta(days=90)).date()
        end_date = datetime.now().date()

        for item in items:
            print(f"\n--- Checking Item ID: {item.id} (Inst: {item.institution_name}) ---")
            
            # 1. Check local accounts for this item
            db_accounts = db.query(models.Account).filter(models.Account.item_id == item.id).all()
            print(f"Local Accounts linked to this Item: {len(db_accounts)}")
            acct_map = {}
            for acc in db_accounts:
                print(f"  - LocalID: {acc.id} | Name: {acc.name} | PlaidID: {acc.plaid_account_id} | Hidden: {acc.is_hidden}")
                acct_map[acc.plaid_account_id] = acc.id

            # 2. Call Plaid
            try:
                request = TransactionsGetRequest(
                    access_token=item.access_token,
                    start_date=start_date,
                    end_date=end_date,
                    options=TransactionsGetRequestOptions(
                        count=100,
                        offset=0
                    )
                )
                response = client.transactions_get(request)
                total_transactions = response['total_transactions']
                fetched_transactions = len(response['transactions'])
                print(f"Plaid Response: Total Available: {total_transactions}, Fetched: {fetched_transactions}")

                # 3. Analyze matches
                match_count = 0
                for tx in response['transactions']:
                    if tx['account_id'] in acct_map:
                        match_count += 1
                        # Print first few matches for verification
                        if match_count <= 3:
                            acc_name = next(a.name for a in db_accounts if a.plaid_account_id == tx['account_id'])
                            print(f"  [MATCH] Date: {tx['date']} | Amt: {tx['amount']} | Desc: {tx['name']} -> Account: {acc_name}")
                    else:
                        print(f"  [NO MATCH] Tx Account ID {tx['account_id']} not in local map!")
                
                print(f"Total Matches that would be synced: {match_count}")

            except Exception as e:
                print(f"Plaid API Error for item {item.id}: {e}")

    except Exception as e:
        print(f"Script Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_sync()
