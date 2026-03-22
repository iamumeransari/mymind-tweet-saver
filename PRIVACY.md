# Privacy Policy — Bookmarks to mymind for X

**Last updated:** March 22, 2026

## What this extension does

Bookmarks to mymind for X automatically saves your X/Twitter bookmarks to your mymind account. When you bookmark a tweet on X, the extension detects the action and sends the tweet URL to mymind's servers so it appears in your mymind library.

## Data we access

### Authentication tokens
The extension reads your mymind session cookies (`_jwt`, `_cid`) and authenticity token to authenticate API requests to mymind on your behalf. The authenticity token is stored in your browser's local storage and persists until the extension is uninstalled. Cookies are read directly from the browser's cookie jar. These credentials are never transmitted to any server other than `access.mymind.com`.

### Bookmark actions
The extension monitors bookmark requests on `x.com` to detect when you bookmark a tweet. It reads the tweet ID from the bookmark request body solely to identify which tweet to save. No other browsing activity is monitored or recorded.

### Tweet URLs
When you bookmark a tweet, the extension resolves the canonical tweet URL (including the author's username) from the page DOM. This URL is sent to `access.mymind.com` to save the tweet to your mymind account.

### Save counter
The extension stores a local count of how many tweets you've saved. This number never leaves your browser.

## Data we do NOT collect

- We do not collect, store, or transmit any personal information
- We do not track your browsing history or activity outside of the bookmark action on X
- We do not read tweet content, your timeline, DMs, or any other X data
- We do not use analytics, telemetry, or third-party tracking
- We do not sell, share, or transfer any data to third parties
- We do not store any data on external servers — all communication is directly between your browser and `access.mymind.com`

## Permissions explained

- **`cookies`** — Read mymind session cookies to authenticate API requests
- **`webRequest`** — Detect when you bookmark a tweet on X (read-only, no request modification)
- **`storage`** — Store the save counter locally in your browser
- **`activeTab`** — Allows the extension to inject UI into the current tab when you click the extension icon
- **`scripting`** — Inject notification and panel UI into the page to confirm saves and show connection status
- **Host permissions on `x.com` / `twitter.com`** — Required to detect bookmark actions and resolve tweet URLs
- **Host permissions on `access.mymind.com`** — Required to authenticate and save tweets to your mymind account

## Data retention

The authenticity token and save counter persist in local storage until the extension is uninstalled. Session cookies are managed by the browser and follow their own expiry. No data is retained on any external server by this extension.

## Contact

For questions about this privacy policy, open an issue at [github.com/iamumeransari/mymind-tweet-saver](https://github.com/iamumeransari/mymind-tweet-saver).
