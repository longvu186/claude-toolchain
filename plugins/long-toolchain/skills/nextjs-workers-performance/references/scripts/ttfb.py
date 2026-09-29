import json, os, subprocess, sys, statistics
st = json.load(open('/tmp/perf/state-CompanyUser.json'))
cookie = "; ".join(f"{c['name']}={c['value']}" for c in st['cookies'] if 'tobuso' in c['domain'])
B = "https://staging.app.tobuso.ca"
paths = sys.argv[2:]
n = int(sys.argv[1])
cfg = "/tmp/par/.curlcfg"
fd = os.open(cfg, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
lines = [f'header = "Cookie: {cookie}"',
         f'header = "CF-Access-Client-Id: {os.environ["STAGING_APP_CF_ACCESS_CLIENT_ID"]}"',
         f'header = "CF-Access-Client-Secret: {os.environ["STAGING_APP_CF_ACCESS_CLIENT_SECRET"]}"']
order = []
for i in range(n):
    for p in paths:
        order.append(p)
        lines += [f'url = "{B}{p}{"&" if "?" in p else "?"}t={i}"', 'output = "/dev/null"']
os.write(fd, ("\n".join(lines) + "\n").encode()); os.close(fd)
out = subprocess.run(["curl", "-s", "-K", cfg, "-w", "%{http_code} %{time_starttransfer} %{time_total}\n"],
                     capture_output=True, text=True).stdout.split("\n")
os.remove(cfg)
res = {}
for p, line in zip(order, out):
    code, ttfb, tot = line.split()
    if code == "200":
        res.setdefault(p, []).append((float(ttfb) * 1000, float(tot) * 1000))
for p, v in res.items():
    print(f"{p[:62]:<62} n={len(v)} ttfb p50 {statistics.median(x for x, _ in v):4.0f} ms  total p50 {statistics.median(y for _, y in v):4.0f} ms")
