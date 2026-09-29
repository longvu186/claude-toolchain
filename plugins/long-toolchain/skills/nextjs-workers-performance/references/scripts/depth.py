import json, re, sys, collections

raw = open(sys.argv[1]).read()
dec = json.JSONDecoder(); i = 0; evs = []
while True:
    j = raw.find("{", i)
    if j < 0: break
    try:
        ev, i = dec.raw_decode(raw, j); evs.append(ev)
    except Exception:
        i = j + 1

def depth(qs):
    """Longest chain of queries where each starts at/after the previous one ended (1 ms slack)."""
    qs = sorted(qs, key=lambda q: q["at"])
    best = {}
    for k, q in enumerate(qs):
        best[k] = 1 + max([best[p] for p in range(k) if qs[p]["at"] + qs[p]["ms"] <= q["at"] + 1] or [0])
    return max(best.values() or [0])

agg = collections.defaultdict(list)
for ev in evs:
    req = (ev.get("event") or {}).get("request") or {}
    url = req.get("url", "").replace("https://staging.app.tobuso.ca", "")
    shape = url.split("?")[0].replace("REDACTED", ":id")
    q = re.search(r"[?&](module|step|tab|view)=([^&]+)", url)
    if q: shape += f"?{q.group(1)}={q.group(2) if q.group(1) != 'step' else '*'}"
    seen = set()
    for l in ev.get("logs", []):
        for m in l.get("message", []):
            if isinstance(m, str) and m.startswith("[query-metrics]") and m not in seen:
                seen.add(m)
                d = json.loads(m[len("[query-metrics] "):])
                agg[shape].append((depth(d.get("queries", [])), d["count"], d["totalWallMs"]))
rows = []
for shape, vals in agg.items():
    d, c, w = max(vals)
    rows.append((d, c, w, shape, len(vals)))
print("depth count wallMs  route (samples)")
for d, c, w, s, n in sorted(rows, key=lambda r: (-r[0], -r[2])):
    print(f"{d:>5} {c:>5} {w:>6.0f}  {s} ({n})")
