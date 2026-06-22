---
name: workflow-diagram-generator
description: "**WORKFLOW SKILL** - Turn code, plans, or prose into human-readable workflow, architecture, or data-flow diagrams using a compact AST-like intermediate model. Use when: generate workflow diagram, make AST diagram, Cloudflare-style workflow graph, visualize control flow, Mermaid from code, diagram this plan, explain parallel branches, render workflow outline, draw system architecture, draw data flow, map services and stores."
argument-hint: "Provide the source material (code, prose, or plan), the view type (workflow, architecture, or data-flow), the preferred output format (Mermaid, JSON AST, or Markdown outline), and whether inferred relationships should be labeled explicitly."
portability: adapt-port
source-skill: Cloudflare workflow-diagram research + internal toolchain design
overlap-gate:
  existing-skill: workflow/documentation-manager
  overlap-score: 34
  decision: create-new
---

# Workflow Diagram Generator

Portability tag: adapt-port.

Use this skill to convert workflow-like or system-structure source material into a readable diagram
without claiming exact runtime execution or exhaustive system truth unless the source makes it explicit.

## Default Outputs

- **Mermaid** is the default rendering format.
- **JSON AST** is the structured intermediate representation.
- **Markdown outline** is the fallback when graph rendering would be noisy or ambiguous.

If the user requests only one format, keep the same intermediate model internally and emit only the
requested output.

## Scope

Supported view types:

- **Workflow / control flow**
- **Architecture / component topology**
- **Data flow / request flow**

Best for:

- approvals, retries, background jobs, agent orchestration, multi-step automations,
  branching processes, loops, waits, sleeps, and parallel fan-out/fan-in flows
- services, boundaries, actors, queues, storage, and integration topology
- request paths, event propagation, ingestion pipelines, and read/write data movement

Input can be:

- code snippets
- natural-language process descriptions
- requirements docs, runbooks, ADRs, or session plans

Focus on human readability over exhaustive fidelity.

## Non-Goals

- Do not present this as a literal source-code AST.
- Do not promise deterministic code-to-diagram conversion.
- Do not silently invent scheduler-accurate runtime semantics or production topology from weak evidence.
- Do not expand this skill into ER diagrams, sequence diagrams, or call graphs unless the user explicitly
  requests those families.

## Diagram Grammar

Use a compact node vocabulary inspired by Cloudflare-style workflow readability, extended for structure
views:

| Node | Use for |
|---|---|
| `start` | Workflow entrypoint or setup boundary |
| `block` | Ordered sequence of steps |
| `step` | One concrete action or named stage |
| `wait` | Human input, event wait, sleep, timeout, or external blocking condition |
| `parallel` | Fan-out groups that start together |
| `loop` | Repeated work (`for`, `while`, retry, poll, review loop) |
| `if` | Conditional branch with explicit conditions |
| `switch` | Multi-branch routing by state or type |
| `try` | Try/catch/finally style recovery paths |
| `function_group` | Helper/function grouping when it clarifies flow |
| `break` | Early exit or explicit stop condition |
| `actor` | Human or external initiator |
| `system` | Service, app, worker, or bounded component |
| `store` | Database, bucket, cache, queue, or durable state |
| `boundary` | Environment, domain, or trust boundary |
| `flow` | Explicit data or request path |

Choose the smallest grammar that fits the requested view. Workflow diagrams should stay workflow-first;
architecture and data-flow views should prefer `actor`, `system`, `store`, `boundary`, and `flow`.

## Intermediate Representation

Use this JSON shape when the user requests structured output or when Mermaid needs a stable backing
model:

```json
{
  "type": "block",
  "name": "main flow",
  "condition": "optional branch condition",
  "kind": "all",
  "inferred": false,
  "starts": 1,
  "resolves": 2,
  "source": "optional producer",
  "target": "optional consumer",
  "protocol": "optional request/event/storage label",
  "notes": ["optional caveats or collapse notes"],
  "nodes": []
}
```

Field rules:

- `type` is required.
- `name` is required for `step`, `wait`, `function_group`, and helpful for `loop` or `block` labels.
- `nodes` contains children for `block`, `parallel`, `loop`, `try`, and `function_group`.
- `condition` is used for `if` branches and loop guards when useful.
- `kind` is used for `parallel` nodes (`all`, `any`, or `inferred`).
- `inferred` must be `true` when the source implies a relationship instead of stating it directly.
- `starts` and `resolves` are optional readability metadata for parallel alignment. Treat them as
  relative grouping hints, not as exact scheduler truth.
- `source`, `target`, and `protocol` are used for explicit architecture or data-flow edges when a graph
  needs relationship metadata rather than only hierarchy.

## Procedure

### Step 1: Intake And Output Contract

1. Identify the source type: code, prose, plan, or mixed.
2. Identify the requested view type:
  - workflow
  - architecture
  - data-flow
  - mixed, if the user wants two complementary views
3. If the user does not specify a view, infer the best default:
  - actions, retries, approvals -> workflow
  - services, boundaries, stores -> architecture
  - requests, events, reads/writes -> data-flow
4. Confirm the desired output:
  - Mermaid
  - JSON AST
  - Markdown outline
5. Confirm the audience:
  - quick human explanation
  - implementation handoff
  - documentation artifact
6. If the source is large, ask whether the user wants a summary view or a detailed view.

### Step 2: Normalize The Source

Extract only diagram-relevant structure for the chosen view:

Workflow:

