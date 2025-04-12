// Disable SSL certificate validation globally
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Export something to make it a proper module
module.exports = {
  applySSLFix: true
};
