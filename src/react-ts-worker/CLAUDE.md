# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

This is a from-scratch TypeScript implementation of React, including a Fiber
reconciler, scheduler, and multiple rendering targets (DOM, Worker-DOM, and
server/streaming). The codebase follows React's internal architecture with
custom implementations of core algorithms.

## Common Commands

```bash
# Build TypeScript to dist/
yarn build

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Type checking without emit
yarn typecheck
```

## Architecture

### Multi-Package Structure

The project exports multiple packages through conditional exports in
package.json:

- `react-ts-worker/react` - Core React API (createElement, hooks, context)
- `react-ts-worker/react/jsx-runtime` - JSX transform runtime
- `react-ts-worker/react-dom/client` - DOM rendering (createRoot, hydrateRoot)
- `react-ts-worker/react-dom/server` - Server rendering (renderToString,
  renderToReadableStream)
- `react-ts-worker/react-worker-dom` - Worker-based rendering
- `react-ts-worker/scheduler` - Task scheduler with priorities

### Core Components

**Reconciler (`/reconciler`)**: Fiber-based reconciler implementing React's
concurrent rendering algorithm

- `ReactFiberWorkLoop.ts` - Main work loop, schedules and executes render/commit
  phases
- `ReactFiberBeginWork.ts` - Begins work on a fiber (reconciliation)
- `ReactFiberCompleteWork.ts` - Completes work on a fiber (creates/updates DOM
  nodes)
- `ReactFiberCommitWork.ts` - Commits effects (mutations, layout, passive
  effects)
- `ReactFiberHooks.ts` - Hook implementation (useState, useEffect, etc.)
- `ReactFiberLane.ts` - Priority lanes for concurrent rendering
- `ReactFiberReconciler.ts` - Public API (createContainer, updateContainer)

**Host Config Pattern (`/host-config`)**: Platform abstraction layer

- `HostConfigInterface.ts` - Interface that all renderers must implement
- `DOMHostConfig.ts` - Browser DOM implementation
- `WorkerDOMHostConfig.ts` - Web Worker DOM implementation
- `StreamHostConfig.ts` - Server streaming implementation

The reconciler is parameterized by host config, allowing the same reconciliation
logic to target different platforms (DOM, Worker, Server).

**Scheduler (`/scheduler`)**: Task scheduling with priority levels

- `Scheduler.ts` - Priority-based task queue using min-heap
- `SchedulerPriorities.ts` - Priority levels (Immediate, Normal, Low, Idle)
- `SchedulerMinHeap.ts` - Min-heap data structure for task queue

**Server Rendering (`/server`)**: Fizz server renderer

- `ReactFizzServer.ts` - Streaming server rendering (renderToString,
  renderToReadableStream)
- `ReactFizzHooks.ts` - Server-side hook implementations
- `WorkerdEntry.ts` - Cloudflare Workers integration

**React Public API (`/react`)**: Standard React API

- `ReactElement.ts` - createElement, cloneElement, isValidElement
- `ReactHooks.ts` - All React hooks (useState, useEffect, etc.)
- `ReactContext.ts`, `ReactMemo.ts`, `ReactForwardRef.ts`, `ReactLazy.ts` -
  Component utilities

**Event System (`/react-dom/events`)**: Synthetic event system

- `EventDelegation.ts` - Event delegation at the root
- `SyntheticEvent.ts` - Cross-browser event wrapper

### Key Architectural Patterns

1. **Host Config Pattern**: The reconciler is decoupled from the rendering
   target through the `HostConfig` interface. To add a new rendering target,
   implement the host config interface.

2. **Fiber Architecture**: Work is organized into fibers (units of work) that
   can be paused and resumed, enabling concurrent rendering.

3. **Lane-based Scheduling**: Updates are assigned priority lanes, allowing
   higher-priority work to interrupt lower-priority work.

4. **Double Buffering**: The reconciler maintains current and work-in-progress
   fiber trees for efficient updates.

## Development Notes

- All source code uses ES modules (`.js` extensions in imports despite `.ts`
  files)
- TypeScript with strict mode enabled
- Tests use Vitest with jsdom environment
- Output is built to `dist/` with declarations and source maps
