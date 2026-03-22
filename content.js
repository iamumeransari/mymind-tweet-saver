// --- Tweet URL Resolution ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TWEET_URL') {
    sendResponse({ url: resolveTweetUrl(msg.tweetId) });
    return true;
  }

  if (msg.type === 'SHOW_NOTIFICATION') {
    showNotification(msg);
    return true;
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

// --- In-Page Notification (exact mymind styling) ---

const ASSETS = {
  font: chrome.runtime.getURL('nunito.woff2'),
  logo: chrome.runtime.getURL('logo.svg'),
  xIcon: chrome.runtime.getURL('x-icon-bg.png'),
};

// Lifted directly from the original mymind extension's notification.css
const NOTIFICATION_CSS = `
  @font-face {
    font-family: 'Nunito';
    src: url('${ASSETS.font}') format('woff2');
  }

  :host {
    all: initial;
  }

  mymind-notification {
    --time-to-close: 2.5s;
    --border-radius: 4px;
    font-family: 'Nunito';
    position: fixed;
    right: 30px;
    top: 30px;
    box-shadow: 11px 11px 22px rgba(0, 0, 0, 0.5);
    border-radius: var(--border-radius);
    width: 300px;
    box-sizing: border-box;
    user-select: none;
    line-height: 1.1;
    animation: mymindSlideIn 300ms ease-out forwards;
    animation-delay: 300ms;
    opacity: 0;
    will-change: opacity, transform;
    text-transform: none;
    z-index: 2147483647;
  }

  mymind-notification::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: #FF5924;
    display: none;
    z-index: 5;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }

  mymind-notification.success::before {
    display: block;
    animation: mymindTimeout var(--time-to-close) linear forwards;
  }

  mymind-notification.closing {
    pointer-events: none;
    opacity: 1;
    animation: mymindSlideOut 500ms ease-out forwards;
  }

  mymind-notification.error .mymind-notification-inner {
    border: 1.5px solid #FF5924;
  }

  .mymind-notification-wrap {
    overflow: hidden;
    border-radius: var(--border-radius);
  }

  .mymind-notification-inner {
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    background: #16181C;
    color: #E7E9EA;
    position: relative;
    z-index: 3;
    padding: 20px;
    box-sizing: border-box;
    border: 1px solid #2F3336;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    cursor: pointer;
  }

  .mymind-notification-inner img {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    margin-right: 14px;
    flex-shrink: 0;
  }

  .mymind-notification-inner span {
    color: inherit;
    font-weight: normal;
    font: 16px/20px 'Nunito';
    letter-spacing: 0;
  }

  .mymind-notification-inner a {
    color: #FF5924;
    text-decoration: none;
    cursor: pointer;
  }

  .mymind-notification-inner a:hover {
    opacity: 0.8;
  }

  @keyframes mymindSlideIn {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0px);
    }
  }

  @keyframes mymindSlideOut {
    0% {
      opacity: 1;
      transform: translateY(0px);
    }
    100% {
      opacity: 0;
      transform: translateY(-30px);
    }
  }

  @keyframes mymindTimeout {
    0% { width: 100%; }
    100% { width: 0%; }
  }
`;

let activeNotification = null;

function showNotification({ status, text, redirect }) {
  // Remove existing
  if (activeNotification) {
    activeNotification.host.remove();
    activeNotification.timeout && clearTimeout(activeNotification.timeout);
    activeNotification = null;
  }

  const host = document.createElement('mymind-tweet-saver');
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = NOTIFICATION_CSS;
  shadow.appendChild(style);

  // Also inject font into document (required for Shadow DOM font loading)
  if (!document.querySelector('#mymind-tweet-saver-font')) {
    const fontStyle = document.createElement('style');
    fontStyle.id = 'mymind-tweet-saver-font';
    fontStyle.textContent = `@font-face {
      font-family: 'Nunito';
      src: url('${ASSETS.font}') format('woff2');
    }`;
    document.head.appendChild(fontStyle);
  }

  // X icon for success/error, mymind logo for signin
  const iconSrc = (status === 'signin') ? ASSETS.logo : ASSETS.xIcon;

  // Build message HTML
  let messageHtml = text;
  if (status === 'signin' && redirect) {
    messageHtml = `${text} <a href="${redirect}" target="_blank">Sign in \u2192</a>`;
  }

  const notificationEl = document.createElement('mymind-notification');
  notificationEl.innerHTML = `
    <div class="mymind-notification-wrap">
      <div class="mymind-notification-inner">
        <img src="${iconSrc}">
        <span>${messageHtml}</span>
      </div>
    </div>
  `;

  // Set status class
  if (status === 'success') notificationEl.classList.add('success');
  else if (status === 'error' || status === 'signin') notificationEl.classList.add('error');

  shadow.appendChild(notificationEl);
  document.body.appendChild(host);

  // Click inner to open redirect
  if (redirect && status !== 'signin') {
    notificationEl.querySelector('.mymind-notification-inner').addEventListener('click', () => {
      window.open(redirect, '_blank');
      close();
    });
  }

  function close() {
    if (notificationEl.classList.contains('closing')) return;
    notificationEl.classList.add('closing');
    // Use a fixed timeout matching the slideOut duration (500ms)
    // instead of animationend which can fire on the wrong animation
    setTimeout(() => host.remove(), 550);
  }

  // Auto-dismiss
  let dismissTimeout = null;
  if (status === 'signin') {
    dismissTimeout = setTimeout(close, 4000);
  } else {
    dismissTimeout = setTimeout(close, 2500);
  }

  // Hover pauses dismiss
  notificationEl.addEventListener('mouseenter', () => {
    dismissTimeout && clearTimeout(dismissTimeout);
  });
  notificationEl.addEventListener('mouseleave', () => {
    dismissTimeout = setTimeout(close, 2000);
  });

  activeNotification = { host, close, timeout: dismissTimeout };
}

