const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const VAULT_DIR = path.join(__dirname, '../public/materials');
const OUTPUT_FILE = path.join(__dirname, '../src/data/vault.json');
const BASE_URL = '/Course-factoryPERFECT'; // Must match vite.config.js base

// Ensure directories exist
if (!fs.existsSync(VAULT_DIR)) {
  console.log(`[VAULT] Creating vault directory at: ${VAULT_DIR}`);
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// Ensure output directory exists
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(OUTPUT_DIR)) {
  console.log(`[VAULT] Creating data directory at: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const toPosixPath = (value) => String(value || '').replace(/\\/g, '/');

const getSmartTitle = (filename) => {
  // 1. Remove extension
  let name = filename.replace(/\.[^/.]+$/, '');

  // 2. Replace underscores/hyphens with spaces
  name = name.replace(/[-_]/g, ' ');

  // 3. Capitalize Words
  return name.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
};

const makeStableId = (relativePosixPath) => {
  const clean = toPosixPath(relativePosixPath).replace(/^\/+/, '');
  const hash = crypto.createHash('sha1').update(clean).digest('hex').slice(0, 12);
  return `vault-${hash}`;
};

const walkFiles = (dir, baseDir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  entries.forEach((entry) => {
    if (!entry || !entry.name || entry.name.startsWith('.')) return;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, baseDir));
      return;
    }
    if (!entry.isFile()) return;

    const stats = fs.statSync(fullPath);
    const rel = path.relative(baseDir, fullPath);
    const relPosix = toPosixPath(rel);
    const filename = path.basename(fullPath);

    results.push({
      id: makeStableId(relPosix),
      filename,
      path: `${BASE_URL}/materials/${relPosix}`,
      title: getSmartTitle(filename),
      type: path.extname(filename).toLowerCase().replace('.', ''),
      size: (stats.size / 1024).toFixed(1) + ' KB',
      date: stats.mtime.toISOString().split('T')[0],
    });
  });

  return results;
};

const scanVault = () => {
  console.log('[VAULT] Scanning public/materials for assets...');

  try {
    const assets = walkFiles(VAULT_DIR, VAULT_DIR);
    assets.sort((a, b) => toPosixPath(a.path || '').localeCompare(toPosixPath(b.path || '')));

    const data = {
      lastUpdated: new Date().toISOString(),
      count: assets.length,
      files: assets,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`[VAULT] Index updated: ${assets.length} items.`);
    console.log(`[VAULT] Saved to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('[VAULT] Error scanning vault:', err);
  }
};

scanVault();
