import sqlite3

DB_PATH = "family_finance.db"

def migrate():
    print(f"Migrating {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_cols = {
        "is_fixed": "BOOLEAN DEFAULT 0",
        "is_recurring": "BOOLEAN DEFAULT 0",
        "tags": "VARCHAR"
    }
    
    for col, def_type in new_cols.items():
        if col not in columns:
            print(f"Adding column: {col}")
            try:
                cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col} {def_type}")
                print("Success.")
            except Exception as e:
                print(f"Error adding {col}: {e}")
        else:
            print(f"Column {col} already exists.")
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
