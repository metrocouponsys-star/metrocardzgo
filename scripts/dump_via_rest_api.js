/**
 * ============================================================
 *  Metro Cardz — Supabase REST API → MySQL Data Dumper
 * ============================================================
 *  Uses the Supabase REST API (HTTPS) — no direct DB connection needed.
 *  Works from any network. Dumps all tables via the PostgREST API.
 *
 *  USAGE:
 *    node scripts/dump_via_rest_api.js
 *
 *  OUTPUT:
 *    scripts/supabase_data_export.sql
 * ============================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================
//  CONFIG — Supabase project dyzjsykvziquqsadnqzu
// ============================================================
const SUPABASE_URL = 'https://dyzjsykvziquqsadnqzu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5empzeWt2emlxdXFzYWRucXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkzNzkxMCwiZXhwIjoyMDk5NTEzOTEwfQ.KV26W4YBrvQHVTKPQopqY4JcYmM3Xa6XooaxmttUVw4';  // <-- FILL THIS IN

// ============================================================
//  All tables in FK-safe dependency order
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
  'loyalty_transactions',
  'reminder_rules',
  'campaigns',
  'message_log',
  'admin_audit_log',
  'card_inventory',
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
const PAGE_SIZE = 1000;  // Supabase default max per request

// ============================================================
//  Helper: fetch one page of data from Supabase REST
// ============================================================
function fetchPage(table, offset) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
    url.searchParams.set('select', '*');
    url.searchParams.set('limit', PAGE_SIZE);
    url.searchParams.set('offset', offset);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 206) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error for table ${table}: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          resolve(null); // Table doesn't exist
        } else {
          reject(new Error(`HTTP ${res.statusCode} for table ${table}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${table} at offset ${offset}`));
    });
    req.end();
  });
}

// ============================================================
//  Helper: fetch ALL rows from a table (handles pagination)
// ============================================================
async function fetchAllRows(table) {
  let allRows = [];
  let offset = 0;

  while (true) {
    const rows = await fetchPage(table, offset);
    if (rows === null) return null;  // table doesn't exist
    if (!Array.isArray(rows) || rows.length === 0) break;
    allRows = allRows.concat(rows);
    if (rows.length < PAGE_SIZE) break;  // last page
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ============================================================
//  Helper: escape a value for MySQL INSERT
// ============================================================
function mysqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return val.toString();
  if (val instanceof Date) return "'" + val.toISOString().slice(0, 19).replace('T', ' ') + "'";
  if (typeof val === 'object') {
    const json = JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return "'" + json + "'";
  }
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0');
  return "'" + str + "'";
}

// ============================================================
//  Main
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('  Metro Cardz — Supabase REST API → MySQL Dump');
  console.log('='.repeat(60));
  console.log();

  if (SUPABASE_SERVICE_KEY === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    console.error('ERROR: Please set SUPABASE_SERVICE_KEY in this script!');
    console.error('');
    console.error('Get it from:');
    console.error('  Supabase Dashboard → Settings → API → service_role (secret)');
    console.error('');
    process.exit(1);
  }

  const lines = [];
  lines.push('-- ============================================================');
  lines.push('-- Metro Cardz — Supabase to Hostinger MySQL Data Import');
  lines.push('-- Generated: ' + new Date().toISOString());
  lines.push('-- Source: Supabase project dyzjsykvziquqsadnqzu (REST API dump)');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS=0;');
  lines.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
  lines.push('SET NAMES utf8mb4;');
  lines.push('SET time_zone="+00:00";');
  lines.push('');

  let totalRows = 0;
  const skipped = [];
  const exported = [];

  for (const table of TABLES_IN_ORDER) {
    process.stdout.write(`Fetching: ${table} ... `);

    let rows;
    try {
      rows = await fetchAllRows(table);
    } catch (err) {
      console.log(`ERROR: ${err.message.substring(0, 80)}`);
      skipped.push(table);
      continue;
    }

    if (rows === null) {
      console.log('NOT FOUND (skipped)');
      skipped.push(table);
      continue;
    }

    if (rows.length === 0) {
      console.log('0 rows (empty table)');
      lines.push(`-- Table: ${table} — 0 rows`);
      lines.push('');
      continue;
    }

    console.log(`${rows.length} rows`);
    totalRows += rows.length;
    exported.push(`${table} (${rows.length})`);

    lines.push(`-- ── Table: ${table}  (${rows.length} rows) ──────────────────`);
    lines.push('');

    const columns = Object.keys(rows[0]).map(c => '`' + c + '`').join(', ');

    // Batch inserts — 50 rows per INSERT for phpMyAdmin compatibility
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const valueRows = batch.map(row =>
        '  (' + Object.values(row).map(mysqlEscape).join(', ') + ')'
      );
      lines.push(`INSERT IGNORE INTO \`${table}\` (${columns}) VALUES`);
      lines.push(valueRows.join(',\n') + ';');
      lines.push('');
    }
  }

  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  lines.push('');
  lines.push(`-- ✅ Export complete — ${totalRows} total rows`);
  if (skipped.length > 0) {
    lines.push(`-- Skipped tables: ${skipped.join(', ')}`);
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');

  console.log();
  console.log('='.repeat(60));
  console.log(`DONE! Total rows exported: ${totalRows}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log();
  if (exported.length > 0) {
    console.log('Tables exported:');
    exported.forEach(t => console.log('  ' + t));
  }
  if (skipped.length > 0) {
    console.log();
    console.log('Skipped (not found or error):');
    skipped.forEach(t => console.log('  ' + t));
  }
  console.log();
  console.log('NEXT STEP: Import supabase_data_export.sql in Hostinger phpMyAdmin');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
