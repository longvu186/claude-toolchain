import os, json, urllib.request, sys
tok = os.environ["CLOUDFLARE_API_TOKEN"]
def call(path, body=None):
    r = urllib.request.Request(f"https://api.cloudflare.com/client/v4{path}", data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "User-Agent": "do-probe/1.0"})
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {"http_error": e.code, "body": e.read()[:300].decode()}
accts = call("/accounts")["result"]
acct = [a for a in accts if "obuso" in a["name"]] or accts
acct = acct[0]["id"]; print("account ok")
# introspect DO invocation dataset fields
q = """{__type(name:"AccountDurableObjectsInvocationsAdaptiveGroupsDimensions"){fields{name}}}"""
t = call("/graphql", {"query": q})
print("dims:", [f["name"] for f in (t.get("data") or {}).get("__type", {}).get("fields", [])] if t.get("data") and t["data"]["__type"] else t)
q2 = """{__type(name:"AccountDurableObjectsInvocationsAdaptiveGroupsQuantiles"){fields{name}}}"""
t2 = call("/graphql", {"query": q2}); print("quantiles:", [f["name"] for f in t2["data"]["__type"]["fields"]] if t2.get("data") and t2["data"]["__type"] else t2)
q3 = """query($a:String!){viewer{accounts(filter:{accountTag:$a}){durableObjectsInvocationsAdaptiveGroups(limit:60,
filter:{datetime_geq:"2026-09-21T00:00:00Z"},orderBy:[sum_requests_DESC]){dimensions{scriptName coloCode objectId}
sum{requests} quantiles{wallTimeP50 wallTimeP90}}}}}"""
g = call("/graphql", {"query": q3, "variables": {"a": acct}})
try:
    rows = g["data"]["viewer"]["accounts"][0]["durableObjectsInvocationsAdaptiveGroups"]
    for r in rows:
        d = r["dimensions"]; qd = r["quantiles"]
        print(f"{d['scriptName']:<34} colo={d['coloCode']:<5} obj={d['objectId'][:10]} req={r['sum']['requests']:>6} wall p50={qd['wallTimeP50']/1000:.1f}ms p90={qd['wallTimeP90']/1000:.1f}ms")
except Exception as e: print("err", json.dumps(g)[:600])
q4 = """query($a:String!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:30,
filter:{scriptName:"tobuso-migration-staging",datetime_geq:"2026-09-26T00:00:00Z"},orderBy:[sum_requests_DESC]){dimensions{coloCode}
sum{requests}}}}}"""
g = call("/graphql", {"query": q4, "variables": {"a": acct}})
try:
    print("staging worker colos:", [(r["dimensions"]["coloCode"], r["sum"]["requests"]) for r in g["data"]["viewer"]["accounts"][0]["workersInvocationsAdaptive"]])
except Exception: print("err4", json.dumps(g)[:400])
