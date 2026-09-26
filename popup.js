function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

const buttons = Array.from(document.querySelectorAll('.mode-btn'));

function setActiveButton(mode) {
  buttons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const hostname = getHostname(tab.url);
  document.getElementById('site').textContent = hostname || 'Unsupported page';

  if (!hostname) {
    buttons.forEach((btn) => (btn.disabled = true));
    return;
  }

  chrome.storage.local.get(['siteThemes'], (result) => {
    const sites = result.siteThemes || {};
    setActiveButton(sites[hostname] || 'none');
  });

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      chrome.storage.local.get(['siteThemes'], (result) => {
        const sites = result.siteThemes || {};
        sites[hostname] = mode;
        chrome.storage.local.set({ siteThemes: sites }, () => {
          setActiveButton(mode);
          chrome.tabs.sendMessage(tab.id, {
            type: 'SET_THEME',
            hostname,
            mode,
          });
        });
      });
    });
  });
});
