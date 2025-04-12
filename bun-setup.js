// SSL fix for Bun environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Using dynamic import to ensure compatibility with ESM
import('pg').then(pg => {
  // Enable extra SSL troubleshooting in pg
  pg.defaults.ssl = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };
  
  console.log('Applied SSL certificate fix for Bun environment');
}).catch(err => {
  console.error('Failed to load pg module:', err.message);
});

// Export for Bun to treat as a module
export default {};
