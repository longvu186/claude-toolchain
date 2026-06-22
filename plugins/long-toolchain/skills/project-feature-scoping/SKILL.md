---
name: project-feature-scoping
description: "PLANNING SKILL - Interview framework for feature decomposition, user class definition, phasing strategy, and edge case elicitation during project initiation. Draws from existing feature-skills to ask informed follow-ups. Trigger phrases: feature scoping, feature planning, user stories, phasing strategy, feature decomposition, MVP scope."
argument-hint: "Describe the product concept and known features. The skill guides structured decomposition from there."
---

# Planning Skill: Feature Scoping

Structured interview framework for decomposing product features into actionable phases with clear edge cases. Designed to be loaded by the Project Architect agent during Phase C of the interview protocol.

## When to Use

- New project where features need decomposition and phasing.
- Feature expansion where scope creep must be managed.
- Migration where existing features need cataloguing before rebuild.

## Interview Domains

### 1. User Classes & Permissions

Start here — user classes shape every feature.

| Question | Why it matters |
|---|---|
| Who are the user types? (anonymous, registered, staff, admin, special roles) | Determines auth model, route protection, and data visibility |
| What can each user type do? (read, write, moderate, configure) | RBAC scope directly affects data model and UI |
| Is there a hierarchy? (admin > collaborator > user) | Determines cascading permissions |
| Are there invitation/approval flows for any role? | Affects onboarding complexity |
| Can users be suspended/banned? | Affects moderation and data retention |

**Feature-skill probes:**
- If **auth + roles** are complex → load `feature-auth-system` and probe:
  - OAuth providers needed? Multiple or single?
  - Self-registration or invitation-only for elevated roles?
  - Profile bootstrap: what data is collected on first login?

### 2. Feature Inventory

Walk through each major feature area systematically.

| Question | Why it matters |
|---|---|
| List all features you envision (even long-term) | Full inventory prevents accidental omissions |
| For each: who uses it? (which user class) | Maps features to permission boundaries |
| For each: is it public-facing or internal? | Determines SEO, performance, and caching requirements |
| For each: does it require data CRUD? | Identifies database table needs |
| For each: does it have real-time requirements? | Flags architectural implications early |

**Systematic feature category probes:**

#### Content / Publishing Features
- If **article/blog system** → load `feature-blog-public-experience` and probe:
  - Content types? (articles, pages, announcements, etc.)
  - Taxonomy? (categories, tags, custom taxonomies)
  - Search needs? (full-text, filtered, faceted)
  - SEO requirements? (structured data, sitemap, OG tags)
  - Engagement? (comments, likes, saves, shares)
- If **editorial workflow** → load `feature-cms-content-workflow` and probe:
  - Status pipeline? (draft → review → scheduled → published → archived)
  - Assignment? (writer, reviewer, approver)

#### Voting / Ranking Features
- If **user voting or comparison system** → probe:
  - Comparison model? (pairwise Elo, ranked list, simple upvote)
  - Personalized vs global ranking? Both?
  - Comparison fatigue mitigation? (adaptive Top-K, skip cooldown, completion lock)
  - State persistence? (per-comparison rows vs consolidated JSONB per user)
  - Auto-save strategy? (debounce, interaction guard to prevent phantom data)
  - Sharing? (shareable personal rankings, disclaimer about personal vs official)
  - Touch device interactions? (drag-and-drop needs explicit fallback controls)
  - Cache strategy for high-read stats? (multi-tier: DB → edge → client)
  - Scheduling? (future publish dates, auto-publish)
  - Media management? (featured images, media library, inline images)
  - Review/approval flow? (inline comments, approval gates)

#### Admin / Management Features
- If **admin dashboard** → load `feature-admin-dashboard` and probe:
  - CRUD scope? (which entities are admin-managed)
  - Analytics? (what metrics matter: views, users, content volume)
  - Moderation? (content moderation, user management, reporting)
  - Multi-view? (list, kanban, calendar, spreadsheet)
  - Bulk operations? (bulk status change, bulk delete, import/export)

#### Interactive / Social Features
- Comments: threaded? moderated? real-time?
- Voting/rating: up/down, star rating, reaction emoji?
- User profiles: public or private? customizable?
- Notifications: in-app, email, push?
- Social sharing: platforms, OG image generation?

#### Specialized Features
- Knowledge base / wiki: hierarchical pages? MDX? search?
- E-commerce: products, cart, checkout, payments?
- Booking/scheduling: calendar, availability, notifications?
- Multi-language / i18n: how many languages? content translation workflow?
- File management: upload, organize, permission-gated downloads?

### 2A. Implementation-Contract Packaging

If the output is meant for implementation agents rather than human brainstorming, package the scoped features so execution can start without reinterpreting the plan.

