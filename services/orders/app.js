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
  host: "db-orders",
  database: process.env.ORDERS_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const productsApiUrl = process.env.PRODUCTS_API_URL || "http://products:5002";

pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch((err) => console.error("Could not create orders table", err));

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const fetchProduct = async (productId) => {
  const response = await fetch(`${productsApiUrl}/${productId}`);
  if (response.status === 404) return { notFound: true };
  if (!response.ok) {
    const text = await response.text();
    return { error: text || "Product service error" };
  }
  const product = await response.json();
  return { product };
};

const updateProductStock = async (productId, stock) => {
  const response = await fetch(`${productsApiUrl}/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: text || "Failed to update product stock" };
  }

  const updatedProduct = await response.json();
  return { product: updatedProduct };
};

app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// GET / : List orders
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id : Order detail
app.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid order id" });

  try {
    const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:user_id : Orders by user
app.get("/user/:user_id", async (req, res) => {
  const userId = parseId(req.params.user_id);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });

  try {
    const result = await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY id ASC", [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / : Create order
app.post("/", async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  const parsedUserId = parseId(user_id);
  const parsedProductId = parseId(product_id);
  const parsedQuantity = parseId(quantity);

  if (!parsedUserId || !parsedProductId || !parsedQuantity) {
    return res.status(400).json({ error: "Missing or invalid fields: user_id, product_id, quantity" });
  }

  try {
    const productResult = await fetchProduct(parsedProductId);
    if (productResult.notFound) return res.status(404).json({ error: "Product not found" });
    if (productResult.error) return res.status(502).json({ error: "Product service error" });

    const product = productResult.product;
    const productStock = Number.parseInt(product.stock, 10);
    const unitPrice = Number(product.price);

    if (Number.isNaN(productStock) || Number.isNaN(unitPrice)) {
      return res.status(502).json({ error: "Invalid product data" });
    }

    if (productStock < parsedQuantity) {
      return res.status(409).json({ error: "Insufficient stock" });
    }

    const newStock = productStock - parsedQuantity;
    const stockResult = await updateProductStock(parsedProductId, newStock);
    if (stockResult.error) return res.status(502).json({ error: "Failed to update stock" });

    const totalPrice = Number((unitPrice * parsedQuantity).toFixed(2));
    const result = await pool.query(
      "INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [parsedUserId, parsedProductId, parsedQuantity, totalPrice, "confirmed"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5003, "0.0.0.0", () => console.log("Service Orders pret"));
