---
name: data-mapping-patterns
description: "Map and normalize terminology between systems with different field vocabularies. Use when integrating two APIs with mismatched fields, building bridge/proxy endpoints, normalizing user input to canonical values, or deciding between hardcoded vs dynamic mappings. Trigger phrases: terminology mapping, cross-API translation, field normalization, material mapping, option mapping, dictionary-based translation, text normalization for matching."
---

# Skill: Data Mapping & Terminology Normalization

**Trigger phrases:** terminology mapping, cross-API translation, field normalization, material mapping, option mapping, dictionary-based translation, text normalization for matching

**Use this skill when:**
- Integrating two systems with different field terminology (e.g., frontend labels → backend catalog values, one API's options → another API's options)
- Building bridge/proxy endpoints that forward payloads between incompatible systems
- Handling user input that may arrive in multiple formats / casing / punctuation styles but needs to map to canonical values
- You need to decide between hardcoded mappings vs. dynamic/loaded mappings
- Matching user-entered text against a controlled dictionary (materials, tolerances, finishes, etc.)

---

## 1. Hardcoded vs. Dynamic Mappings

### Hardcoded Mappings (Recommended for Most Cases)

**Advantages:**
- Type-safe in TypeScript: can use `as const` to make dictionary exhaustive
- No runtime loading or parsing complexity
- Immutable and version-controlled; changes require explicit commit/review/deploy
- Fast (no file I/O or network calls)
- Simple unit testing: mock nothing, test function directly
- Operationally clean: no external config service dependency

**Disadvantages:**
- Adds code bulk (50+ entries = 100+ lines including keys)
- Requires redeploy to add/update mappings
- Not suitable for user-driven mappings (e.g., end-user configurable dictionary)

**When to use:**
- System integrations (API ↔ API)
- Stable, rarely-changing canonical catalogs (e.g., ISO standards, known material grades)
- Entag 3D Viewer: Bubble ↔ DigiFabster materials, tolerances, finishes

### Dynamic Mappings (Load from External Source)

**Advantages:**
- Can update dictionary without redeploy (if polling)
- Supports user-driven/custom mappings
- Separates data from code

**Disadvantages:**
- Runtime I/O cost (file system, object store, or external API call)
- Parsing/validation complexity
- Need to handle stale cache, fallback, and fetch failures
- More operational moving parts (config service, schema evolution)

**When to use:**
- End-user configurable mappings
- Frequently changing catalogs (daily/hourly sync)
- High volume (10K+ entries, too large for code)
- Cross-team shared dictionary (centralized authority)

**Future enhancement for Entag:** If DigiFabster catalog updates frequently or Bubble field options become user-configurable, consider polling `DigiFabster /v2/catalog/` on app startup and caching mappings locally or in Vercel Blob with TTL.

---

## 2. Text Normalization Pattern

**Goal:** Make user input (and dictionary keys) comparable regardless of case, diacritics, punctuation, or symbol variations.

### Implementation

```typescript
const normalizeText = (value: string): string =>
  value
    // Unicode decomposition: combine characters → base + combining marks
    .normalize("NFKD")
    // Remove diacritics (combining marks)
    .replace(/[\u0300-\u036f]/g, "")
    // Unify micro symbols (µ, μ, `` → u)
    .replace(/[\u00B5\u03BC]/g, "u")
    // Replace non-alphanumeric with space (preserves word boundaries)
    .replace(/[^a-zA-Z0-9]+/g, " ")
    // Lowercase
    .toLowerCase()
    // Trim and collapse multiple spaces
    .trim()
    .replace(/\s+/g, " ");
```

### Why This Works

- **NFKD**: Decomposes é → e + combining accent, so diacritics can be stripped uniformly
- **Micro symbols**: µ and μ are visually similar but different Unicode points; unify them
- **Special chars**: Hyphens, slashes, underscores in user input are treated as word separators, not breaking matches
- **Lowercase first, then trim**: Ensures consistent output regardless of input casing or leading/trailing whitespace

### Example Matches

