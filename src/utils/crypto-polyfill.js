/**
 * Crypto Polyfill Utility
 * 
 * This utility provides alternative implementations for Node.js crypto functions
 * to avoid issues with experimental dynamicIO in Next.js 15.
 */

// Generate a UUID v4 without relying on node:crypto
export function generateUUID() {
  // Implementation based on RFC4122 version 4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate random bytes using Math.random instead of crypto
export function generateRandomBytes(size) {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

// Export a function that can be used as a drop-in replacement for crypto.randomUUID()
export function randomUUID() {
  return generateUUID();
}

// Export a function that can be used as a replacement for crypto.randomBytes()
export function randomBytes(size) {
  return generateRandomBytes(size);
}

// Default export for convenience
export default {
  randomUUID,
  randomBytes,
  generateUUID,
  generateRandomBytes
};
