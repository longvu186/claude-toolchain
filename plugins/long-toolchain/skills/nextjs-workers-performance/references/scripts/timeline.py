import json, re, sys

raw = open(sys.argv[1]).read()
dec = json.JSONDecoder()
i = 0
evs = []
while True:
    j = raw.find("{", i)
    if j < 0:
        break
    try:
        ev, i = dec.raw_decode(raw, j)
        evs.append(ev)
    except Exception:
        i = j + 1
pat = re.compile(sys.argv[2] if len(sys.argv) > 2 else ".")
print("events", len(evs))
for ev in evs:
    req = (ev.get("event") or {}).get("request") or {}
    url = req.get("url", "")
    if not pat.search(url):
        continue
    ms = [m for l in ev.get("logs", []) for m in l.get("message", []) if isinstance(m, str) and m.startswith("[query-metrics]")]
    if not ms:
        continue
    rsc = "RSC" if (req.get("headers") or {}).get("rsc") else "doc"
    print("==", rsc, url[:110], "wall", ev.get("wallTime"), "cpu", ev.get("cpuTime"))
    for m in ms:
        d = json.loads(m[len("[query-metrics] "):])
        ch = sorted(d.get("queries", []), key=lambda q: q["at"])
        steps = " | ".join("%s@%s+%d" % (q["l"], q["at"], q["ms"]) for q in ch)
        print("    %s count=%s serial=%s wall=%d  %s" % (d.get("pathname"), d["count"], d["serialDepth"], d["totalWallMs"], steps[:700]))
