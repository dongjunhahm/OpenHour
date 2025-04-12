import { setupDatabase } from './setupDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    await setupDatabase();
    return res.status(200).json({ message: 'Database schema initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return res.status(500).json({ 
      message: 'Failed to initialize database', 
      error: error.message 
    });
  }
}
