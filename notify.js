// Injected on-demand by background.js to show notifications.
// Receives config via window.__mymindNotify before injection.

(function () {
  const config = window.__mymindNotify;
  if (!config) return;
  delete window.__mymindNotify;

  const { status, text, redirect, fontUrl, logoUrl, xIconUrl } = config;

  const NOTIFICATION_CSS = `
    @font-face {
      font-family: 'Nunito';
      src: url('${fontUrl}') format('woff2');
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
      background: #000;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
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
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0px); }
    }

    @keyframes mymindSlideOut {
      0% { opacity: 1; transform: translateY(0px); }
      100% { opacity: 0; transform: translateY(-30px); }
    }

    @keyframes mymindTimeout {
      0% { width: 100%; }
      100% { width: 0%; }
    }
  `;

  // Remove any existing notification
  const existing = document.querySelector('mymind-tweet-saver');
  if (existing) existing.remove();

  const host = document.createElement('mymind-tweet-saver');
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = NOTIFICATION_CSS;
  shadow.appendChild(style);

  // Font in document for Shadow DOM
  if (!document.querySelector('#mymind-tweet-saver-font')) {
    const fontStyle = document.createElement('style');
    fontStyle.id = 'mymind-tweet-saver-font';
    fontStyle.textContent = `@font-face {
      font-family: 'Nunito';
      src: url('${fontUrl}') format('woff2');
    }`;
    document.head.appendChild(fontStyle);
  }

  const iconSrc = (status === 'signin') ? logoUrl : xIconUrl;

  const notificationEl = document.createElement('mymind-notification');
  const wrap = document.createElement('div');
  wrap.className = 'mymind-notification-wrap';
  const inner = document.createElement('div');
  inner.className = 'mymind-notification-inner';

  const img = document.createElement('img');
  img.src = iconSrc;
  inner.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;
  if (status === 'signin' && redirect) {
    span.textContent = text + ' ';
    const link = document.createElement('a');
    link.href = redirect;
    link.target = '_blank';
    link.textContent = 'Sign in \u2192';
    span.appendChild(link);
  }
  inner.appendChild(span);

  wrap.appendChild(inner);
  notificationEl.appendChild(wrap);

  if (status === 'success') notificationEl.classList.add('success');
  else if (status === 'error' || status === 'signin') notificationEl.classList.add('error');

  shadow.appendChild(notificationEl);
  document.body.appendChild(host);

  if (redirect && status !== 'signin') {
    notificationEl.querySelector('.mymind-notification-inner').addEventListener('click', () => {
      window.open(redirect, '_blank');
      close();
    });
  }

  function close() {
    if (notificationEl.classList.contains('closing')) return;
    notificationEl.classList.add('closing');
    setTimeout(() => host.remove(), 550);
  }

  let dismissTimeout = null;
  if (status === 'signin') {
    dismissTimeout = setTimeout(close, 4000);
  } else {
    dismissTimeout = setTimeout(close, 2500);
  }

  notificationEl.addEventListener('mouseenter', () => {
    dismissTimeout && clearTimeout(dismissTimeout);
  });
  notificationEl.addEventListener('mouseleave', () => {
    dismissTimeout = setTimeout(close, 2000);
  });
})();
