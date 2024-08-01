const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 6000;

//new blog post with validation
app.post(
  "/posts",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    fs.readFile(postsFilePath, "utf8", (err, data) => {
      if (err) {
        res.status(500).send("Error reading posts file");
      } else {
        const posts = JSON.parse(data);
        const newPost = { id: Date.now().toString(), ...req.body };
        posts.push(newPost);
        fs.writeFile(postsFilePath, JSON.stringify(posts), (err) => {
          if (err) {
            res.status(500).send("Error writing to posts file");
          } else {
            res.status(201).send(newPost);
          }
        });
      }
    });
  }
);

app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  const postsFilePath = path.join(__dirname, "posts.json");

  // Helper functions to read and write posts
  const readPosts = () => {
    if (!fs.existsSync(postsFilePath)) {
      fs.writeFileSync(postsFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(postsFilePath);
    return JSON.parse(data);
  };

  const writePosts = (posts) => {
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
  };

  // Endpoint to get all posts
  app.get("/api/posts", (req, res) => {
    const posts = readPosts();
    res.json(posts);
  });

  // Endpoint to get a single post by id
  app.get("/api/posts/:id", (req, res) => {
    const posts = readPosts();
    const post = posts.find((p) => p.id === req.params.id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).send("Post not found");
    }
  });

  // Endpoint to add a new post
  app.post("/api/posts", (req, res) => {
    const posts = readPosts();
    const newPost = { id: Date.now().toString(), ...req.body };
    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  });

  // Endpoint to delete a post by id
  app.delete("/api/posts/:id", (req, res) => {
    let posts = readPosts();
    posts = posts.filter((p) => p.id !== req.params.id);
    writePosts(posts);
    res.status(204).send();
  });

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
