import fs from 'fs';
import path from 'path';

const realClientPath = path.resolve(process.cwd(), 'src/api/realClient.ts');
const apiDir = path.resolve(process.cwd(), 'src/app/api/v1');

const content = fs.readFileSync(realClientPath, 'utf8');

// Find all API endpoints requested in realClient.ts
// Format is usually `/endpoint` or `${API}/endpoint`
const regex = /(?:get|post|patch|del|request)(?:<[^>]+>)?\(\s*(?:'[^']+'|"[^"]+",)?\s*[`'"](\/[^`'"]*)[`'"]/g;
const matches = [...content.matchAll(regex)];

const endpoints = new Set<string>();
for (const match of matches) {
  let endpoint = match[1];
  // If template contains conditional query param like ${m ? `?merchant_id=...` : ''}, strip from ${ onward if it contains '?'
  endpoint = endpoint.replace(/\$\{[^}]*\?[\s\S]*$/, '');
  // Strip query string first
  endpoint = endpoint.split('?')[0];
  // Replace route parameter variables like ${id} with [param]
  endpoint = endpoint.replace(/\$\{[^}]+\}/g, '[param]');
  endpoint = endpoint.replace(/\/+$/, '');
  if (endpoint.startsWith('/')) {
    endpoints.add(endpoint);
  }
}

console.log(`\n======================================================`);
console.log(`🔍 AUDITING REALCLIENT.TS ENDPOINTS VS ROUTE HANDLERS`);
console.log(`======================================================\n`);
console.log(`Found ${endpoints.size} unique endpoint patterns in realClient.ts\n`);

let missing = 0;
let verified = 0;

for (const ep of Array.from(endpoints).sort()) {
  // Check if matching directory with route.ts exists under app/src/app/api/v1
  // Clean leading slash
  const cleanEp = ep.replace(/^\//, '');
  const segments = cleanEp.split('/');

  // Check direct path or parameterized path
  let currentDir = apiDir;
  let exists = true;

  for (const seg of segments) {
    if (!fs.existsSync(currentDir)) {
      exists = false;
      break;
    }
    const children = fs.readdirSync(currentDir);
    // Check if seg matches or if there is a parameterized folder [id] or [token]
    if (children.includes(seg)) {
      currentDir = path.join(currentDir, seg);
    } else {
      const paramFolder = children.find(c => c.startsWith('[') && c.endsWith(']'));
      if (paramFolder) {
        currentDir = path.join(currentDir, paramFolder);
      } else {
        exists = false;
        break;
      }
    }
  }

  const routeFile = path.join(currentDir, 'route.ts');
  const routeExists = exists && fs.existsSync(routeFile);

  if (routeExists) {
    verified++;
    console.log(`  ✓ VERIFIED: /api/v1${ep}`);
  } else {
    missing++;
    console.log(`  ✗ MISSING:  /api/v1${ep} (No route.ts found)`);
  }
}

console.log(`\n------------------------------------------------------`);
console.log(`Summary: ${verified} Verified, ${missing} Missing`);
console.log(`======================================================\n`);

if (missing > 0) {
  process.exit(1);
}
