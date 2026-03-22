// --- Token Management ---

async function getMymindTokens() {
  const stored = await chrome.storage.local.get(['mymind_authenticity_token']);
  const authenticityToken = stored.mymind_authenticity_token;

  const [jwt, cid] = await Promise.all([
    chrome.cookies.get({ url: 'https://access.mymind.com', name: '_jwt' }),
    chrome.cookies.get({ url: 'https://access.mymind.com', name: '_cid' }),
  ]);

  if (!jwt?.value || !cid?.value || !authenticityToken) {
    return null;
  }

  return {
    jwt: jwt.value,
    cid: cid.value,
    authenticityToken,
  };
}

// Capture x-authenticity-token from any mymind request
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const header = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === 'x-authenticity-token'
    );
    if (header?.value) {
      chrome.storage.local.set({ mymind_authenticity_token: header.value });
    }
  },
  { urls: ['*://access.mymind.com/*'] },
  ['requestHeaders']
);

// --- First Install → Open sign-in page ---

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://access.mymind.com/signin' });
  }
});

// --- Extension Icon Click → Show status panel in page ---

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  const tokens = await getMymindTokens();
  const { save_count = 0 } = await chrome.storage.local.get('save_count');

  // Set config, then inject panel.js which reads it
  const fontUrl = chrome.runtime.getURL('nunito.woff2');
  const logoUrl = chrome.runtime.getURL('logo.svg');

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (config) => { window.__mymindPanel = config; },
    args: [{
      connected: !!tokens,
      saveCount: save_count,
      fontUrl,
      logoUrl,
    }],
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['panel.js'],
  });
});

// --- Notify content script (in-page notification) ---

function notifyTab(tabId, msg) {
  chrome.tabs.sendMessage(tabId, { type: 'SHOW_NOTIFICATION', ...msg }).catch(() => {});
}

// --- Save to mymind ---

async function saveToMymind(tabId, tweetUrl) {
  const tokens = await getMymindTokens();

  if (!tokens) {
    console.error('[mymind] Missing tokens.');
    notifyTab(tabId, {
      status: 'signin',
      text: 'Please sign in to your mind.',
      redirect: 'https://access.mymind.com/signin',
    });
    return false;
  }

  try {
    const response = await fetch('https://access.mymind.com/objects', {
      method: 'POST',
      headers: {
        'x-authenticity-token': tokens.authenticityToken,
        'Cookie': `_cid=${tokens.cid}; _jwt=${tokens.jwt}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ url: tweetUrl, type: 'WebPage' }),
    });

    if (response.ok) {
      const data = await response.json();
      const isExisting = response.status === 200;
      console.log('[mymind] Saved:', tweetUrl, data);

      // Increment save counter
      if (!isExisting) {
        const { save_count = 0 } = await chrome.storage.local.get('save_count');
        chrome.storage.local.set({ save_count: save_count + 1 });
      }

      notifyTab(tabId, {
        status: 'success',
        text: isExisting ? 'Already in your mind' : 'Saved to your mind',
      });
      return true;
    } else if (response.status === 401) {
      notifyTab(tabId, {
        status: 'signin',
        text: 'Your session expired. Please sign in.',
        redirect: 'https://access.mymind.com/signin',
      });
      return false;
    } else {
      console.error('[mymind] Save failed:', response.status);
      notifyTab(tabId, { status: 'error', text: 'Something went wrong. Please try again.' });
      return false;
    }
  } catch (err) {
    console.error('[mymind] Network error:', err);
    notifyTab(tabId, { status: 'error', text: 'Network error. Check your connection.' });
    return false;
  }
}

// --- Resolve canonical tweet URL via content script ---

async function resolveTweetUrl(tabId, tweetId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_TWEET_URL',
      tweetId,
    });
    if (response?.url) return response.url;
  } catch {
    // Content script not ready or tab closed
  }
  return `https://x.com/i/web/status/${tweetId}`;
}

// --- Intercept Twitter Bookmark ---

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method !== 'POST') return;

    const raw = details.requestBody?.raw;
    if (!raw?.[0]?.bytes) return;

    try {
      const body = JSON.parse(new TextDecoder().decode(raw[0].bytes));
      const tweetId = body?.variables?.tweet_id;
      if (!tweetId) return;

      const tabId = details.tabId;
      console.log('[mymind] Bookmark detected, tweet ID:', tweetId);

      resolveTweetUrl(tabId, tweetId).then((url) => saveToMymind(tabId, url));
    } catch (err) {
      console.error('[mymind] Failed to parse bookmark request:', err);
    }
  },
  { urls: ['*://x.com/i/api/graphql/*/CreateBookmark'] },
  ['requestBody']
);

console.log('[mymind] Tweet Saver extension loaded');
