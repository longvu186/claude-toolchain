import json, sys, collections, bisect, glob, re
R = '/root/projects/tobuso-migration/'
exec(open('/root/.claude/skills/nextjs-workers-performance/references/scripts/wd-mods.py').read().split("DH = open")[0])
DHs = open(R + '.open-next/server-functions/default/handler.mjs').read()
starts = [0]
for ln in DHs.split('\n'): starts.append(starts[-1] + len(ln) + 1)
marks = [(m.start(), m.group(1)) for m in re.finditer(r'__(?:commonJS|esm)\(\{"([^"]+)"', DHs)]
mpos = [m[0] for m in marks]
def short(pth):
    m = re.search(r'node_modules/(?:\.pnpm/[^/]+/node_modules/)?((?:@[^/]+/)?[^/]+)(/dist/(?:compiled/[^/]+|server/[^/]+|[^/]+))?', pth)
    if '.next/server/' in pth: return '.next/server/' + pth.split('.next/server/')[1]
    if m: return m.group(1) + (m.group(2) or '')
    return pth[-70:]
def locate(line, col):
    r = smap(line, col)
    if not r: return '?'
    s, l, c = r
    if not s.endswith('default/handler.mjs'): return s.split('/')[-2] + '/' + s.split('/')[-1]
    off = starts[l] + c; k = bisect.bisect_right(mpos, off) - 1
    return short(marks[k][1]) if k >= 0 else 'handler-prelude'
top = int(sys.argv[2]) if len(sys.argv) > 2 else 25
for fp in sys.argv[1].split(','):
    p = json.load(open(fp)); nodes = {n['id']: n for n in p['nodes']}
    parent = {c: n['id'] for n in p['nodes'] for c in n.get('children', [])}
    cnt = collections.Counter(); cache = {}; busy = 0
    for s, d in zip(p['samples'], p['timeDeltas']):
        if nodes[s]['callFrame']['functionName'] == '(idle)': continue
        busy += d / 1000; nid = s
        while nid is not None and nodes[nid]['callFrame']['url'] != 'worker-entry.js': nid = parent.get(nid)
        if nid is None: cnt['(native, no js caller) ' + nodes[s]['callFrame']['functionName']] += d / 1000; continue
        cf = nodes[nid]['callFrame']; key = (cf['lineNumber'], cf['columnNumber'])
        if key not in cache: cache[key] = locate(*key)
        cnt[cache[key]] += d / 1000
    print(f'### {fp} busy {busy:.0f} ms')
    for f, v in cnt.most_common(top): print(f'  {v:7.1f} ms  {f}')
