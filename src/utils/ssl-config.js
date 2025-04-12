/**
 * SSL Configuration Utility
 * 
 * This utility centralizes SSL configuration for the application
 * to ensure consistent behavior across different environments.
 */

// Apply SSL configuration for Node.js environments
export function configureSSL() {
  // Disable SSL certificate validation globally
  if (typeof process !== 'undefined' && process.env) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Configure pg module if available (server-side only)
  if (typeof window === 'undefined') {
    try {
      // Use dynamic import for ESM compatibility
      import('pg').then(pg => {
        if (pg && pg.defaults) {
          pg.defaults.ssl = {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
          };
          console.log('SSL configuration successfully applied to pg module');
        }
      }).catch(err => {
        // Silently ignore if pg isn't available
      });
    } catch (error) {
      // Ignore errors if pg isn't available
    }
  }
}

// Call configuration function immediately
configureSSL();

// Export a function to manually apply the configuration if needed
export default configureSSL;
