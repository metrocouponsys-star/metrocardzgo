/**
 * ============================================================
 *  CSV → MySQL SQL Converter  (v2 — handles multi-line fields)
 *  Reads all CSV files from ../data/ and generates
 *  one big "all_data_import.sql" ready for phpMyAdmin
 * ============================================================
 *  Run: node csv_to_mysql.js
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const OUTPUT_SQL = path.join(DATA_DIR, 'all_data_import.sql');

// ─────────────────────────────────────────────────────────────
//  Map: CSV filename  →  MySQL table name  (in FK-safe order)
// ─────────────────────────────────────────────────────────────
const FILE_TO_TABLE = [
  { file: 'merchants_rows.csv',              table: 'merchants' },
  { file: 'merchant_users_rows.csv',         table: 'merchant_users' },
  { file: 'membership_types_rows.csv',       table: 'membership_types' },
  { file: 'offer_templates_rows.csv',        table: 'offer_templates' },
  { file: 'membership_type_offers_rows.csv', table: 'membership_type_offers' },
  { file: 'members_rows.csv',                table: 'members' },
  { file: 'member_offer_state_rows.csv',     table: 'member_offer_state' },
  { file: 'redemption_log_rows.csv',         table: 'redemption_log' },
  { file: 'reminder_rules_rows.csv',         table: 'reminder_rules' },
  { file: 'loyalty_transactions_rows.csv',   table: 'loyalty_transactions' },
  { file: 'reward_catalog_rows.csv',         table: 'reward_catalog' },
  { file: 'reward_claims_rows.csv',          table: 'reward_claims' },
  { file: 'coupon_codes_rows.csv',           table: 'coupon_codes' },
  { file: 'gift_vouchers_rows.csv',          table: 'gift_vouchers' },
  { file: 'points_rules_rows.csv',           table: 'points_rules' },
  { file: 'card_inventory_rows.csv',         table: 'card_inventory' },
  { file: 'merchant_wallet_classes_rows.csv',table: 'merchant_wallet_classes' },
  { file: 'member_wallet_passes_rows.csv',   table: 'member_wallet_passes' },
  { file: 'event_logs_rows.csv',             table: 'event_logs' },
  { file: 'admin_audit_log_rows.csv',        table: 'admin_audit_log' },
];

// ─────────────────────────────────────────────────────────────
//  Parse ENTIRE CSV content (handles newlines inside quoted fields)
//  Returns array of rows, each row is array of field strings
// ─────────────────────────────────────────────────────────────
function parseCSV(content) {
  const rows  = [];
  let row     = [];
  let cur     = '';
  let inQ     = false;

  for (let i = 0; i < content.length; i++) {
    const ch   = content[i];
    const next = content[i + 1];

    if (inQ) {
      if (ch === '"' && next === '"') {
        // Escaped quote inside quoted field
        cur += '"';
        i++;
      } else if (ch === '"') {
        // End of quoted field
        inQ = false;
      } else {
        cur += ch;  // newlines inside quoted fields are kept as-is
      }
    } else {
      if (ch === '"') {
        inQ = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\r' && next === '\n') {
        // Windows line ending
        row.push(cur);
        cur = '';
        rows.push(row);
        row = [];
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cur);
        cur = '';
        rows.push(row);
        row = [];
      } else {
        cur += ch;
      }
    }
  }
  // Last field / row
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    if (row.some(f => f !== '')) rows.push(row);
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────
//  Escape a single field value for MySQL
// ─────────────────────────────────────────────────────────────
function escape(val) {
  if (val === '' || val === null || val === undefined) return 'NULL';
  const lower = val.toLowerCase().trim();
  if (lower === 'null') return 'NULL';
  if (lower === 'true')  return '1';
  if (lower === 'false') return '0';
  const s = val
    .replace(/\\/g, '\\\\')
    .replace(/'/g,  "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0');
  return "'" + s + "'";
}

// ─────────────────────────────────────────────────────────────
//  Convert one CSV file → array of INSERT statement strings
// ─────────────────────────────────────────────────────────────
function csvToInserts(filePath, tableName) {
  const raw    = fs.readFileSync(filePath, 'utf8');
  const allRows = parseCSV(raw);

  if (allRows.length < 2) return { inserts: [], count: 0 };

  const headers  = allRows[0];
  const dataRows = allRows.slice(1).filter(r => r.length === headers.length);
  const skipped  = allRows.slice(1).length - dataRows.length;

  if (skipped > 0) {
    console.log('    ⚠ ' + skipped + ' rows skipped (column count mismatch) in ' + tableName);
  }

  const cols    = headers.map(h => '`' + h.trim() + '`').join(', ');
  const inserts = [];
  const BATCH   = 50;

  for (let i = 0; i < dataRows.length; i += BATCH) {
    const chunk  = dataRows.slice(i, i + BATCH);
    const values = chunk.map(row =>
      '(' + row.map(escape).join(', ') + ')'
    );
    inserts.push(
      'INSERT IGNORE INTO `' + tableName + '` (' + cols + ') VALUES\n' +
      values.join(',\n') + ';'
    );
  }

  return { inserts, count: dataRows.length };
}

// ─────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────
function main() {
  console.log('Starting CSV → MySQL conversion (v2 — multi-line safe)...\n');
  const out = [];

  out.push('-- ================================================================');
  out.push('-- Metro Cardz — All Data Import (from Supabase CSV export)');
  out.push('-- Generated: ' + new Date().toISOString());
  out.push('-- INSERT IGNORE used: duplicate rows are skipped safely');
  out.push('-- ================================================================');
  out.push('');
  out.push('SET FOREIGN_KEY_CHECKS=0;');
  out.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
  out.push('SET NAMES utf8mb4;');
  out.push('');

  let totalRows = 0;
  const skipped = [];

  for (const { file, table } of FILE_TO_TABLE) {
    const filePath = path.join(DATA_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log('  SKIP  ' + file + ' (file not found)');
      skipped.push(file);
      continue;
    }

    const { inserts, count } = csvToInserts(filePath, table);

    if (count === 0) {
      console.log('  SKIP  ' + file + ' (0 data rows)');
      continue;
    }

    console.log('  OK    ' + file + ' → ' + table + ' (' + count + ' rows)');
    totalRows += count;

    out.push('-- ── ' + table + ' (' + count + ' rows) ──────────────');
    out.push('');
    inserts.forEach(ins => { out.push(ins); out.push(''); });
  }

  out.push('SET FOREIGN_KEY_CHECKS=1;');
  out.push('-- Total rows: ' + totalRows);

  fs.writeFileSync(OUTPUT_SQL, out.join('\n'), 'utf8');

  console.log('\n========================================================');
  console.log('DONE!  Total rows: ' + totalRows);
  console.log('Output: ' + OUTPUT_SQL);
  if (skipped.length) console.log('Missing files: ' + skipped.join(', '));
  console.log('\nNEXT: Import all_data_import.sql in phpMyAdmin (charset utf-8)');
  console.log('========================================================');
}

main();
