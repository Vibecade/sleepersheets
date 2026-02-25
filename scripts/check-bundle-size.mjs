import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');

const toBytes = (kb) => Number(kb) * 1024;
const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)}kb`;

const BUDGETS = {
  entryJs: toBytes(process.env.BUDGET_ENTRY_JS_KB ?? 950),
  asyncJs: toBytes(process.env.BUDGET_ASYNC_JS_KB ?? 500),
  css: toBytes(process.env.BUDGET_CSS_KB ?? 300),
  totalJs: toBytes(process.env.BUDGET_TOTAL_JS_KB ?? 3200),
};

if (!fs.existsSync(assetsDir)) {
  console.error('Bundle budget check failed: dist/assets not found. Run build first.');
  process.exit(1);
}

const assets = fs.readdirSync(assetsDir).map((file) => {
  const fullPath = path.join(assetsDir, file);
  const stat = fs.statSync(fullPath);
  return {
    file,
    bytes: stat.size,
  };
});

const jsAssets = assets.filter((asset) => asset.file.endsWith('.js'));
const cssAssets = assets.filter((asset) => asset.file.endsWith('.css'));

if (jsAssets.length === 0) {
  console.error('Bundle budget check failed: no JS assets found in dist/assets.');
  process.exit(1);
}

const entryCandidates = jsAssets
  .filter((asset) => /^index-[\w-]+\.js$/.test(asset.file))
  .sort((a, b) => b.bytes - a.bytes);

const entryAsset = entryCandidates[0] ?? [...jsAssets].sort((a, b) => b.bytes - a.bytes)[0];

const asyncAssets = jsAssets.filter((asset) => asset.file !== entryAsset.file);
const totalJsBytes = jsAssets.reduce((total, asset) => total + asset.bytes, 0);

const failures = [];

if (entryAsset.bytes > BUDGETS.entryJs) {
  failures.push(
    `Entry JS ${entryAsset.file} is ${formatKb(entryAsset.bytes)} (limit ${formatKb(BUDGETS.entryJs)}).`
  );
}

for (const asset of asyncAssets) {
  if (asset.bytes > BUDGETS.asyncJs) {
    failures.push(
      `Async JS ${asset.file} is ${formatKb(asset.bytes)} (limit ${formatKb(BUDGETS.asyncJs)}).`
    );
  }
}

for (const asset of cssAssets) {
  if (asset.bytes > BUDGETS.css) {
    failures.push(
      `CSS ${asset.file} is ${formatKb(asset.bytes)} (limit ${formatKb(BUDGETS.css)}).`
    );
  }
}

if (totalJsBytes > BUDGETS.totalJs) {
  failures.push(
    `Total JS is ${formatKb(totalJsBytes)} (limit ${formatKb(BUDGETS.totalJs)}).`
  );
}

console.log('Bundle budget summary');
console.log(`- Entry JS: ${entryAsset.file} (${formatKb(entryAsset.bytes)})`);
console.log(`- Async JS files: ${asyncAssets.length}`);
console.log(`- CSS files: ${cssAssets.length}`);
console.log(`- Total JS: ${formatKb(totalJsBytes)}`);

if (failures.length > 0) {
  console.error('\nPerformance budget exceeded:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Bundle budgets passed.');
