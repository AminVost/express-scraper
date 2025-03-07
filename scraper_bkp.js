const { chromium } = require("playwright");

let browser;
let page;
let initialized = false;
let allComments = [];
let hasMore = true;

async function initScraper(url) {
  if (!initialized) {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });
    initialized = true;
    console.log(`🚀 Scraper initialized for URL: ${url}`);
  }
}

async function getInitialComments(url) {
  await initScraper(url);

  const comments = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".comment_text_toggle p")).map(el => el.innerText.trim());
  });

  allComments.push(...comments);
  console.log(`✅ Extracted ${comments.length} initial comments.`);

  const nextButton = await page.$("#ajaxLoadMoreComments");
  hasMore = !!nextButton;

  return {
    comments,
    hasMore
  };
}

async function loadMoreComments() {
  if (!initialized) {
    return { error: "Scraper not initialized. Call getInitialComments first." };
  }

  if (!hasMore) {
    return { comments: [], hasMore: false };
  }

  const nextButton = await page.$("#ajaxLoadMoreComments");
  if (nextButton) {
    console.log('🔄 Clicking "Load More" button');
    await nextButton.click();
    await page.waitForTimeout(2000);
    
    const newComments = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".comment_text_toggle p")).map(el => el.innerText.trim());
    });

    const addedComments = newComments.filter(comment => !allComments.includes(comment));
    allComments.push(...addedComments);
    console.log(`✅ Extracted ${addedComments.length} new comments.`);

    const nextButtonCheck = await page.$("#ajaxLoadMoreComments");
    hasMore = !!nextButtonCheck;

    return {
      comments: addedComments,
      hasMore
    };
  } else {
    hasMore = false;
    return { comments: [], hasMore: false };
  }
}

async function closeScraper() {
  if (initialized) {
    await browser.close();
    initialized = false;
    allComments = [];
    hasMore = true;
    console.log("❌ Scraper closed.");
  }
}

module.exports = { getInitialComments, loadMoreComments, closeScraper };
