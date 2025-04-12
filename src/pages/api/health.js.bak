/**
 * Health check endpoint for Render
 * 
 * This simple endpoint returns a 200 status code and a JSON response
 * to indicate that the application is up and running.
 */

export default function handler(req, res) {
  // Get the current version from package.json if possible
  let version;
  try {
    const packageJson = require('../../../package.json');
    version = packageJson.version;
  } catch (error) {
    version = 'unknown';
  }

  // Return a 200 OK response with some basic information
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version
  });
}
