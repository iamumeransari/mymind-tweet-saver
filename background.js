// --- Token Management ---

async function getMymindTokens() {
  const stored = await chrome.storage.session.get(['mymind_authenticity_token']);
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
      chrome.storage.session.set({ mymind_authenticity_token: header.value });
    }
  },
  { urls: ['*://access.mymind.com/*'] },
  ['requestHeaders']
);

// --- First Install → Open sign-in page ---

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const tab = await chrome.tabs.create({ url: 'https://access.mymind.com/signin' });

    // Show sign-in panel once page loads; clean up listener if tab closes
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        showPanel(tab.id);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);

    // Clean up if tab is closed before loading
    chrome.tabs.onRemoved.addListener(function onRemoved(tabId) {
      if (tabId === tab.id) {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.onRemoved.removeListener(onRemoved);
      }
    });
  }
});

// --- Show status panel in page ---

async function showPanel(tabId) {
  const tokens = await getMymindTokens();
  const { save_count = 0 } = await chrome.storage.local.get('save_count');

  const fontUrl = chrome.runtime.getURL('nunito.woff2');
  const logoUrl = chrome.runtime.getURL('logo.svg');

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (config) => { window.__mymindPanel = config; },
    args: [{
      connected: !!tokens,
      saveCount: save_count,
      fontUrl,
      logoUrl,
    }],
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['panel.js'],
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  showPanel(tab.id);
});

// --- Notify via injected script (no content script dependency) ---

async function notifyTab(tabId, msg) {
  const fontUrl = chrome.runtime.getURL('nunito.woff2');
  const logoUrl = chrome.runtime.getURL('logo.svg');
  const xIconUrl = chrome.runtime.getURL('x-icon-bg.png');

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (config) => { window.__mymindNotify = config; },
    args: [{ ...msg, fontUrl, logoUrl, xIconUrl }],
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['notify.js'],
  });
}

// --- Save to mymind ---

async function saveToMymind(tabId, tweetUrl) {
  const tokens = await getMymindTokens();

  if (!tokens) {
    notifyTab(tabId, {
      status: 'signin',
      text: 'Connect mymind to sync tweets.',
      redirect: 'https://access.mymind.com/signin',
    });
    return false;
  }

  try {
    const response = await fetch('https://access.mymind.com/objects', {
      method: 'POST',
      headers: {
        'x-authenticity-token': tokens.authenticityToken,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ url: tweetUrl, type: 'WebPage' }),
    });

    if (response.ok) {
      const data = await response.json();
      const isExisting = response.status === 200;

      // Increment save counter atomically
      if (!isExisting) {
        const { save_count = 0 } = await chrome.storage.local.get('save_count');
        await chrome.storage.local.set({ save_count: save_count + 1 });
      }

      notifyTab(tabId, {
        status: 'success',
        text: isExisting ? 'Already in mymind' : 'Saved to mymind',
      });
      return true;
    } else if (response.status === 401) {
      notifyTab(tabId, {
        status: 'signin',
        text: 'You\'ve been signed out of mymind.',
        redirect: 'https://access.mymind.com/signin',
      });
      return false;
    } else {
      notifyTab(tabId, { status: 'error', text: 'Something went wrong. Please try again.' });
      return false;
    }
  } catch (err) {
    notifyTab(tabId, { status: 'error', text: 'Network error. Check your connection.' });
    return false;
  }
}

// --- Resolve canonical tweet URL via content script ---

async function resolveTweetUrl(tabId, tweetId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_TWEET_URL',
        tweetId,
      });
      if (response?.url) return response.url;
    } catch (e) {
      // Content script not ready or tab closed
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
  }

  // Fall back to tab URL when viewing a single tweet
  try {
    const tab = await chrome.tabs.get(tabId);
    const match = tab.url?.match(/x\.com\/([A-Za-z0-9_]+)\/status\/\d+/);
    if (match && match[1] !== 'i') return tab.url.split('?')[0];
  } catch (e) {}

  return `https://x.com/i/web/status/${tweetId}`;
}

// --- Intercept Twitter Bookmark ---

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method !== 'POST') return;

    const raw = details.requestBody?.raw;
    if (!raw?.[0]?.bytes) return;

    try {
      // Concatenate all raw chunks
      const allBytes = new Uint8Array(
        raw.reduce((acc, r) => acc + (r.bytes?.byteLength || 0), 0)
      );
      let offset = 0;
      for (const r of raw) {
        if (r.bytes) {
          allBytes.set(new Uint8Array(r.bytes), offset);
          offset += r.bytes.byteLength;
        }
      }

      const body = JSON.parse(new TextDecoder().decode(allBytes));
      const tweetId = body?.variables?.tweet_id;
      if (!tweetId) return;

      const tabId = details.tabId;

      resolveTweetUrl(tabId, tweetId)
        .then((url) => saveToMymind(tabId, url))
        .catch((err) => console.error('[mymind] Save pipeline error:', err));
    } catch (err) {
      console.error('[mymind] Failed to parse bookmark request:', err);
    }
  },
  { urls: ['*://x.com/i/api/graphql/*/CreateBookmark'] },
  ['requestBody']
);
