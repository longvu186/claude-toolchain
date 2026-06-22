---
name: project-nonfunctional-requirements
description: "PLANNING SKILL - Interview framework for non-functional requirements: performance, security, SEO, accessibility, deployment, legal/compliance, and scalability. Knows when to skip irrelevant probes. Trigger phrases: non-functional requirements, performance requirements, security requirements, SEO requirements, deployment strategy, compliance, scalability."
argument-hint: "Describe the project type (public site, internal tool, e-commerce, etc.) so irrelevant probes can be skipped."
---

# Planning Skill: Non-Functional Requirements

Structured interview framework for eliciting non-functional requirements during project initiation. Designed to be loaded by the Project Architect agent during Phase D of the interview protocol.

## When to Use

- New project initiation where quality attributes need definition.
- Architecture review where NFRs have been implicit but need documentation.
- Migration where NFRs must be preserved or upgraded.

## Relevance Filter

Not all probes apply to every project. Skip entire domains when irrelevant:

| Domain | Skip when... |
|---|---|
| SEO | Internal tool, admin-only app, no public pages |
| Accessibility | Prototype/hackathon (but flag as tech debt) |
| Legal/Compliance | Personal project with no user data collection |
| Scalability | MVP with < 100 expected users |
| Performance (advanced) | Content site with no interactive features |

Always ask the user: "Which of these matter for your project? I'll focus on those."

## Interview Domains

### 1. Performance

| Question | Why it matters |
|---|---|
| Target page load time? (e.g., < 2s LCP) | Sets performance budget and optimization priorities |
| Bundle size concerns? (target KB for JS) | Determines code splitting and lazy loading strategy |
| Image optimization strategy? | Heavy images are the #1 performance killer |
| Caching strategy? (CDN, browser cache, stale-while-revalidate) | Affects content freshness vs speed trade-off |
| Expected concurrent users? | Determines infrastructure sizing |
| Offline support needed? | Determines service worker and PWA strategy |

**Informed probes by stack:**
- If **static export** → build time is the performance bottleneck, not runtime. Probe: how many pages at build time? Incremental builds?
- If **Supabase** → probe: connection pooling? Real-time subscription limits?
- If **Cloudflare** → probe: edge caching rules? Cache purge strategy on deploy? KV cache tier for high-read endpoints?
- If **high-read feature** (polls, leaderboards, stats) → probe: multi-tier cache architecture? DB cache table → KV edge → client-side? TTL alignment across tiers?

### 2. Security

| Question | Why it matters |
|---|---|
| Auth hardening needs? (MFA, session timeout, brute force protection) | Determines auth provider config |
| Data sensitivity level? (public, internal, PII, financial) | Determines encryption, access control, and audit logging needs |
| RLS / RBAC depth? (row-level, field-level, action-level) | Determines database policy complexity |
| Input validation strategy? (client-only, server-side, both) | Prevents injection attacks |
| CORS policy? (open, restricted origins, credentials) | Affects API and auth cookie behavior |
| CSP (Content Security Policy)? | Prevents XSS; affects inline scripts and third-party embeds |
| API rate limiting? | Prevents abuse and DDoS |
| Secret management? (env vars, vault, platform secrets) | Affects deployment and rotation procedures |

**OWASP Top 10 quick-check:**
1. Broken access control → Are all admin routes protected? Can users access other users' data?
2. Cryptographic failures → Are passwords hashed? Is PII encrypted at rest?
3. Injection → Are user inputs sanitized? Parameterized queries?
4. Insecure design → Are destructive actions confirmed? Are audit logs in place?
5. Security misconfiguration → Are default credentials changed? Debug modes disabled in production?
6. Vulnerable components → Dependency audit strategy? Automated vulnerability scanning?
7. Auth failures → Account enumeration possible? Password reset flow secure?
8. Data integrity failures → Are deployments verified? Supply chain attacks mitigated?
9. Logging/monitoring failures → Are security events logged? Alert thresholds set?
10. SSRF → Are external URL inputs validated? Server-side fetch targets restricted?

### 3. SEO

| Question | Why it matters |
|---|---|
| Target audience search behavior? (what do they Google) | Informs content strategy and keyword targeting |
| Structured data needs? (JSON-LD, Schema.org types) | Rich snippets in search results |
| Sitemap strategy? (static, dynamic, per-content-type) | Crawl efficiency |
| Social sharing? (OG tags, Twitter cards, custom images) | Affects social media traffic |
| Canonical URL strategy? | Prevents duplicate content penalties |
| i18n / hreflang? | Required for multi-language sites |
| robots.txt policy? | Which paths should be crawled/blocked? |

**Informed probes by stack:**
- If **static export** → all SEO is baked at build time. Probe: is this acceptable, or do you need runtime meta tag updates?
- If **SPA** → SEO is severely limited without SSR/prerendering. Probe: is prerendering acceptable?
- If **SPA and prerender is rejected** → require SEO mitigation baseline: static fallback tags in `index.html` plus route-aware runtime updates for `title`, `description`, canonical, Open Graph, and Twitter tags.
- Require an automated SEO route check (headless browser script) on localhost and deployed URL before release sign-off.

