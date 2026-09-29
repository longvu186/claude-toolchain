// Visit every reachable page for a role (sidebar + in-page tab/record links), one at a time.
import { open, BASE } from './common.mjs';

const role = process.argv[2] || 'Company User';
const extra = (process.env.EXTRA || '').split(',').filter(Boolean);
const { browser, page } = await open();
await page.goto(BASE + '/login');
await page.getByRole('button', { name: 'Sign in as ' + role }).click();
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 });
await page.waitForLoadState('networkidle');

const seen = new Set();
const queue = [new URL(page.url()).pathname + new URL(page.url()).search, ...extra];
const skip = /\/(login|logout|sign-?out|api\/|_next)|\.(pdf|docx|zip)$|download|delete|cancel/i;
const MAX = Number(process.env.MAX || 45);
const perPrefix = new Map();

while (queue.length && seen.size < MAX) {
  const href = queue.shift();
  if (seen.has(href) || skip.test(href)) continue;
  // cap records per route shape so we sample page types, not every record
  const shape = href.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ':id').replace(/\?.*$/, (q) => q.replace(/=[^&]*/g, '='));
  const n = perPrefix.get(shape) || 0;
  if (n >= 2) continue;
  perPrefix.set(shape, n + 1);
  seen.add(href);
  const t = Date.now();
  let status = 0;
  try {
    const r = await page.goto(BASE + href, { waitUntil: 'networkidle', timeout: 45000 });
    status = r?.status() ?? 0;
  } catch (e) { status = -1; }
  console.log(`${status} ${Date.now() - t}ms ${href}`);
  const links = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')));
  for (const l of links) if (l && !seen.has(l)) queue.push(l);
  await page.waitForTimeout(400);
}
await browser.close();
