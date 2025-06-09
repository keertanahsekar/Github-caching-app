import express from "express";
import fetch from "node-fetch";

let ourApp = express()
ourApp.use(express.urlencoded({ extended: false }));


ourApp.post("/submit", async (req, res) => {
  const user = req.body.name;

  if (cache[user]) {
    console.log(`"${user}" from cache`);
    return res.render("index", {
      repos: cache[user],
      error: null,
      username: user,
      cached: true,
    });
  }

  try {
    const response = await fetch(`https://api.github.com/users/${user}/repos`);
    const repos = await response.json();

    if (repos.message) {
      throw new Error(repos.message);
    }

    // Fetch extra details: commits, events, languages
    const enhancedRepos = await Promise.all(
      repos.map(async (repo) => {
        const [commitsRes, eventsRes, languagesRes] = await Promise.all([
          fetch(repo.commits_url.replace('{/sha}', '')),
          fetch(repo.events_url),
          fetch(repo.languages_url),
        ]);

        const [commits, events, languages] = await Promise.all([
          commitsRes.json(),
          eventsRes.json(),
          languagesRes.json(),
        ]);

        return {
          ...repo,
          commits,
          events,
          languages,
        };
      })
    );

    cache[user] = enhancedRepos;
    console.log(`"${user}" from GitHub API`);

    res.render("index", {
      repos: enhancedRepos,
      error: null,
      username: user,
      cached: false,
    });

  } catch (error) {
    res.render("index", {
      repos: null,
      error: error.message,
      username: user,
      cached: false,
    });
  }
});

ourApp.listen(3000)