// Direct SSL fix for Bun environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Export for database connection modules to import
export function setupSSL() {
  // Force Node to accept self-signed certificates
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  return {
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    }
  };
}
