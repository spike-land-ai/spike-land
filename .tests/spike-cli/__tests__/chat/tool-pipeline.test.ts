import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  composeMiddleware,
  validationMiddleware,
  timeoutMiddleware,
  retryMiddleware,
  cachingMiddleware,
  loggingMiddleware,
  createToolPipeline,
  type ToolCallCtx,
  type ToolExecResult,
  type ToolMiddleware,
} from "../../../../src/cli/spike-cli/core-logic/chat/tool-pipeline.js";

function makeCtx(overrides: Partial<ToolCallCtx> = {}): ToolCallCtx {
  return {
    toolName: "test__my_tool",
    input: {},
    ...overrides,
  };
}

const okResult: ToolExecResult = { result: "success", isError: false };
const errResult: ToolExecResult = { result: "failure", isError: true };

describe("composeMiddleware", () => {
  it("calls handler directly with no middleware", async () => {
    const handler = vi.fn().mockResolvedValue(okResult);
    const composed = composeMiddleware([], handler);
    const result = await composed(makeCtx());
    expect(result).toEqual(okResult);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("chains middleware in order", async () => {
    const order: number[] = [];

    const mw1: ToolMiddleware = async (_ctx, next) => {
      order.push(1);
      const r = await next();
      order.push(4);
      return r;
    };
    const mw2: ToolMiddleware = async (_ctx, next) => {
      order.push(2);
      const r = await next();
      order.push(3);
      return r;
    };

    const handler = vi.fn().mockResolvedValue(okResult);
    const composed = composeMiddleware([mw1, mw2], handler);
    await composed(makeCtx());

    expect(order).toEqual([1, 2, 3, 4]);
  });

  it("middleware can short-circuit without calling next", async () => {
    const shortCircuit: ToolMiddleware = async () => errResult;
    const handler = vi.fn().mockResolvedValue(okResult);
    const composed = composeMiddleware([shortCircuit], handler);
    const result = await composed(makeCtx());
    expect(result).toEqual(errResult);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("validationMiddleware", () => {
  const mw = validationMiddleware();
  const next = vi.fn().mockResolvedValue(okResult);

  beforeEach(() => {
    next.mockClear();
  });

  it("passes when no schema provided", async () => {
    const result = await mw(makeCtx(), next);
    expect(result).toEqual(okResult);
    expect(next).toHaveBeenCalled();
  });

  it("passes when required fields are present", async () => {
    const ctx = makeCtx({
      input: { name: "test" },
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
      },
    });
    const result = await mw(ctx, next);
    expect(result).toEqual(okResult);
  });

  it("fails when required field is missing", async () => {
    const ctx = makeCtx({
      input: {},
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
      },
    });
    const result = await mw(ctx, next);
    expect(result.isError).toBe(true);
    expect(result.result).toContain("missing required field");
    expect(next).not.toHaveBeenCalled();
  });

  it("allows missing required field if schema has default", async () => {
    const ctx = makeCtx({
      input: {},
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", default: "default" } },
      },
    });
    const result = await mw(ctx, next);
    expect(result).toEqual(okResult);
  });

  it("fails on type mismatch for string", async () => {
    const ctx = makeCtx({
      input: { name: 42 },
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
      },
    });
    const result = await mw(ctx, next);
    expect(result.isError).toBe(true);
    expect(result.result).toContain("expected string");
  });
});

describe("timeoutMiddleware", () => {
  it("returns result when within timeout", async () => {
    const mw = timeoutMiddleware(5000);
    const next = vi.fn().mockResolvedValue(okResult);
    const result = await mw(makeCtx(), next);
    expect(result).toEqual(okResult);
  });

  it("returns error when tool times out", async () => {
    const mw = timeoutMiddleware(10);
    const next = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(okResult), 200)),
    );
    const result = await mw(makeCtx(), next);
    expect(result.isError).toBe(true);
    expect(result.result).toContain("timed out");
  });
});

describe("retryMiddleware", () => {
  it("returns immediately on success", async () => {
    const mw = retryMiddleware(2);
    const next = vi.fn().mockResolvedValue(okResult);
    const result = await mw(makeCtx(), next);
    expect(result).toEqual(okResult);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("retries on error up to maxRetries", async () => {
    const mw = retryMiddleware(2);
    const next = vi.fn()
      .mockResolvedValueOnce({ result: "server error", isError: true })
      .mockResolvedValueOnce({ result: "server error", isError: true })
      .mockResolvedValueOnce(okResult);
    const result = await mw(makeCtx(), next);
    expect(result).toEqual(okResult);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it("does not retry validation errors", async () => {
    const mw = retryMiddleware(2);
    const next = vi.fn().mockResolvedValue({
      result: "Validation error: missing field",
      isError: true,
    });
    const result = await mw(makeCtx(), next);
    expect(result.isError).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("cachingMiddleware", () => {
  it("caches results for GET-like tools", async () => {
    const mw = cachingMiddleware(100, 60000);
    const next = vi.fn().mockResolvedValue(okResult);
    const ctx = makeCtx({ toolName: "server__list_items", input: { q: "test" } });

    const result1 = await mw(ctx, next);
    const result2 = await mw(ctx, next);

    expect(result1).toEqual(okResult);
    expect(result2).toEqual(okResult);
    expect(next).toHaveBeenCalledTimes(1); // cached second time
  });

  it("does not cache write-like tools", async () => {
    const mw = cachingMiddleware(100, 60000);
    const next = vi.fn().mockResolvedValue(okResult);
    const ctx = makeCtx({ toolName: "server__create_item", input: {} });

    await mw(ctx, next);
    await mw(ctx, next);

    expect(next).toHaveBeenCalledTimes(2); // not cached
  });

  it("does not cache errors", async () => {
    const mw = cachingMiddleware(100, 60000);
    const next = vi.fn()
      .mockResolvedValueOnce(errResult)
      .mockResolvedValueOnce(okResult);
    const ctx = makeCtx({ toolName: "server__get_item", input: {} });

    const r1 = await mw(ctx, next);
    const r2 = await mw(ctx, next);

    expect(r1).toEqual(errResult);
    expect(r2).toEqual(okResult);
    expect(next).toHaveBeenCalledTimes(2);
  });
});

describe("loggingMiddleware", () => {
  it("passes through results", async () => {
    const mw = loggingMiddleware();
    const next = vi.fn().mockResolvedValue(okResult);
    const result = await mw(makeCtx(), next);
    expect(result).toEqual(okResult);
  });
});

describe("createToolPipeline", () => {
  it("creates pipeline with default options", async () => {
    const handler = vi.fn().mockResolvedValue(okResult);
    const pipeline = createToolPipeline(handler);
    const result = await pipeline(makeCtx());
    expect(result).toEqual(okResult);
  });

  it("applies validation middleware", async () => {
    const handler = vi.fn().mockResolvedValue(okResult);
    const pipeline = createToolPipeline(handler, { validation: true, logging: false, timeoutMs: 0 });
    const ctx = makeCtx({
      input: {},
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
      },
    });
    const result = await pipeline(ctx);
    expect(result.isError).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("disables validation when option is false", async () => {
    const handler = vi.fn().mockResolvedValue(okResult);
    const pipeline = createToolPipeline(handler, { validation: false, logging: false, timeoutMs: 0 });
    const ctx = makeCtx({
      input: {},
      inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
    });
    const result = await pipeline(ctx);
    expect(result).toEqual(okResult);
  });
});
