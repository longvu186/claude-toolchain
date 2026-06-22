---
name: feature-cms-content-workflow
description: "FEATURE SKILL - Build CMS editorial workflows for content teams with lifecycle-complete content operations. Use for article CRUD, status pipelines, assignment/review flows, scheduling, media handling, and publishing/deploy handoffs. Trigger phrases: build cms, editorial workflow, article management, content statuses, review flow, scheduling, media library."
argument-hint: "Describe content types, status pipeline, assignment/review requirements, scheduling rules, and media strategy."
---

# Feature Skill: CMS Content Workflow

Reusable feature playbook for editorial CMS systems.

## Feature Scope

- Content CRUD with metadata and SEO fields.
- Status pipeline (`draft`, `in-progress`, `review`, `scheduled`, `published`, etc.).
- Content lifecycle actions (`archive`, `restore`, `soft_delete`, `hard_delete` policy).
- Assignment model (writer/reviewer) and deadline tracking.
- Media workflow (upload, attach, replace, remove).
- Publish/deploy coordination.

## Preferred Build Pattern

1. Define content schema and status enum first.
2. Define lifecycle policy (`archive`, `restore`, delete windows, and restore constraints).
3. Build editor with autosave-safe UX and validation.
4. Implement assignment and review comments as first-class data.
5. Add scheduling flow with cron/publish guard.
6. Couple publish events with deploy workflow expectations.

## Common Pitfalls

- Status enum expanded but UI/query filters not updated everywhere.
- Scheduled publish without deploy coordination in static sites.
- Media attachments drifting from editor content.
- Reviewer flow tracked in UI only, not persisted in data model.
- Deleting lessons/content without archive or restore path, causing irreversible authoring loss.

## Content Lifecycle Baseline

For each content type, define and implement:

- archive and restore
- soft delete and restore window
- hard delete policy and approval level
- publish/unpublish compatibility with archived and deleted states

If versioning exists, define how lifecycle actions affect historical versions and learner visibility.

## Validation Checklist

- End-to-end publish path from draft to live is testable.
- Assignment/reviewer fields influence filters and analytics correctly.
- Scheduled items publish as expected and are visible after deploy.
- Media list and editor body remain in sync.
- SEO metadata paths are complete and valid.
- Archive/restore and delete/restore flows are implemented and tested.
- Lifecycle state filters are reflected in both UI and query paths.
- Delete operations define cascade/orphan behavior for related entities.
- Lifecycle mutations emit audit events.

## Works With Technical Skills

- `supabase-operations`: schema migrations, RLS, RPC/cron publication flows.
- `nextjs-static-export-reliability`: static export implications for publish/schedule workflows.
- `cloudflare-operations`: deploy verification and alias-vs-unique URL checks.
- `entity-lifecycle-operations`: lifecycle matrix for content entities.
- `role-based-access-control`: editor/reviewer/admin action boundaries.
- `audit-logging-patterns`: content transition and delete audit trails.

## Output Contract

When invoked, provide:

1. Workflow state machine.
2. Data model + UI surface mapping.
3. Lifecycle action matrix for each content type.
4. Publish/deploy integration plan.
5. Validation checklist and rollout risks.
