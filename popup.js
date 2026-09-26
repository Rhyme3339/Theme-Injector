function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const hostname = getHostname(tab.url);
  document.getElementById('site').textContent = hostname || 'Unsupported page';

  if (!hostname) {
    document.getElementById('toggle').disabled = true;
    return;
  }

  chrome.storage.local.get(['darkModeSites'], (result) => {
    const sites = result.darkModeSites || {};
    document.getElementById('toggle').checked = !!sites[hostname];
  });

  document.getElementById('toggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.get(['darkModeSites'], (result) => {
      const sites = result.darkModeSites || {};
      sites[hostname] = enabled;
      chrome.storage.local.set({ darkModeSites: sites }, () => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_DARK_MODE',
          hostname,
          enabled,
        });
      });
    });
  });
});
