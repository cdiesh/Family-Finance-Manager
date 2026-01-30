from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Postgres uses TIMESTAMP, DOUBLE PRECISION
            # Use IF NOT EXISTS equivalent logic or just try/except
            
            try:
                conn.execute(text("ALTER TABLE assets ADD COLUMN amortization_start_date TIMESTAMP"))
                print("Added amortization_start_date")
            except Exception as e:
                print(f"Skipped amortization_start_date: {e}")

            try:
                conn.execute(text("ALTER TABLE assets ADD COLUMN original_principal DOUBLE PRECISION DEFAULT 0.0"))
                print("Added original_principal")
            except Exception as e:
                print(f"Skipped original_principal: {e}")

            try:
                conn.execute(text("ALTER TABLE assets ADD COLUMN term_months INTEGER DEFAULT 360"))
                print("Added term_months")
            except Exception as e:
                print(f"Skipped term_months: {e}")
            
            trans.commit()
            print("Migration transaction committed")
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
