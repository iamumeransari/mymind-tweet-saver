// --- Tweet URL Resolution ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TWEET_URL') {
    sendResponse({ url: resolveTweetUrl(msg.tweetId) });
  }
});

function resolveTweetUrl(tweetId) {
  const links = document.querySelectorAll(`a[href*="/status/${tweetId}"]`);
  for (const link of links) {
    const href = link.getAttribute('href');
    const match = href.match(/^\/([^/]+)\/status\/\d+/);
    if (match && match[1] !== 'i') {
      return `https://x.com${match[0]}`;
    }
  }

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
