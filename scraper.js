const { chromium } = require("playwright");

async function fetchComments(url) {
  let browser;
  let page;
  let allComments = [];

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const response = await page.goto(url, { waitUntil: "load", timeout: 10000 });

    if (!response || response.status() !== 200) {
      console.error(`❌ Page failed to load: ${response ? response.status() : "No Response"}`);
      return { error: "🚨 Invalid URL or page not found. Please check the link." };
    }

    while (allComments.length < 50) {
      const comments = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".comment_text_toggle p")).map(el => el.innerText.trim());
      });

      if (!comments.length && allComments.length === 0) {
        console.warn("⚠ No comments found on the page.");
        return {
          totalComments: 0,
          comments: ["📌 No comments found. Be the first to comment!"],
          hasMore: false,
        };
      }

      const newComments = comments.filter(comment => !allComments.includes(comment));
      allComments.push(...newComments);
      console.log(`✅ Extracted ${newComments.length} new comments. Total: ${allComments.length}`);

      if (allComments.length >= 50) {
        allComments = allComments.slice(0, 50);
        break;
      }

      const nextButton = await page.$("#ajaxLoadMoreComments");
      if (nextButton) {
        console.log('🔄 Clicking "Load More" button');
        await nextButton.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('🚀 No more "Load More" button found.');
        break;
      }
    }

    return {
      totalComments: allComments.length,
      comments: allComments,
      hasMore: allComments.length === 50,
    };
  } catch (error) {
    console.error("❌ Error during comment extraction:", error);
    return { error: "🚨 Failed to extract comments. Please try again later." };
  } finally {
    if (browser) {
      await browser.close();
      console.log("❌ Browser closed.");
    }
  }
}

module.exports = { fetchComments };