- Split the scope into stable requirement IDs with one feature area per document when the project is broad enough to parallelize.
- Give each requirement explicit implementation targets and validation targets so agents can tell when the slice is actually complete.
- In custom-stack commerce or content systems, model admin, CMS, and operations surfaces as first-class scope instead of treating them as later polish.
- Keep design exploration in a separate workstream and state that implementation should consume the chosen design output rather than redefine the visual system.

### 3. Data Model Implications

After features are inventoried, probe the data model:

| Question | Why it matters |
|---|---|
| What are the core entities? (users, articles, products, etc.) | Determines table structure |
| What relationships exist? (1:many, many:many) | Determines junction tables and query complexity |
| What fields need full-text search? | Determines indexing strategy |
| What data is user-generated vs admin-managed? | Affects RLS policy design |
| What data needs versioning or audit trails? | Affects schema complexity |
| What data has soft-delete vs hard-delete? | Affects query filters and archival strategy |

### 4. Phasing Strategy

Break features into deliverable phases.

**Phasing principles:**
1. **Phase 1 = walking skeleton**: Auth + core read/write + basic admin. Must be deployable and testable.
2. **Phase 2 = enrichment**: Advanced features on top of the skeleton (editorial workflow, analytics, moderation).
3. **Phase N = specialization**: Domain-specific features (knowledge base, lyrics system, e-commerce, etc.).

| Question | Why it matters |
|---|---|
| What is the absolute minimum for a useful first deploy? | Defines Phase 1 scope |
| What features depend on other features? | Determines ordering constraints |
| What can be deferred without blocking core value? | Prevents scope creep in early phases |
| Are there external deadlines or milestones? | May force phase boundaries |

**Challenge patterns:**
- "Everything in Phase 1" → push back. Ask: "If you could only ship 3 features, which would they be?"
- Feature with no clear user class → probe: "Who actually uses this? Is this a user need or an admin need?"
- Feature that implies another feature → surface: "Comments imply auth. Auth implies profiles. Add both to scope?"

### 5. Edge Cases & Empty States

For each major feature, probe these systematically:

| Edge case category | Questions |
|---|---|
| **Empty states** | What does the UI show when there's no data? First-time user experience? |
| **Error states** | What happens on network failure? Invalid input? Permission denied? |
| **Concurrent operations** | Can two users edit the same entity? How are conflicts handled? |
| **Data limits** | Max items per page? Max upload size? Rate limiting? |
| **Migration** | Is there existing data to import? What format? |
| **Content seeding** | Does the app need seed data to be functional? (e.g., at least one category, one admin user) |
| **Deletion cascades** | When a parent is deleted, what happens to children? (e.g., delete category → articles in that category?) |
| **Timezone handling** | Are dates stored/displayed in UTC, user timezone, or server timezone? |

### 6. API Surface

If the project exposes or consumes APIs:

| Question | Why it matters |
|---|---|
| REST, GraphQL, or RPC? | Determines API design and client code generation |
| Public API or internal only? | Affects rate limiting, auth, and documentation needs |
| Third-party integrations? | May require webhooks, OAuth apps, or API keys |
| Webhook needs? | Affects event system design |

## Challenge Patterns

| Stated requirement | Issue | Reframe as |
|---|---|---|
| "Users should be able to do everything" | No permission model | "Which actions are admin-only? Which are user-only?" |
| "Real-time everything" | Massive infrastructure complexity | "Which specific interactions need real-time? Others can use polling or page refresh." |
| "We need AI features" | Vague; unbounded scope | "What specific AI capability? Summarization? Search? Generation? Classification?" |
| "Mobile app too" | Doubles development effort | "Is a responsive web app sufficient initially? Native app in a later phase?" |
| 10+ features in Phase 1 | Scope creep | "Rank these features 1-10 by user value. Top 3-5 = Phase 1." |
| Feature with no user story | May not be needed | "Can you describe a scenario where a user actually uses this?" |

## Cross-Skill References

| Skill | When to load |
|---|---|
| `feature-auth-system` | User describes auth, roles, or protected areas |
| `feature-admin-dashboard` | User describes admin panel or staff tools |
| `feature-cms-content-workflow` | User describes content editing, editorial workflow, or scheduling |
| `feature-blog-public-experience` | User describes blog, news, or public content pages |

## Output Format

After completing feature scoping, produce a structured summary:

```markdown
## User Classes
- {Role 1}: {capabilities}
- {Role 2}: {capabilities}

## Feature Map by Phase
### Phase 1: {Name} — {Goal}
- Feature 1: {description}
  - User class: {who}
  - Data entities: {what tables/models}
  - Edge cases: {key concerns}
- Feature 2: ...

### Phase 2: {Name} — {Goal}
- ...

## Data Model Sketch
- {Entity 1} → {relationships}
- {Entity 2} → {relationships}

## Deferred Features (explicitly out of scope for now)
- {Feature}: {reason for deferral}

## Skill Gaps Identified
- {Feature area with no existing feature-skill}: recommend creating after implementation
```
