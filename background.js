const API_BASE =
  "https://pte-backend-token-DlksYKNDindmnLHDLIWNDlkxkljlkDLKdkDllkdLK.vercel.app";

var accountCache = null;
var cachedResponse = null;

async function getAccount() {
  const nonce = Date.now().toString() + Math.floor(Math.random() * 99);
  try {
    const createRes = await fetch(`${API_BASE}/create?nonce=${nonce}`);
    if (!createRes.ok) return null;

    const session = await createRes.text();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    let verificationToken = null;
    for (let attempt = 0; attempt <= 5; attempt++) {
      const response = await fetch(`${API_BASE}/read?nonce=${nonce}`);
      if (response.status === 200) {
        verificationToken = await response.text();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (verificationToken) {
      const confirmationRes = await fetch(
        `https://www.apeuni.com/users/confirmation?confirmation_token=${verificationToken}&locale=en`
      );
      if (confirmationRes.ok) {
        return session;
      }
    }
  } catch {
    return null;
  }
}

chrome.tabs.onActivated.addListener(async () => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/another-commit/orangey/refs/heads/main/random"
    );
    cachedResponse = res.ok ? await res.text() : "huh? werid error";
  } catch {
    cachedResponse = "Oops, error occurred, is internet fine? GO CHECK IT!!!";
  }
});

let cacheLoadingPromise = null;

function loadCache() {
  if (!cacheLoadingPromise) {
    cacheLoadingPromise = getAccount().then((account) => {
      accountCache = account;
      cacheLoadingPromise = null;
      return account;
    });
  }
  return cacheLoadingPromise;
}
loadCache();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "GET_ACCOUNT") {
    if (accountCache) {
      sendResponse(accountCache);
      loadCache();
    } else {
      loadCache().then((account) => {
        sendResponse(account);
        loadCache();
      });
    }
  } else if (msg === "GET_RANDOM") {
    sendResponse(cachedResponse);
  }
  return true;
});
