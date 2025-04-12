/**
 * API Crypto Helper
 * 
 * This module provides safe alternatives to Node.js crypto functions
 * that might cause issues with experimental dynamicIO.
 */

// Generate a UUID v4 without relying on node:crypto
export function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate random bytes using Math.random
export function randomBytes(size) {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

// Default export for convenience
export default {
  randomUUID,
  randomBytes
};
