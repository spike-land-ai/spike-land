# State Machine Library

A self-contained statechart execution engine with an in-process guard expression
parser.

## Key Files

| File                     | Responsibility                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`               | Core types: `MachineDefinition`, `MachineInstance`, `StateNode`, `Transition`, `Action`, `ValidationIssue`, `TransitionLogEntry`, `MachineExport`                                                  |
| `parser.ts`              | Safe recursive-descent parser for guard expressions — no `eval`. Supports `&&`, `\|\|`, comparison operators, arithmetic, string/number/boolean literals, and context field access                 |
| `engine.ts`              | Execution runtime: creates and manages `MachineInstance` objects in an in-memory `Map`, resolves compound/parallel/history state entry, fires transitions, executes actions, validates definitions |
| `visualizer-template.ts` | Generates HTML/SVG visualizations of a machine definition                                                                                                                                          |

## Architecture

```
types.ts  (shared interfaces)
  └── parser.ts   (guard evaluation — pure, no side effects)
      └── engine.ts  (orchestrator: machine registry + transition logic)
          └── visualizer-template.ts  (read-only rendering)
```

### Engine

The engine maintains all running machines in a module-level
`Map<id, MachineInstance>`. Key operations:

- **`createMachine`** — validates a `MachineDefinition` and stores a new
  instance
- **`sendEvent`** — finds eligible transitions whose guards pass (via
  `parser.evaluateGuard`), exits the current state, executes
  exit/transition/entry actions, and updates the active state set
- **`getMachineState`** / **`listMachines`** / **`exportMachine`** — read-only
  introspection

Supports: atomic, compound (hierarchical), parallel (concurrent regions),
history, and final states.

### Guard Parser

Implements a recursive-descent grammar (no regex eval). Grammar priority (low to
high):

```
expr → orExpr → andExpr → comparison → additive → multiplicative → unary → primary
```

`primary` resolves dot-path context lookups (e.g. `user.role == "admin"`),
literals, and parenthesised sub-expressions.

## Related

- MCP tools: `src/lib/mcp/server/tools/state-machine/`
- Store app tools: `packages/store-apps/state-machine/`
- MCP tool guidelines:
  [docs/architecture/MCP_TOOL_GUIDELINES.md](../../../docs/architecture/MCP_TOOL_GUIDELINES.md)
