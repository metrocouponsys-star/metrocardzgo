/**
 * Fix mysql_master_schema.sql:
 * Before every ADD CONSTRAINT line, insert a DROP FOREIGN KEY IF EXISTS line
 * so re-imports never fail with errno 121.
 */
const fs   = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'app', 'prisma', 'mysql_master_schema.sql');
const raw = fs.readFileSync(schemaPath, 'utf8');
const lines = raw.split(/\r?\n/);

const out = [];
for (const line of lines) {
  // Match:  ALTER TABLE `tbl` ADD CONSTRAINT `fkey_name` FOREIGN KEY ...
  const m = line.match(/ALTER TABLE `(\S+)` ADD CONSTRAINT `(\S+)` FOREIGN KEY/);
  if (m) {
    const tbl  = m[1];
    const fkey = m[2];
    // Inject a DROP IF EXISTS before the ADD
    out.push(`ALTER TABLE \`${tbl}\` DROP FOREIGN KEY IF EXISTS \`${fkey}\`;`);
  }
  out.push(line);
}

fs.writeFileSync(schemaPath, out.join('\n'), 'utf8');
console.log('Done! DROP FOREIGN KEY IF EXISTS lines added.');
// Verify
const addCount  = (out.join('\n').match(/ADD CONSTRAINT/g)  || []).length;
const dropCount = (out.join('\n').match(/DROP FOREIGN KEY IF EXISTS/g) || []).length;
console.log('ADD CONSTRAINT lines : ' + addCount);
console.log('DROP FK IF EXISTS lines: ' + dropCount);
