---
description: Create or Scaffold an MCP Tool
---

# Workflow: Create an MCP Tool

When asked to create or scaffold a new MCP tool in any `mcp-*` project, you MUST
strictly adhere to the standardized error handling pattern detailed in
`docs/architecture/MCP_TOOL_GUIDELINES.md`.

## Steps

1. **Verify Tool Context**: Check if `src/tools/try-catch.ts` exists in the
   target project. If it doesn't, inform the user or scaffold it according to
   the pattern (see existing mcp projects for reference).
2. **Define the Input**: Create an exported interface for the tool's input
   parameters.
3. **Use the `tryCatch` wrapper**: Wrap all asynchronous business logic
   (database calls, external APIs) in the `tryCatch` utility.
   - Do NOT use traditional `try { ... } catch (e) { ... }` blocks.
4. **Standardize Returns**:
   - On error:
     `if (!result.ok) return errorResult("ERROR_CODE", result.error.message);`
   - On success: `return jsonResult({ ...result.data });`
5. **Update Tool Documentation**: If you find ways to improve the error-handling
   guidelines during your work, click the edit link in the documentation to
   suggest updates via a PR or issue.
