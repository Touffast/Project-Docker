const express = require("express");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "db-users",
  database: process.env.USERS_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Create tables with the correct schema
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, 
    username VARCHAR(100) UNIQUE NOT NULL, 
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error("Could not create users table", err));

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password || "").digest("hex");
};

// --- Routes ---

app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// GET / : List users
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, created_at FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id : User detail
app.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / : Create user
app.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: username, email, password" });
  }
  try {
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id : Update user
app.put("/:id", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let query = "UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, email, created_at";
    let values = [username, email, req.params.id];
    
    // If updating password
    if (password) {
      query = "UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email), password_hash = $3 WHERE id = $4 RETURNING id, username, email, created_at";
      values = [username, email, hashPassword(password), req.params.id];
    }
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id : Delete user
app.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login : Authentication
app.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  if (!password || (!email && !username)) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  try {
    const hashedPassword = hashPassword(password);
    let result;
    if (email) {
      result = await pool.query("SELECT * FROM users WHERE email = $1 AND password_hash = $2", [email, hashedPassword]);
    } else {
      result = await pool.query("SELECT * FROM users WHERE username = $1 AND password_hash = $2", [username, hashedPassword]);
    }

    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const user = result.rows[0];
    delete user.password_hash;
    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5001, "0.0.0.0", () => console.log("Service Users pret"));
