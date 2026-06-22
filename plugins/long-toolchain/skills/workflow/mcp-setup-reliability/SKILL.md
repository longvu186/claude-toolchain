---
name: mcp-setup-reliability
description: "**WORKFLOW SKILL** - Configure MCP servers so they appear reliably across clients, then verify detection and startup. Use when: MCP server does not appear in UI, server exists but is not detected, config schema mismatch (`servers` vs `mcpServers`), wrong config file location, or command/env wiring issues. Trigger phrases: setup mcp, mcp not showing, server missing in mcp panel, fix mcp config, mcp json issue."
argument-hint: "Provide the MCP server name, command, target client, and whether auth should use env vars or OAuth."
---

# MCP Setup Reliability

Use this workflow to prevent the common "configured but not visible" MCP issue.

## Canonical Rules

1. Write MCP config in BOTH common workspace locations when client behavior is uncertain:
- `.vscode/mcp.json`
- `mcp.json`

2. Include BOTH schema keys when compatibility is uncertain:
- `servers` (common VS Code schema)
- `mcpServers` (other MCP clients)

3. Keep server command minimal and testable:
- `command: "npx"`
- `args: ["<package>", "proxy"]`

4. Put secrets in env vars and keep configs local/non-committed whenever possible.

## Golden Config Template

```json
{
  "servers": {
    "stitch": {
      "type": "stdio",
      "command": "npx",
      "args": ["google-stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  },
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["google-stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

## Verification Checklist (Mandatory)

1. Validate files exist:
- `.vscode/mcp.json`
- `mcp.json`

2. Validate command resolves:
- `npx -y google-stitch-mcp --help`
- `npx -y google-stitch-mcp proxy --help`

3. Validate JSON shape:
- top-level object present
- server key present under `servers` and/or `mcpServers`
- stdio servers include `type: "stdio"` where required

4. Refresh client detection:
- Run "Developer: Reload Window"
- If still missing, restart IDE fully

5. If still missing, diagnose:
- Confirm client actually reads workspace MCP config
- Check extension/client logs for MCP parse/start errors
- Temporarily remove duplicate/invalid keys and retry

## Symptom -> Fix Map

- Symptom: MCP server not listed in panel.
  Fix: add `servers` key and place config in `.vscode/mcp.json` and `mcp.json`.

- Symptom: MCP file exists but ignored.
  Fix: move/duplicate to correct workspace root and reload window.

- Symptom: Listed but fails to start.
  Fix: verify package command with `npx ... --help`, then validate env vars.

- Symptom: Works in one client, not another.
  Fix: keep dual schema (`servers` + `mcpServers`) unless client docs explicitly require one.

## Provenance

- Added from BeeApp workspace issue on 2026-03-30 after Stitch MCP config was present but not visible in client UI due to schema/location ambiguity.
