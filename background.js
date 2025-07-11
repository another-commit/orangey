let cachedResponse = null;

chrome.tabs.onActivated.addListener(async () => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/mozilla-firefox/firefox/refs/heads/main/random"
    );
    cachedResponse = await res.text();
  } catch (e) {
    cachedResponse = "ops error occurred, is internet fine? GO CHECK IT!!!";
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "getCachedResponse") {
    sendResponse(cachedResponse);
  }
});
