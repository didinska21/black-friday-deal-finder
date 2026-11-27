// Re-shoot the 4 make.fun screenshots as DIRECT headless-Chrome captures.
// No dependencies: drives Chrome over CDP with Node 22's built-in WebSocket,
// serves app/ with the repo's own serve.ts. No pixel post-processing anywhere:
// Page.captureScreenshot output is written to disk unchanged (JPEG q80).
// Usage: node shots.mjs  (run twice; hashes printed per run must match)
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.url.replace('file://', '').replace(/\/shots\.mjs$/, ''));
const PORT = 8123;
const CHROME = process.env.BF_CHROME ?? '/home/hatch/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';
const FALLBACK_CHROME = '/opt/meta-chromium/chrome';
const SHOTS = [
  { file: '1-cover-grid.jpg', path: '#/', width: 1280, height: 800, mobile: false },
  { file: '2-gaming-grid.jpg', path: '#/?category=Gaming', width: 1280, height: 800, mobile: false,
    scroll: `(() => { const c = document.querySelector('.deal-card'); if (c) window.scrollBy(0, c.getBoundingClientRect().bottom - window.innerHeight + 16); })()` },
  { file: '3-filtered.jpg', path: '#/?category=TVs&sort=saving', width: 1280, height: 800, mobile: false,
    scroll: `document.querySelectorAll('.deal-card')[3].scrollIntoView({block:'start'})` },
  { file: '4-phone.jpg', path: '#/', width: 390, height: 844, mobile: true,
    scroll: `(() => { const c = document.querySelector('[data-deal-id="michael-kors-bag"]'); c.scrollIntoView({block:'start'}); window.scrollBy(0, c.getBoundingClientRect().top); })()` },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error(`never came up: ${url}`);
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const chromeArgs = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=9222', '--user-data-dir=/tmp/bf-chrome-profile', '--hide-scrollbars', 'about:blank'];
let chrome = spawn(CHROME, chromeArgs, { stdio: 'ignore' });
try { await waitFor('http://127.0.0.1:9222/json/version', 25); }
catch {
  chrome.kill(); await sleep(500);
  chrome = spawn(FALLBACK_CHROME, chromeArgs, { stdio: 'ignore' });
  await waitFor('http://127.0.0.1:9222/json/version');
}
await waitFor(`http://127.0.0.1:${PORT}/`);

try {
  const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg.method);
};
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => pending.set(id, res));
}
async function waitEvent(name, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const i = events.indexOf(name);
    if (i !== -1) { events.splice(i, 1); return; }
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${name}`);
}

await send('Page.enable');
await send('Runtime.enable');
async function waitCards(minCount, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.deal-card').length`, returnByValue: true,
    });
    if ((r.result?.result?.value ?? 0) >= minCount) return;
    await sleep(150);
  }
  throw new Error('timeout waiting for deal cards');
}
const EXPECTED_CARDS = { '1-cover-grid.jpg': 57, '2-gaming-grid.jpg': 6, '3-filtered.jpg': 8, '4-phone.jpg': 57 };
for (const shot of SHOTS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: shot.mobile,
  });
  events.length = 0;
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${shot.path}` });
  await waitCards(EXPECTED_CARDS[shot.file]);
  await sleep(1200);
  const grid = await send('Runtime.evaluate', { expression: `!!document.querySelector('#deal-grid')`, returnByValue: true });
  if (!grid.result?.result?.value) throw new Error(`no #deal-grid on ${shot.file}`);
  if (shot.scroll) {
    await send('Runtime.evaluate', { expression: shot.scroll });
    await sleep(400);
  }
  const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  const buf = Buffer.from(snap.result.data, 'base64');
  const out = resolve(ROOT, 'screenshots', shot.file);
  writeFileSync(out, buf);
  const hash = createHash('sha256').update(buf).digest('hex');
  console.log(`${shot.file} ${buf.length} bytes sha256=${hash}${buf.length > 262144 ? ' OVER-256KiB!' : ''}`);
}
console.log('done');
} finally {
  try { ws.close(); } catch { /* already closed */ }
  chrome.kill();
  server.kill();
}
