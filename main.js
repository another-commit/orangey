(async function initPopupWindow() {
  let responseText = await new Promise((resolve) =>
    chrome.runtime.sendMessage("GET_RANDOM", resolve)
  );

  const random = document.getElementById("random");
  if (responseText) {
    random.textContent = responseText;
  }
})();

const statusElem = document.getElementById("status");
export const setStatus = (text) => (statusElem.textContent = text);

const button = document.getElementById("heck");
const state = document.getElementById("status");
state.innerText = "idle";
button.addEventListener("click", async () => {
  try {
    setStatus("Working on it...");
    const token = await new Promise((resolve) =>
      chrome.runtime.sendMessage("GET_ACCOUNT", resolve)
    );
    console.log("token", token);
    if (token) {
      setStatus("Access Granted");
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
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    } else {
      setStatus("Access Denied");
    }
  } catch (error) {
    setStatus("Access Denied");
  }
});
