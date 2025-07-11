const API =
  "https://pte-backend-token-DlksYKNDindmnLHDLIWNDlkxkljlkDLKdkDllkdLK.vercel.app";
(async function initPopupWindow() {
  let responseText = await new Promise((resolve) =>
    chrome.runtime.sendMessage("getCachedResponse", resolve)
  );

  const random = document.getElementById("random");
  if (responseText) {
    random.textContent = responseText;
  }
})();

const button = document.getElementById("heck");
const state = document.getElementById("status");
state.innerText = "idle";
button.addEventListener("click", async () => {
  try {
    const nonce = Date.now().toString() + Math.floor(Math.random() * 99);
    state.innerText = "Determining best route";
    const createRes = await fetch(`${API}/create?nonce=${nonce}`);
    if (!createRes.ok) {
      statusEl.innerText = "routing failed.";
      return;
    }
    const token = await createRes.text();
    var verificationToken = null;
    for (var attempt = 0; attempt <= 3; attempt++) {
      state.innerText = `Connecting to IMAP protocol retry: ${attempt}`;
      const response = await fetch(`${API}/read?nonce=${nonce}`);
      if (response.status == 200) {
        verificationToken = await response.text();
        console.log(verificationToken);
        break;
      }
    }
    if (verificationToken) {
      const { status } = await fetch(
        `https://www.apeuni.com/users/confirmation?confirmation_token=${verificationToken}&locale=en`
      );
      if (!status === 200) {
        state.innerHTML = "Access Denied";
        return;
      }
      state.innerHTML = "Access Granted";
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        if (!currentUrl.includes("apeuni.com")) {
          state.innerText = "ops, wrong site??";
          return;
        }
        const urlObj = new URL(currentUrl);
        chrome.cookies.set({
          url: urlObj.origin,
          name: "user_token",
          value: token,
          path: "/",
          expirationDate: Math.floor(Date.now() / 1000) + 3600,
        });
      });
      // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      //   chrome.tabs.reload(tabs[0].id);
      // });
    } else {
      state.innerHTML = "Access Denied";
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
});
