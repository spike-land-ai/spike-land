import { describe, it, expect } from "vitest";
import {
  generateBadgeToken,
  verifyBadgeToken,
  type BadgePayload,
} from "../../../src/core/shared-utils/core-logic/badge-token.js";

const SECRET = "test-secret-key";

function makePayload(overrides: Partial<BadgePayload> = {}): BadgePayload {
  return {
    sid: "session-abc123",
    topic: "typescript-basics",
    score: 95,
    ts: 1700000000000,
    ...overrides,
  };
}

describe("generateBadgeToken", () => {
  it("returns a string with exactly two dot-separated parts", () => {
    const token = generateBadgeToken(makePayload(), SECRET);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBeTruthy();
    expect(parts[1]).toBeTruthy();
  });

  it("encodes the payload as base64 in the first part", () => {
    const payload = makePayload();
    const token = generateBadgeToken(payload, SECRET);
    const payloadPart = token.split(".")[0];
    const decoded = JSON.parse(atob(payloadPart)) as BadgePayload;
    expect(decoded).toEqual(payload);
  });

  it("produces the same token for identical inputs (deterministic)", () => {
    const payload = makePayload();
    const token1 = generateBadgeToken(payload, SECRET);
    const token2 = generateBadgeToken(payload, SECRET);
    expect(token1).toBe(token2);
  });

  it("produces different tokens for different secrets", () => {
    const payload = makePayload();
    const token1 = generateBadgeToken(payload, "secret-a");
    const token2 = generateBadgeToken(payload, "secret-b");
    expect(token1).not.toBe(token2);
    // Payload part is the same, only signature differs
    expect(token1.split(".")[0]).toBe(token2.split(".")[0]);
    expect(token1.split(".")[1]).not.toBe(token2.split(".")[1]);
  });

  it("produces different tokens for different payloads", () => {
    const token1 = generateBadgeToken(makePayload({ score: 80 }), SECRET);
    const token2 = generateBadgeToken(makePayload({ score: 90 }), SECRET);
    expect(token1).not.toBe(token2);
  });

  it("handles payloads with score of 0", () => {
    const payload = makePayload({ score: 0 });
    const token = generateBadgeToken(payload, SECRET);
    expect(token.split(".")).toHaveLength(2);
  });
});

describe("verifyBadgeToken", () => {
  it("returns the original payload for a valid token", () => {
    const payload = makePayload();
    const token = generateBadgeToken(payload, SECRET);
    const result = verifyBadgeToken(token, SECRET);
    expect(result).toEqual(payload);
  });

  it("returns null for a token with wrong secret", () => {
    const token = generateBadgeToken(makePayload(), SECRET);
    const result = verifyBadgeToken(token, "wrong-secret");
    expect(result).toBeNull();
  });

  it("returns null for a tampered payload", () => {
    const payload = makePayload();
    const token = generateBadgeToken(payload, SECRET);
    // Modify the payload part but keep the original signature
    const tamperedPayload = btoa(JSON.stringify({ ...payload, score: 100 }));
    const sig = token.split(".")[1];
    const tamperedToken = `${tamperedPayload}.${sig}`;
    expect(verifyBadgeToken(tamperedToken, SECRET)).toBeNull();
  });

  it("returns null for a token with only one part (no dot)", () => {
    expect(verifyBadgeToken("nodotatall", SECRET)).toBeNull();
  });

  it("returns null for a token with more than two parts", () => {
    expect(verifyBadgeToken("part1.part2.part3", SECRET)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(verifyBadgeToken("", SECRET)).toBeNull();
  });

  it("returns null for a token with invalid base64 payload", () => {
    expect(verifyBadgeToken("not-valid-base64!@#.signature", SECRET)).toBeNull();
  });

  it("returns null when payload part is empty", () => {
    expect(verifyBadgeToken(".signature", SECRET)).toBeNull();
  });

  it("returns null when signature part is empty", () => {
    const payload = makePayload();
    const token = generateBadgeToken(payload, SECRET);
    const payloadPart = token.split(".")[0];
    expect(verifyBadgeToken(`${payloadPart}.`, SECRET)).toBeNull();
  });

  it("round-trips all payload fields correctly", () => {
    const payload: BadgePayload = {
      sid: "uuid-special-chars",
      topic: "advanced-typescript/generics",
      score: 42,
      ts: Date.now(),
    };
    const token = generateBadgeToken(payload, SECRET);
    const verified = verifyBadgeToken(token, SECRET);
    expect(verified).not.toBeNull();
    expect(verified?.sid).toBe(payload.sid);
    expect(verified?.topic).toBe(payload.topic);
    expect(verified?.score).toBe(payload.score);
    expect(verified?.ts).toBe(payload.ts);
  });
});
