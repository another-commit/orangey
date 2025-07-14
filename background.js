const API_BASE =
  "https://pte-backend-token-DlksYKNDindmnLHDLIWNDlkxkljlkDLKdkDllkdLK.vercel.app";
var accountCache = null;
var uuid = crypto.randomUUID();
async function getAccount() {
  const nonce = Date.now().toString() + Math.floor(Math.random() * 99);
  try {
    const rawRes = await fetch(
      "https://any.apeuni.com/api/v1/users/registration/sign_up?",
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          api_type: "e1",
          device_type: "web-1.0.0-Chrome-Chrome 138.0.0.0 on Windows 10 64-bit",
          device_id: uuid,
          first_visit_time: Date.now() / 1000,
          logged_in: true,
          locale: "en",
          s: "wa",
          nickname: nonce,
          user_detail: `ptbypass123+${nonce}@outlook.com`,
          password: `password@${nonce}`,
        }),
        method: "POST",
      }
    );
    if (rawRes.status !== 201) return null;
    const response = await rawRes.json();
    const createRes = await fetch(`${API_BASE}/encode?nonce=${nonce}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    });
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

function setAccount(currentAcc) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0]?.url;
    if (!currentUrl || !currentUrl.includes("apeuni.com")) return;
    const urlObj = new URL(currentUrl);
    chrome.cookies.set({
      url: urlObj.origin,
      name: "device_id",
      value: uuid,
      path: "/",
      expirationDate: Math.floor(Date.now() / 1000) + 46000,
    });

    chrome.cookies.set({
      url: urlObj.origin,
      name: "user_token",
      value: currentAcc,
      path: "/",
      expirationDate: Math.floor(Date.now() / 1000) + 36000,
    });
    chrome.tabs.reload(tabs[0].id);
  });
  accountCache = null;
}

var ACTIVE = false;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "SET_ACCOUNT") {
    if (accountCache) {
      setAccount(accountCache);
      loadCache();
    } else {
      loadCache().then((account) => {
        setAccount(account);
        loadCache();
      });
    }
  } else if (msg === "STATE") {
    sendResponse(ACTIVE);
  } else if (msg === "TOGGLE_STATE") {
    ACTIVE = !ACTIVE;
    sendResponse(ACTIVE);
  }
});