### 4. Accessibility

| Question | Why it matters |
|---|---|
| Target WCAG level? (A, AA, AAA) | Determines effort level and testing requirements |
| Screen reader support required? | Affects semantic HTML, ARIA labels, and focus management |
| Keyboard navigation required? | Affects interactive component design |
| Color contrast requirements? | Affects design system and dark mode implementation |
| Reduced motion support? | Affects animations and transitions |
| Form accessibility? (labels, error messages, focus indicators) | Affects all input components |

### 5. Deployment & Operations

| Question | Why it matters |
|---|---|
| Preview/staging environments? | Determines branch strategy and deploy config |
| Rollback strategy? (redeploy previous build, revert commit, feature flags) | Determines risk mitigation for bad deploys |
| Zero-downtime deploys required? | Affects deploy strategy (blue-green, rolling, etc.) |
| Monitoring/alerting? (uptime, error rates, performance) | Determines observability tooling |
| Log aggregation? (structured logs, log search, retention) | Affects debugging and audit capabilities |
| Backup strategy? (database, media, configuration) | Affects disaster recovery |
| Incident response plan? | Affects on-call and escalation procedures |

**Informed probes by stack:**
- If **Cloudflare Pages** → load `cloudflare-operations` and probe:
  - Deploy hook for CMS-triggered rebuilds?
  - CDN cache invalidation strategy?
  - Unique deployment URL for verification?
  - Is immutable deployment URL verification (`https://<hash>.<project>.pages.dev`) done before alias/custom-domain validation?
- If **Supabase** → load `supabase-operations` and probe:
  - Database backup frequency?
  - Point-in-time recovery enabled?
  - Edge function monitoring?

### 6. Legal & Compliance

| Question | Why it matters |
|---|---|
| Privacy policy required? | Required if collecting any user data |
| Terms of service required? | Required for user-facing apps |
| Cookie consent required? | Required in EU (GDPR), recommended elsewhere |
| Data retention policy? | How long is user data kept? Right to deletion? |
| GDPR applicability? | EU users → full GDPR compliance needed |
| Local law compliance? (country-specific requirements) | Vietnam: Cybersecurity Law, data localization considerations |
| Account deletion capability? | Required by Apple App Store, GDPR, and good practice |
| Third-party data sharing disclosure? | If using analytics, auth providers, or ad networks |
| Age restrictions? | If content is age-gated |

### 7. Scalability

| Question | Why it matters |
|---|---|
| Expected user growth curve? (linear, viral, seasonal) | Determines infrastructure provisioning strategy |
| Database scaling strategy? (connection pooling, read replicas, sharding) | Affects architecture decisions early |
| Media storage growth? (GB/month estimate) | Affects storage provider choice and cost |
| Feature flag strategy? (build-time, runtime, percentage rollout) | Determines feature release and A/B testing capability |
| Multi-tenancy? | Dramatically affects data model and auth |
| API versioning strategy? | Affects long-term maintainability if external consumers exist |

## Challenge Patterns

| Stated requirement | Issue | Reframe as |
|---|---|---|
| "Maximum security" | Unbounded; leads to over-engineering | "What is the most sensitive data? Let's protect that specifically." |
| "Must be fast" | Vague; no measurable target | "What LCP target? Under 2 seconds? Under 1 second?" |
| "GDPR compliant" without EU users | Unnecessary compliance burden | "Do you expect EU users? If not, focus on local privacy law." |
| "100% uptime" | Impossible and expensive to approximate | "What is acceptable downtime? 99.9% = ~8.7 hours/year." |
| "We'll add accessibility later" | Retrofitting accessibility is 3-5x more expensive | "Let's at least target WCAG AA for forms and navigation now." |
| No monitoring plan | Blind to production issues | "At minimum: uptime monitoring + error alerting. 30 minutes to set up." |

## Cross-Skill References

| Skill | When to load |
|---|---|
| `cloudflare-operations` | Deployment, CDN, and preview environment probes |
| `supabase-operations` | Database security, backup, and edge function probes |
| `nextjs-static-export-reliability` | Build performance, SEO baking, and static data freshness |
| `frontend-layout-pitfalls` | Accessibility and responsive layout concerns |

## Output Format

After completing the NFR interview, produce a structured summary:

```markdown
## Non-Functional Requirements

### Performance
- LCP target: {value}
- Bundle budget: {value}
- Caching: {strategy}

### Security
- Data sensitivity: {level}
- Auth hardening: {requirements}
- OWASP focus areas: {list}

### SEO (if applicable)
- Structured data: {types}
- Sitemap: {strategy}
- Social sharing: {requirements}

### Accessibility (if applicable)
- Target: WCAG {level}
- Key areas: {keyboard nav, screen reader, contrast, etc.}

### Deployment
- Environments: {list}
- Rollback: {strategy}
- Monitoring: {tooling}

### Legal (if applicable)
- Privacy policy: {yes/no}
- Compliance: {frameworks}
- Data retention: {policy}

### Scalability
- Growth expectation: {curve}
- Database strategy: {approach}
- Feature flags: {strategy}

## Deferred NFRs (explicitly out of scope for now)
- {NFR}: {reason}
```
