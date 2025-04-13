import { pool } from "../db";

export default async function handler(req, es) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, email, name } = req.body;

  if (!token || !email) {
    return res.status(400).json({ message: "missing required parameters" });
  }

  const client = await pool.connect();

  try {
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      await client.query(
        "INSERT INTO users (email, name, google_token, created_at) VALUES ($1, $2, $3, NOW())",
        [email, name, token]
      );
    } else {
      await client.query(
        "UPDATE users SET google_token = $1, name = COALESCE($2, name) WHERE email = $3",
        [token, name, email]
      );
    }

    return res.status(200).json({ message: "token updated successfully" });
  } catch (error) {
    console.error("error updating usre token", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
