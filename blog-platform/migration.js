const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Read the JSON file
const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));

const insertPosts = () => {
  posts.forEach((post) => {
    const { id, title, content, image, comments } = post;

    // Insert post into posts table
    pool.query(
      "INSERT INTO posts (id, title, content, image) VALUES (?, ?, ?, ?)",
      [id, title, content, image],
      (error) => {
        if (error) throw error;

        // Insert comments into comments table
        comments.forEach((comment) => {
          pool.query(
            "INSERT INTO comments (id, post_id, text) VALUES (?, ?, ?)",
            [comment.id, id, comment.text],
            (error) => {
              if (error) throw error;
            }
          );
        });
      }
    );
  });

  console.log("Data migration completed.");
};

// Run the migration
insertPosts();
