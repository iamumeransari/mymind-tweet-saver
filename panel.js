// Injected on-demand by background.js when the extension icon is clicked.
// Receives config via window.__mymindPanel before injection.

(function () {
  const config = window.__mymindPanel;
  if (!config) return;
  delete window.__mymindPanel;

  const { connected, saveCount, fontUrl, logoUrl } = config;

  const PANEL_CSS = `
    @font-face {
      font-family: 'Nunito';
      src: url('${fontUrl}') format('woff2');
    }

    :host { all: initial; }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
    }

    .panel {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 320px;
      z-index: 2147483647;
      border-radius: 12px;
      background: #16181C;
      border: 1px solid #2F3336;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      font-family: 'Nunito', sans-serif;
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
      animation: panelIn 200ms ease-out forwards;
    }

    .panel.closing {
      animation: panelOut 150ms ease-in forwards;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 22px 20px 0;
    }

    .header img {
      width: auto;
      height: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .header span {
      font: 18px/22px 'Nunito', sans-serif;
      color: #E7E9EA;
    }

    .divider {
      height: 1px;
      background: #2F3336;
      margin: 0 20px;
    }

    .steps {
      padding: 18px 20px 24px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font: 13px/18px 'Nunito', sans-serif;
      color: #71767B;
    }

    .step:last-child { margin-bottom: 0; }

    .step-num {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2F3336;
      color: #71767B;
      font: 10px/1 'Nunito', sans-serif;
      flex-shrink: 0;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-top: 1px solid #2F3336;
    }

    .counter {
      font: 13px/1 'Nunito', sans-serif;
      color: #71767B;
    }

    .counter-num { color: #FF5924; }

    .open-link {
      font: 13px/1 'Nunito', sans-serif;
      color: #FF5924;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .open-link:hover { opacity: 0.8; }

    .signin {
      padding: 36px 28px 28px;
      text-align: center;
    }

    .signin img {
      width: 29px;
      height: 38px;
      margin-bottom: 18px;
    }

    .signin h1 {
      font: 18px/22px 'Nunito', sans-serif;
      font-weight: normal;
      color: #E7E9EA;
      margin-bottom: 8px;
    }

    .signin p {
      font: 14px/19px 'Nunito', sans-serif;
      color: #71767B;
      margin-bottom: 22px;
    }

    .signin-btn {
      display: inline-block;
      background: #FF5924;
      color: #fff;
      font: 14px/1 'Nunito', sans-serif;
      border: none;
      border-radius: 50px;
      padding: 11px 28px;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    .signin-btn:hover { opacity: 0.85; }

    @keyframes panelIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes panelOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
    }
  `;

  // Toggle — if already open, animate out
  const existing = document.querySelector('mymind-tweet-panel');
  if (existing) {
    if (existing.__close) existing.__close();
    else existing.remove();
    return;
  }

  const host = document.createElement('mymind-tweet-panel');
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = PANEL_CSS;
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

  const container = document.createElement('div');

  if (connected) {
    container.innerHTML = `
      <div class="backdrop"></div>
      <div class="panel">
        <div class="header">
          <img src="${logoUrl}">
          <span>You're connected</span>
        </div>
        <div class="steps">
          <div class="step">
            <span class="step-num">1</span>
            <span>Bookmark any tweet on X</span>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <span>It gets saved to your mind automatically</span>
          </div>
        </div>
        <div class="footer">
          <span class="counter"><span class="counter-num">${saveCount}</span> tweets saved</span>
          <a class="open-link" href="https://access.mymind.com/" target="_blank">Open my mind \u2192</a>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="backdrop"></div>
      <div class="panel">
        <div class="signin">
          <img src="${logoUrl}">
          <h1>Sign in to your mind</h1>
          <p>Connect your mymind account to start saving bookmarked tweets automatically.</p>
          <a class="signin-btn" href="https://access.mymind.com/signin" target="_blank">Sign in</a>
        </div>
      </div>
    `;
  }

  shadow.appendChild(container);
  document.body.appendChild(host);

  const panelEl = container.querySelector('.panel');

  function closePanel() {
    panelEl.classList.add('closing');
    setTimeout(() => host.remove(), 150);
  }

  host.__close = closePanel;
  container.querySelector('.backdrop').addEventListener('click', closePanel);
})();
