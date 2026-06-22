---
name: crawl4ai-web-research
description: "**WORKFLOW SKILL** - Use Crawl4AI as the default path for public website crawling, markdown extraction, and URL-based research. Use when: crawl a site, read a URL, scrape public content, summarize webpage content, extract links from a page, or gather public website information without needing screenshots or complex interaction."
argument-hint: "Provide the URL or list of URLs, the output shape you need (markdown/json/html), and whether freshness matters."
---

# Crawl4AI Web Research

Use this skill when the task is primarily about reading or extracting information from public URLs.

## When To Use

- Read a public webpage and summarize it
- Extract page content as markdown for later reasoning
- Pull links or structured page output for research
- Crawl a small list of public URLs without screenshots
- Replace ad hoc browser use when no visual inspection is needed

## Do Not Use This Skill First When

- The task requires screenshots, pixel comparisons, or visual design analysis
- The site requires login, MFA, or manual session setup
- The task depends on multi-step clicking, uploads, downloads, or prolonged interaction
- A browser page is already shared and the user explicitly wants browser-driven work

In those cases, escalate to browser or Playwright workflows.

## Default Commands

### Readable markdown

```powershell
& "C:\Users\longv\.claude\scripts\crawl4ai-url.ps1" "https://example.com"
```

### Fresh markdown

```powershell
& "C:\Users\longv\.claude\scripts\crawl4ai-url.ps1" "https://example.com" -BypassCache
```

### Machine-friendly output

```powershell
& "C:\Users\longv\.claude\scripts\crawl4ai-url.ps1" "https://example.com" -Output json -BypassCache
```

### Direct CLI fallback

```powershell
& "C:\Users\longv\.copilot\tools\crawl4ai\Scripts\crwl.exe" "https://example.com" -o markdown --bypass-cache
```

## Procedure

1. Decide whether the task is text-first or browser-first.
2. If text-first, run the Crawl4AI wrapper against the target URL.
3. Choose `markdown` for reading, `json` for richer extraction, `html` only when raw rendered markup is necessary.
4. Summarize or post-process the output instead of opening a browser immediately.
5. Escalate to browser tools only if Crawl4AI is blocked or the task needs screenshots or interaction state.

## Fallback Behavior

- The local PowerShell wrapper accepts `-Output` for output-shape selection; `-Format` is not a valid parameter on that wrapper.
- If the wrapper fails, retry once with `-BypassCache` or direct `crwl.exe`.
- If Crawl4AI itself appears unhealthy, run:

```powershell
& "C:\Users\longv\.copilot\tools\crawl4ai\Scripts\crawl4ai-doctor.exe"
```

- If the page is highly interactive or auth-gated, stop forcing Crawl4AI and switch to browser tooling.

## Output Checklist

- URL and retrieval mode captured
- Crawl4AI output type chosen intentionally
- Key findings extracted from the result
- Browser escalation explicitly justified when used