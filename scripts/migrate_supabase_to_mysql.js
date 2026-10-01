/**
 * ============================================================
 *  Supabase (PostgreSQL) → Hostinger MySQL  —  Data Migrator
 * ============================================================
 *
 * HOW TO USE:
 *  1. Fill in SUPABASE_DB_URL below (get from Supabase → Settings → Database → Connection string → URI)
 *  2. Run: node migrate_supabase_to_mysql.js
 *  3. A file "supabase_data_export.sql" will be created
 *  4. Import that file into Hostinger phpMyAdmin
 *
 * INSTALL DEPS FIRST (one time):
 *  npm install pg
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ============================================================
// ✏️  FILL IN YOUR SUPABASE CONNECTION STRING HERE
//    Supabase → Settings → Database → Connection string → URI
//    It looks like: postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
// ============================================================
const SUPABASE_DB_URL = 'postgresql://postgres:MikEWbgykvtyBiZoV@db.dyzjsykvziquqsadnqzu.supabase.co:5432/postgres';

// ============================================================
//  Tables to migrate (in correct foreign-key order)
// ============================================================
const TABLES_IN_ORDER = [
  'merchants',
  'merchant_users',
  'membership_types',
  'offer_templates',
  'membership_type_offers',
  'members',
  'member_offer_state',
  'redemption_log',
  'reminder_rules',
  'campaigns',
  'message_log',
  'admin_audit_log',
  'card_inventory',
  'loyalty_transactions',
  'reward_catalog',
  'reward_claims',
  'coupon_codes',
  'gift_vouchers',
  'points_rules',
  'scratch_cards',
  'lucky_draws',
  'lucky_draw_entries',
  'member_feedback',
  'merchant_wallet_classes',
  'member_wallet_passes',
  'idempotency_records',
  'event_logs',
  'otp_codes',
  'deals_categories',
  'deals_cities',
  'deals_brands',
  'deals_deals',
  'deals_admin_users',
  'deals_click_log',
  'tier_configs',
  'member_tiers',
  'visit_streaks',
  'challenges',
  'challenge_progress',
  'points_expiry_rules',
  'member_reviews',
  'member_consents',
  'pii_access_log',
  'erasure_requests',
  'correction_requests',
];

const OUTPUT_FILE = path.join(__dirname, 'supabase_data_export.sql');

// ============================================================
//  Helper: escape a value for MySQL INSERT
// ============================================================
function mysqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return val.toString();
  if (val instanceof Date) return "'" + val.toISOString().slice(0, 23).replace('T', ' ') + "'";
  if (typeof val === 'object') {
    return "'" + JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0');
  return "'" + str + "'";
}

// ============================================================
//  Main migration logic
// ============================================================
async function migrate() {
  const client = new Client({
    host: 'db.dyzjsykvziquqsadnqzu.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'MikEWbgykvtyBiZoV',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    family: 6,  // Force IPv6
  });

  console.log('Connecting to Supabase...');
  await client.connect();
  console.log('Connected!\n');

  const lines = [];
  lines.push('-- ============================================================');
  lines.push('-- Supabase to Hostinger MySQL Data Export');
  lines.push('-- Generated: ' + new Date().toISOString());
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS=0;');
  lines.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
  lines.push('SET time_zone="+00:00";');
  lines.push('');

  let totalRows = 0;
  const skipped = [];

  for (const table of TABLES_IN_ORDER) {
    process.stdout.write('Exporting table: ' + table + ' ... ');

    let rows;
    try {
      const result = await client.query('SELECT * FROM "' + table + '" LIMIT 100000');
      rows = result.rows;
    } catch (err) {
      console.log('SKIPPED (not found: ' + err.message.split('\n')[0] + ')');
      skipped.push(table);
      continue;
    }

    if (rows.length === 0) {
      console.log('0 rows (skipping)');
      continue;
    }

    console.log(rows.length + ' rows');
    totalRows += rows.length;

    lines.push('-- Table: ' + table + '  (' + rows.length + ' rows)');
    lines.push('TRUNCATE TABLE `' + table + '`;');
    lines.push('');

    const columns = Object.keys(rows[0]).map(c => '`' + c + '`').join(', ');

    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const valueRows = batch.map(row =>
        '(' + Object.values(row).map(mysqlEscape).join(', ') + ')'
      );
      lines.push('INSERT INTO `' + table + '` (' + columns + ') VALUES');
      lines.push(valueRows.join(',\n') + ';');
      lines.push('');
    }
  }

  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  lines.push('-- Export complete. Total rows: ' + totalRows);

  await client.end();

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');

  console.log('\n========================================');
  console.log('DONE! Total rows exported: ' + totalRows);
  console.log('Output file: ' + OUTPUT_FILE);
  if (skipped.length > 0) {
    console.log('Skipped tables: ' + skipped.join(', '));
  }
  console.log('\nNEXT STEP:');
  console.log('1. Import mysql_master_schema.sql in phpMyAdmin (creates tables)');
  console.log('2. Import supabase_data_export.sql in phpMyAdmin (inserts your data)');
  console.log('========================================');
}

migrate().catch(err => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
