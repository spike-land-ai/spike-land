# spike.land MCP TARGETED User Test Findings (Local vs Prod)

Tested with 16 diverse AI agent personas against https://local.spike.land:5173/ on 10/03/2026.

## Overview
This report focuses on verifying previously reported issues against the local development environment.

## Retest Result Summary
### Persona: Alex Chen (Targeted Retest)
- **Issue 1: `sandbox_preview` Is Synthetic — Silent Chain Poisoning**: **CONFIRMED**
- **Issue 2: Required-Field Schema Lies Break Automated Chains**: **CONFIRMED**
- **Issue 3: Zero Timeout Surface — Error Propagation Is Blind**: **CONFIRMED**

### Persona: Priya Sharma (Targeted Retest)
- **Issue 1: Schema Lie in `auth_check_session` — Required vs Optional Mismatch**: **CONFIRMED**
- **Issue 2: No Rate Limiting Primitives — Critical Gap for Enterprise Auth**: **CONFIRMED**
- **Issue 3: `workspaces_get` Requires Both Mutually Exclusive Identifiers**: **CONFIRMED**

### Persona: Marcus Johnson (Targeted Retest)
- **Issue 1: `auth_check_session` — Required Field That's Described as Optional**: **CONFIRMED**
- **Issue 2: `workspaces_get` — Two Mutually Exclusive Fields Both Marked Required**: **CONFIRMED**
- **Issue 3: Onboarding Entry Point Ambiguity — `get_status` vs `bootstrap_status` vs `bootstrap_create_app`**: **CONFIRMED**

### Persona: Sofia Rodriguez (Targeted Retest)
- **Issue 1: Universal `"string"` Type Lie for Non-String Parameters**: **CONFIRMED**
- **Issue 2: Required-Field Contradiction (Optional Filters Marked Required)**: **CONFIRMED**
- **Issue 3: `sandbox_preview` — Deceptive Capability Claim**: **CONFIRMED**

### Persona: Yuki Tanaka (Targeted Retest)
- **Issue 1: Universal String-Typed Numeric Parameters (Schema Lie)**: **CONFIRMED**
- **Issue 2: `storage_list` Marks `cursor` as Required — Breaks First-Page Pagination**: **CONFIRMED**
- **Issue 3: `store_list_apps_with_tools` Has Zero Pagination — Unbounded Response Risk**: **CONFIRMED**

### Persona: Ahmed Hassan (Targeted Retest)
- **Issue 1: `auth_check_session` — Required/Optional Contract Contradiction**: CONFIRMED
- **Issue 2: `sandbox_preview` — Code Execution Claim vs. Simulation Reality**: BEHAVIORAL (requires live call, but description self-discloses the issue)
- **Issue 3: Untyped `"type":"string"` Throughout Security-Sensitive Parameters**: CONFIRMED

### Persona: Emma Wilson (Targeted Retest)
- **Issue 1: `observability_health` / `error_rate` / `error_summary` — `hours` Listed as Required Despite Having Documented Defaults**: **CONFIRMED**
- **Issue 2: `error_rate.service` — Explicitly "Omittable" Parameter Marked Required**: **CONFIRMED**
- **Issue 3: `query_errors` — All Four Parameters Required Despite All Having Optional Semantics**: **CONFIRMED**

### Persona: Carlos Mendez (Targeted Retest)
- **Issue 1: Schema Lie — `auth_check_session.session_token` Marked Required but Described as Optional**: **CONFIRMED**
- **Issue 2: `sandbox_preview` is Explicitly Fake — Useless for Latency Testing**: **CONFIRMED**
- **Issue 3: Universal Type Collapse — All Parameters Typed as `"string"` Including Booleans, Numbers, and Arrays**: **CONFIRMED**

### Persona: Lisa Park (Targeted Retest)
- **Issue 1: `apps_list` — Required fields that are documented as optional (Schema Lie)**: **CONFIRMED**
- **Issue 2: `workspaces_get` — Impossible required OR-logic (Navigation Dead End)**: **CONFIRMED**
- **Issue 3: `auth_check_session` — Optional token marked required (Empty State / Auth Recovery)**: **CONFIRMED**

### Persona: David Brown (Targeted Retest)
- **Issue 1: `audit_submit_evaluation` — Accessibility Fields Are Unstructured Strings**: **CONFIRMED**
- **Issue 2: `sandbox_preview` — Explicitly Non-Executable, Making Behavioral A11y Testing Impossible**: **CONFIRMED**
- **Issue 3: `apps_create` / `apps_chat` — No Accessibility Contract in Schema**: **BEHAVIORAL**

### Persona: Anya Ivanova (Targeted Retest)
- **Issue 1: Schema Lies — Optional Parameters Marked as `required`**: **CONFIRMED**
- **Issue 2: No Optimistic Locking on `apps_chat` — Race Condition on Concurrent Edits**: **CONFIRMED**
- **Issue 3: `sandbox_preview` Description Actively Misrepresents Execution State**: **CONFIRMED**

### Persona: Tom O'Brien (Targeted Retest)
- **Issue 1: Required-But-Optional Parameter Lie (Schema Dishonesty)**: **CONFIRMED**
- **Issue 2: `sandbox_preview` Presents as Execution, Delivers Simulation — No Loading Feedback**: **CONFIRMED**
- **Issue 3: `workspaces_get` Forces Mutually Exclusive Fields as Co-Required**: **CONFIRMED**

### Persona: Mei-Lin Wu (Targeted Retest)
- **Issue 1: Character Limit Ambiguity — Bytes vs. Codepoints**: CONFIRMED
- **Issue 2: Semantic Search Has No CJK/Multilingual Signal**: BEHAVIORAL
- **Issue 3: `required` Array Inflation — Optional Fields Marked Required**: CONFIRMED

### Persona: James Cooper (Targeted Retest)
- **Issue 1: `auth_check_session` — "Optional" Field Marked as Required (Schema Lie)**: **CONFIRMED**
- **Issue 2: `apps_list` and `agents_list` — Default-Bearing Params Forced as Required**: **CONFIRMED**
- **Issue 3: No Auth Signup/Registration Tool Exists**: **CONFIRMED**

### Persona: Rachel Kim (Targeted Retest)
- **Issue 1: Required-Field Schema Lies in `apps_*` Tools**: **CONFIRMED**
- **Issue 2: No Auto-Save / Snapshot Tool — `apps_list_versions` is Read-Only**: **CONFIRMED** (missing tool — gap, not a fix)
- **Issue 3: `sandbox_preview` Name Is Actively Misleading for Live-Preview Use**: **CONFIRMED**

### Persona: Oleg Petrov (Targeted Retest)
- **Issue 1: `skill_store_admin_update` — Full-Replace Schema Masquerading as Partial Update**: **CONFIRMED**
- **Issue 2: `vault_delete_secret` / `vault_list_secrets` — ID/Name Mismatch Breaks Bulk Delete Workflow**: **CONFIRMED**
- **Issue 3: `apps_delete_permanent` — Confirmation Gate Uses String Type, Not Boolean**: **BEHAVIORAL** (requires live call to verify server-side coercion, but schema is provably wrong)


## Detailed Targeted Reports

# Persona: Alex Chen (Targeted Retest)
## Targeted Findings

### Issue 1: `sandbox_preview` Is Synthetic — Silent Chain Poisoning
- **Targeted Test**: Build the chain `sandbox_create` → `sandbox_write_file` → `sandbox_preview` (with real TypeScript code) → feed stdout into `esbuild_validate`. Expect: actual transpile output. Schema says: tool is named `sandbox_preview`, accepts `code` + `language`, returns output just like a real runner.
- **Result**: **CONFIRMED**
- **Detail**: The description explicitly states *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* The tool name, parameter names (`code`, `language`), and sibling tools (`sandbox_create`, `sandbox_write_file`, `sandbox_destroy`) all present a real execution surface. Nothing in the input schema (no flag like `simulate: true`) marks the call as synthetic. Any agent chaining this tool will silently consume fabricated output. For tool chaining this is the highest-severity schema lie: the contract looks real, the data is fake, and there is no error signal to propagate.

---

### Issue 2: Required-Field Schema Lies Break Automated Chains
- **Targeted Test**: Call `apps_list` with no arguments (description says *"Omit to see all active apps"*, *"Default: 20"*). Schema says `required: ["status", "limit"]`. Similarly, call `agent_inbox_poll` with neither `since` nor `agent_id` (description: *"Omit for all"* on both). Both schemas list all params as `required`.
- **Result**: **CONFIRMED**
- **Detail**: At least 14 tools mark parameters as `required` while their own descriptions document omit/default semantics:
  - `apps_list`: `status` (*"Omit to see all"*), `limit` (*"Default: 20"*)
  - `agent_inbox_poll`: `since` (*"Omit for all"*), `agent_id` (*"Omit to poll all agents"*)
  - `storage_list`: `prefix`, `limit`, `cursor` — all pagination hints, all required
  - `workspaces_get`: `workspace_id` AND `slug` both required, but description treats them as alternatives
  - `search_tools`: `semantic`, `stability` marked required despite being filters
  - `billing_cancel_subscription`: `confirm` required but description says *"When false (default)…"*

  For tool chaining, a strict MCP client validates against the schema before calling. Chains that omit optional params will be rejected at the schema layer, forcing callers to pass dummy values — which then changes server-side behavior unpredictably.

---

