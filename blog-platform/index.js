const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("combined"));
app.use(helmet());
app.use(bodyParser.json());

// Custom CORS configuration for localhost:3000
const corsOptions = {
  origin: "https://blogs-f-11.netlify.app",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

// Path to posts file
const postsFilePath = path.join(__dirname, "posts.json");

// Helper functions to read and write posts
const readPosts = () => {
  if (!fs.existsSync(postsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(postsFilePath);
  return JSON.parse(data);
};

const writePosts = (posts) => {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
};

// Helper function to get the next post ID
const getNextPostId = (posts) => {
  if (posts.length === 0) return 1;
  const lastPost = posts[posts.length - 1];
  return parseInt(lastPost.id) + 1;
};

// Helper function to get the next comment ID
const getNextCommentId = (comments) => {
  if (comments.length === 0) return 1;
  const lastComment = comments[comments.length - 1];
  return parseInt(lastComment.id) + 1;
};

// Endpoint to get all posts
app.get("/posts", (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// Endpoint to get a single post by id
app.get("/posts/:id", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).send("Post not found");
  }
});

// Endpoint to add a new post with validation
app.post(
  "/posts",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
    // Remove URL validation, but keep the field
    body("image")
      .optional()
      .isString()
      .withMessage("Image URL should be a string"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const posts = readPosts();
    const newPost = {
      id: getNextPostId(posts).toString(),
      ...req.body,
      comments: [],
    };
    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  }
);

// Endpoint to delete a post by id
app.delete("/posts/:id", (req, res) => {
  let posts = readPosts();
  posts = posts.filter((p) => p.id !== req.params.id);
  writePosts(posts);
  res.status(204).send();
});

// Endpoint to add a comment to a blog post with validation
app.post(
  "/posts/:id/comments",
  [body("text").notEmpty().withMessage("Comment text is required")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const posts = readPosts();
    const post = posts.find((p) => p.id === req.params.id);
    if (post) {
      const newComment = {
        id: getNextCommentId(post.comments).toString(),
        text: req.body.text,
      };
      post.comments.push(newComment);
      writePosts(posts);
      res.status(201).json(newComment);
    } else {
      res.status(404).send("Post not found");
    }
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
