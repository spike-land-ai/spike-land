import { describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "../../../src/spike-land-mcp/auth/jwt";

const SECRET = "test-jwt-secret-at-least-32-chars-long";

describe("JWT sign + verify", () => {
  it("roundtrip: sign then verify returns original payload", async () => {
    const payload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = await signJwt(payload, SECRET);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const result = await verifyJwt(token, SECRET);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe("user-123");
    expect(result!.iat).toBeTypeOf("number");
  });

  it("preserves custom fields in payload", async () => {
    const payload = {
      sub: "user-456",
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "admin",
    };
    const token = await signJwt(payload, SECRET);
    const result = await verifyJwt(token, SECRET);

    expect(result).not.toBeNull();
    expect(result!.role).toBe("admin");
  });

  it("rejects token signed with different secret", async () => {
    const payload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = await signJwt(payload, SECRET);

    const result = await verifyJwt(token, "wrong-secret-that-is-different!!");
    expect(result).toBeNull();
  });

  it("rejects expired token", async () => {
    // Create a token that expired 10 seconds ago
    const payload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) - 10,
    };
    const token = await signJwt(payload, SECRET);

    const result = await verifyJwt(token, SECRET);
    expect(result).toBeNull();
  });

  it("rejects malformed token (missing parts)", async () => {
    const result = await verifyJwt("not.a.valid.token.with.extra", SECRET);
    expect(result).toBeNull();

    const result2 = await verifyJwt("onlyonepart", SECRET);
    expect(result2).toBeNull();
  });

  it("rejects token with tampered payload", async () => {
    const payload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = await signJwt(payload, SECRET);
    const parts = token.split(".");

    // Tamper with the payload (change a character)
    const tamperedPayload = parts[1]!.slice(0, -1) + "X";
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const result = await verifyJwt(tamperedToken, SECRET);
    expect(result).toBeNull();
  });

  it("returns null for token with malformed JSON payload (catch branch)", async () => {
    // Build a token with a valid signature but a body that decodes to invalid JSON
    // We sign a custom header.body pair so the signature matches but body is garbage
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    // "not-json" in base64url
    const badBody = btoa("not-valid-json{{{").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const signingInput = `${header}.${badBody}`;

    // Sign with the real secret so signature verification passes
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
    const sigBytes = new Uint8Array(sigBuffer);
    let sigStr = "";
    for (const b of sigBytes) sigStr += String.fromCharCode(b);
    const sig = btoa(sigStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const token = `${signingInput}.${sig}`;
    const result = await verifyJwt(token, SECRET);
    // The catch block returns null for invalid JSON
    expect(result).toBeNull();
  });
});
