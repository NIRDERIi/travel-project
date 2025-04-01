const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const pool = new Pool({ connectionString: process.env.DB_URL });

app.use(cors());
app.use(express.json());

// Get all offers (basic info)
app.get("/api/offers", async (req, res) => {
  try {
    const result = await pool.query("SELECT title, slug FROM offers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching offers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one offer by slug (full data)
app.get("/api/offers/:slug", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM offers WHERE slug = $1", [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching offer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new offer
app.post("/api/offers", async (req, res) => {
  const { title, slug, data } = req.body;
  if (!title || !slug || !data) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO offers (title, slug, data) VALUES ($1, $2, $3) RETURNING *",
      [title, slug, data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating offer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete offer by slug
app.delete("/api/offers/:slug", async (req, res) => {
  try {
    await pool.query("DELETE FROM offers WHERE slug = $1", [req.params.slug]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting offer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update an existing offer by slug
app.put("/api/offers/:slug", async (req, res) => {
  const { title, data } = req.body;
  const { slug } = req.params;

  try {
    const result = await pool.query(
      "UPDATE offers SET title = $1, data = $2 WHERE slug = $3 RETURNING *",
      [title, data, slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating offer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
