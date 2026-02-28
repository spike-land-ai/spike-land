import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

// Mock reactflow CSS import that hangs in jsdom/forks pool
vi.mock("reactflow", () => ({
  default: () => null,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  MarkerType: { Arrow: "arrow", ArrowClosed: "arrowclosed" },
}));
vi.mock("reactflow/dist/style.css", () => ({}));

// Mock useStateMachine to prevent API fetch calls
const mockHookReturn = vi.hoisted(() => ({
  machines: [] as Array<{ id: string; name: string; }>,
  activeMachineId: null as string | null,
  activeMachine: null,
  loading: false,
  error: null,
  activeValidation: [],
  listMachines: vi.fn(),
  createMachine: vi.fn(),
  switchMachine: vi.fn(),
  closeMachine: vi.fn(),
  refreshMachine: vi.fn(),
  addState: vi.fn(),
  removeState: vi.fn(),
  addTransition: vi.fn(),
  removeTransition: vi.fn(),
  sendEvent: vi.fn(),
  resetMachine: vi.fn(),
  setContext: vi.fn(),
  validateMachine: vi.fn(),
  exportMachine: vi.fn(),
  shareMachine: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock("@/components/state-machine/use-state-machine", () => ({
  useStateMachine: () => mockHookReturn,
}));

describe("StateMachineApp", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders empty workspace when no machines exist", async () => {
    const { StateMachineApp } = await import("./StateMachineApp");
    render(React.createElement(StateMachineApp));
    expect(screen.getByText("State Machine Studio")).toBeDefined();
    expect(screen.getByText("New Machine")).toBeDefined();
    expect(screen.getByText("Templates")).toBeDefined();
  });

  it("calls listMachines on mount", async () => {
    const { StateMachineApp } = await import("./StateMachineApp");
    render(React.createElement(StateMachineApp));
    expect(mockHookReturn.listMachines).toHaveBeenCalled();
  });
});
