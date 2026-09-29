import os, json, urllib.request
tok = os.environ["CLOUDFLARE_API_TOKEN"]
def call(path, body=None):
    r = urllib.request.Request(f"https://api.cloudflare.com/client/v4{path}", data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "User-Agent": "colo/1.0"})
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {"http_error": e.code, "body": e.read()[:300].decode()}
acct = ([a for a in call("/accounts")["result"] if "obuso" in a["name"]])[0]["id"]
t = call("/graphql", {"query": '{__type(name:"AccountWorkersInvocationsAdaptiveDimensions"){fields{name}}}'})
print("dims:", [f["name"] for f in t["data"]["__type"]["fields"]])
for script in ["tobuso-migration", "tobuso-migration-staging"]:
    q = """query($a:String!,$s:String!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:40,
    filter:{scriptName:$s,datetime_geq:"2026-09-21T00:00:00Z"},orderBy:[sum_requests_DESC]){dimensions{coloCode usageModel}
    sum{requests}}}}}"""
    g = call("/graphql", {"query": q, "variables": {"a": acct, "s": script}})
    try: print(script, [(r["dimensions"]["coloCode"], r["sum"]["requests"]) for r in g["data"]["viewer"]["accounts"][0]["workersInvocationsAdaptive"]])
    except Exception: print(script, json.dumps(g)[:300])
