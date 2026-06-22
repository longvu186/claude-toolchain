---
name: project-tech-stack-interview
description: "PLANNING SKILL - Interview framework for technology stack and architecture decisions during project initiation. Covers rendering strategy, frontend/backend/hosting/media/CI-CD selection, and stack-specific edge case probes informed by existing technical skills. Trigger phrases: tech stack interview, architecture decisions, stack selection, project tech setup."
argument-hint: "Provide any known tech preferences or constraints. The skill guides a structured interview from there."
---

# Planning Skill: Tech Stack Interview

Structured interview framework for eliciting and validating technology stack decisions at project initiation. Designed to be loaded by the Project Architect agent during Phase B of the interview protocol.

## When to Use

- New project initiation where tech stack has not been decided.
- Project migration where stack is changing.
- Architecture review where current stack choices need validation.

## Locked-Stack Closure

When the stack is already decided, stop treating the exercise as a platform comparison and convert the planning set into implementation contracts instead.

- Refresh the agent-facing context, PRD, requirements dashboard, and architecture docs in the same session.
- Record the locked stack and module boundaries in repo memory so future agents do not reopen the decision by default.
- Move unresolved vendor choices behind adapters so implementation can proceed without pretending the core stack is still undecided.

## Interview Domains

### 1. Rendering Strategy

Ask first — this constrains most downstream decisions.

| Option | When appropriate | Watch out for |
|---|---|---|
| Static Site Generation (SSG / `output: "export"`) | Content-heavy, infrequent updates, CDN-friendly | Dynamic routes need `generateStaticParams`, no runtime server, stale build cache |
| Server-Side Rendering (SSR) | Personalized content, frequent updates, SEO-critical dynamic pages | Cold starts, hosting cost, session management |
| Single Page Application (SPA) | Internal tools, admin dashboards, auth-gated apps | Poor SEO, large initial bundle, deep-link issues |
| Incremental Static Regeneration (ISR) | Hybrid: mostly static with periodic revalidation | Not supported by all hosts (e.g., Cloudflare Pages), cache invalidation complexity |
| Edge rendering | Low-latency personalization, geographically distributed users | Limited runtime APIs, cold start on some platforms |

**Challenge patterns:**
- "Static export + real-time features" → contradiction. Probe: do they mean real-time for all users or just admin?
- "SSR on Cloudflare Pages" → not natively supported without OpenNext/Workers. Suggest static export or Cloudflare Workers.
- "SPA with SEO requirements" → push toward SSG or SSR with hydration.

### 2. Frontend Framework

| Question | Why it matters |
|---|---|
| Framework preference? (Next.js, Nuxt, Astro, Remix, Vite SPA, etc.) | Defines routing model, data fetching, and build pipeline |
| TypeScript or JavaScript? | Type safety affects refactoring confidence and onboarding |
| Styling approach? (Tailwind, CSS Modules, Styled Components, etc.) | Determines theming, dark mode strategy, and component library compatibility |
| State management? (React Context, Zustand, Redux, Pinia, etc.) | Affects data flow complexity and testing strategy |
| Component library? (Headless UI, Radix, shadcn/ui, Vuetify, etc.) | Determines accessibility baseline and customization effort |
| Rich text editor? (TipTap, ProseMirror, Slate, MDX, etc.) | Critical if CMS or content editing is a feature |

**Stack-specific probes (load relevant skills dynamically):**
- If **Next.js** → load `nextjs-static-export-reliability` and ask:
  - Static or server export? If static: aware of `generateStaticParams` requirements?
  - Dynamic routes planned? How will empty datasets be handled at build time?
  - Environment variable strategy? (`NEXT_PUBLIC_*` baked at build time)
  - Image optimization strategy? (`unoptimized: true` for static export)
- If **Astro** → ask about island architecture, partial hydration strategy
- If **Remix** → ask about loader/action patterns, deployment target

### 3. Backend / BaaS

| Question | Why it matters |
|---|---|
| Custom API or BaaS? (Supabase, Firebase, Appwrite, custom Node/Python/Go) | Determines auth model, data access patterns, and operational complexity |
| Database type? (Postgres, MySQL, MongoDB, SQLite, etc.) | Affects querying, migration strategy, and hosting |
| Auth provider? (Supabase Auth, Firebase Auth, Auth0, Clerk, custom) | Determines OAuth flow, session management, and role model |
| File/media storage? (R2, S3, Supabase Storage, Firebase Storage) | Affects upload pipeline, CDN strategy, and cost |
| Edge functions / serverless? (Supabase Edge, Cloudflare Workers, AWS Lambda) | Determines server-side logic placement and cold start concerns |
| Real-time needs? (WebSockets, Supabase Realtime, Pusher, etc.) | Affects architecture complexity significantly |