| Input | Normalized | Matches Dictionary Key |
|---|---|---|
| `Aluminium 6061` | `aluminium 6061` | `"aluminium 6061"` |
| `ALUMINUM_5083` | `aluminum 5083` | `"aluminium 5083"` (after accent stripping) |
| `St37 / S235JR` | `st37 s235jr` | `"st37 s235jr"` |
| `ISO 2768-m` | `iso 2768 m` | `"iso 2768 medium"` (prefix match) |

---

## 3. TypeScript Type-Safe Mapping Interface

### Pattern

```typescript
interface TerminologyMappingType {
  materials: Record<string, string>;
  tolerances: Record<string, string>;
  inspection: Record<string, string>;
  roughness: Record<string, string>;
  finish: Record<string, string>;
}

const MAPPING: TerminologyMappingType = {
  materials: { /* ... */ },
  tolerances: { /* ... */ },
  // etc.
};

function applyMapping(value: string, field: keyof TerminologyMappingType): string {
  const normalized = normalizeText(value);
  const dict = MAPPING[field] || {};
  // resolution logic here
  return resolved || value; // fallback to original
}
```

### Why This Pattern

- **Field-specific typing**: Prevents mixing material values into tolerance fields (IDE autocomplete guides you)
- **Exhaustive checking**: Adding a new field requires updating the interface, callers, and tests
- **Centralized constant**: Single source of truth; easier to version-control and review diffs

### Alternative: If Fields Share Structure (not recommended initially)

If all fields use identical resolution logic, avoid premature optimization. Keep fields separate in the interface for clarity. Optimization can come later if code becomes unwieldy.

---

## 4. Multi-Level Fallback Resolution

### Standard Order (Recommended)

```typescript
function applyMapping(input: string, field: keyof TerminologyMappingType): string {
  if (!input?.trim()) return input;
  
  const normalized = normalizeText(input);
  const dict = MAPPING[field] || {};

  // Tier 1: Exact match (after normalization)
  for (const [key, value] of Object.entries(dict)) {
    if (normalizeText(key) === normalized) {
      return value;
    }
  }

  // Tier 2: Prefix match (either side contains the other)
  for (const [key, value] of Object.entries(dict)) {
    const normKey = normalizeText(key);
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      return value;
    }
  }

  // Tier 3: Fallback to original (unmapped value)
  return input;
}
```

### Why Three Tiers

1. **Exact match**: Handles canonical values and user input that matches exactly (most reliable)
2. **Prefix match**: Handles:
   - User partial input: "iso 2768" matches key "iso 2768 medium standard"
   - Bubble variations: "st37" matches "st37 s235jr 1.0570"
   - Prevents false negatives while staying reasonable
3. **Fallback to original**: Preserves unmapped values so downstream systems don't silently drop unknown options

### Gotchas

- **Prefix ambiguity**: If "iso" matches both "ISO 2768-m" and "ISO-internal-code", both will match. Design your keys to avoid excessive overlap, or narrow prefix scope to one side only.
- **Performance**: For 100+ entries, tier 2 iteration is still O(n) per lookup; acceptable for initialization or per-request transforms. If lookups are very frequent (1000s/sec), consider pre-built trie or index.

---

## 5. Implementation Checklist

### When Adding a New Terminology Mapping System

- [ ] Define `TerminologyMappingType` interface with all field categories
- [ ] Implement `normalizeText()` helper (copy the pattern above)
- [ ] Implement `applyMapping(value, field)` with three-tier resolution
- [ ] Add all known canonical values to `MAPPING` constant (start with reference documentation, fill in blanks from user feedback)
- [ ] Add unit tests:
  - Exact match test (canonical value)
  - Prefix match test (user variation)
  - Unmapped value test (fallback to original)
  - Case/diacritics/punctuation tests
- [ ] Add integration test: call mapping in context of real route/service, validate downstream accepts result
- [ ] Add observability: log/meter unmapped values (Tier 3 fallback) so mapping gaps are visible
- [ ] Document in API route docs: which fields support mapping, how mappings are maintained, how to add new entries
- [ ] Plan for future refresh: after each integration/production deployment, review logs to find new unmapped values and add them to `MAPPING`

