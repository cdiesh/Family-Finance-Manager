from sqlalchemy import text
from database import engine

def migrate_postgres():
    print("Connecting to Postgres...")
    with engine.connect() as conn:
        print("Checking/Adding columns...")
        
        # We wrap in try/catch blocks or just execute 'ADD COLUMN IF NOT EXISTS'
        # Postgres 9.6+ supports IF NOT EXISTS for columns
        
        commands = [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags VARCHAR;"
        ]
        
        for cmd in commands:
            try:
                print(f"Executing: {cmd}")
                conn.execute(text(cmd))
                print("Success.")
            except Exception as e:
                print(f"Error (might already exist): {e}")
                
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate_postgres()
