import { access, readFile, symlink, unlink, writeFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { Eta } from 'eta';
import logSymbols from 'log-symbols';

import { loadDataset } from './dataset.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FORMULA_DIR = path.join(ROOT, 'Formula');
const ALIAS_DIR = path.join(ROOT, 'Aliases');
const TEMPLATE_DIR = path.join(__dirname, 'data');

const eta = new Eta({
  views: TEMPLATE_DIR,
  useWith: true,
  autoEscape: false,
  cache: true,
});

const { values, positionals } = parseArgs({
  options: {
    only: { type: 'string', multiple: true },
    add: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const versionFilter = new Set([
  ...((values.only ?? [])),
  ...positionals,
]);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isPrerelease(entry) {
  return entry.channel === 'prerelease';
}

function templateName(entry) {
  return `nsis@${entry.major}`;
}

function renderFormula(entry) {
  if (!entry.artifacts.sourceTarball) {
    return null;
  }
  return eta.render(templateName(entry), {
    version: entry.version,
    versionNoDot: entry.version.replace(/\./g, ''),
    sourceUrl: entry.artifacts.sourceTarball.url,
    sourceSha256: entry.artifacts.sourceTarball.hashes.sha256,
    zipUrl: entry.artifacts.zip.url,
    zipSha256: entry.artifacts.zip.hashes.sha256,
  });
}

async function writeIfChanged(filePath, content) {
  let existing = null;
  try {
    existing = await readFile(filePath, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (existing === content) return 'unchanged';
  await writeFile(filePath, content);
  return existing === null ? 'created' : 'updated';
}

async function ensureSymlink(linkPath, target) {
  let current = null;
  try {
    current = await readlink(linkPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (current === target) return 'unchanged';
  if (current !== null) await unlink(linkPath);
  await symlink(target, linkPath);
  return current === null ? 'created' : 'updated';
}

async function emitFormula(entry, stats, addMissing) {
  const content = renderFormula(entry);
  if (content === null) {
    console.warn(
      logSymbols.warning,
      `skip ${entry.version}: no source tarball available`,
    );
    stats.skipped += 1;
    return;
  }

  const formulaFile = path.join(FORMULA_DIR, `makensis@${entry.version}.rb`);

  if (!addMissing && !(await fileExists(formulaFile))) {
    stats.skipped += 1;
    return;
  }

  const formulaResult = await writeIfChanged(formulaFile, content);
  stats[formulaResult] += 1;
  if (formulaResult !== 'unchanged') {
    console.log(
      logSymbols.success,
      `${formulaResult}: ${path.relative(ROOT, formulaFile)}`,
    );
  }

  const aliasFile = path.join(ALIAS_DIR, `nsis@${entry.version}.rb`);
  const aliasTarget = path.join('..', 'Formula', `makensis@${entry.version}.rb`);
  const aliasResult = await ensureSymlink(aliasFile, aliasTarget);
  if (aliasResult !== 'unchanged') {
    console.log(
      logSymbols.success,
      `symlink ${aliasResult}: ${path.relative(ROOT, aliasFile)}`,
    );
  }
}

async function main() {
  const dataset = await loadDataset();
  const stats = { created: 0, updated: 0, unchanged: 0, skipped: 0 };

  const entries = Object.values(dataset.versions).filter(
    (e) =>
      !isPrerelease(e) &&
      e.artifacts.sourceTarball !== null &&
      (versionFilter.size === 0 || versionFilter.has(e.version)),
  );

  for (const entry of entries) {
    await emitFormula(entry, stats, values.add === true);
  }

  console.log(
    logSymbols.info,
    `${stats.created} created, ${stats.updated} updated, ${stats.unchanged} unchanged, ${stats.skipped} skipped`,
  );
}

main().catch((err) => {
  console.error(logSymbols.error, err);
  process.exit(1);
});
