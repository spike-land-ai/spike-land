// ULID: Universally Unique Lexicographically Sortable Identifier
// Inlined from 'ulid' package — 26-char Crockford Base32 string
// Format: 10 chars timestamp (ms) + 16 chars randomness

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(now: number, len: number): string {
  let str = "";
  for (let i = len; i > 0; i--) {
    const mod = now % 32;
    str = CROCKFORD.charAt(mod) + str;
    now = (now - mod) / 32;
  }
  return str;
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let str = "";
  for (let i = 0; i < len; i++) {
    str += CROCKFORD.charAt(bytes[i]! % 32);
  }
  return str;
}

export function ulid(seedTime: number = Date.now()): string {
  return encodeTime(seedTime, 10) + encodeRandom(16);
}

export function generateId(): string {
  return ulid();
}
