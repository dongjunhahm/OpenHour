import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, email } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Missing token parameter" });
  }

  const client = await pool.connect();

  try {
    console.log("Checking token:", token.substring(0, 6) + "...");
    
    let query = "SELECT id, email, name, google_token FROM users WHERE google_token = $1";
    let params = [token];
    
    if (email) {
      query = "SELECT id, email, name, google_token FROM users WHERE email = $1";
      params = [email];
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "No user found", 
        lookup: email ? "by email" : "by token",
        tokenInfo: {
          prefix: token.substring(0, 6) + "...",
          length: token.length,
          isGoogleFormat: token.startsWith('ya29.')
        }
      });
    }
    
    const user = result.rows[0];
    
    // Compare the token with the stored one if we looked up by email
    if (email) {
      const storedToken = user.google_token;
      const tokensMatch = token === storedToken;
      
      return res.status(200).json({
        message: "User found by email",
        tokensMatch,
        tokenDetails: {
          providedToken: {
            prefix: token.substring(0, 6) + "...",
            length: token.length,
            isGoogleFormat: token.startsWith('ya29.')
          },
          storedToken: {
            prefix: storedToken ? (storedToken.substring(0, 6) + "...") : "null",
            length: storedToken ? storedToken.length : 0,
            isGoogleFormat: storedToken ? storedToken.startsWith('ya29.') : false
          }
        },
        userId: user.id,
        userEmail: user.email
      });
    }
    
    return res.status(200).json({
      message: "User found by token",
      userId: user.id,
      userEmail: user.email
    });
  } catch (error) {
    console.error("Error checking token:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
