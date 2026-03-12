const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const MAX_BYTE = 252; // largest multiple of 36 ≤ 256, avoids modulo bias

export function nanoid(length = 21): string {
  let id = "";
  while (id.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - id.length));
    for (let i = 0; i < bytes.length && id.length < length; i++) {
      if (bytes[i] < MAX_BYTE) {
        id += ALPHABET[bytes[i] % ALPHABET.length];
      }
    }
  }
  return id;
}
