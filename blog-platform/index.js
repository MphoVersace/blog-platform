const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan("combined"));
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Path to posts file
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

// Endpoint to add a new post with validation
app.post(
  "/api/posts",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const posts = readPosts();
    const newPost = { id: Date.now().toString(), ...req.body, comments: [] };
    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  }
);

// Endpoint to delete a post by id
app.delete("/api/posts/:id", (req, res) => {
  let posts = readPosts();
  posts = posts.filter((p) => p.id !== req.params.id);
  writePosts(posts);
  res.status(204).send();
});

// Endpoint to add a comment to a blog post with validation
app.post(
  "/api/posts/:id/comments",
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
        id: Date.now().toString(),
        text: req.body.text,
      };
      post.comments = post.comments || [];
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

// Initialize posts file with example data if it doesn't exist
if (
  !fs.existsSync(postsFilePath) ||
  fs.readFileSync(postsFilePath).length === 0
) {
  const examplePosts = [
    {
      id: "1",
      title: "18 3-Step Summer Lunches To Make Forever",
      content:
        "Three is a magic number – and it’s how many steps it takes to make these delicious lunches! These tasty dishes are packed with flavorful summer produce and have stolen the hearts of our readers, earning at least 4-star reviews. Add options like our Green Goddess Grain Bowl and Walnut Pesto Pasta Salad to your weekly lunch rotation for a simple and refreshing summer meal!",
      image:
        "https://www.trndigital.com/wp-content/uploads/2024/01/AdobeStock_230441943-1038x576.jpeg",
      comments: [],
    },
    {
      id: "2",
      title: "25 High-Protein Breakfast Recipes to Make Forever",
      content:
        "You might wake up with a smile on your face thinking of these yummy breakfast ideas. Rated with 4- and 5-stars, our readers have been loving these recipes, and we think you will too. Each serving contains at least 15 grams of protein, which helps support healthy digestion, muscle growth and energy production. You’ll want to start your day with tasty options like our Peanut-Ginger Tofu Scramble or High-Protein Peach Muffins for a delicious and nourishing morning meal!",
      image:
        "https://www.eatingwell.com/thmb/lWnuvRWXJPycYhf2PzORYoQ_IRc=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/EWL-green-breakfast-sandwich-with-pesto-hero-247-cabef6ec85f74ca58d5a0ecac41eeb0b.jpg",
      comments: [],
    },
    {
      id: "3",
      title: "25 High-Protein Breakfast Recipes to Make Forever",
      content:
        "You might wake up with a smile on your face thinking of these yummy breakfast ideas. Rated with 4- and 5-stars, our readers have been loving these recipes, and we think you will too. Each serving contains at least 15 grams of protein, which helps support healthy digestion, muscle growth and energy production. You’ll want to start your day with tasty options like our Peanut-Ginger Tofu Scramble or High-Protein Peach Muffins for a delicious and nourishing morning meal!",
      image:
        "https://www.eatingwell.com/thmb/lWnuvRWXJPycYhf2PzORYoQ_IRc=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/EWL-green-breakfast-sandwich-with-pesto-hero-247-cabef6ec85f74ca58d5a0ecac41eeb0b.jpg",
      comments: [],
    },
  ];
  writePosts(examplePosts);
}
