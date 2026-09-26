(function () {
  const FILTER_STYLE_ID = 'cl-dark-mode-style';
  const OVERLAY_ID = 'cl-theme-overlay';

  // Each theme (other than 'dark' and 'none') is a CSS background painted
  // onto a fixed, click-through overlay div using blend modes + gradients.
  const THEMES = {
    romance: {
      blend: 'multiply',
      background:
        'radial-gradient(circle at 20% 20%, rgba(255,0,90,0.45), transparent 60%),' +
        'radial-gradient(circle at 80% 80%, rgba(160,0,40,0.4), transparent 60%),' +
        'rgba(120,0,30,0.12)',
    },
    sky: {
      blend: 'screen',
      background:
        'linear-gradient(180deg, rgba(135,206,250,0.35), rgba(210,245,255,0.15)),' +
        'radial-gradient(circle at 70% 10%, rgba(255,255,255,0.5), transparent 40%)',
    },
    sea: {
      blend: 'multiply',
      background:
        'linear-gradient(160deg, rgba(0,150,136,0.4), rgba(0,90,140,0.3)),' +
        'radial-gradient(circle at 30% 90%, rgba(0,200,180,0.3), transparent 50%)',
    },
    magic: {
      blend: 'screen',
      background:
        'radial-gradient(2px 2px at 10% 20%, #fff, transparent),' +
        'radial-gradient(2px 2px at 80% 30%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 50% 70%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 90% 80%, #fff, transparent),' +
        'radial-gradient(1px 1px at 25% 85%, #fff, transparent),' +
        'radial-gradient(1px 1px at 60% 15%, #fff, transparent),' +
        'linear-gradient(135deg, rgba(148,0,255,0.4), rgba(75,0,130,0.4))',
    },
  };

  function removeDarkFilter() {
    const styleTag = document.getElementById(FILTER_STYLE_ID);
    if (styleTag) styleTag.remove();
  }

  function addDarkFilter() {
    if (document.getElementById(FILTER_STYLE_ID)) return;
    const styleTag = document.createElement('style');
    styleTag.id = FILTER_STYLE_ID;
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

  function removeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
  }

  function addOverlay(themeName) {
    removeOverlay();
    const theme = THEMES[themeName];
    if (!theme) return;
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483647',
      mixBlendMode: theme.blend,
      background: theme.background,
    });
    document.documentElement.appendChild(overlay);
  }

  function applyMode(mode) {
    removeDarkFilter();
    removeOverlay();
    if (mode === 'dark') {
      addDarkFilter();
    } else if (mode && mode !== 'none') {
      addOverlay(mode);
    }
  }

  function getHostname() {
    return window.location.hostname;
  }

  chrome.storage.local.get(['siteThemes'], (result) => {
    const sites = result.siteThemes || {};
    applyMode(sites[getHostname()] || 'none');
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SET_THEME' && message.hostname === getHostname()) {
      applyMode(message.mode);
    }
  });
})();
