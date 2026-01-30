from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE accounts ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Migration successful: Added is_hidden column to accounts table.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")

if __name__ == "__main__":
    migrate()