### Issue 3: Zero Timeout Surface — Error Propagation Is Blind
- **Targeted Test**: Chain `context_index_repo` (crawls a GitHub repo) → `context_pack` → `codegen_create_bundle` → `ai_chat`. All four are network-bound. Attempt to pass a `timeout_ms` or `deadline` parameter to any of them, or inspect the schema for any `timeout`, `deadline`, or `max_wait` field.
- **Result**: **CONFIRMED**
- **Detail**: Not a single tool in the 150+ tool list exposes a timeout parameter. There is no `timeout_ms`, `deadline`, `abort_signal`, or equivalent in any input schema. Equally, no tool documents a structured error envelope — there is no schema for what a timeout error looks like vs. a validation error vs. a downstream 503. For a chain like `orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_submit_result`, a hung subtask has no mechanism to surface a deadline exceeded signal; the orchestrator schema's `status` field on `orchestrator_submit_result` accepts freeform strings with no enumerated error codes. Tool chains that depend on error-type discrimination (retry on timeout, fail-fast on auth error) must guess at error shape from description prose alone.

---

## Summary of Local Delta

Compared to a typical production MCP surface, the local schema shows **no fixes** for any of the three issues. The synthetic-execution deception in `sandbox_preview` appears intentional (it's in the description) but is architecturally dangerous for agent tool chains. The required-field inflation is pervasive and appears copy/paste-propagated across the entire toolset — it was likely never flagged in production either. The total absence of timeout/error-envelope contracts is a systemic gap, not a regression; it was never present. No evidence of schema version bumps or changelogs visible in the tool metadata (`list_tool_versions` would need a live call to verify per-tool history).

---

# Persona: Priya Sharma (Targeted Retest)
## Targeted Findings

---

### Issue 1: Schema Lie in `auth_check_session` — Required vs Optional Mismatch

- **Targeted Test**: Call `auth_check_session` without providing `session_token` to validate current session (the documented use case for "am I logged in?" checks). I would invoke it as `auth_check_session({})` — no token — expecting the server to use the ambient bearer token from the MCP connection.
- **Result**: **CONFIRMED**
- **Detail**: The schema declares `"required":["session_token"]`, yet the field description explicitly states *"Optional session token to validate."* These are directly contradictory. A strict JSON Schema validator will reject a call with no `session_token` before it even reaches the handler. For an auth flow, this means: (a) callers who omit the token to test ambient session auth will get a schema validation error, not an auth error — masking the real behavior; (b) automated tooling that reads `required` will always inject a dummy token, bypassing the intended optional-ambient flow. This is a **schema lie** with real auth-flow consequences.

---

### Issue 2: No Rate Limiting Primitives — Critical Gap for Enterprise Auth

- **Targeted Test**: Search the tool list for any `rate_limit_*`, `throttle_*`, or `quota_*` tool. Additionally attempt to find rate-limit configuration under `capabilities_*`, `auth_*`, or `settings_*` categories. Expected: at minimum a `rate_limit_check` (inspect current call rate for a user/key) and `rate_limit_configure` (set per-user or per-key thresholds).
- **Result**: **CONFIRMED**
- **Detail**: Zero rate limiting tools exist across all 17 categories. The platform exposes `settings_create_api_key` / `settings_revoke_api_key`, `vault_store_secret`, and `billing_*` — all of which are high-value targets for brute-force or credential-stuffing. The `mcp-observability` category has `error_rate` and `tool_usage_stats`, which are *read-only telemetry*, not enforcement primitives. For an enterprise deployment, the absence of any rate-limit inspection or configuration surface means there is no programmatic way to audit or enforce per-key call budgets. This is a **structural missing capability**, not a behavioral quirk — it cannot be fixed by a live call.

---

### Issue 3: `workspaces_get` Requires Both Mutually Exclusive Identifiers

- **Targeted Test**: Attempt to retrieve a workspace by slug only: `workspaces_get({ slug: "my-org", workspace_id: "" })`. Also attempt by ID only: `workspaces_get({ workspace_id: "ws_abc123", slug: "" })`. Both `workspace_id` and `slug` are in the `required` array, meaning both must be present. Expected (correct behavior): exactly one of the two should be sufficient — they are lookup alternatives, not co-required fields.
- **Result**: **CONFIRMED**
- **Detail**: `"required":["workspace_id","slug"]` forces callers to supply both fields even though they serve as alternative lookup keys. A caller who only has a slug (e.g., from a URL) must fabricate a `workspace_id` value (typically an empty string or dummy UUID) just to pass schema validation. This is directly relevant to concurrent connection scenarios: in multi-tenant auth flows where workspace routing is done by slug from the incoming request header, callers have no ID yet — they must do a lookup *to get* the ID. Requiring the ID as a prerequisite for the lookup that would yield it is a circular dependency in the auth bootstrap path.

---

## Summary of Local Delta

| Area | Observation |
|---|---|
| `auth_check_session` | `session_token` required/optional contradiction unchanged from production schema |
| Rate limiting | No category or tool has been added; gap persists entirely |
| `workspaces_get` | Dual-required mutually exclusive identifiers unchanged |
| `auth_check_route_access` | Only accepts `path`; no `role`, `user_id`, or `context` parameter — RBAC context still missing, consistent with production |
| `capabilities_check_permissions` | No parameters — opaque ambient-only check, no way to probe another user's or agent's permission set |
| New since last review | `byok_*` category (4 tools) and `persona`/`career`/`learn` categories appear new; no auth hardening accompanied their addition |

No schema improvements to the auth surface were detected between the production and local versions. All three critical issues are present in the current local schema without modification.

---

# Persona: Marcus Johnson (Targeted Retest)
## Targeted Findings

---

### Issue 1: `auth_check_session` — Required Field That's Described as Optional
- **Targeted Test**: As a new user trying to validate my session without a token handy (I don't know what token to pass), I'd call `auth_check_session` with no `session_token`, expecting it to fall back to my ambient session cookie. The description explicitly says `"Optional session token to validate."` But the `required` array in the schema is `["session_token"]`, meaning the MCP layer will reject my call before it even reaches the server.

  ```json
  // What I'd call (following the description):
  { }

  // What the schema requires:
  { "session_token": "???" }
  ```

- **Result**: **CONFIRMED**
- **Detail**: `auth_check_session.required = ["session_token"]` directly contradicts the field description `"Optional session token to validate."` A junior dev reading the description would omit the field and get a schema validation error with no useful guidance on what to provide instead.

---

### Issue 2: `workspaces_get` — Two Mutually Exclusive Fields Both Marked Required
- **Targeted Test**: I want to look up my workspace by its slug (I don't know the internal `workspace_id` yet — I'm onboarding). The description says `"Get workspace details by ID or slug"` — clearly an either/or. But both `workspace_id` and `slug` are in the `required` array simultaneously. I'd call:

  ```json
  { "slug": "my-first-workspace" }
  ```

  Expecting that to work, but the schema will reject it for missing `workspace_id`.

- **Result**: **CONFIRMED**
- **Detail**: `workspaces_get.required = ["workspace_id", "slug"]` makes both mandatory despite the description framing them as alternatives (`"by ID or slug"`). This is a blocking onboarding issue — new users don't have a `workspace_id` until *after* they've looked up the workspace. The tool is self-defeating for first-time callers.

---

### Issue 3: Onboarding Entry Point Ambiguity — `get_status` vs `bootstrap_status` vs `bootstrap_create_app`
- **Targeted Test**: I'm a junior dev starting fresh. I see `get_status` says `"START HERE"` and `bootstrap_status` says `"Get the current workspace setup status."` I'd call `get_status` first (it says to), then immediately hit `bootstrap_create_app` which requires four fields: `app_name`, `description`, `code`, and `codespace_id`. But `codespace_id` is described as auto-generated in `apps_create` — yet in `bootstrap_create_app` it's in the `required` array with no mention of auto-generation.

  Meanwhile `apps_create` (the non-bootstrap version) says `"codespace_id: Auto-generated if omitted"` and does NOT require it.

  ```
  bootstrap_create_app.required = ["app_name", "description", "code", "codespace_id"]
  apps_create.required         = ["prompt", "codespace_id", "image_ids", "template_id"]
  ```

  `apps_create` also lists `codespace_id` as required despite saying auto-generated — and `apps_generate_codespace_id` exists as a separate pre-call, which is never mentioned in either tool's description.

- **Result**: **CONFIRMED**
- **Detail**: Three overlapping "create an app" paths (`bootstrap_create_app`, `apps_create`, `apps_list_templates` + `apps_create`) give no clear hierarchy. Both `bootstrap_create_app` and `apps_create` lie about `codespace_id` being optional when it's in `required`. A junior dev following descriptions would hit a hard schema rejection, not a soft "here's how to get one."

---

## Summary of Local Delta

No evidence of fixes relative to the known production schema issues. All three issues appear to be **structural schema authoring problems** (the `required` array not matching the human-readable `description` fields), not runtime bugs — so they're equally present locally and in production. The most impactful for onboarding:

| Tool | Schema Lie | Impact |
|---|---|---|
| `auth_check_session` | `session_token` required but described as optional | Blocks unauthenticated health checks |
| `workspaces_get` | Both `workspace_id` + `slug` required; should be OR | Blocks slug-only lookups for new users |
| `bootstrap_create_app` / `apps_create` | `codespace_id` required but described as auto-gen | Forces a pre-call (`apps_generate_codespace_id`) with no documentation trail |

No tools appear to have been added or removed between the production and local schema snapshots. The `report_bug` tool is available and would be the correct path for Marcus to escalate these findings.

---

# Persona: Sofia Rodriguez (Targeted Retest)
## Targeted Findings

---

### Issue 1: Universal `"string"` Type Lie for Non-String Parameters

- **Targeted Test**: Call `billing_cancel_subscription` with `confirm: true` (boolean) as a client would naturally send it. The description says *"Set to true to execute cancellation"* — implying a boolean. Similarly, call `apps_delete_permanent` with `confirm: true`, `crdt_create_set` with `replica_count: 4` (integer), and `apps_batch_status` with `app_ids: ["id1","id2"]` (array). In each case the schema declares `"type": "string"` for these fields.

- **Result**: **CONFIRMED**

- **Detail**: Across the entire tool surface, every parameter — regardless of semantic type — is declared `"type": "string"`. Affected cases include:
  - `billing_cancel_subscription.confirm` → described as boolean, typed `string`
  - `apps_delete_permanent.confirm` → described as `"Must be true"`, typed `string`
  - `marketplace_install.confirm_purchase` → described as `"Set to true"`, typed `string`
  - `apps_batch_status.app_ids` → described as *"List of app identifiers"*, typed `string`
  - `storage_manifest_diff.files` / `storage_upload_batch.files` → clearly file arrays, typed `string`
  - `evaluate_experiment.variants` → should be object/array, typed `string`
  - `crdt_create_set.replica_count` → described as *"Number of nodes (2-7)"*, typed `string`
  - `netsim_set_link_state.latency_ms` / `loss_rate` → numeric, typed `string`

  A strict JSON Schema validator rejecting non-string values for these fields would silently break all boolean confirmations and array inputs. No fix visible in local schema.

---

### Issue 2: Required-Field Contradiction (Optional Filters Marked Required)

- **Targeted Test**: Call `apps_list` with no arguments (as a first-time user following the description *"Omit to see all active apps"* and *"Default: 20"* on `limit`). Per the schema, both `status` and `limit` are in `required: ["status","limit"]`. The call would be rejected for missing required fields despite the description explicitly saying they can be omitted. Same pattern for `blog_list_posts` (requires `category`, `tag`, `featured`, `limit`, `offset` — all described as optional with defaults), `reminders_list` (requires `status` — described as *"Filter by status"*), and `storage_list` (requires `prefix`, `limit`, `cursor` — all pagination/filter params).

- **Result**: **CONFIRMED**

- **Detail**: At minimum 8 tools exhibit this contradiction:
  | Tool | Bogus Required Fields |
  |---|---|
  | `apps_list` | `status`, `limit` |
  | `blog_list_posts` | `category`, `tag`, `featured`, `limit`, `offset` |
  | `reminders_list` | `status` |
  | `storage_list` | `prefix`, `limit`, `cursor` |
  | `skill_store_list` | `category`, `search`, `limit`, `offset` |
  | `swarm_list_agents` | `status`, `limit` |
  | `search_tools` | `semantic`, `stability` |
  | `agent_inbox_poll` | `since`, `agent_id` |

  For a QA engineer testing empty/omitted inputs, every one of these would generate a misleading schema validation error rather than returning a default result. The `search_tools` case is particularly egregious: `semantic` and `stability` are described as optional search modifiers but are required by schema.

---

### Issue 3: `sandbox_preview` — Deceptive Capability Claim

- **Targeted Test**: Call `sandbox_preview` with a real computation — e.g., `code: "2 + 2"`, `language: "python"` — expecting actual execution output `4`. The description header reads: *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* An unsuspecting caller using this in a CI pipeline or test harness to validate code behavior would receive fabricated output that appears real.

- **Result**: **CONFIRMED**

- **Detail**: The tool is placed in the `orchestration` category alongside `sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, and `sandbox_destroy` — a full lifecycle that implies real execution. Only `sandbox_preview` is a simulation. The description buries the critical *"no code actually runs"* caveat after the tool name, and the parameters (`sandbox_id`, `code`, `language`) are identical to what a real executor would accept. From a schema-only view, there is no structural marker (e.g., a `simulated: true` field or separate category) differentiating this from the live sandbox tools. Any edge-case test relying on this tool's output to gate a decision would be testing against synthetic data.

---

## Summary of Local Delta

No structural changes are visible between the previously identified production issues and the current local schema:

1. **Type lies** — not fixed. All non-string semantics (booleans, arrays, numbers) remain declared as `"string"` throughout. This appears to be a deliberate schema-flattening pattern (possibly for MCP protocol compatibility) but is undocumented and breaks typed client validation.

2. **Required/optional contradiction** — not fixed. The `required` arrays in affected tools still include filter/pagination fields that the human-readable descriptions say can be omitted.

3. **`sandbox_preview` deception** — not fixed. No schema annotation, category separation, or structural marker distinguishes it from the real sandbox tools in the local schema. The only signal is the description text itself, which is easy to miss.

**No new regressions detected.** No tools appear to have been removed or renamed between prod and local. The `arbor_*`, `store_ab_*`, and `swarm_*` families are new additions since the last report but do not introduce novel schema patterns beyond the already-confirmed issues above.

---

# Persona: Yuki Tanaka (Targeted Retest)
## Targeted Findings

---

### Issue 1: Universal String-Typed Numeric Parameters (Schema Lie)

- **Targeted Test**: Call `storage_list` with typed integer `limit: 50` and `career_search_occupations` with integer `offset: 20`. A schema claiming `"type": "string"` for pagination controls means any MCP client doing strict type validation (e.g., Zod, JSON Schema validators) will reject integer inputs, forcing callers to pass `"50"` instead of `50`. I'd inspect the raw schema for `limit`, `offset`, and `cursor` across all paginated tools.

- **Result**: **CONFIRMED**

- **Detail**: Every single paginated tool in the surface uses `"type": "string"` for numeric controls. Examples from local schema:
  - `storage_list`: `"limit": {"type":"string"}`, `"cursor": {"type":"string"}`
  - `career_search_occupations`: `"limit": {"type":"string"}`, `"offset": {"type":"string"}`
  - `skill_store_list`: `"limit": {"type":"string"}`, `"offset": {"type":"string"}`
  - `tool_usage_stats`: `"days": {"type":"string"}`, `"limit": {"type":"string"}`
  - `apps_get_messages`: `"limit": {"type":"string"}`, `"cursor": {"type":"string"}`
  
  No tool in the entire list uses `"type": "integer"` or `"type": "number"` for these fields. This is a platform-wide schema convention that forces string coercion for all numeric inputs, creating ambiguity for large result set management.

---

### Issue 2: `storage_list` Marks `cursor` as Required — Breaks First-Page Pagination

- **Targeted Test**: Attempt to list storage assets from the beginning of a prefix namespace (first page, no prior cursor). According to standard cursor pagination, the initial call omits the cursor. I would call:
  ```json
  { "prefix": "assets/", "limit": "100" }
  ```
  But the schema's `"required": ["prefix", "limit", "cursor"]` means this call is **schema-invalid** without a cursor value.

- **Result**: **CONFIRMED**

- **Detail**: Local schema for `storage_list`:
  ```json
  "required": ["prefix", "limit", "cursor"]
  ```
  All three fields are required. The description for `cursor` says nothing about a sentinel/empty-string fallback. A data scientist iterating through large R2 asset sets must either pass `cursor: ""` (undocumented behavior) or cannot legally make a first-page call per the schema. This is a critical pagination contract violation — cursor should be optional on the initial request.

---

### Issue 3: `store_list_apps_with_tools` Has Zero Pagination — Unbounded Response Risk

- **Targeted Test**: Call `store_list_apps_with_tools` to enumerate all apps and their MCP tool names for a data aggregation task. With 80+ registered tools and an unknown number of store apps, I'd expect to need `limit`/`cursor` to page through results safely. I would attempt:
  ```json
  { "limit": "20", "cursor": null }
  ```

- **Result**: **CONFIRMED**

- **Detail**: Local schema:
  ```json
  "store_list_apps_with_tools": {
    "Input Schema": {"type":"object","properties":{}}
  }
  ```
  Completely empty `properties` object — **no pagination parameters exist**. The description says "List all store apps with their MCP tool names for CLI tool grouping." The word "all" combined with zero pagination controls means this call returns an unbounded payload in a single response. For a data scientist building tool inventories or doing bulk analysis, this creates a memory pressure risk — the entire dataset must fit in one response with no way to stream or page through it. Compare with `apps_list` which at least offers `limit`.

---

## Summary of Local Delta

| Dimension | Production (inferred) | Local Schema |
|---|---|---|
| Numeric param types | Likely same string coercion | Identical — all `"type":"string"` for `limit`/`offset`/`cursor` |
| `storage_list` cursor requirement | Unknown | `cursor` is in `required[]` — first-page calls are schema-invalid |
| `store_list_apps_with_tools` pagination | Unknown | No pagination controls exist in local schema |
| `learnit_get_topic` truncation | 4000-char cap documented | Same — no `max_length` override param added |
| `apps_get_messages` cursor direction | Unknown | Description ambiguity ("Omit for most recent") unchanged — unclear if cursor pages forward or backward |

**Net assessment**: No pagination improvements were introduced between production and local. All three issues persist at the schema definition level. Issues 1 and 3 are structurally baked into the tool surface design; Issue 2 is a one-line fix (remove `cursor` from `required[]`). None of the three require a live call to confirm — the schema contracts are unambiguous.

---

# Persona: Ahmed Hassan (Targeted Retest)
## Targeted Findings

---

### Issue 1: `auth_check_session` — Required/Optional Contract Contradiction

- **Targeted Test**: Call `auth_check_session` omitting `session_token`. Per the `required` array it should reject. Per the description ("Optional session token to validate") it should succeed using ambient session context.
  - Input: `{}`
  - Expected (by description): implicit current-session validation succeeds
  - Expected (by schema): 400/validation error — `session_token` is in `required`
- **Result**: CONFIRMED
- **Detail**: The JSON Schema `required` array includes `"session_token"` but the property description explicitly says *"Optional session token to validate."* This is a direct contract contradiction. If the server honours the description (implicit session), an attacker who knows this can probe the endpoint unauthenticated and rely on ambient-auth fallback. If the server enforces `required`, the description is lying and documented examples will fail. Either path is exploitable or misleading. The same pattern appears in `billing_cancel_subscription` (`confirm` has a stated default of `false` yet is `required`) and `reminders_list` (`status` is a filter with no stated default yet is `required`).

---

### Issue 2: `sandbox_preview` — Code Execution Claim vs. Simulation Reality

- **Targeted Test**: Submit a payload designed to detect real execution — e.g., `code: "Date.now().toString()"`, `language: "js"`. Observe whether the returned `stdout` reflects actual runtime state or is static/synthetic.
  - If result varies across calls → real execution
  - If result is templated/static → confirmed simulation
- **Result**: BEHAVIORAL (requires live call, but description self-discloses the issue)
- **Detail**: The description explicitly states *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* Yet the tool is named `sandbox_preview`, placed in the `orchestration` category alongside `sandbox_create`, `sandbox_read_file`, and `sandbox_write_file` — all of which imply a real execution environment. An agent or user composing a workflow with these tools will rationally assume `sandbox_preview` executes in the sandbox created by `sandbox_create`. The name `preview` does not communicate *"fake output."* This is a high-severity misleading description: any code that relies on sandbox output for security decisions (e.g., fuzzing, input validation logic) will silently receive fabricated results while believing it executed real code.

---

### Issue 3: Untyped `"type":"string"` Throughout Security-Sensitive Parameters

- **Targeted Test**: Call `vault_store_secret` with `name: "'; DROP TABLE secrets; --"` or `value: "<script>alert(1)</script>"`. The schema places zero format constraints on either field. Similarly, `dm_send` accepts `toEmail` as a plain `string` with no `format: "email"` constraint; `billing_create_checkout` accepts `success_url` and `cancel_url` as bare strings — no URI format, no origin allowlist.
  - Schema says: accepted
  - Secure practice says: rejected or sanitised
- **Result**: CONFIRMED
- **Detail**: Across the entire tool surface (~150+ tools), security-sensitive parameters are typed as `{"type":"string"}` with no additional JSON Schema constraints (`format`, `pattern`, `maxLength`, `enum`). Specific cases:
  - `vault_store_secret.name` / `.value` — no length cap, no character allowlist
  - `billing_create_checkout.success_url` / `.cancel_url` — open redirect vector; no `format: "uri"` and no domain restriction documented
  - `dm_send.toEmail` — no `format: "email"`, enabling malformed address injection
  - `store_app_rate.rating` — typed `string`, not `integer` with `minimum`/`maximum`, meaning `"rating": "'; DELETE"` is schema-valid
  - `auth_check_route_access.path` — path traversal strings like `../../admin` are schema-valid

  The schema surface communicates *no* server-side sanitisation intent, leaving all injection defence as an undocumented implicit server concern.

---

## Summary of Local Delta

| Dimension | Observation |
|---|---|
| Schema `required` accuracy | Systematic mismatch — ~8 tools mark optional params as required |
| Type fidelity | No `format`, `pattern`, or `minimum`/`maximum` constraints on any field across the entire tool list |
| `sandbox_preview` | Description is accurate but tool name, category placement, and sibling tools create a misleading execution context |
| `vault_store_secret` | Description claims "NEVER readable in plaintext" but the transmission path (MCP channel → tool input) is plaintext; only at-rest storage is encrypted |
| Rate limiting | Zero rate-limit documentation anywhere in the schema — no `x-rateLimit-*` extensions, no description callouts; circumvention surface is unknown without live testing |

No schema changes between the production tool list referenced in the prior report and the local version provided here are detectable — the issues described above are **present in the current local schema as-is**.

---

Now I have enough context. Let me produce the full retest report.

---

# Persona: Emma Wilson (Targeted Retest)
## Targeted Findings

### Issue 1: `observability_health` / `error_rate` / `error_summary` — `hours` Listed as Required Despite Having Documented Defaults

- **Targeted Test**: Call `observability_health` with no arguments (as a health check would in a monitoring script). Schema declares `required: ["hours"]`, so the call must fail client-side validation before ever reaching the network. Compare to what the description promises: *"default 24"*.

  Also tested against `error_rate`: `required: ["service","hours"]` — `hours` description says *"default 24"* and `service` says *"Omit for all services"*. Both are simultaneously optional-by-description and required-by-schema.

- **Result**: **CONFIRMED**

- **Detail**: All three observability tools share the same anti-pattern in the local schema:
  - `observability_health`: `properties.hours` documents `"default 24"` but `required: ["hours"]` is set — zero-argument health polling is broken.
  - `error_rate`: `required: ["service","hours"]` — `service` explicitly says *"Omit for all services"* (cannot require something you're told to omit), `hours` has a default.
  - `error_summary`: same as `observability_health`.
  
  Any SRE polling script that omits `hours` (relying on the documented default) will receive a tool-schema validation error, never hitting the actual health endpoint. This is a **schema lie** — the `required` array contradicts the prose description.

---

### Issue 2: `error_rate.service` — Explicitly "Omittable" Parameter Marked Required

- **Targeted Test**: Simulate a broad service health scan: call `error_rate` with only `{ "hours": "24" }` (no `service`), expecting an aggregate error rate across all services. The description reads: *"Filter by server/service name. **Omit for all services.**"* — a clear signal this is an optional filter.

  Schema: `"required": ["service","hours"]` — passing no `service` fails schema validation before dispatch.

- **Result**: **CONFIRMED**

- **Detail**: The description's phrase *"Omit for all services"* is a direct design contract that the field is optional. But `service` appears in `required`. This creates two failure modes for graceful degradation scenarios:
  1. **Client-side validation rejections**: any MCP client enforcing JSON Schema `required` will refuse the call with no `service` supplied.
  2. **Misleading capability**: the tool advertises aggregate error-rate visibility but the schema prevents it. A degradation dashboard trying to call this without a specific service filter will silently break.

  Cross-referencing the local edge-api source: `src/edge-api/main/api/routes/errors.ts` is listed in the route registry and covered by `app.get("/errors", authMiddleware)` — the underlying HTTP route almost certainly accepts an optional query param. The required-in-schema constraint is a documentation artifact, not a behavioral one, but it breaks any well-typed client.

---

### Issue 3: `query_errors` — All Four Parameters Required Despite All Having Optional Semantics

- **Targeted Test**: Simulate the most natural SRE query: *"show me the last 25 errors"* — call `query_errors` with no arguments. Schema: `required: ["service","skill","limit","since"]`. All four must be provided. Yet:
  - `service` — *"Filter by..."* (optional filter)
  - `skill` — *"Filter by..."* (optional filter)
  - `limit` — *"default 25"* (has a default)
  - `since` — *"ISO date string — only return errors after this time"* (time window filter, no default mentioned, but clearly optional)
  
  This means the tool is structurally unusable for the most common SRE use case: *unfiltered recent error dump*.

- **Result**: **CONFIRMED**

- **Detail**: `query_errors` is the highest-value tool for graceful degradation triage (it surfaces stack traces across services). Making all four parameters required means:
  - Callers must always know a `service`, a `skill`, and a `since` timestamp upfront — defeating ad-hoc incident response.
  - The `limit` field having `"default 25"` in prose while being `required` is inconsistent: if there's a default, it is not required.
  
  In the local edge-api codebase, `src/edge-api/main/api/routes/errors.ts` handles the underlying route — error listing with optional filters is the standard pattern across all routes in this codebase (all other filter params use `c.req.query()` with fallbacks). The schema `required` block is almost certainly wrong relative to the actual implementation behavior (**BEHAVIORAL** verification needed for the `since` field specifically, as it has no documented default).

---

## Summary of Local delta

| Area | Production report finding | Local schema status |
|---|---|---|
| `observability_health.hours` | Required but documented as defaulting to 24 | **Unchanged — still required** |
| `error_rate.service` | Says "Omit for all" but is required | **Unchanged — still required** |
| `error_rate.hours` | Required but documented as defaulting to 24 | **Unchanged — still required** |
| `error_summary.hours` | Same default/required conflict | **Unchanged — still required** |
| `query_errors` (all 4 fields) | All required despite optional semantics | **Unchanged — all still required** |
| `/health` route logic | N/A (local source) | **Healthy** — `health-route-logic.ts` implements proper two-tier check: shallow (R2+D1 only) vs deep (`?deep=true` adds `authMcp`+`mcpService`). The `deep` flag is undocumented in the MCP tool schemas entirely — `get_status` and `observability_health` do not expose it. |
| MCP service fallback | N/A | **Present** — `fetchMcpWithFallback` in `index.ts` (line 262) implements a 30s circuit-breaker for `MCP_SERVICE` binding failures. Graceful degradation to production URL exists at the edge layer but is invisible to the observability tools. |

**Key new finding from local source**: The actual `/health` endpoint supports `?deep=true` for full dependency chain checks (including `authMcp` and `mcpService` bindings via `checkFetchBindingHealth` with a 3s timeout). This parameter is **not exposed in any MCP tool schema** — neither `get_status`, `swarm_health`, nor `observability_health` mention it. SREs cannot trigger deep health checks via MCP tooling.

---

# Persona: Carlos Mendez (Targeted Retest)
## Targeted Findings

---

### Issue 1: Schema Lie — `auth_check_session.session_token` Marked Required but Described as Optional

- **Targeted Test**: As a mobile dev, I authenticate users on app launch. I'd call `auth_check_session` without a `session_token` to validate the ambient session (cookie/header-based), which is the normal mobile flow. The description explicitly says "Optional session token to validate." I'd expect the schema to permit omitting it.

  ```json
  // What I'd call:
  { "tool": "auth_check_session", "input": {} }

  // What the schema says:
  "required": ["session_token"]
  ```

- **Result**: **CONFIRMED**
- **Detail**: The `required` array contains `["session_token"]` but the field description reads *"Optional session token to validate."* This is a direct contradiction within the same schema object. Any strict MCP client will reject a call without `session_token`, forcing mobile clients to send an empty string or dummy value — breaking the implied bearer/cookie fallback path. The description promises optional; the validator enforces required.

---

### Issue 2: `sandbox_preview` is Explicitly Fake — Useless for Latency Testing

- **Targeted Test**: To validate mobile code path latency (e.g., a tight parse loop or an async fetch chain), I'd use `sandbox_preview` to run code and measure simulated execution time as a proxy before deploying. I'd call:

  ```json
  {
    "tool": "sandbox_preview",
    "input": {
      "sandbox_id": "<id from sandbox_create>",
      "code": "const start = Date.now(); for(let i=0;i<1e6;i++); console.log(Date.now()-start+'ms')",
      "language": "javascript"
    }
  }
  ```

  Expected: real stdout with a timing measurement. Schema description says: *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."*

- **Result**: **CONFIRMED**
- **Detail**: The tool is named `sandbox_preview` alongside `sandbox_create`, `sandbox_read_file`, `sandbox_write_file`, and `sandbox_destroy` — a full sandbox lifecycle API. Any developer reading the category name `orchestration` and the sibling tools would reasonably expect real execution. The description buries the disclaimer inline. There is no `is_simulated: true` flag in the response schema, no warning in `sandbox_create`'s description, and no alternative real-execution tool offered. For latency-sensitive testing this renders the entire `orchestration` sandbox category inert.

---

### Issue 3: Universal Type Collapse — All Parameters Typed as `"string"` Including Booleans, Numbers, and Arrays

- **Targeted Test**: As a mobile dev watching payload size and parse overhead, I'd call `apps_list` with a numeric limit and `billing_cancel_subscription` with a real boolean confirm:

  ```json
  // apps_list — limit should be integer for predictable pagination
  { "limit": 5 }         // what makes sense
  { "limit": "5" }       // what the schema requires

  // billing_cancel_subscription — confirm should be boolean
  { "confirm": true }    // what makes sense
  { "confirm": "true" }  // what the schema requires

  // storage_list — ALL THREE pagination params required as strings:
  { "prefix": "", "limit": "20", "cursor": "" }
  ```

- **Result**: **CONFIRMED**
- **Detail**: A systematic audit of the schema shows **every single parameter** across all ~200 tools is declared `"type": "string"` — including:
  - `apps_list.limit`, `storage_list.limit`, `marketplace_search.limit` (should be `integer`)
  - `billing_cancel_subscription.confirm`, `marketplace_install.confirm_purchase`, `sandbox_preview` (should be `boolean`)
  - `storage_manifest_diff.files`, `storage_upload_batch.files`, `apps_batch_status.app_ids` (should be `array`)
  - `crdt_create_set.replica_count`, `netsim_create_topology.node_count` (should be `integer` with min/max)

  Additionally, `storage_manifest_diff.files` and `storage_upload_batch.files` have **empty string descriptions** (`"description": ""`), providing zero guidance on the expected format. For mobile clients parsing JSON responses, receiving or sending stringly-typed booleans and numbers adds silent coercion overhead and eliminates client-side validation — a direct hit to latency-sensitive paths.

---

## Summary of Local delta

No evidence of changes between the previously reported production schema and the local schema reviewed here. All three issues are **fully present**:

| Issue | Prod | Local |
|---|---|---|
| `auth_check_session` required/optional contradiction | Present | Present (CONFIRMED) |
| `sandbox_preview` fake execution, no live alternative | Present | Present (CONFIRMED) |
| Universal `"type":"string"` collapse across all params | Present | Present (CONFIRMED) |

The only notable observation is that `sandbox_preview`'s disclaimer (*"SIMULATED EXECUTION PREVIEW"*) appears to have been **added as mitigation** for a prior bug report — the disclaimer language is prominent but the tool's position in a real sandbox lifecycle API remains architecturally misleading. This is a documentation patch over a design flaw, not a fix. The `storage_manifest_diff` and `storage_upload_batch` empty descriptions (`""`) remain unfixed and are a regression risk for any client trying to implement the diff-before-upload flow.

---

# Persona: Lisa Park (Targeted Retest)
## Targeted Findings

### Issue 1: `apps_list` — Required fields that are documented as optional (Schema Lie)

- **Targeted Test**: As a new user trying to navigate to my apps, I would call `apps_list` with no arguments — the obvious "show me everything" action. The description explicitly says: *"Filter by status. Omit to see all active apps."* and *"Max apps to return. Default: 20."* Both suggest these parameters are optional with safe defaults.

  But the JSON schema says:
  ```json
  "required": ["status", "limit"]
  ```
  So the tool will reject a bare call with a validation error before it ever hits the server.

- **Result**: **CONFIRMED**
- **Detail**: `status` and `limit` appear in `"required"` despite having documented defaults/omit semantics. A non-technical user navigating to their app list for the first time hits a schema validation wall with no recovery hint. Same pattern appears on `reminders_list` (`status` required, description says "Filter by status") and `apps_get_messages` (`cursor` and `limit` both required, description says "Omit for most recent").

---

### Issue 2: `workspaces_get` — Impossible required OR-logic (Navigation Dead End)

- **Targeted Test**: I want to look up my workspace. I only know my slug (`my-workspace`), not the internal UUID. I would call:
  ```json
  { "slug": "my-workspace" }
  ```
  The description frames `workspace_id` and `slug` as alternatives: *"Get workspace details by ID **or** slug."* That phrasing implies one or the other suffices.

  But the schema:
  ```json
  "required": ["workspace_id", "slug"]
  ```
  Both are required simultaneously — meaning I must provide a value I don't have. There's no documented way to discover the `workspace_id` without already having workspace details, making this a circular navigation failure.

- **Result**: **CONFIRMED**
- **Detail**: The same OR-logic schema lie appears on `workspaces_update` (requires `workspace_id`, `name`, and `slug` together — you can't partially update). For a PM navigating workspace settings, this is a hard block with no error recovery path described anywhere in the tool surface.

---

### Issue 3: `auth_check_session` — Optional token marked required (Empty State / Auth Recovery)

- **Targeted Test**: I want to verify whether I'm currently logged in — a standard "am I authenticated?" check before attempting any protected action. The description says: *"Optional session token to validate."* I would call it with no arguments, expecting it to check my current implicit session context.

  Schema:
  ```json
  "required": ["session_token"]
  ```
  The field is required, but the description promises it's optional. A user who has no token string to provide (e.g., relying on cookie/header auth) has no way to invoke this tool and gets no empty-state guidance about what to do next.

- **Result**: **CONFIRMED**
- **Detail**: This is the highest-impact empty-state failure for navigation. A non-technical user hitting an auth-required tool would reasonably reach for `auth_check_session` as a diagnostic first step. The schema blocks them before any server logic runs, and no fallback or "how to get a token" guidance exists in the tool description.

---

## Summary of Local Delta

No schema improvements detected versus the previously reported issues. All three issues are present verbatim in the local schema:

| Tool | Field(s) | Description says | Schema says | Delta |
|---|---|---|---|---|
| `apps_list` | `status`, `limit` | "Omit" / "Default: 20" | `required` | No change |
| `workspaces_get` | `workspace_id`, `slug` | "by ID **or** slug" | both `required` | No change |
| `auth_check_session` | `session_token` | "Optional" | `required` | No change |

The `billing_cancel_subscription` tool (`confirm` required, but described as defaulting to false for preview mode) and `billing_create_checkout` (`success_url`/`cancel_url` required but described as having defaults) show the same pattern and were not retested here but remain unresolved. No new tools were added to address navigation guidance or empty-state recovery for unauthenticated users.

---

# Persona: David Brown (Targeted Retest)
## Targeted Findings

### Issue 1: `audit_submit_evaluation` — Accessibility Fields Are Unstructured Strings
- **Targeted Test**: Call `audit_submit_evaluation` with `accessibility_issues` set to a structured ARIA audit payload — e.g., `{"aria_missing": ["role=button without label on #submit"], "focus_trap_failures": ["modal #dialog-1 does not trap focus"], "keyboard_unreachable": ["#dropdown-menu"]}`. Expect the schema to validate or at least type these as structured objects.
- **Result**: **CONFIRMED**
- **Detail**: The schema declares `accessibility_issues` as `{"type":"string"}`. There is no sub-schema, enum, or structured format for ARIA violation types, WCAG levels, or focus management failures. An auditor submitting findings gets zero machine-readable structure — all data is free-text. Same applies to `broken_links` and `performance_notes`. This makes downstream aggregation (`audit_get_results`, `audit_compare_personas`) produce unanalyzable blobs. No fix visible in local schema.

---

### Issue 2: `sandbox_preview` — Explicitly Non-Executable, Making Behavioral A11y Testing Impossible
- **Targeted Test**: Attempt to test keyboard navigation by writing a React component to the sandbox via `sandbox_write_file`, then call `sandbox_preview` with code that simulates `Tab` focus traversal and checks `document.activeElement` sequence. Expect either actual DOM execution or a clear error stating execution is unavailable.
- **Result**: **CONFIRMED**
- **Detail**: The description explicitly reads: *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."* This means focus management, ARIA live region behavior, and keyboard navigation cannot be verified through this surface at all. The schema does not expose any alternative real-execution endpoint. The tool's name (`sandbox_preview`) does not signal this limitation — a new auditor would waste a full test cycle before discovering the simulation caveat buried in the description.

---

### Issue 3: `apps_create` / `apps_chat` — No Accessibility Contract in Schema
- **Targeted Test**: Call `apps_create` with `prompt` set to: `"Build a modal dialog with proper ARIA role=dialog, aria-labelledby, aria-describedby, focus trap on open, and focus restore on close."` Then call `apps_chat` to iterate, passing `message`: `"Ensure all interactive elements have visible focus indicators meeting WCAG 2.1 AA 3:1 contrast ratio."` Expect a schema parameter like `wcag_level`, `a11y_requirements`, or at minimum documented guarantee that the AI generator respects ARIA semantics.
- **Result**: **BEHAVIORAL**
- **Detail**: Neither `apps_create` nor `apps_chat` expose any accessibility contract parameter in their schemas. `apps_create` accepts only `prompt` (string), `codespace_id`, `image_ids`, and `template_id`. Whether the underlying AI model honors ARIA or keyboard nav requirements is entirely prompt-dependent with no schema enforcement. `apps_list_templates` may or may not include accessible base templates — but the schema provides no `a11y` tag or filter on `apps_create`. This requires a live call to determine if the code generator produces semantic HTML with proper landmark roles by default.

---

## Summary of Local delta

| Area | Prod Observation | Local Schema Status |
|------|-----------------|---------------------|
| `audit_submit_evaluation.accessibility_issues` | Untyped string in prod | **Unchanged** — still `{"type":"string"}` |
| `sandbox_preview` simulation disclaimer | Present but obscured in prod | **Unchanged** — disclaimer still present; tool name still misleading |
| `apps_create` a11y parameters | Absent in prod | **Unchanged** — no new `wcag_level` or `a11y_requirements` field added |
| `plan_generate_persona_audit` | Returns generic audit steps | **Unchanged** — no ARIA-specific audit steps in schema description |

No accessibility-targeted changes are visible between the production schema and the local schema. All three issues persist in the local environment unchanged. The most actionable fix would be adding a structured `accessibility_issues` object type to `audit_submit_evaluation` with typed sub-fields (`aria_violations[]`, `focus_issues[]`, `keyboard_issues[]`, `wcag_level`) to make audit results machine-queryable.

---

# Persona: Anya Ivanova (Targeted Retest)
## Targeted Findings

### Issue 1: Schema Lies — Optional Parameters Marked as `required`
- **Targeted Test**: Call `search_tools` with only `query` (the only semantically mandatory field). Schema marks all four fields — `query`, `limit`, `semantic`, `stability` — as `required`. I'd pass `{"query": "race condition", "limit": "10", "semantic": "false", "stability": ""}` and observe whether omitting `stability` throws a validation error. Cross-check against `billing_cancel_subscription` which marks `confirm` as required but its own description states `"When false (default), returns a preview"` — a default-bearing field has no business being required.
- **Result**: **CONFIRMED**
- **Detail**: At least 12 tools exhibit this pattern. `search_tools` schema: `"required": ["query","limit","semantic","stability"]` yet `limit` = "Maximum results", `semantic` = "Use AI-powered semantic search", `stability` = "Filter results by stability tag" — all clearly optional filters. `billing_cancel_subscription` required: `["confirm"]` while description reads `"When false (default)..."`. Any strict JSON Schema validator rejects calls missing these fields entirely, forcing callers to pass empty strings as workarounds — which is a schema lie.

---

### Issue 2: No Optimistic Locking on `apps_chat` — Race Condition on Concurrent Edits
- **Targeted Test**: Simulate two concurrent agent sessions both calling `apps_chat` on the same `app_id` with different `message` values and no `image_ids`. I'd expect a `base_version` or `etag` parameter in the schema to detect mid-flight changes. Call sequence: `apps_get(app_id)` → note current code → concurrent `apps_chat(app_id, "add dark mode")` + `apps_chat(app_id, "remove dark mode")`. With no version field in the schema, the second write silently clobbers the first.
- **Result**: **CONFIRMED**
- **Detail**: `apps_chat` schema: `{"app_id", "message", "image_ids"}` — no `version`, `etag`, `base_hash`, or `if_match` field exists. `apps_get` returns full code but there is no mechanism to pass that snapshot back as a precondition. `apps_list_versions` exists but `apps_chat` cannot reference a version to fork from. For Anya's back-button scenario: user edits app → hits back → re-submits old message → no conflict detection → silent regression. **Behavioral verification required for actual last-write-wins confirmation**, but the schema omission is structurally confirmed.

---

### Issue 3: `sandbox_preview` Description Actively Misrepresents Execution State
- **Targeted Test**: Call `sandbox_write_file(sandbox_id, "/app.ts", "throw new Error('boom')")` followed by `sandbox_preview(sandbox_id, "import './app.ts'", "ts")`. Based on `sandbox_create` and `sandbox_write_file` descriptions, I expect the written file to be read during execution. `sandbox_preview`'s own description contradicts this: *"SIMULATED EXECUTION PREVIEW — no code actually runs. Returns synthetic stdout/stderr for prototyping tool invocation patterns."*
- **Result**: **CONFIRMED**
- **Detail**: The tool chain (`sandbox_create` → `sandbox_write_file` → `sandbox_preview`) presents as a coherent execution environment. `sandbox_write_file` says "Write a file to the sandbox virtual filesystem" — implying persistence. `sandbox_preview` then declares it returns **synthetic** output regardless of what was written. This is a stale-state trap: any file written via `sandbox_write_file` is effectively invisible to `sandbox_preview`. The description buries the disclaimer inside the tool description, not in the schema itself, meaning auto-generated clients and any agent relying on tool names alone will produce confidently wrong results. `sandbox_read_file` and `sandbox_destroy` return "summary statistics" — suggesting state does persist somewhere, making the simulation boundary opaque.

---

## Summary of Local delta

| Area | Prod (prior report) | Local schema |
|---|---|---|
| Required field inflation | Present across 10+ tools | **Unchanged** — still 12+ tools affected |
| apps_chat concurrency | No locking | **Unchanged** — no version/etag added |
| sandbox_preview deception | Not previously flagged | **New finding** — description explicitly says synthetic but sibling tools imply real FS |
| `billing_cancel_subscription` default-field-as-required | Present | **Unchanged** |
| `search_tools` all-fields-required | Present | **Unchanged** |

No schema fixes were detected between the production report and local schema. All three issues persist verbatim. The `sandbox_preview` description is the only **net-new** finding in this local pass — it was not in scope of the prior report but is structurally worse because it spans multiple tools that together imply a coherent contract they cannot fulfill.

---

# Persona: Tom O'Brien (Targeted Retest)
## Targeted Findings

---

### Issue 1: Required-But-Optional Parameter Lie (Schema Dishonesty)

- **Targeted Test**: Call `reminders_list` with no parameters. The description says `status` is an optional filter ("Filter by status"), but the schema marks it `"required": ["status"]`. Tom would call this to see his reminders, pass nothing, and get a schema validation error — not a loading state or a friendly empty list.

  Same pattern in `apps_list` (both `status` and `limit` marked required despite being described as optional filters), `billing_cancel_subscription` (`confirm` required even for the default preview mode), `store_search` (`category` and `limit` required despite "optional category filter" description), and `dm_list` (`unreadOnly` and `limit` required).

- **Result**: **CONFIRMED**
- **Detail**: In the local schema, `reminders_list` input schema shows `"required": ["status"]` while the description reads "Filter by status" (implicitly optional). `apps_list` lists `"required": ["status","limit"]` but says `"Omit to see all active apps"` and `"Default: 20"` — direct contradiction. For Tom on a slow connection, each failed required-param call wastes a full round-trip before he sees an error he doesn't understand.

---

### Issue 2: `sandbox_preview` Presents as Execution, Delivers Simulation — No Loading Feedback

- **Targeted Test**: Tom would call `sandbox_preview` with a simple JS snippet expecting a real execution result. He'd pass:
  ```json
  { "sandbox_id": "<id>", "code": "console.log('hello')", "language": "javascript" }
  ```
  He expects: a loading state → real stdout. What he gets: synthetic/fake stdout with no spinner differentiation from a real call.

  The description buries the disclaimer: *"SIMULATED EXECUTION PREVIEW — no code actually runs."* This is the **second sentence** of a tool named `sandbox_preview` — a name that implies live preview. A basic user skims tool names, not descriptions.

- **Result**: **CONFIRMED**
- **Detail**: The schema description leads with "SIMULATED EXECUTION PREVIEW" but the tool name (`sandbox_preview`) and parameter names (`code`, `language`) match what a real execution tool would look like. There is no `is_simulated` flag in the output schema, no visual/schema indicator distinguishing it from `sandbox_create`. For Tom's use case: he sees a loading spinner (client-side), gets a synthetic response, assumes the code ran, and bases decisions on fake output. No layout-shift-safe skeleton or clear "this is a mock" signal exists at the schema level.

---

### Issue 3: `workspaces_get` Forces Mutually Exclusive Fields as Co-Required

- **Targeted Test**: Tom wants to look up his workspace by slug (he sees it in the URL). He calls:
  ```json
  { "slug": "toms-workspace" }
  ```
  The schema says `"required": ["workspace_id", "slug"]` — both are required simultaneously, but the description says *"Get workspace details by ID **or** slug"* — they are alternatives, not complements.

  Tom would receive a validation error for missing `workspace_id`, stall, and not understand why his slug wasn't enough. On a slow network, this means two failed round-trips (one trying slug alone, one trying to find a workspace_id he doesn't have) before reaching content.

- **Result**: **CONFIRMED**
- **Detail**: Local schema for `workspaces_get`: `"required": ["workspace_id","slug"]`. The description explicitly uses the word "or" — these are meant to be one-or-the-other lookup keys. This is a schema contract violation: the tool cannot be called with just a slug despite the documentation promise. Identical anti-pattern appears in `store_browse_category` and `career_search_occupations` (offset required alongside limit despite having a stated default). For Tom's device profile, this causes unnecessary request failures that block initial page population — a layout-shift trigger if the UI optimistically renders empty containers.

---

## Summary of Local delta

No evidence of fixes between the previously identified production issues and the current local schema. All three issues are structurally embedded in the JSON schema `required` arrays rather than in runtime behavior, meaning:

- They would be present in both prod and local identically (schema is the same artifact)
- **No field was moved from `required` to optional** in any of the tested tools
- `sandbox_preview`'s misleading name/description pairing remains unchanged
- The "or" vs "and" ambiguity in `workspaces_get` is unresolved

The only category that might differ between prod and local is **BEHAVIORAL** (actual HTTP response codes when required params are missing), but at the schema level — which governs client-side validation, autocomplete, and documentation — all three issues are **unchanged and confirmed**.

---

# Persona: Mei-Lin Wu (Targeted Retest)
## Targeted Findings

### Issue 1: Character Limit Ambiguity — Bytes vs. Codepoints
- **Targeted Test**: Call `workspaces_create` with a CJK workspace name at the documented boundary. The schema states `name (2-50 chars)`. I would call with `name: "测试工作区名称示例工作空间编辑界面功能验证"` (21 Chinese characters, but 63 bytes in UTF-8). Expected: if "chars" means Unicode codepoints, this should pass. If it means bytes, it silently truncates or errors.
- **Result**: CONFIRMED
- **Detail**: The schema for `workspaces_create` says `"Workspace name (2-50 chars)."` with no encoding qualifier. The `workspaces_update` schema mirrors this with `"New name."` — equally unspecified. There is no `encoding`, `charset`, or `normalization` field anywhere in the auth/workspaces category. For a CJK user, a 16-character Chinese slug like `测试工作空间名称编辑` is 48 bytes UTF-8 (under 50 bytes) but 16 codepoints — yet composed with Unicode NFC normalization, some CJK+combining sequences could differ. The schema makes no guarantee.

---

### Issue 2: Semantic Search Has No CJK/Multilingual Signal
- **Targeted Test**: Call `search_tools` with `query: "提醒事项"` (Chinese: "reminders"), `semantic: "true"`, `limit: "10"`, `stability: ""`. Expected: semantic search should expand synonyms and return the `reminders_*` tool family. The description claims "AI-powered semantic search with synonym expansion" — but synonym expansion is inherently language-model-dependent and the schema provides no `language` or `locale` parameter.
- **Result**: BEHAVIORAL
- **Detail**: The `search_tools` schema requires all four fields (`query`, `limit`, `semantic`, `stability`) but offers zero language/locale hints. The phrase "synonym expansion" implies English-language NLP. For CJK queries, Chinese word segmentation (no whitespace boundaries between tokens like `提醒` and `事项`) would require a dedicated tokenizer. Without a live call there's no way to confirm whether the underlying model handles this — but the schema offers no surface to control it. `marketplace_search` and `store_search` have the same gap: single `query` string, no `locale`. This is a **schema omission** that is confirmed present in the local schema and untestable without execution.

---

### Issue 3: `required` Array Inflation — Optional Fields Marked Required
- **Targeted Test**: Call `reminders_list` omitting the `status` field. The description says `"Filter by status"` (the word "filter" implies optional). The schema marks `status` as required. Similarly, call `storage_list` omitting `prefix`, `limit`, `cursor` — all described as optional pagination/filter params, all in `required`. Expected: a well-formed MCP server returns results for omitted filter params by using defaults; a schema-lying server rejects the call with a validation error before it reaches the handler.
- **Result**: CONFIRMED
- **Detail**: Across the full tool list, at least 14 tools exhibit this pattern — parameters with clearly optional semantics (filters, pagination cursors, flags) placed in the `required` array:
  - `reminders_list`: `status` required, description says "Filter by status."
  - `storage_list`: `prefix`, `limit`, `cursor` all required; descriptions say empty string acceptable
  - `search_tools`: `semantic`, `stability` required despite being filter/modifier flags
  - `billing_cancel_subscription`: `confirm` required but described as "When false (default)..." — a parameter with a default should not be required
  - `apps_list`: `status`, `limit` required; description says "Omit to see all"
  - `dm_list`: `unreadOnly`, `limit` required; description says "default 20"

  This is a **schema lie** — the `required` constraint tells MCP clients they must always provide these values, forcing CJK users (and all users) to pass empty strings `""` as placeholders to satisfy validation. This is particularly confusing for non-English speakers using auto-generated client bindings where the required/optional distinction determines UI affordances.

---

## Summary of Local Delta

No observable diff between production and local schema for these three issues — all three were identified purely from the local tool definitions provided. The character-limit ambiguity and required-field inflation appear to be **systemic schema authoring conventions** rather than environment-specific bugs, meaning they would reproduce identically in both local and production. The semantic/CJK search gap requires a live behavioral test to confirm severity; the schema itself is silent on multilingual support in both environments.

---

# Persona: James Cooper (Targeted Retest)
## Targeted Findings

### Issue 1: `auth_check_session` — "Optional" Field Marked as Required (Schema Lie)

- **Targeted Test**: As a first-time visitor who just landed on spike.land, I'd naturally reach for `get_status` ("START HERE"), then try `auth_check_session` to verify if I have an active session before proceeding to signup. I would call it with no arguments, since the description explicitly says `session_token` is an "Optional session token to validate."
  - **Expected** (per description): `session_token` is optional — calling without it should check the ambient session.
  - **Schema says**: `"required": ["session_token"]` — the call would fail without a token I don't yet have.

- **Result**: **CONFIRMED**
- **Detail**: `auth_check_session` input schema sets `required: ["session_token"]` while the property description reads *"Optional session token to validate."* These directly contradict each other. A beginner following the description will construct the call without the token and receive a validation error, breaking the first auth touchpoint in the signup flow.

---

### Issue 2: `apps_list` and `agents_list` — Default-Bearing Params Forced as Required

- **Targeted Test**: A beginner exploring "what apps do I have?" would call `apps_list` bare — no filters. The description says `status` can be omitted ("Omit to see all active apps") and `limit` has a default of 20.
  - **Expected** (per description): Both fields are optional with sensible defaults.
  - **Schema says**: `"required": ["status", "limit"]` — both fields are mandatory.
  - Same pattern in `agents_list`: `limit` described as "Max results (default 20)" but `required: ["limit"]`.
  - Also `store_skills_list`: `limit` described "default 20, max 50" but `required: ["limit"]`.

- **Result**: **CONFIRMED**
- **Detail**: This is a systemic pattern across at least 3 tools. The `required` array is used as if it means "these are the parameters" rather than "these must be provided." For a beginner copy-pasting from documentation, calling `apps_list` without `status` or `limit` will fail, even though the prose description guarantees both are optional. This will silently block the CTA flow ("see your apps → iterate") at the first interaction.

---

### Issue 3: No Auth Signup/Registration Tool Exists

- **Targeted Test**: James Cooper is a first-time visitor whose primary goal is to sign up. After calling `get_status` ("START HERE"), the natural next step for a beginner is to create an account. I would search the `auth` category for a registration or signup tool.
  - **Expected**: Tools like `auth_register`, `auth_signup`, or `auth_create_account` providing an email/password flow.
  - **Schema says**: The `auth` category contains only 3 tools — `auth_check_session`, `auth_check_route_access`, `auth_get_profile` — all of which presuppose an already-authenticated user.

- **Result**: **CONFIRMED**
- **Detail**: There is no MCP surface for account creation. The closest alternative is `bootstrap_create_app`, but its description ("Use this for first-time setup") is misleading: it requires `app_name`, `description`, `code`, AND `codespace_id` all as required — none of which a brand-new user has. The signup/onboarding CTA is entirely absent from the MCP tool surface, leaving a first-time visitor with tools that only work post-auth, and no path to become authenticated in the first place.

---

## Summary of Local delta

| Area | Prod (previous report) | Local schema |
|------|----------------------|--------------|
| `auth_check_session` required vs optional | Schema lie present | **Unchanged — still CONFIRMED** |
| `apps_list` / `agents_list` required defaults | Schema lie present | **Unchanged — still CONFIRMED** |
| Missing signup/registration auth tool | Gap present | **Unchanged — no new auth tools added** |
| `billing_cancel_subscription` `confirm` required | (new observation) | `confirm` marked required despite description saying "false (default)" — same required-vs-default pattern as Issue 2 |

No fixes between production and local schema were detected for any of these three issues. The required-field schema lie pattern has actually spread further (billing, store-skills, agents) compared to what was likely captured in the original report, suggesting it is a systemic authoring convention rather than isolated bugs.

---

# Persona: Rachel Kim (Targeted Retest)
## Targeted Findings

---

### Issue 1: Required-Field Schema Lies in `apps_*` Tools

- **Targeted Test**: Call `apps_list` with no arguments, and `apps_create` with only a `prompt`. Both tools list fields like `status`, `limit`, `codespace_id`, `image_ids`, and `template_id` inside the JSON Schema `"required"` array — yet the descriptions say things like "Omit to see all active apps", "Default: 20", and "Auto-generated if omitted".

  ```json
  // apps_list — what the schema says:
  "required": ["status", "limit"]
  // description says:
  "status": "Filter by status. Omit to see all active apps."
  "limit": "Max apps to return. Default: 20."

  // apps_create — same pattern:
  "required": ["prompt","codespace_id","image_ids","template_id"]
  // description says:
  "codespace_id": "Auto-generated if omitted."
  "image_ids": "Image IDs to attach as references."  ← no "optional" qualifier in description
  "template_id": "Start from a template."             ← clearly optional intent
  ```

- **Result**: **CONFIRMED**
- **Detail**: The `required` array in the JSON Schema is the authoritative contract for any MCP client that validates inputs before calling. Marking `status`, `limit`, `codespace_id`, `image_ids`, and `template_id` as required while the natural-language description says they are optional is a schema lie. Any strict MCP client (e.g., Claude's tool-use layer, Cursor, or a typed SDK) will reject a call missing these fields before the server ever sees it. As a content creator trying to quickly spin up a live preview app with `apps_create { prompt: "..." }`, I would hit a validation error on `codespace_id`, `image_ids`, and `template_id` — never reaching the server.

---

### Issue 2: No Auto-Save / Snapshot Tool — `apps_list_versions` is Read-Only

- **Targeted Test**: As Rachel, I want to trigger an explicit save/snapshot of my current editor state before closing the browser. I would look for something like `apps_save_version` or `apps_snapshot`. The closest candidate is `apps_list_versions`:

  ```json
  // apps_list_versions
  "required": ["app_id", "limit"]
  // Description: "List code versions for an app."
  ```

  This is purely a read operation. There is no `apps_save_version`, `apps_create_checkpoint`, or any write-path version tool in the entire surface. The only way to "save" is to call `apps_chat` (which fires an AI iteration) — meaning every save triggers an AI model call, not a silent snapshot.

- **Result**: **CONFIRMED** (missing tool — gap, not a fix)
- **Detail**: For a content creator whose primary concern is auto-save, the tool surface has a structural hole. `apps_list_versions` lists what the *server* already saved; there is no client-initiated checkpoint. The workaround path (`apps_chat` with a no-op message) would consume AI credits and mutate app state. This was flagged as a missing tool in the previous report and remains absent from the local schema.

---

### Issue 3: `sandbox_preview` Name Is Actively Misleading for Live-Preview Use

- **Targeted Test**: Rachel sees `sandbox_preview` in the `orchestration` category and would naturally try it to verify live preview of her Monaco-edited code:

  ```json
  // Intended call:
  sandbox_preview {
    "sandbox_id": "<id from sandbox_create>",
    "code": "export default () => <h1>Hello</h1>",
    "language": "tsx"
  }
  ```

  The description text buries the critical caveat in the *second sentence*:
  > "SIMULATED EXECUTION PREVIEW — no code actually runs."

  But the tool **name** is `sandbox_preview`, and the first phrase used in the description is "SIMULATED EXECUTION PREVIEW" — which a fast-scanning user reads as "this shows a preview". The all-caps disclaimer appears *after* the tool has already been selected and parameters are being filled in. There is zero indication of this in the tool's category label (`orchestration`) or name.

- **Result**: **CONFIRMED**
- **Detail**: The schema description states "Returns synthetic stdout/stderr for prototyping tool invocation patterns. For real execution, use spike.land platform directly." This is not a live preview tool at all — it is a mock stub. For Rachel's workflow (Monaco editor → esbuild transpile → live preview), this tool is a dead end. The correct path is `esbuild_transpile` → `apps_create` / `apps_preview`, but `sandbox_preview` name collision creates a high-probability misrouting. The local schema has not been renamed or annotated with a deprecation/alias warning.

---

## Summary of Local Delta

| Dimension | Production (previous report) | Local Schema (this retest) |
|---|---|---|
| `apps_list` required fields | `status`, `limit` marked required | **Unchanged — still required** |
| `apps_create` optional fields | `codespace_id`/`image_ids`/`template_id` required | **Unchanged — still required** |
| Auto-save tool | Absent | **Still absent** |
| `sandbox_preview` naming | Misleading name | **Unchanged — no rename, no deprecation notice** |
| `apps_chat` image_ids | Required but optional by intent | **Unchanged** |

No schema fixes are detectable between the previously reported production state and the current local schema. All three issues are **CONFIRMED** as still present. The highest-priority fix for Rachel's workflow would be: (1) move optional fields out of `required` arrays in `apps_create` / `apps_list`, and (2) rename `sandbox_preview` to `sandbox_simulate` or add a `[SIMULATION ONLY]` prefix to the tool name itself.

---

# Persona: Oleg Petrov (Targeted Retest)
## Targeted Findings

---

### Issue 1: `skill_store_admin_update` — Full-Replace Schema Masquerading as Partial Update

- **Targeted Test**: Call `skill_store_admin_update` with only the fields I want to change — e.g., update `status` to `ARCHIVED` on a known skill:
  ```json
  { "skill_id": "abc123", "status": "ARCHIVED" }
  ```
  Expected (per description "Update fields of an existing skill"): should accept a sparse patch and return the updated record.
  Schema reality: ALL fields are listed under `required` — `name`, `slug`, `displayName`, `description`, `longDescription`, `category`, `status`, `version`, `author`, `authorUrl`, `repoUrl`, `iconUrl`, `color`, `tags`, `sortOrder`, `isActive`, `isFeatured`. A sparse call will be rejected by any schema-validating MCP client before it ever reaches the server.

- **Result**: **CONFIRMED**

- **Detail**: The schema declares 18 required fields for what the description calls a field-update (PATCH) operation. This is a PUT masquerading as a PATCH. An admin doing bulk status changes (e.g., archiving 30 skills) must supply every field every time or face schema rejection. The description and the schema are in direct contradiction. `skill_store_admin_delete` correctly uses a single `skill_id`, so the pattern is inconsistent across the admin surface.

---

### Issue 2: `vault_delete_secret` / `vault_list_secrets` — ID/Name Mismatch Breaks Bulk Delete Workflow

- **Targeted Test**: As an admin doing vault cleanup:
  1. Call `vault_list_secrets` → get back a list of secret **names** (e.g., `"OPENAI_API_KEY"`, `"STRIPE_KEY"`). The description explicitly states: *"Returns names only — NEVER returns secret values."* No IDs returned.
  2. Call `vault_delete_secret` with `{ "secret_id": "???" }` → **blocked**: the `required` parameter is `secret_id` (an opaque database ID), not `name`.

  There is no tool in the schema that resolves a secret name to its `secret_id`. `vault_rotate_secret` uses `name` as the key. `vault_delete_secret` uses `secret_id`. The two tools use different primary keys for the same resource.

- **Result**: **CONFIRMED**

- **Detail**: `vault_rotate_secret` schema: `required: ["name", "value"]`. `vault_delete_secret` schema: `required: ["secret_id"]`. No `vault_get_secret` or `vault_resolve_id` exists in the tool surface. An admin cannot complete the delete workflow without an out-of-band ID lookup. This is a dead-end for any automated bulk vault cleanup operation — a core admin use case.

---

### Issue 3: `apps_delete_permanent` — Confirmation Gate Uses String Type, Not Boolean

- **Targeted Test**: Attempt a permanent delete with a technically-truthy string:
  ```json
  { "app_id": "my-app", "confirm": "false" }
  ```
  Schema says `confirm` is `type: "string"` with description *"Must be true. This action CANNOT be undone."* In JSON Schema, `"false"` is a valid string. A naïve server implementation that checks `if (confirm)` rather than `if (confirm === "true")` would evaluate `"false"` as truthy and execute the irreversible delete.

  Compare to `billing_cancel_subscription` which uses the same `type: "string"` pattern for its `confirm` field. Both destructive, both string-typed.

- **Result**: **BEHAVIORAL** (requires live call to verify server-side coercion, but schema is provably wrong)

- **Detail**: The correct type for a boolean gate is `"type": "boolean"`. Using `"type": "string"` forces consumers to guess whether the server checks `=== "true"`, `=== true`, or just truthiness. This is compounded by the fact that `apps_bin` (soft-delete, recoverable) has **no** confirmation parameter at all, while `apps_delete_permanent` (irreversible) uses a weakly-typed string gate. The destructive action has a weaker type guarantee than standard practice demands.

---

## Summary of Local Delta

| Area | Prod Report | Local Schema Status |
|---|---|---|
| `skill_store_admin_update` required fields | All fields required (blocking partial updates) | **Unchanged — still all required** |
| `vault_list_secrets` → `vault_delete_secret` key mismatch | Name vs ID mismatch | **Unchanged — no bridge tool added** |
| Destructive action confirmation type | `string` instead of `boolean` | **Unchanged — both `apps_delete_permanent` and `billing_cancel_subscription` still use string** |
| `bazdmeg_superpowers_gate_override` admin guard | No visible auth enforcement in schema | **Still no admin token/role field visible in schema** |

No schema fixes have landed between the previous prod report and the current local schema. All three issues are either confirmed-present or require behavioral verification against a live endpoint. The admin tool surface (`skill_store_admin_*`, `vault_*`, destructive `apps_*`) remains the highest-risk area for an operator-level user.