- named actions
- order dependencies
- branch conditions
- loop boundaries and retry limits
- waits, sleeps, or approval gates
- parallel work that clearly fans out and joins later

Architecture:

- actors and external systems
- core services or components
- storage and queue boundaries
- trust or environment boundaries
- major dependencies and ownership boundaries

Data flow:

- producers and consumers
- request, event, or storage paths
- direction of movement
- protocols or channels when stated (`HTTP`, queue, webhook, DB write, cache read)
- transformation or aggregation points only when they matter to understanding the path

Ignore low-value implementation detail:

- local data transforms without workflow effect
- helper functions that do not change control flow
- leaf helpers with no direct or indirect workflow step relevance
- classes/modules that add no architectural or flow-level distinction

### Step 3: Build The AST-Like Model

Workflow:

1. Start with a `start` node and one top-level `block`.
2. Convert each concrete action into a `step` or `wait` node.
3. Use `parallel` only when the source clearly shows concurrent work or coordinated fan-out.
4. Use `function_group` only when grouping improves readability; trim it if it becomes a leaf with no
  workflow value.
5. Preserve loops and branches as explicit container nodes instead of flattening them.

Architecture:

1. Start with `actor`, `system`, `store`, and `boundary` nodes.
2. Group by trust, ownership, or deployment boundary only when it improves understanding.
3. Represent relationships with `flow` edges or adjacency notes, not nested noise.
4. Collapse internal implementation detail into one labeled system when subcomponents do not matter.

Data flow:

1. Start with the producer and the final consumer or sink.
2. Insert only meaningful intermediate systems and stores.
3. Label directional edges with protocol or action when known.
4. Distinguish reads, writes, emits, receives, and transforms when they change meaning.

For all views, when a relationship is only implied, mark the relevant node or edge with `inferred: true`.

### Step 4: Apply Readability Heuristics

Follow these rules before rendering:

- Prefer 8-15 meaningful nodes over 30 noisy nodes.
- Collapse repeated helper detail into a named step when it does not change control flow.
- Use subgraphs for parallel groups and complex retry loops.
- Keep wait states visually distinct from ordinary steps.
- Show joins after parallel work instead of leaving branches dangling.
- Use simple labels taken from the source when possible; otherwise generate direct action labels.
- In architecture views, show ownership or trust boundaries only when they help orientation.
- In data-flow views, prefer a clean left-to-right path over a component inventory dump.

Cloudflare-style heuristics to borrow safely:

- Immediately awaited work usually stays sequential.
- Explicit fan-out, unawaited work, or grouped concurrent descriptions can become `parallel`.
- Wait-for-event, approval, timeout, and sleep steps should read like blocking states, not generic work.
- Helper functions belong in the diagram only if they contain direct or indirect workflow relevance.

Additional heuristics for extension views:

- Architecture diagrams should answer "what talks to what" before "how is code organized".
- Data-flow diagrams should answer "where does the data/request go" before "which class implements it".
- If both structure and flow matter, emit two small diagrams instead of one overloaded diagram.

### Step 5: Render The Output

#### Mermaid

- Default to `flowchart TD` unless left-to-right materially improves readability.
- Use subgraphs for `parallel`, `loop`, and `function_group` nodes.
- Label branch edges with conditions.
- Keep node labels short and human-readable.
- For architecture or data-flow views, prefer `flowchart LR` when it materially improves left-to-right
  path readability.
- Use subgraphs for `boundary` nodes and labeled edges for `flow` relationships.

#### JSON AST

- Emit the compact intermediate model only.
- Include `inferred`, `starts`, and `resolves` only when they add clarity.
- Do not emit placeholder fields with empty strings.

#### Markdown Outline

- Use nested numbered or bulleted structure to mirror the same flow.
- Make control-flow boundaries explicit: `if`, `else`, `retry loop`, `parallel`, `join`, `wait`.
- For architecture views, list boundaries, systems, stores, and major connections.
- For data-flow views, list producer -> intermediary -> consumer paths with explicit verbs.

### Step 6: Validate Before Returning

Check these conditions:

- Every important named step from the source is either represented or consciously collapsed.
- Parallel branches rejoin somewhere explicit.
- Loops are not flattened into fake straight-line flow.
- Branch conditions are labeled, not implied.
- Any uncertain interpretation is marked as inferred.
- Architecture diagrams have clear boundaries and primary connections, not a class inventory.
- Data-flow diagrams have clear directionality and do not hide the sink or storage endpoints.

If the diagram is still too dense, return two views:

1. summary Mermaid or outline
2. detailed JSON AST

## Safety Defaults And Fallback Behavior

- Default to Mermaid plus a short explanation when no format is specified.
- If the source is ambiguous, ask one focused clarification question or mark the uncertain nodes as
  inferred.
- If Mermaid would become unreadable, fall back to Markdown outline and offer a grouped Mermaid version.
- Never describe the diagram as exact runtime truth unless the source explicitly establishes it.
- When translating code, state that the result is a human-readable workflow interpretation, not a
  deterministic compiler artifact.
- For architecture or data-flow views, state that the result is a high-level map intended for human
  understanding, not a complete infrastructure inventory.

## Output Checklist

- Source type identified
- Output format chosen
- Workflow-relevant structure normalized
- AST-like model built
- Parallel, wait, branch, and loop semantics preserved
- Architecture/data-flow relationships preserved when those views are requested
- Inference and uncertainty labeled when needed
- Final diagram optimized for human reading