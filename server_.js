require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getInitialComments, loadMoreComments, closeScraper } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

let activeUrl = "";

app.post("/api/fetch-comments", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (activeUrl !== url) {
      await closeScraper(); // بستن قبلی اگر URL تغییر کند
      activeUrl = url;
    }

    const result = await getInitialComments(url);
    res.json(result);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/load-more-comments", async (req, res) => {
  try {
    const result = await loadMoreComments();
    res.json(result);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
