(function () {
  const FILTER_STYLE_ID = 'cl-dark-mode-style';
  const OVERLAY_ID = 'cl-theme-overlay';
  const TEXT_STYLE_ATTR = 'data-cl-text-color';

  // Solid (non-blended) overlay colors + forced text color per theme.
  // Plain alpha overlays always show up, regardless of what's underneath.
  const THEMES = {
    romance: { overlay: 'rgba(200, 0, 60, 0.5)', text: '#ffffff' },
    sky: { overlay: 'rgba(135, 206, 250, 0.6)', text: '#ffffff' },
    sea: { overlay: 'rgba(0, 105, 92, 0.5)', text: '#4CAF50' }, // grassy green text
    magic: { overlay: 'rgba(106, 13, 173, 0.6)', text: '#ffffff' },
  };

  let currentMode = 'none';
  let observer = null;
  const processedRoots = new WeakSet();
  let debounceTimer = null;

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

  function addOverlay(color) {
    removeOverlay();
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483647',
      background: color,
    });
    document.documentElement.appendChild(overlay);
  }

  // Injects a forced-text-color <style> into a root (document or shadow root)
  // if it doesn't already have one, then recurses into any shadow roots found
  // inside it. This is what lets the theme reach into web-component-based
  // sites like YouTube, which wall off their internal markup in shadow DOM.
  function injectTextColor(root, color) {
    if (!processedRoots.has(root)) {
      const style = document.createElement('style');
      style.setAttribute(TEXT_STYLE_ATTR, 'true');
      style.textContent = `*, *::before, *::after { color: ${color} !important; }`;
      root.appendChild(style);
      processedRoots.add(root);
    }
    const all = root.querySelectorAll('*');
    for (const el of all) {
      if (el.shadowRoot) injectTextColor(el.shadowRoot, color);
    }
  }

  function removeAllTextColorStyles(root) {
    root.querySelectorAll(`[${TEXT_STYLE_ATTR}]`).forEach((el) => el.remove());
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) removeAllTextColorStyles(el.shadowRoot);
    });
  }

  function startObserving(color) {
    stopObserving();
    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      // Debounced re-scan: catches new shadow roots created as the page
      // (e.g. a YouTube SPA navigation) adds new custom elements.
      debounceTimer = setTimeout(() => injectTextColor(document, color), 600);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function stopObserving() {
    if (observer) observer.disconnect();
    observer = null;
    clearTimeout(debounceTimer);
  }

  function applyMode(mode) {
    currentMode = mode;
    removeDarkFilter();
    removeOverlay();
    removeAllTextColorStyles(document);
    stopObserving();

    if (mode === 'dark') {
      addDarkFilter();
    } else if (mode && THEMES[mode]) {
      const theme = THEMES[mode];
      addOverlay(theme.overlay);
      injectTextColor(document, theme.text);
      startObserving(theme.text);
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
