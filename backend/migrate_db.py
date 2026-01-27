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

    # 3. Check for 'households' table
    if not inspector.has_table("households"):
        print("Creating 'households' table...")
        models.Base.metadata.tables["households"].create(engine)
    else:
        print("'households' table exists.")

    # 4. Check for 'household_id' in users
    user_columns = [c['name'] for c in inspector.get_columns("users")]
    if "household_id" not in user_columns:
        print("Adding 'household_id' column to users...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN household_id INTEGER REFERENCES households(id)"))
            conn.commit()
    else:
        print("Column 'household_id' in users exists.")

    # 5. Check for 'google_sub' in users
    if "google_sub" not in user_columns:
        print("Adding 'google_sub' column to users...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR UNIQUE"))
            conn.commit()
    else:
        print("Column 'google_sub' in users exists.")

if __name__ == "__main__":
    print("Checking database schema...")
    check_and_migrate()
    print("Schema check complete.")
