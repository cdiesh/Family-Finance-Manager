from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Force simple string if not loaded correctly
DB_URL = "postgresql://postgres:Jennifer52891!@136.115.56.180/postgres"

print(f"Connecting to: {DB_URL}...")
try:
    engine = create_engine(DB_URL)
    connection = engine.connect()
    print("✅ SUCCESS: Connected to Google Cloud SQL!")
    
    # Check version
    result = connection.execute(text("SELECT version()"))
    print(f"Database Version: {result.fetchone()[0]}")
    
    connection.close()
except Exception as e:
    print(f"❌ FAILED: {e}")
