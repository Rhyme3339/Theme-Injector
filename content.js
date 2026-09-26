(function () {
  const STYLE_ID = 'cl-dark-mode-style';

  function applyDarkMode(enabled) {
    let styleTag = document.getElementById(STYLE_ID);
    if (enabled) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = STYLE_ID;
        styleTag.textContent = `
          html {
            filter: invert(1) hue-rotate(180deg) !important;
            background: #fff !important;
          }
          img, video, picture, canvas, iframe, svg {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        `;
        document.documentElement.appendChild(styleTag);
      }
    } else if (styleTag) {
      styleTag.remove();
    }
  }

  function getHostname() {
    return window.location.hostname;
  }

  // Apply saved preference for this site on page load
  chrome.storage.local.get(['darkModeSites'], (result) => {
    const sites = result.darkModeSites || {};
    applyDarkMode(!!sites[getHostname()]);
  });

  // Listen for live toggles from the popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE_DARK_MODE' && message.hostname === getHostname()) {
      applyDarkMode(message.enabled);
    }
  });
})();
