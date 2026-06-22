---
name: feature-blog-public-experience
description: "FEATURE SKILL - Build public blog/news experiences: home feed, article detail, taxonomy pages, search, SEO, and engagement actions. Use for list/detail flows, related content, comments/saves/shares, and crawl-friendly page output. Trigger phrases: build blog page, article list page, category page, tag page, search page, seo for blog."
argument-hint: "Describe content discovery surfaces, SEO requirements, engagement features, and deployment model (SSR/static)."
---

# Feature Skill: Blog Public Experience

Reusable feature playbook for public article/news experiences.

## Feature Scope

- Homepage content hierarchy (featured/latest/popular/categories).
- Article list/detail pages with taxonomy filters.
- Category/tag/search pages.
- Engagement actions (comments, saves, shares, views).
- SEO and structured data for discoverability.

## Preferred Build Pattern

1. Define canonical article contract (title, slug, status, author, dates, taxonomy).
2. Keep the homepage focused on orientation, trust, and content discovery; if the product also ships quizzes, scanners, or self-serve utilities, move them to a dedicated `tools` route instead of leading with them on `/`.
3. Build list/detail pages with shared card primitives.
4. Implement category/tag/search consistency on same query model.
5. Add engagement actions with clear auth boundary.
6. Implement metadata, canonical URLs, sitemap/RSS where needed.

## Common Pitfalls

- Letting interactive utilities dominate a public-trust homepage, which makes the site feel too technical before credibility and routing are established.
- List page surfacing slugs not available in deployed static detail pages.
- Author/source ambiguity (creator vs assigned writer) across surfaces.
- Inconsistent taxonomy behavior between list/category/tag/search.
- Metadata URL generation using runtime origin instead of environment contract.
- Filter/sort controls update state while cards still render from the unfiltered source collection.
- Card CTA links target a detail route that is not registered (or not deployed) in the router map.

## Validation Checklist

- List/detail/taxonomy/search all resolve consistent content sets.
- Filter/sort controls mutate the rendered collection and produce deterministic ordering.
- Every card CTA resolves to a registered detail route with required identifier params.
- Detail pages include metadata + structured data as required.
- Comments/saves/shares enforce auth and degrade gracefully when logged out.
- View counters and popularity sorting are coherent.
- RSS/sitemap include expected published items.
- For SPA deployments, validate CTA href contracts via browser DOM or deployed bundle token checks, not route HTML fetch alone.

## Works With Technical Skills

- `nextjs-static-export-reliability`: static-export list/detail alignment and generateStaticParams safety.
- `supabase-operations`: query consistency, nullable handling, type-safe relations.
- `cloudflare-operations`: post-deploy validation and cache propagation checks.

## Output Contract

When invoked, provide:

1. Route + data dependency map.
2. SEO/crawlability plan.
3. Engagement feature boundary map (guest vs auth).
4. Validation matrix for list/detail/taxonomy/search coherence.
