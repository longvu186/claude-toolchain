#!/usr/bin/env node
// Deterministic parallel frame renderer for any HTML page that implements the frame contract:
//   window.ready        -> Promise resolved once fonts/assets are loaded
//   window.FRAMES       -> total frame count (optional if --to is given)
//   window.renderFrame(f) -> PNG base64 string of frame f (pure function of f)
// Usage: node render-frames.mjs <projectDir> [--out frames] [--from 0] [--to N] [--workers 4] [--w 1920 --h 1080]
// Serves <projectDir> over http (fonts need http, not file://). Resolves playwright-core and
// chrome-headless-shell automatically; override with PLAYWRIGHT_CORE=<dir> / CHROME_PATH=<binary>.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const dir = path.resolve(argv[0] || '.');
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const outDir = path.resolve(dir, opt('out', 'frames'));
const workers = Number(opt('workers', Math.max(1, Math.min(6, os.cpus().length - 1))));
const W = Number(opt('w', 1920)), H = Number(opt('h', 1080));

function resolvePlaywright() {
  if (process.env.PLAYWRIGHT_CORE) return createRequire(import.meta.url)(path.resolve(process.env.PLAYWRIGHT_CORE));
  for (const base of [process.cwd(), dir]) {
    try { return createRequire(path.join(base, 'x.js'))('playwright-core'); } catch {}
  }
  // Fallback: any pnpm store copy inside ~/projects/*
  const root = path.join(os.homedir(), 'projects');
  for (const p of fs.existsSync(root) ? fs.readdirSync(root) : []) {
    const pnpm = path.join(root, p, 'node_modules', '.pnpm');
    if (!fs.existsSync(pnpm)) continue;
    const hit = fs.readdirSync(pnpm).filter(d => d.startsWith('playwright-core@')).sort().pop();
    if (hit) return createRequire(path.join(pnpm, hit, 'node_modules', 'playwright-core', 'x.js'))('playwright-core');
  }
  throw new Error('playwright-core not found; set PLAYWRIGHT_CORE=<path to playwright-core package dir>');
}
function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  const shells = (fs.existsSync(cache) ? fs.readdirSync(cache) : [])
    .filter(d => d.startsWith('chromium_headless_shell-'))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    .map(d => path.join(cache, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'))
    .filter(p => fs.existsSync(p));
  if (!shells.length) throw new Error('no chrome-headless-shell in ~/.cache/ms-playwright; set CHROME_PATH');
  return shells[0];
}

const { chromium } = resolvePlaywright();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const p = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(dir + path.sep) || !fs.existsSync(p) || !fs.statSync(p).isFile()) { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const url = `http://127.0.0.1:${srv.address().port}/index.html`;

const browser = await chromium.launch({ executablePath: resolveChrome(), args: ['--disable-gpu'] });
fs.mkdirSync(outDir, { recursive: true });
let failed = null, done = 0;
const probe = await browser.newPage({ viewport: { width: W, height: H } });
await probe.goto(url); await probe.evaluate(() => window.ready);
const total = await probe.evaluate(() => window.FRAMES);
await probe.close();
const from = Number(opt('from', 0)), to = Number(opt('to', total));
if (!Number.isFinite(to) || to <= from) throw new Error('frame range unknown: pass --to or define window.FRAMES');
const frames = Array.from({ length: to - from }, (_, i) => from + i);
const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => { failed = e; });
  await page.goto(url); await page.evaluate(() => window.ready);
  for (let k = w; k < frames.length && !failed; k += workers) {
    const f = frames[k];
    const b64 = await page.evaluate(f => window.renderFrame(f), f);
    if (!b64 || b64.length < 100) { failed = new Error(`frame ${f} returned empty image`); break; }
    fs.writeFileSync(path.join(outDir, `f_${String(f).padStart(4, '0')}.png`), Buffer.from(b64, 'base64'));
    if (++done % 50 === 0) console.log(`${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}));
await browser.close(); srv.close();
if (failed) { console.error('RENDER FAILED:', failed); process.exit(1); }
console.log(`rendered ${done} frames (${from}..${to - 1}) to ${outDir} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
