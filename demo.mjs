import express from "express";
import fetch from "node-fetch";

const ourApp = express();
const cache = {}; 

ourApp.set("view engine", "ejs");
ourApp.use(express.urlencoded({ extended: false }));

ourApp.get("/", (req, res) => {
  res.render("index", { repos: null, error: null, username: null, cached: false });
});

ourApp.post("/submit", async (req, res) => {
  const user = req.body.name;

  if (cache[user]) {
    console.log(`"${user}" from cache`);
    return res.render("index", {
      repos: cache[user],error: null,username: user,cached: true,
    });
  }

  try {
    const response = await fetch(`https://api.github.com/users/${user}/repos`);
    const data = await response.json();

    if (data.message) {
      throw new Error(data.message);
    }

    cache[user] = data;
    console.log(`"${user}" from GitHub API`);

    res.render("index", {
      repos: data,error: null,username: user,cached: false,
    });
  } catch (error) {
    res.render("index", {
      repos: null,error: error.message,username: user,cached: false,
    });
  }
});

ourApp.get("/reset", (req, res) => {
  res.render("index", { repos: null, error: null, username: null, cached: false });
});

ourApp.listen(3000)
