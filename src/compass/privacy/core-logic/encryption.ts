/**
 * COMPASS Privacy Layer — Encryption Service
 *
 * Implements AES-GCM-256 authenticated encryption using the Web Crypto API.
 * The SubtleCrypto interface is defined locally so this module is portable
 * across browser, Cloudflare Workers, Node.js >= 20, and Deno without
 * importing any environment-specific crypto module.
 *
 * SECURITY DECISIONS (OWASP A02 – Cryptographic Failures):
 *
 * 1. AES-GCM-256:  provides both confidentiality and integrity (AEAD).
 *    An attacker who tampers with the ciphertext will receive a decryption
 *    error rather than corrupted plaintext. This prevents chosen-ciphertext
 *    attacks.
 *
 * 2. 96-bit IV (12 bytes): the NIST-recommended size for GCM. A fresh IV
 *    is generated via getRandomValues() for every encryption call, ensuring
 *    (key, IV) pairs are never reused. Reuse breaks GCM authentication.
 *
 * 3. extractable: false on generated keys: the raw key bytes cannot be
 *    exported. Keys only leave the crypto subsystem as CryptoKey handles.
 *
 * 4. PBKDF2 for password-derived keys: 310 000 iterations (OWASP 2023
 *    recommendation for PBKDF2-SHA-256) to resist brute-force. Salt must
 *    be stored alongside the derived-key ciphertext; use a fresh random
 *    salt per key derivation.
 *
 * 5. base64url encoding: ciphertext and IV are encoded without padding
 *    so they are safe in JSON, URLs, and HTTP headers without escaping.
 */

import type { EncryptedPayload } from "../types.js";

// ---------------------------------------------------------------------------
// Minimal local SubtleCrypto interface
// ---------------------------------------------------------------------------
// We define only the operations we actually use. This avoids a dependency on
// @types/node, lib.dom.d.ts, or @cloudflare/workers-types, keeping the
// package portable and the TCB (trusted computing base) small.
//
// We use ArrayBufferLike | ArrayBufferView instead of the DOM BufferSource
// type, because TypeScript's Uint8Array constructor returns
// Uint8Array<ArrayBufferLike> (not Uint8Array<ArrayBuffer>), and the strict
// DOM BufferSource = ArrayBuffer | ArrayBufferView<ArrayBuffer> rejects it
// under exactOptionalPropertyTypes + strict mode.
type LocalBufferSource = ArrayBufferLike | ArrayBufferView;

// Local algorithm parameter types — we define these ourselves so we can use
// LocalBufferSource for salt/iv/data fields rather than the strict DOM
// BufferSource (which rejects Uint8Array<ArrayBufferLike>).
interface LocalAesGcmParams {
  name: "AES-GCM";
  iv: LocalBufferSource;
}
interface LocalAesKeyGenParams {
  name: "AES-GCM";
  length: 256;
}
interface LocalAesDerivedKeyParams {
  name: "AES-GCM";
  length: 256;
}
interface LocalPbkdf2Params {
  name: "PBKDF2";
  salt: LocalBufferSource;
  iterations: number;
  hash: "SHA-256";
}

interface SubtleCryptoLocal {
  encrypt(
    algorithm: LocalAesGcmParams,
    key: CryptoKey,
    data: LocalBufferSource,
  ): Promise<ArrayBuffer>;

  decrypt(
    algorithm: LocalAesGcmParams,
    key: CryptoKey,
    data: LocalBufferSource,
  ): Promise<ArrayBuffer>;

  generateKey(
    algorithm: LocalAesKeyGenParams,
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>,
  ): Promise<CryptoKey>;

  importKey(
    format: "raw",
    keyData: LocalBufferSource,
    algorithm: "PBKDF2",
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>,
  ): Promise<CryptoKey>;

  deriveKey(
    algorithm: LocalPbkdf2Params,
    baseKey: CryptoKey,
    derivedKeyType: LocalAesDerivedKeyParams,
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>,
  ): Promise<CryptoKey>;
}

