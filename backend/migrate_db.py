from database import engine
import models
from sqlalchemy import inspect, text

def check_and_migrate():
    inspector = inspect(engine)
    
    # 1. Check if 'transactions' table exists
    if not inspector.has_table("transactions"):
        print("Creating 'transactions' table...")
        models.Base.metadata.tables["transactions"].create(engine)
    else:
        print("'transactions' table exists.")
        
        # 2. Check for 'plaid_transaction_id' column
        columns = [c['name'] for c in inspector.get_columns("transactions")]
        if "plaid_transaction_id" not in columns:
            print("Adding 'plaid_transaction_id' column...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN plaid_transaction_id VARCHAR"))
                conn.commit()
        else:
            print("Column 'plaid_transaction_id' exists.")

if __name__ == "__main__":
    print("Checking database schema...")
    check_and_migrate()
    print("Schema check complete.")
