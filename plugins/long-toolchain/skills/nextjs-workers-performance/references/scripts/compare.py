import json, re, sys, statistics, collections

def load(path):
    raw = open(path).read(); dec = json.JSONDecoder(); i = 0; evs = []
    while True:
        j = raw.find("{", i)
        if j < 0: break
        try:
            ev, i = dec.raw_decode(raw, j); evs.append(ev)
        except Exception:
            i = j + 1
    out = collections.defaultdict(lambda: {"wall": [], "qwall": [], "count": [], "depth": []})
    for ev in evs:
        req = (ev.get("event") or {}).get("request") or {}
        if (req.get("headers") or {}).get("rsc") or (req.get("headers") or {}).get("next-router-prefetch"):
            continue
        url = req.get("url", "").replace("https://staging.app.tobuso.ca", "")
        shape = url.split("?")[0].replace("REDACTED", ":id")
        if "step=" in url: shape += "?step=*"
        if "tab=" in url: shape += "?tab"
        ms = [m for l in ev.get("logs", []) for m in l.get("message", []) if isinstance(m, str) and m.startswith("[query-metrics]")]
        if not ms: continue
        d = json.loads(ms[0][len("[query-metrics] "):])
        qs = sorted([q for q in d.get("queries", []) if q["ms"] >= 2], key=lambda q: q["at"])
        best = {}
        for k, q in enumerate(qs):
            best[k] = 1 + max([best[p] for p in range(k) if qs[p]["at"] + qs[p]["ms"] <= q["at"] + 1] or [0])
        r = out[shape]
        r["wall"].append(ev.get("wallTime") or 0); r["qwall"].append(d["totalWallMs"])
        r["count"].append(d["count"]); r["depth"].append(max(best.values() or [0]))
    return out

a, b = load(sys.argv[1]), load(sys.argv[2])
med = lambda v: statistics.median(v) if v else float("nan")
print(f"{'route':<34} {'depth':>9} {'queries':>9} {'query ms':>11} {'server ms':>11}  (before -> after, medians)")
for shape in sorted(set(a) & set(b), key=lambda s: -med(a[s]["qwall"])):
    x, y = a[shape], b[shape]
    print(f"{shape[:34]:<34} {med(x['depth']):>3.0f} ->{med(y['depth']):>3.0f} {med(x['count']):>3.0f} ->{med(y['count']):>3.0f} {med(x['qwall']):>4.0f} ->{med(y['qwall']):>4.0f} {med(x['wall']):>4.0f} ->{med(y['wall']):>4.0f}  n={len(x['wall'])}/{len(y['wall'])}")
