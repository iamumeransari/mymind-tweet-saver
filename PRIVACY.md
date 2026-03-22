# Privacy Policy — Bookmarks to mymind for X

**Last updated:** March 22, 2026

This is a community-built extension and is not officially affiliated with or endorsed by mymind or X/Twitter.

## What this extension does

Bookmarks to mymind for X lets you automatically save tweets to your mymind account when you bookmark them on X. The extension detects your bookmark action and sends the tweet URL to your mymind account.

## Data we access

### Your mymind session
To save tweets on your behalf, the extension uses your existing mymind login session. It reads your mymind authentication credentials from the browser's cookie jar and local storage. These credentials are only used to communicate with `access.mymind.com` and are never sent anywhere else.

### Bookmark actions on X
The extension detects when you bookmark a tweet on X. It reads only the tweet ID from the bookmark action to identify which tweet to save. No other activity on X or any other website is monitored.

### Tweet URLs
When you bookmark a tweet, the extension determines the full tweet URL (including the author's username) so mymind can display a rich preview. This URL is sent to `access.mymind.com`.

### Save counter
A local count of how many tweets you've saved is stored in your browser. This number never leaves your device.

## Data we do NOT collect

- No personal information is collected, stored, or transmitted
- No browsing history or activity outside of the bookmark action on X
- No tweet content, timelines, DMs, or other X data
- No analytics, telemetry, or third-party tracking
- No data is sold, shared, or transferred to third parties
- No data is stored on external servers — all communication is directly between your browser and `access.mymind.com`

## Permissions explained

- **`cookies`** — Read your mymind login session to authenticate saves
- **`webRequest`** — Detect when you bookmark a tweet on X (read-only, no requests are modified or blocked)
- **`storage`** — Store the save counter and authentication token locally in your browser
- **`activeTab`** — Show the extension's status panel on the current page when you click the extension icon
- **`scripting`** — Display save confirmations and the status panel on the page
- **Host permissions on `x.com` / `twitter.com`** — Detect bookmark actions and resolve tweet URLs
- **Host permissions on `access.mymind.com`** — Authenticate and save tweets to your mymind account

## Data retention

Authentication credentials and the save counter are stored locally in your browser and persist until the extension is uninstalled. No data is retained on any external server by this extension.

## Open source

This extension is open source. You can review the full source code at [github.com/iamumeransari/mymind-tweet-saver](https://github.com/iamumeransari/mymind-tweet-saver).

## Contact

For questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/iamumeransari/mymind-tweet-saver/issues).