**Stack-specific probes:**
- If **Supabase** → load `supabase-operations` and ask:
  - Row Level Security strategy? (per-table policies vs service role bypass)
  - Edge functions planned? (reminder: use `verify_jwt: false` + in-function auth)
  - Schema migration workflow? (Supabase CLI migrations vs dashboard)
  - Type generation strategy? (`supabase gen types`)
- If **Firebase** → ask about Firestore vs Realtime DB, security rules complexity
- If **Custom API** → ask about API framework, ORM, migration strategy

### 4. Hosting & Deployment

| Question | Why it matters |
|---|---|
| Hosting platform? (Cloudflare Pages, Vercel, Netlify, AWS Amplify, self-hosted) | Determines build pipeline, deploy hooks, preview environments |
| CI/CD? (Git-triggered, CLI deploy, GitHub Actions) | Affects automation level and rollback strategy |
| Preview/staging environments? | Critical for content verification before production |
| Custom domain? SSL? | Usually straightforward but affects OAuth callback URLs |
| CDN caching strategy? | Affects content freshness and deploy verification |

**Stack-specific probes:**
- If **Cloudflare Pages** → load `cloudflare-operations` and ask:
  - Pages or Workers? (static hosting vs edge compute)
  - Deploy hook for CMS-triggered rebuilds?
  - Preview branch strategy? (separate branch or deploy alias)
  - Aware of CDN cache lag on alias URLs post-deploy?
- If **Vercel** → ask about edge vs serverless functions, ISR strategy
- If **Netlify** → ask about build plugins, forms, identity

### 5. Media & Assets

| Question | Why it matters |
|---|---|
| Image storage? (R2, S3, Cloudinary, Supabase Storage) | Affects upload flow, transformation pipeline, and cost |
| Image optimization? (Build-time, CDN transform, client-side) | Determines `next/image` config, lazy loading strategy |
| Video/audio hosting? (Self-hosted, YouTube embed, Mux, etc.) | Affects page weight and embed strategy |
| Max upload size? File type restrictions? | Affects validation and UX |

### 6. Developer Experience

| Question | Why it matters |
|---|---|
| Monorepo or single repo? | Affects build config, shared packages, CI complexity |
| Linting/formatting? (ESLint, Prettier, Biome) | Consistency and CI gates |
| Testing strategy? (Unit, integration, E2E, visual regression) | Determines testing framework choices and CI pipeline |
| Environment management? (.env files, Vault, platform secrets) | Affects secret rotation and onboarding |

## Challenge Patterns

These are contradictions or risky combinations the interviewer should flag:

| Stated combination | Issue | Suggested alternative |
|---|---|---|
| Static export + real-time features | Static HTML cannot push live updates | Use SSR, or limit real-time to client-side polling/WebSocket overlay |
| Static export + ISR | ISR requires a runtime server | Choose pure SSG or move to SSR platform |
| Cloudflare Pages + SSR | Pages is static-only without Workers adapter | Use `output: "export"` or move to Cloudflare Workers |
| SPA + SEO requirements | SPAs are poorly crawled | Use SSG/SSR with hydration |
| Supabase + `cache: "no-store"` in static export | Incompatible with `output: "export"` | Clean `.next/` before builds instead |
| Multiple auth providers + static export | OAuth callback URLs must be baked per environment | Use `NEXT_PUBLIC_SITE_URL` pattern, not `window.location.origin` |
| No database + user accounts | Implicit data storage need | Clarify: are accounts stored in auth provider only, or do you need profiles/preferences? |

## Cross-Skill References

| Skill | When to load |
|---|---|
| `nextjs-static-export-reliability` | User selects Next.js with static export |
| `supabase-operations` | User selects Supabase for backend/auth |
| `cloudflare-operations` | User selects Cloudflare for hosting |
| `frontend-layout-pitfalls` | User describes complex admin layouts or viewport-fitting views |

## Output Format

After completing the tech stack interview, produce a structured summary:

```markdown
## Tech Stack Decisions
- **Rendering**: {strategy} — {rationale}
- **Frontend**: {framework} + {styling} + {state management}
- **Backend**: {BaaS/API} + {database} + {auth provider}
- **Hosting**: {platform} + {deploy strategy} + {preview setup}
- **Media**: {storage} + {optimization strategy}
- **DX**: {repo structure} + {linting} + {testing}

## Flagged Risks
- {risk 1}: {mitigation}

## Skills to Load During Implementation
- {skill 1}: {reason}
```
