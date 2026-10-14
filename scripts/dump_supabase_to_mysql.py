"""
Metro Cardz — Supabase → Hostinger MySQL Migration Script
===========================================================
This script connects to your OLD Supabase PostgreSQL database,
reads ALL data from every table, and generates a MySQL-compatible
INSERT SQL file you can run on Hostinger.

SETUP:
  1. Install dependencies:
     pip install psycopg2-binary python-dotenv

  2. Set your Supabase DB connection string in the SUPABASE_DB_URL variable below.
     Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     Example: postgresql://postgres:mypassword@db.dyzjsykvziquqsadnqzu.supabase.co:5432/postgres

  3. Run:
     cd c:\\work\\metrocard - Copy
     python scripts/dump_supabase_to_mysql.py

  4. This will generate:  supabase_to_mysql_import.sql
     Import it on Hostinger via hPanel -> phpMyAdmin -> Import

NOTES:
  - All boolean values are converted: true=1, false=0
  - NULL values are preserved
  - TIMESTAMPTZ -> DATETIME (UTC timezone stripped)
  - JSON columns preserved as-is (MySQL JSON type supported)
  - Text is properly escaped for MySQL
"""

import psycopg2
import psycopg2.extras
import json
import re
from datetime import datetime, date, timezone
from decimal import Decimal

# -------------------------------------------------------------------------
# CONFIGURE THESE:
# -------------------------------------------------------------------------

SUPABASE_DB_URL = (
    "postgresql://postgres:MikEWbgykvtyBiZoV@db.dyzjsykvziquqsadnqzu.supabase.co:5432/postgres"
)

OUTPUT_FILE = "supabase_to_mysql_import.sql"

# All 27 tables in dependency order (parents before children)
TABLES_IN_ORDER = [
    "merchants",
    "merchant_users",
    "membership_types",
    "offer_templates",
    "membership_type_offers",
    "members",
    "member_offer_state",
    "redemption_log",
    "loyalty_transactions",
    "campaigns",
    "reminder_rules",
    "message_log",
    "card_inventory",
    "admin_audit_log",
    "reward_catalog",
    "reward_claims",
    "coupon_codes",
    "gift_vouchers",
    "points_rules",
    "scratch_cards",
    "lucky_draws",
    "lucky_draw_entries",
    "member_feedback",
    "idempotency_records",
    "merchant_wallet_classes",
    "member_wallet_passes",
    "event_logs",
]

# -------------------------------------------------------------------------


def escape_mysql_string(value):
    """Escape a string value for MySQL INSERT."""
    if value is None:
        return "NULL"
    value = str(value)
    value = value.replace("\\", "\\\\")
    value = value.replace("'", "\\'")
    value = value.replace("\n", "\\n")
    value = value.replace("\r", "\\r")
    value = value.replace("\x00", "\\0")
    return f"'{value}'"


def convert_value(val):
    """Convert a Python value to MySQL-compatible SQL string."""
    if val is None:
        return "NULL"
    elif isinstance(val, bool):
        return "1" if val else "0"
    elif isinstance(val, (int, float, Decimal)):
        return str(val)
    elif isinstance(val, datetime):
        if val.tzinfo is not None:
            val = val.astimezone(timezone.utc).replace(tzinfo=None)
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
    elif isinstance(val, date):
        return f"'{val.strftime('%Y-%m-%d')}'"
    elif isinstance(val, dict) or isinstance(val, list):
        return escape_mysql_string(json.dumps(val, ensure_ascii=False))
    else:
        return escape_mysql_string(val)


def dump_table(cursor, table_name):
    """Fetch all rows from a table and return MySQL INSERT statements."""
    try:
        cursor.execute(f'SELECT * FROM "{table_name}"')
    except Exception as e:
        print(f"  WARNING: Could not read table '{table_name}': {e}")
        return []

    rows = cursor.fetchall()
    if not rows:
        print(f"  INFO: Table '{table_name}' -- 0 rows (skipped)")
        return []

    col_names = [desc[0] for desc in cursor.description]
    print(f"  OK: Table '{table_name}' -- {len(rows)} rows")

    statements = []
    col_list = ", ".join(f"`{c}`" for c in col_names)

    for row in rows:
        values = ", ".join(convert_value(v) for v in row)
        stmt = f"INSERT IGNORE INTO `{table_name}` ({col_list}) VALUES ({values});"
        statements.append(stmt)

    return statements


def main():
    print("=" * 65)
    print("  Metro Cardz -- Supabase to MySQL Migration")
    print("=" * 65)
    print(f"\nConnecting to Supabase...")
    print()

    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connected to Supabase PostgreSQL!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        print("\nCheck your SUPABASE_DB_URL at the top of this script.")
        print("Make sure your IP is allowed in Supabase -> Settings -> Database")
        return

    all_lines = []

    all_lines.append("-- ============================================================")
    all_lines.append("-- Metro Cardz -- Supabase to Hostinger MySQL Data Import")
    all_lines.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    all_lines.append("-- ============================================================")
    all_lines.append("")
    all_lines.append("SET FOREIGN_KEY_CHECKS=0;")
    all_lines.append("SET NAMES utf8mb4;")
    all_lines.append("SET CHARACTER SET utf8mb4;")
    all_lines.append("")

    total_rows = 0

    for table in TABLES_IN_ORDER:
        all_lines.append(f"-- Table: {table}")
        stmts = dump_table(cursor, table)
        if stmts:
            all_lines.extend(stmts)
            total_rows += len(stmts)
        all_lines.append("")

    all_lines.append("SET FOREIGN_KEY_CHECKS=1;")
    all_lines.append("")
    all_lines.append(f"-- Import complete -- {total_rows} total rows")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(all_lines))

    cursor.close()
    conn.close()

    print(f"\n{'=' * 65}")
    print(f"DONE! {total_rows} total rows exported.")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"\nHOW TO IMPORT TO HOSTINGER:")
    print(f"  1. Go to hPanel -> Databases -> phpMyAdmin")
    print(f"  2. Select your database: u446352478_metrocardz")
    print(f"  3. Click 'Import' tab")
    print(f"  4. Upload: {OUTPUT_FILE}")
    print(f"  5. Click 'Go'")
    print(f"{'=' * 65}")


if __name__ == "__main__":
    main()
