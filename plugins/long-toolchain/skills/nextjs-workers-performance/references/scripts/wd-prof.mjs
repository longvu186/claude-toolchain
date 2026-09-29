// Attach to wrangler dev's inspector, profile a sequence of requests, write .cpuprofile.
import fs from 'node:fs';
const list = await (await fetch('http://127.0.0.1:9239/json')).json();
const target = list.find(t => t.webSocketDebuggerUrl) ;
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 });
const st = JSON.parse(fs.readFileSync('/tmp/perf/state-CompanyUser.json'));
const cookie = st.cookies.filter(c => c.name.startsWith('sb-')).map(c => `${c.name}=${c.value}`).join('; ');
const out = [];
for (const [i, p] of process.argv.slice(2).entries()) {
  await send('Profiler.start');
  const t = performance.now();
  const r = await fetch('http://127.0.0.1:8799' + p, { headers: { cookie }, redirect: 'manual' });
  const b = await r.arrayBuffer();
  const ms = performance.now() - t;
  const prof = (await send('Profiler.stop')).result.profile;
  fs.writeFileSync(`/tmp/perf/wd-${i}.cpuprofile`, JSON.stringify(prof));
  out.push(`${i} ${r.status} ${ms.toFixed(0)}ms ${b.byteLength}B ${p}`);
  await new Promise(r => setTimeout(r, 1500));
}
console.log(out.join('\n')); ws.close();
