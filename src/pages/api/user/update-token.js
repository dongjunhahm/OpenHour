import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, email, name } = req.body;
  
  if (!token || !email) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const client = await pool.connect();

  try {
    console.log("Updating token for email:", email);
    
    // Check if user exists
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      // Create new user
      console.log("User not found, creating new user with email:", email);
      await client.query(
        "INSERT INTO users (email, name, google_token, created_at) VALUES ($1, $2, $3, NOW())",
        [email, name, token]
      );
      console.log("New user created successfully");
    } else {
      // Update existing user's token
      console.log("User found, updating token for user ID:", userResult.rows[0].id);
      await client.query(
        "UPDATE users SET google_token = $1, name = COALESCE($2, name) WHERE email = $3",
        [token, name, email]
      );
      console.log("User token updated successfully");
    }

    return res.status(200).json({ message: "User token updated successfully" });
  } catch (error) {
    console.error("Error updating user token:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
