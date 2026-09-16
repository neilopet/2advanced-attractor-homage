import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeBasePath } from '../lib/base-path.ts';

const vinextCli = fileURLToPath(
  new URL('../node_modules/vinext/dist/cli.js', import.meta.url),
);
const result = spawnSync(process.execPath, [vinextCli, 'build'], {
  env: { ...process.env, BUILD_TARGET: 'static' },
  stdio: 'inherit',
});

if (result.error) throw result.error;
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

const clientDir = path.resolve('dist/client');
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

function removeEmptyParents(directory) {
  let current = directory;
  while (current !== clientDir) {
    try {
      fs.rmdirSync(current);
    } catch {
      return;
    }
    current = path.dirname(current);
  }
}

function movePrefixedFrameworkAssets() {
  if (!basePath) return;

  const prefixDirectory = path.join(clientDir, ...basePath.slice(1).split('/'));
  const source = path.join(prefixDirectory, '_next');
  const destination = path.join(clientDir, '_next');
  if (!fs.existsSync(source)) {
    throw new Error(`Static export did not produce ${path.relative('.', source)}`);
  }
  if (fs.existsSync(destination)) {
    throw new Error(
      `Refusing to overwrite an existing ${path.relative('.', destination)}`,
    );
  }
  fs.renameSync(source, destination);
  removeEmptyParents(prefixDirectory);
}

function resolveOutputFile(url) {
  const withoutQuery = url.split(/[?#]/, 1)[0];
  if (!withoutQuery || !withoutQuery.startsWith('/')) return null;
  if (
    basePath &&
    withoutQuery !== basePath &&
    !withoutQuery.startsWith(`${basePath}/`)
  ) {
    throw new Error(`Static HTML URL is outside configured basePath: ${url}`);
  }
  const localPath = basePath
    ? withoutQuery.slice(basePath.length)
    : withoutQuery;
  const relativePath = decodeURIComponent(localPath).replace(/^\/+/, '');
  const candidate = relativePath
    ? path.join(clientDir, relativePath)
    : path.join(clientDir, 'index.html');
  const resolvedCandidate = path.resolve(candidate);
  const resolvedClientDir = path.resolve(clientDir);
  if (
    resolvedCandidate !== resolvedClientDir &&
    !resolvedCandidate.startsWith(`${resolvedClientDir}${path.sep}`)
  ) {
    throw new Error(`Static HTML URL escapes the artifact directory: ${url}`);
  }
  if (fs.existsSync(resolvedCandidate) && fs.statSync(resolvedCandidate).isFile())
    return resolvedCandidate;
  if (fs.existsSync(resolvedCandidate)) {
    const index = path.join(resolvedCandidate, 'index.html');
    if (fs.existsSync(index) && fs.statSync(index).isFile()) return index;
  }
  return resolvedCandidate;
}

function validateIndexAssetUrls() {
  const indexPath = path.join(clientDir, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error('Static export did not produce index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const urls = /\b(?:src|href|poster)=["']([^"']+)["']/g;
  const missing = [];
  for (const match of html.matchAll(urls)) {
    const url = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) continue;
    const outputFile = resolveOutputFile(url);
    if (!outputFile) continue;
    if (fs.existsSync(outputFile) && fs.statSync(outputFile).isFile()) continue;
    missing.push(path.relative(clientDir, outputFile));
  }
  if (missing.length > 0) {
    throw new Error(
      `Static HTML references missing artifact files: ${missing.join(', ')}`,
    );
  }
}

movePrefixedFrameworkAssets();
validateIndexAssetUrls();
console.log('Static artifact check passed: index.html URLs resolve within dist/client.');
