const button = document.getElementById("heck");

chrome.runtime.sendMessage("STATE", (state) => {
  button.innerText = state ? "Inactive" : "Active";
});

button.addEventListener("click", async () => {
  chrome.runtime.sendMessage("TOGGLE_STATE", (state) => {
    button.innerText = state ? "Inactive" : "Active";
  });
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.reload(tabs[0].id);
  });
});
