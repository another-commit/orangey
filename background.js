const API_BASE =
  "https://pte-backend-token-DlksYKNDindmnLHDLIWNDlkxkljlkDLKdkDllkdLK.vercel.app";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        credentials: "omit",
        body: JSON.stringify({
          api_type: "e1",
          device_type: "web-1.0.0-Chrome-Chrome 138.0.0.0 on Windows 10 64-bit",
          // device_id: uuid,
          first_visit_time: Date.now() / 1000,
          logged_in: false,
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
        "x-auth-key": await new Promise((r) =>
          chrome.storage.session.get("password", ({ password }) => r(password))
        ),
      },
      body: JSON.stringify(response),
    });
    if (!createRes.ok) return null;

    const session = await createRes.text();

    await delay(1000);

    let verificationToken = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await fetch(`${API_BASE}/read?nonce=${nonce}`, {
        headers: {
          "x-auth-key": await new Promise((r) =>
            chrome.storage.session.get("password", ({ password }) =>
              r(password)
            )
          ),
        },
      });
      if (response.status === 200) {
        verificationToken = await response.text();
        break;
      }
      await delay(500);
    }

    if (verificationToken) {
      const confirmationRes = await fetch(
        `https://www.apeuni.com/users/confirmation?confirmation_token=${verificationToken}&locale=en`,
        {
          credentials: "omit",
        }
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
      return chrome.storage.session
        .set({
          accountCache: account,
        })
        .then(() => {
          cacheLoadingPromise = null;
          return account;
        });
    });
  }
  return cacheLoadingPromise;
}

function setAccount(currentAcc) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0]?.url;
    if (!currentUrl || !currentUrl.includes("apeuni.com")) return;
    const urlObj = new URL(currentUrl);
    // chrome.cookies.set({
    //   url: urlObj.origin,
    //   name: "device_id",
    //   value: uuid,
    //   path: "/",
    //   expirationDate: Math.floor(Date.now() / 1000) + 46000,
    // });

    chrome.cookies.set({
      url: urlObj.origin,
      name: "user_token",
      value: currentAcc,
      path: "/",
      expirationDate: Math.floor(Date.now() / 1000) + 36000,
    });
    chrome.tabs.reload(tabs[0].id);
    chrome.storage.session.remove("accountCache");
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "SET_ACCOUNT") {
    chrome.storage.session.get("accountCache", ({ accountCache }) => {
      if (accountCache) {
        setAccount(accountCache);
        loadCache();
      } else {
        loadCache().then((account) => {
          setAccount(account);
          loadCache();
        });
      }
    });
  } else if (msg.action === "STATE") {
    chrome.storage.session.get("password", ({ password }) => {
      sendResponse(password);
    });
  } else if (msg.action === "SET_PASSWORD") {
    chrome.storage.session.set({ password: msg.data }, () => {
      chrome.storage.session.get("accountCache", ({ accountCache }) => {
        if (!accountCache) {
          loadCache();
        }
        sendResponse(msg.data);
      });
    });
  }
  return true;
});
