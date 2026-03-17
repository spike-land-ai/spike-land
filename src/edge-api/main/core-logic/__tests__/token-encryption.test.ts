/**
 * Tests for token-encryption.ts
 *
 * Runtime note: these tests run in Vitest with the Web Crypto API available
 * (Node 20+ exposes globalThis.crypto). They do NOT require a Cloudflare
 * Workers runtime — Web Crypto is standards-based.
 */

import { describe, expect, it } from "vitest";
import { encryptApiKey, decryptApiKey, isEncryptedBlob } from "../token-encryption";

const SECRET = "test-secret-key-that-is-long-enough-for-pbkdf2";
const PLAINTEXT = "sk-test-1234567890abcdefghijklmnopqrstuvwxyz";

// ── encryptApiKey / decryptApiKey ────────────────────────────────────────────

describe("encryptApiKey", () => {
  it("returns a non-empty base64 string", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    expect(typeof blob).toBe("string");
    expect(blob.length).toBeGreaterThan(0);
  });

  it("does NOT return the plaintext key inside the blob", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    // The plaintext must not appear literally in the base64-encoded output
    expect(blob).not.toContain(PLAINTEXT);
  });

  it("produces a different blob each call (unique IV per encryption)", async () => {
    const blob1 = await encryptApiKey(PLAINTEXT, SECRET);
    const blob2 = await encryptApiKey(PLAINTEXT, SECRET);
    // IVs are random so ciphertexts must differ even for identical plaintexts
    expect(blob1).not.toBe(blob2);
  });

  it("blob is valid base64 (isEncryptedBlob returns true)", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    expect(isEncryptedBlob(blob)).toBe(true);
  });
});

describe("decryptApiKey", () => {
  it("round-trips the plaintext correctly", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    const result = await decryptApiKey(blob, SECRET);
    expect(result).toBe(PLAINTEXT);
  });

  it("round-trips a short key", async () => {
    const short = "sk-short-key";
    const blob = await encryptApiKey(short, SECRET);
    const result = await decryptApiKey(blob, SECRET);
    expect(result).toBe(short);
  });

  it("round-trips a key with special characters", async () => {
    const special = "AIza-SomeKey/With+Chars=";
    const blob = await encryptApiKey(special, SECRET);
    const result = await decryptApiKey(blob, SECRET);
    expect(result).toBe(special);
  });

  it("throws when the wrong secret is used (auth tag mismatch)", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    await expect(decryptApiKey(blob, "wrong-secret")).rejects.toThrow("token_decryption_failed");
  });

  it("throws when the ciphertext is tampered (auth tag bytes replaced)", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    // Decode to raw bytes, flip a byte in the auth-tag region (last 16 bytes),
    // then re-encode. AES-GCM MUST reject any modification to ciphertext or tag.
    const raw = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
    // Flip the very last byte of the 16-byte GCM auth tag
    raw[raw.length - 1] = raw[raw.length - 1] ^ 0xff;
    const tampered = btoa(String.fromCharCode(...raw));
    await expect(decryptApiKey(tampered, SECRET)).rejects.toThrow("token_decryption_failed");
  });

  it("throws for an obviously invalid (non-base64) input", async () => {
    await expect(decryptApiKey("!!!not-base64!!!", SECRET)).rejects.toThrow(
      "token_decryption_failed",
    );
  });

  it("throws for a blob that is too short to contain IV + auth tag", async () => {
    // 20 bytes base64-encoded = fewer than 12 (IV) + 16 (tag) = 28 required bytes
    const tooShort = btoa("tooshort");
    await expect(decryptApiKey(tooShort, SECRET)).rejects.toThrow("token_decryption_failed");
  });

  it("is deterministic: two decryptions of the same blob return the same value", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    const r1 = await decryptApiKey(blob, SECRET);
    const r2 = await decryptApiKey(blob, SECRET);
    expect(r1).toBe(r2);
  });
});

// ── isEncryptedBlob ──────────────────────────────────────────────────────────

describe("isEncryptedBlob", () => {
  it("returns true for output of encryptApiKey", async () => {
    const blob = await encryptApiKey(PLAINTEXT, SECRET);
    expect(isEncryptedBlob(blob)).toBe(true);
  });

  it("returns false for a raw API key prefix (too short)", () => {
    expect(isEncryptedBlob("sk-abc")).toBe(false);
  });

  it("returns false for a string with non-base64 characters", () => {
    // Contains spaces and ! which are not base64 alphabet
    expect(isEncryptedBlob("sk-this is a plaintext api key with spaces!")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isEncryptedBlob("")).toBe(false);
  });

  it("returns true for a synthetically valid-length base64 string", () => {
    // 28+ chars of pure base64 alphabet — structurally valid
    const synth = btoa("a".repeat(22)); // encodes to 32 chars of base64
    expect(isEncryptedBlob(synth)).toBe(true);
  });
});
