import { describe, expect, it } from "vitest";
import {
  AppError,
  CacheError,
  createError,
  DOMError,
  ErrorCode,
  getErrorCode,
  getErrorMessage,
  isAppError,
  MessageHandlingError,
  NetworkError,
  RouterError,
  ValidationError,
  WebSocketError,
  wrapError,
} from "@/lib/errors";

describe("ErrorCode enum", () => {
  it("has all expected codes", () => {
    expect(ErrorCode.WEBSOCKET_ERROR).toBe("WEBSOCKET_ERROR");
    expect(ErrorCode.DOM_ERROR).toBe("DOM_ERROR");
    expect(ErrorCode.ROUTER_ERROR).toBe("ROUTER_ERROR");
    expect(ErrorCode.MESSAGE_ERROR).toBe("MESSAGE_ERROR");
    expect(ErrorCode.NETWORK_ERROR).toBe("NETWORK_ERROR");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.CACHE_ERROR).toBe("CACHE_ERROR");
    expect(ErrorCode.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR");
  });
});

describe("AppError", () => {
  it("creates an error with message, code, and timestamp", () => {
    const err = new AppError("test message", ErrorCode.UNKNOWN_ERROR);
    expect(err.message).toBe("test message");
    expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(err.timestamp).toBeGreaterThan(0);
    expect(err.name).toBe("AppError");
  });

  it("defaults to UNKNOWN_ERROR when no code provided", () => {
    const err = new AppError("msg");
    expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });

  it("stores details", () => {
    const details = { extra: "data" };
    const err = new AppError("msg", ErrorCode.CACHE_ERROR, details);
    expect(err.details).toEqual(details);
  });

  it("toJSON returns all fields", () => {
    const err = new AppError("json test", ErrorCode.NETWORK_ERROR, { url: "http://x" });
    const json = err.toJSON();
    expect(json.name).toBe("AppError");
    expect(json.message).toBe("json test");
    expect(json.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(json.details).toEqual({ url: "http://x" });
    expect(json.timestamp).toBeGreaterThan(0);
  });

  it("is an instance of Error", () => {
    const err = new AppError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("WebSocketError", () => {
  it("creates with message only", () => {
    const err = new WebSocketError("ws failed");
    expect(err.code).toBe(ErrorCode.WEBSOCKET_ERROR);
    expect(err.originalError).toBeUndefined();
  });

  it("includes cause stack when originalError has stack", () => {
    const cause = new Error("original");
    const err = new WebSocketError("ws failed", cause);
    expect(err.originalError).toBe(cause);
    expect(err.stack).toContain("Caused by:");
  });

  it("handles originalError without stack", () => {
    const cause = new Error("no stack");
    delete cause.stack;
    const err = new WebSocketError("ws failed", cause);
    expect(err.originalError).toBe(cause);
  });
});

describe("DOMError", () => {
  it("creates with message only", () => {
    const err = new DOMError("dom failed");
    expect(err.code).toBe(ErrorCode.DOM_ERROR);
    expect(err.elementId).toBeUndefined();
  });

  it("includes elementId in message", () => {
    const err = new DOMError("dom failed", "btn-submit");
    expect(err.message).toContain("btn-submit");
    expect(err.elementId).toBe("btn-submit");
  });
});

describe("RouterError", () => {
  it("creates with path", () => {
    const err = new RouterError("route failed", "/dashboard");
    expect(err.code).toBe(ErrorCode.ROUTER_ERROR);
    expect(err.path).toBe("/dashboard");
    expect(err.message).toContain("/dashboard");
  });

  it("creates without path", () => {
    const err = new RouterError("route failed");
    expect(err.path).toBeUndefined();
  });
});

describe("MessageHandlingError", () => {
  it("stores data", () => {
    const err = new MessageHandlingError("bad msg", { type: "ping" });
    expect(err.code).toBe(ErrorCode.MESSAGE_ERROR);
    expect(err.data).toEqual({ type: "ping" });
  });
});

describe("NetworkError", () => {
  it("stores url and statusCode", () => {
    const err = new NetworkError("fetch failed", "https://api.com", 404);
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(err.url).toBe("https://api.com");
    expect(err.statusCode).toBe(404);
  });

  it("creates with no url or statusCode", () => {
    const err = new NetworkError("timeout");
    expect(err.url).toBeUndefined();
    expect(err.statusCode).toBeUndefined();
  });
});

describe("CacheError", () => {
  it("stores cacheName", () => {
    const err = new CacheError("cache miss", "my-cache");
    expect(err.code).toBe(ErrorCode.CACHE_ERROR);
    expect(err.cacheName).toBe("my-cache");
  });
});

describe("ValidationError", () => {
  it("stores field", () => {
    const err = new ValidationError("invalid email", "email");
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(err.field).toBe("email");
  });
});

describe("createError", () => {
  it("creates WebSocketError", () => {
    const cause = new Error("cause");
    const err = createError(ErrorCode.WEBSOCKET_ERROR, "ws", cause);
    expect(err).toBeInstanceOf(WebSocketError);
  });

  it("creates WebSocketError without Error details", () => {
    const err = createError(ErrorCode.WEBSOCKET_ERROR, "ws", "not an error");
    expect(err).toBeInstanceOf(WebSocketError);
  });

  it("creates DOMError with string details", () => {
    const err = createError(ErrorCode.DOM_ERROR, "dom", "btn-id");
    expect(err).toBeInstanceOf(DOMError);
  });

  it("creates DOMError without string details", () => {
    const err = createError(ErrorCode.DOM_ERROR, "dom", 42);
    expect(err).toBeInstanceOf(DOMError);
  });

  it("creates RouterError with string details", () => {
    const err = createError(ErrorCode.ROUTER_ERROR, "route", "/path");
    expect(err).toBeInstanceOf(RouterError);
  });

  it("creates RouterError without string details", () => {
    const err = createError(ErrorCode.ROUTER_ERROR, "route", null);
    expect(err).toBeInstanceOf(RouterError);
  });

  it("creates MessageHandlingError", () => {
    const err = createError(ErrorCode.MESSAGE_ERROR, "msg", { data: 1 });
    expect(err).toBeInstanceOf(MessageHandlingError);
  });

  it("creates NetworkError with url and statusCode", () => {
    const err = createError(ErrorCode.NETWORK_ERROR, "net", { url: "http://x", statusCode: 500 });
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).url).toBe("http://x");
    expect((err as NetworkError).statusCode).toBe(500);
  });

  it("creates NetworkError with undefined details", () => {
    const err = createError(ErrorCode.NETWORK_ERROR, "net");
    expect(err).toBeInstanceOf(NetworkError);
  });

  it("creates CacheError with string details", () => {
    const err = createError(ErrorCode.CACHE_ERROR, "cache", "cache-name");
    expect(err).toBeInstanceOf(CacheError);
  });

  it("creates CacheError without string details", () => {
    const err = createError(ErrorCode.CACHE_ERROR, "cache", { obj: true });
    expect(err).toBeInstanceOf(CacheError);
  });

  it("creates ValidationError with string details", () => {
    const err = createError(ErrorCode.VALIDATION_ERROR, "invalid", "field");
    expect(err).toBeInstanceOf(ValidationError);
  });

  it("creates ValidationError without string details", () => {
    const err = createError(ErrorCode.VALIDATION_ERROR, "invalid", 123);
    expect(err).toBeInstanceOf(ValidationError);
  });

  it("creates generic AppError for UNKNOWN_ERROR", () => {
    const err = createError(ErrorCode.UNKNOWN_ERROR, "unknown");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe("getErrorMessage", () => {
  it("returns message from Error", () => {
    expect(getErrorMessage(new Error("oops"))).toBe("oops");
  });

  it("converts non-Error to string", () => {
    expect(getErrorMessage("raw string")).toBe("raw string");
    expect(getErrorMessage(42)).toBe("42");
    expect(getErrorMessage(null)).toBe("null");
  });
});

describe("getErrorCode", () => {
  it("returns code from AppError", () => {
    const err = new AppError("x", ErrorCode.CACHE_ERROR);
    expect(getErrorCode(err)).toBe(ErrorCode.CACHE_ERROR);
  });

  it("returns UNKNOWN_ERROR for non-AppError", () => {
    expect(getErrorCode(new Error("plain"))).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(getErrorCode("string")).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => {
    expect(isAppError(new AppError("x"))).toBe(true);
    expect(isAppError(new WebSocketError("ws"))).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError("str")).toBe(false);
  });
});

describe("wrapError", () => {
  it("returns AppError unchanged", () => {
    const err = new AppError("x");
    expect(wrapError(err)).toBe(err);
  });

  it("wraps plain Error into AppError", () => {
    const plain = new Error("plain");
    const wrapped = wrapError(plain);
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.message).toBe("plain");
    expect(wrapped.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });

  it("wraps with custom code", () => {
    const wrapped = wrapError(new Error("net"), ErrorCode.NETWORK_ERROR);
    expect(wrapped.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it("wraps non-Error values", () => {
    const wrapped = wrapError("just a string");
    expect(wrapped.message).toBe("just a string");
  });
});
