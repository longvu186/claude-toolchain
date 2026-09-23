# Vendored skill — provenance

- Source: https://github.com/shadcn-ui/ui
- Commit: 98a1fe6
- Vendored: 2026-09-23 (interactive session, operator-authorized)
- Local modifications: pinned every shadcn@4.12.0 to shadcn@4.12.0 (HQ's installed version) so all hosts run the same CLI; replaced the load-time auto-exec line (!`npx shadcn@4.12.0 info --json`) with a plain instruction so loading the skill never executes a network-fetched package

Do not auto-update. Re-vendor deliberately: review the upstream diff, then bump the commit here.