### Example: Entag 3D Viewer

**Files:**
- `api/digifabster-price-tweak.cts` — TerminologyMappingType, BUBBLE_TO_DIGIFABSTER_MAPPING, applyTerminologyMapping()
- `api/autodesk_helpers/digifabster-sync.ts` — Uses mapping when forwarding requests to DigiFabster
- `memories/repo/api-routes.md` — Documented mapping structure and update process
- `docs/ai/run-logs/2026-04-09-terminology-mapping-population.md` — Session log with 70+ mappings populated, build/deploy results

---

## 6. Monitoring & Observability

### What to Track

1. **Mapping hit rate** (Tier 1 vs. Tier 2 vs. Tier 3):
   - High Tier 3 (fallback): indicates missing mappings; queue for addition
   - High Tier 2 (prefix): may indicate user input variations worth standardizing in Bubble form

2. **Unmapped values** (Tier 3 results):
   - Log unique unmapped inputs
   - Create alert if new unmapped value appears in production
   - Feed into mapping queue (e.g., "User entered 'tool steel', add to dict")

3. **Performance** (resolution time):
   - Tier 1 should be O(n) but typically fast; Tier 2 is O(n²) worst case but usually completes in <1ms for 100 entries
   - If users report slowness, consider indexing high-traffic fields

### Example Log Context

```javascript
function applyMappingWithObs(input: string, field: string): string {
  const result = applyMapping(input, field);
  if (result !== input) {
    console.log(`[MAPPING_APPLIED] field=${field} input=${input} result=${result}`);
  } else {
    console.warn(`[MAPPING_UNMAPPED] field=${field} input=${input}`);
  }
  return result;
}
```

---

## 7. Testing Examples

### Unit Tests

```typescript
describe("applyMapping", () => {
  it("exact match", () => {
    expect(applyMapping("aluminium 6061", "materials")).toBe("Aluminium 6061");
  });

  it("case insensitive", () => {
    expect(applyMapping("ALUMINIUM_6061", "materials")).toBe("Aluminium 6061");
  });

  it("prefix match", () => {
    expect(applyMapping("iso 2768", "tolerances")).toBe("ISO 2768-m");
  });

  it("unmapped fallback", () => {
    expect(applyMapping("custom alloy XYZ", "materials")).toBe("custom alloy XYZ");
  });

  it("empty input", () => {
    expect(applyMapping("", "materials")).toBe("");
  });
});
```

### Integration Test

```typescript
it("POST /api/digifabster-price-tweak maps material correctly", async () => {
  const res = await POST("/api/digifabster-price-tweak", {
    material: "ALUMINIUM 6061",  // Bubble format
    // ...other fields
  });

  expect(res.status).toBe(200);
  // Confirm DigiFabster forwarding used mapped value ("Aluminium 6061")
  expect(res.body.quote).toHaveProperty("status");
});
```

---

## 8. Decision Tree

```
Do you need to map terminology between systems?
├─ Yes
│  ├─ Are values stable & rarely change?
│  │  ├─ Yes → Use hardcoded MAPPING constant
│  │  └─ No → Use dynamic loading (poll external catalog)
│  ├─ How many entries?
│  │  ├─ <500 → Hardcoded + normalize + 3-tier fallback OK
│  │  ├─ 500-5000 → Hardcoded but consider splitting by category
│  │  └─ >5000 → Consider dynamic + indexed lookup
│  └─ Can you define canonical values?
│     ├─ Yes → Implement 3-tier resolution (exact → prefix → fallback)
│     └─ No → Need to sync/negotiate with upstream system first
└─ No → Move on
```

---

## See Also

- Tech pitfall: Text Normalization For Cross-API Terminology Matching
- Tech pitfall: Multi-Level Fallback Resolution for Terminology Mapping
- Tech pitfall: Observable Unmapped Terminology Handling
- Example implementation: [Entag 3D Viewer](c:\Users\longv\Desktop\entag-3d-viewer\project-entag-3d-viewer\api\digifabster-price-tweak.cts)
