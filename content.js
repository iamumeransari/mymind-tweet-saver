// --- Tweet Author Cache (from API responses) ---

const tweetAuthorCache = new Map();

// Intercept fetch to capture tweet data from X's GraphQL responses
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  try {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && url.includes('/i/api/graphql/')) {
      // Clone so the original consumer can still read the body
      const clone = response.clone();
      clone.json().then((data) => extractTweetAuthors(data)).catch(() => {});
    }
  } catch (e) {}

  return response;
};

function extractTweetAuthors(obj) {
  if (!obj || typeof obj !== 'object') return;

  // Look for tweet result objects: { rest_id, core.user_results.result.legacy.screen_name }
  if (obj.rest_id && obj.core?.user_results?.result?.legacy?.screen_name) {
    tweetAuthorCache.set(obj.rest_id, obj.core.user_results.result.legacy.screen_name);
  }

  // Recurse into arrays and objects
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      extractTweetAuthors(val);
    }
  }
}

// --- Tweet URL Resolution ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TWEET_URL') {
    sendResponse({ url: resolveTweetUrl(msg.tweetId) });
  }
});

function resolveTweetUrl(tweetId) {
  // 1. Check API response cache first (most reliable)
  const cachedAuthor = tweetAuthorCache.get(tweetId);
  if (cachedAuthor) {
    return `https://x.com/${cachedAuthor}/status/${tweetId}`;
  }

  // 2. Look for direct status links in the DOM
  const links = document.querySelectorAll(`a[href*="/status/${tweetId}"]`);
  for (const link of links) {
    const href = link.getAttribute('href');
    const match = href.match(/^\/([^/]+)\/status\/\d+/);
    if (match && match[1] !== 'i') {
      return `https://x.com${match[0]}`;
    }
  }

  // 3. Find the article containing the tweet link and extract author
  const articles = document.querySelectorAll('article');
  for (const article of articles) {
    if (!article.querySelector(`a[href*="/status/${tweetId}"]`)) continue;
    const authorLinks = article.querySelectorAll('a[href^="/"][role="link"]');
    for (const al of authorLinks) {
      const href = al.getAttribute('href');
      if (/^\/[A-Za-z0-9_]+$/.test(href)) {
        return `https://x.com${href}/status/${tweetId}`;
      }
    }
  }

  return null;
}
