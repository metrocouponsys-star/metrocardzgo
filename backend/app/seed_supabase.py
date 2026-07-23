"""
Metro Cardz — Supabase Production Database Seeder
Executes the SQL seed statements directly against Supabase PostgreSQL.

Usage:
  cd c:\\work\\metrocard\\backend
  .\\venv\\Scripts\\Activate.ps1
  python -m app.seed_supabase
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def seed_supabase():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "supabase" not in db_url.lower():
        print("⚠️ DATABASE_URL not pointing to Supabase or not found in backend/.env.")
        print("💡 You can copy-paste c:\\work\\metrocard\\SUPABASE_DEMO_SEED.sql directly into Supabase SQL Editor!")
        return

    print(f"Connecting to Supabase PostgreSQL...")
    engine = create_engine(db_url)
    
    sql_filepath = os.path.join(os.path.dirname(__file__), "..", "..", "SUPABASE_DEMO_SEED.sql")
    if not os.path.exists(sql_filepath):
        print(f"❌ SQL file not found at {sql_filepath}")
        return

    with open(sql_filepath, "r", encoding="utf-8") as f:
        sql_script = f.read()

    with engine.begin() as conn:
        conn.execute(text(sql_script))
        print("✅ Successfully executed SUPABASE_DEMO_SEED.sql against Supabase PostgreSQL database!")

if __name__ == "__main__":
    seed_supabase()
