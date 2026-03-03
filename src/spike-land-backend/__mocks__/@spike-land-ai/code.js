// Mock for @spike-land-ai/code
let counter = 0;
export function computeSessionHash(session) {
  // Return a hash based on session content to allow change detection
  if (session) {
    return JSON.stringify(session).length.toString(36) + "-" + JSON.stringify(session).slice(0, 20);
  }
  return "hash-" + (++counter);
}
export function generateSessionPatch(oldSession, newSession) {
  return { type: "patch", changes: {} };
}
export function md5(s) {
  // Simple deterministic hash for testing
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}
export function sanitizeSession(s) { return s; }
