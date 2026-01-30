from database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        with conn.begin():
            columns = [
                ("manual_mortgage_balance", "FLOAT DEFAULT 0"),
                ("interest_rate", "FLOAT DEFAULT 0"),
                ("monthly_payment", "FLOAT DEFAULT 0")
            ]
            
            for col_name, col_type in columns:
                try:
                    conn.execute(text(f"ALTER TABLE assets ADD COLUMN {col_name} {col_type}"))
                    print(f"Added column {col_name}")
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")

if __name__ == "__main__":
    add_columns()
