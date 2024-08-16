const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware setup
app.use(morgan("combined"));
app.use(helmet());
app.use(bodyParser.json());

const corsOptions = {
  origin: "https://blogs-f-11.netlify.app",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

// Endpoint to get all posts
app.get("/posts", (req, res) => {
  pool.query("SELECT * FROM posts", (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json(results);
  });
});

// Endpoint to get a single post by id
app.get("/posts/:id", (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM posts WHERE id = ?", [id], (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    if (results.length === 0) return res.status(404).send("Post not found");
    res.json(results[0]);
  });
});

// Endpoint to add a new post with validation
app.post(
  "/posts",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
    body("image")
      .optional()
      .isString()
      .withMessage("Image URL should be a string"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { title, content, image } = req.body;
    pool.query(
      "INSERT INTO posts (title, content, image) VALUES (?, ?, ?)",
      [title, content, image],
      (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        const newPost = { id: results.insertId, title, content, image };
        res.status(201).json(newPost);
      }
    );
  }
);

// Endpoint to delete a post by id
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM posts WHERE id = ?", [id], (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });
});

// Endpoint to add a comment to a blog post with validation
app.post(
  "/posts/:id/comments",
  [body("text").notEmpty().withMessage("Comment text is required")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { text } = req.body;
    pool.query(
      "INSERT INTO comments (post_id, text) VALUES (?, ?)",
      [id, text],
      (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        const newComment = { id: results.insertId, post_id: id, text };
        res.status(201).json(newComment);
      }
    );
  }
);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
