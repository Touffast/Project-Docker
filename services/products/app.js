const express = require("express");
const { Pool } = require("pg");

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
  host: "db-products",
  database: process.env.PRODUCTS_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch((err) => console.error("Could not create products table", err));

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const parseNumber = (value) => {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
};

app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// GET / : List products
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id : Product detail
app.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid product id" });

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / : Create product
app.post("/", async (req, res) => {
  const { name, price, stock } = req.body;
  const parsedPrice = parseNumber(price);
  const parsedStock = Number.isNaN(Number.parseInt(stock, 10)) ? null : Number.parseInt(stock, 10);

  if (!name || parsedPrice === null || parsedStock === null) {
    return res.status(400).json({ error: "Missing or invalid fields: name, price, stock" });
  }

  if (parsedPrice < 0 || parsedStock < 0) {
    return res.status(400).json({ error: "Price and stock must be positive" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [name, parsedPrice, parsedStock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id : Update product
app.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid product id" });

  const { name, price, stock } = req.body;
  const parsedPrice = price !== undefined ? parseNumber(price) : null;
  const parsedStock = stock !== undefined ? Number.parseInt(stock, 10) : null;

  if (price !== undefined && parsedPrice === null) {
    return res.status(400).json({ error: "Invalid price" });
  }
  if (stock !== undefined && Number.isNaN(parsedStock)) {
    return res.status(400).json({ error: "Invalid stock" });
  }
  if (parsedPrice !== null && parsedPrice < 0) {
    return res.status(400).json({ error: "Price must be positive" });
  }
  if (parsedStock !== null && parsedStock < 0) {
    return res.status(400).json({ error: "Stock must be positive" });
  }

  try {
    const result = await pool.query(
      "UPDATE products SET name = COALESCE($1, name), price = COALESCE($2, price), stock = COALESCE($3, stock) WHERE id = $4 RETURNING *",
      [name ?? null, parsedPrice, parsedStock, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id : Delete product
app.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid product id" });

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5002, "0.0.0.0", () => console.log("Service Products pret"));
