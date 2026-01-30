import sqlite3
import os

DB_FILE = os.path.abspath("../family_finance.db")
if not os.path.exists(DB_FILE):
    # Fallback if running from root? No, CWD is backend.
    DB_FILE = os.path.abspath("family_finance.db")

def add_columns():
    if not os.path.exists(DB_FILE):
        print(f"File not found: {DB_FILE}")
        return
    print(f"Connecting to {DB_FILE} (Size: {os.path.getsize(DB_FILE)} bytes)")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", tables)

    columns = [
        ("manual_mortgage_balance", "FLOAT DEFAULT 0"),
        ("interest_rate", "FLOAT DEFAULT 0"),
        ("monthly_payment", "FLOAT DEFAULT 0")
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE assets ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
