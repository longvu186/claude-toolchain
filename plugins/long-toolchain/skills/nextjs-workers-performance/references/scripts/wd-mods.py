import json, sys, collections, bisect, glob, re
R = '/root/projects/tobuso-migration/'
M = json.load(open(glob.glob(R + '.wrangler/tmp/dev-*/worker-entry.js.map')[0]))
B64 = {c: i for i, c in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')}
def vlq(seg):
    out, val, shift = [], 0, 0
    for ch in seg:
        d = B64[ch]; val += (d & 31) << shift
        if d & 32: shift += 5
        else: out.append(-(val >> 1) if val & 1 else val >> 1); val = shift = 0
    return out
lines = []; src = sl = sc = 0
for gl in M['mappings'].split(';'):
    col = 0; segs = []
    for seg in gl.split(','):
        if not seg: continue
        v = vlq(seg); col += v[0]
        if len(v) >= 4: src += v[1]; sl += v[2]; sc += v[3]; segs.append((col, src, sl, sc))
    lines.append(segs)
def smap(line, col):
    segs = lines[line] if line < len(lines) else []
    if not segs: return None
    k = max(bisect.bisect_right([s[0] for s in segs], col) - 1, 0)
    _, si, l, c = segs[k]; return M['sources'][si], l, c
DH = open(R + '.open-next/server-functions/default/handler.mjs').read().split('\n')
chunks = {f.split('/')[-1]: open(f).read() for f in glob.glob(R + '.next/server/chunks/*.js')}
apps = {f.replace(R + '.next/server/', ''): open(f).read() for f in glob.glob(R + '.next/server/app/**/*.js', recursive=True)}
nexts = {f.split('next/dist/')[-1]: open(f).read() for f in glob.glob(R + 'node_modules/.pnpm/next@16*/node_modules/next/dist/compiled/next-server/*.js')}
heads = {f: [(m.start(), m.group(1)) for m in re.finditer(r'[{,](\d+):(?:\([a-z,]*\)|[a-z])=>', s)] for f, s in chunks.items()}
def locate(line, col):
    r = smap(line, col)
    if not r: return ('?', '?')
    s, l, c = r
    if not s.endswith('default/handler.mjs'): return (s.split('/')[-2] + '/' + s.split('/')[-1], '')
    txt = DH[l][c:c + 50]
    for f, content in chunks.items():
        i = content.find(txt)
        if i >= 0:
            hs = heads[f]; k = bisect.bisect_right([h[0] for h in hs], i) - 1
            return ('chunk ' + f, hs[k][1] if k >= 0 else '?')
    for group in (apps, nexts):
        for f, content in group.items():
            if txt in content: return (f[:80], '')
    return ('handler(other) L%d' % l, '')
top = int(sys.argv[2]) if len(sys.argv) > 2 else 20
p = json.load(open(sys.argv[1])); nodes = {n['id']: n for n in p['nodes']}
parent = {c: n['id'] for n in p['nodes'] for c in n.get('children', [])}
self_c = collections.Counter(); cache = {}
for s, d in zip(p['samples'], p['timeDeltas']):
    if nodes[s]['callFrame']['functionName'] == '(idle)': continue
    nid = s
    while nid is not None and nodes[nid]['callFrame']['url'] != 'worker-entry.js': nid = parent.get(nid)
    if nid is None: self_c[('(native, no js caller)', '')] += d / 1000; continue
    cf = nodes[nid]['callFrame']; key = (cf['lineNumber'], cf['columnNumber'])
    if key not in cache: cache[key] = locate(*key)
    self_c[cache[key]] += d / 1000
byfile = collections.Counter()
for (f, m), v in self_c.items(): byfile[f] += v
print('BY FILE:'); [print(f'  {v:7.1f} ms  {f}') for f, v in byfile.most_common(top)]
print('BY CHUNK MODULE:')
for (f, m), v in self_c.most_common(60):
    if not m: continue
    s = chunks[f.split(' ')[1]]; o = dict((mm, pos) for pos, mm in heads[f.split(' ')[1]]).get(m, 0)
    print(f'  {v:7.1f} ms  {f} #{m}: {re.sub(chr(10), " ", s[o:o+130])}')
