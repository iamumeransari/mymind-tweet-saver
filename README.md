# X Bookmarks to mymind

Bookmark a tweet on X. Find it in mymind. Zero clicks. Fully automatic.

## How it works

1. Install the extension and sign in to your [mymind](https://mymind.com) account
2. Browse X as usual
3. Bookmark any tweet — it gets saved to your mymind automatically

A small notification confirms each save.

## Install

Available on the [Chrome Web Store](https://chromewebstore.google.com) (pending review).

Or load it manually:

1. Clone this repo
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the repo folder

## Permissions

| Permission | Why |
|---|---|
| `webRequest` | Detect when you bookmark a tweet on X |
| `cookies` | Read your mymind session to authenticate saves |
| `storage` | Store save counter and auth token locally |
| `activeTab` | Show status panel when you click the extension icon |
| `scripting` | Display save confirmations on the page |

Host permissions on `x.com`/`twitter.com` for bookmark detection and tweet URL resolution. Host permissions on `access.mymind.com` for authentication and saving.

## Privacy

- No browsing data collected
- No analytics or tracking
- No data sold or shared
- All communication is directly between your browser and `access.mymind.com`

Full [privacy policy](PRIVACY.md).

## Requirements

- A [mymind](https://mymind.com) account
- Signed in to mymind in your browser

## Disclaimer

This is a community-built tool and is not officially affiliated with or endorsed by mymind or X/Twitter.