interface WebCryptoLocal {
  subtle: SubtleCryptoLocal;
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

// Resolve crypto from the global scope at call time so this module works in
// all runtimes without side-effects at import time.
function getCrypto(): WebCryptoLocal {
  // globalThis.crypto is available in: browsers, CF Workers, Node >= 20, Deno
  const c = (globalThis as Record<string, unknown>)["crypto"];
  if (
    typeof c !== "object" ||
    c === null ||
    typeof (c as Record<string, unknown>)["subtle"] === "undefined"
  ) {
    throw new Error(
      "Web Crypto API (globalThis.crypto.subtle) is not available in this runtime. " +
        "Require Node >= 20, a modern browser, or Cloudflare Workers.",
    );
  }
  return c as WebCryptoLocal;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALGORITHM = "AES-GCM" as const;
const KEY_LENGTH_BITS = 256 as const;
/** GCM IV length in bytes. NIST SP 800-38D recommends 96 bits (12 bytes). */
const IV_BYTES = 12 as const;
/**
 * PBKDF2 iterations. OWASP recommends >= 310,000 for PBKDF2-SHA-256 (2023).
 * Increase this value over time as hardware improves.
 */
const PBKDF2_ITERATIONS = 310_000 as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode an ArrayBuffer to base64url (no padding). */
function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    // bytes[i] is always defined inside bounds
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Decode a base64url string (with or without padding) to ArrayBuffer. */
function fromBase64Url(encoded: string): ArrayBuffer {
  // Re-add padding
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  const withPad = remainder === 0 ? padded : padded + "=".repeat(4 - remainder);
  const binary = atob(withPad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Encode a UTF-8 string to a Uint8Array. */
function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Decode a Uint8Array to a UTF-8 string. */
function decodeUtf8(bytes: BufferSource): string {
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------------------
// EncryptionService
// ---------------------------------------------------------------------------

/**
 * Stateless service: all methods are pure functions that take explicit keys.
 * There is no internal key storage — the caller is responsible for key
 * lifecycle (storage, rotation, destruction).
 *
 * USAGE PATTERN:
 *
 *   const svc = new EncryptionService("compass-user-data-key-v1");
 *   const key = await svc.generateKey();
 *   const payload = await svc.encrypt(sensitiveString, key);
 *   // store payload.ciphertext, payload.iv, payload.algorithm, payload.keyId
 *   // store key securely (e.g. wrapped by a KMS master key)
 *   const plaintext = await svc.decrypt(payload, key);
 */
export class EncryptionService {
  /**
   * @param keyId  Logical key identifier used to populate EncryptedPayload.keyId.
   *   This should reflect key version so callers can rotate keys and still
   *   decrypt older records (e.g. "compass-v1", "compass-v2").
   */
  constructor(private readonly keyId: string) {}

  /**
   * Generate a new AES-GCM-256 CryptoKey.
   *
   * extractable is set to false: the raw key material cannot be exported.
   * This limits exposure if the CryptoKey handle is accidentally serialised.
   *
   * Key usages are restricted to encrypt+decrypt only.
   */
  async generateKey(): Promise<CryptoKey> {
    const { subtle } = getCrypto();
    return subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH_BITS },
      /* extractable */ false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Derive an AES-GCM-256 key from a password using PBKDF2-SHA-256.
   *
   * @param password  User-supplied secret (never stored; only used transiently).
   * @param salt      Random salt (16+ bytes). Must be stored alongside the
   *                  ciphertext to allow future decryption.
   *
   * OWASP A02: password-to-key derivation must use a slow KDF.
   * Never use a hash (MD5, SHA-256 directly) to derive a key from a password.
   */
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const { subtle } = getCrypto();

    // Step 1: import the password as a raw key for PBKDF2.
    // This key can only be used to derive other keys, never directly to encrypt.
    const rawKeyMaterial = await subtle.importKey(
      "raw",
      encodeUtf8(password),
      "PBKDF2",
      /* extractable */ false,
      ["deriveKey"],
    );

    // Step 2: derive the actual AES-GCM key.
    return subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      rawKeyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH_BITS },
      /* extractable */ false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Encrypt a UTF-8 plaintext string.
   *
   * A fresh 96-bit IV is generated for each call. Never reuse (key, IV) pairs
   * with AES-GCM — doing so catastrophically breaks authentication.
   *
   * @returns EncryptedPayload — safe to serialise to JSON or store in a database.
   *   The IV is not secret; the key must remain secret.
   */
  async encrypt(data: string, key: CryptoKey): Promise<EncryptedPayload> {
    const crypto = getCrypto();
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodeUtf8(data),
    );

    return {
      ciphertext: toBase64Url(ciphertextBuffer),
      iv: toBase64Url(iv.buffer),
      algorithm: ALGORITHM,
      keyId: this.keyId,
    };
  }

  /**
   * Decrypt an EncryptedPayload back to a UTF-8 string.
   *
   * AES-GCM will throw a DOMException (OperationError) if the ciphertext has
   * been tampered with. The error is re-thrown as a plain Error to avoid
   * leaking implementation details to callers.
   *
   * @throws Error if decryption fails (tampered data, wrong key, or wrong IV).
   */
  async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    if (payload.algorithm !== ALGORITHM) {
      // Fail fast with a clear message rather than a cryptic crypto error.
      throw new Error(`Unsupported algorithm "${payload.algorithm}". Expected "${ALGORITHM}".`);
    }

    const { subtle } = getCrypto();
    const iv = new Uint8Array(fromBase64Url(payload.iv));
    const ciphertextBytes = fromBase64Url(payload.ciphertext);

    let plaintextBuffer: ArrayBuffer;
    try {
      plaintextBuffer = await subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertextBytes);
    } catch {
      // Do NOT expose the original error: it may leak timing or algorithm info.
      // OWASP A02: fail securely and uniformly.
      throw new Error(
        "Decryption failed. The payload may have been tampered with, " +
          "or an incorrect key was supplied.",
      );
    }

    return decodeUtf8(plaintextBuffer);
  }
}
