import sqlite3
import os

db_path = "test.db"
print("DB Path exists:", os.path.exists(db_path))
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("Tables found:", [r[0] for r in cursor.fetchall()])
    conn.close()
