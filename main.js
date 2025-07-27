const button = document.getElementById("heck");
const passElem = document.getElementById("pass");
chrome.runtime.sendMessage({ action: "STATE" }, (state) => {
  button.innerText = state ? "Inactive" : "Active";
});

button.addEventListener("click", async () => {
  if (button.innerText === "Inactive") {
    return chrome.runtime.sendMessage(
      {
        action: "SET_PASSWORD",
        data: undefined,
      },
      (state) => {
        button.innerText = state ? "Inactive" : "Active";
      }
    );
  }
  const encoder = new TextEncoder();
  const buffer = encoder.encode(passElem.value);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const u8Buffer = new Uint8Array(hashBuffer);

  const password = u8Buffer.reduce(
    (pre, current) => pre + current.toString(16).padStart(2, "0"),
    ""
  );
  if (
    password ===
    "1eaa1051b86d50b23c609d9b3aff71d1e49390799325fa92c9df90c2c0bd6fb0"
  ) {
    chrome.runtime.sendMessage(
      {
        action: "SET_PASSWORD",
        data: passElem.value,
      },
      (state) => {
        button.innerText = state ? "Inactive" : "Active";
      }
    );
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  }
});
