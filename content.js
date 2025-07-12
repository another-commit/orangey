if (!window.__replenishInjected) {
  window.__replenishInjected = true;

  const BUTTON_ID = "replenish-btn";
  const TARGET_SELECTOR =
    "#root > div.Wrapper-sc-vp4h46.iWqOCa > div.ant-spin-nested-loading > div > div.ant-row-flex.ant-row-flex-space-between > div:nth-child(2)";

  const buttonHTML = `
    <button
      type="button"
      id="${BUTTON_ID}"
      class="ant-btn"
      style="color: rgb(255, 102, 102); border-color: rgb(255, 102, 102); background-color: rgb(250, 250, 250); margin-right: 10px;"
    >
      <i class="anticon custom-icon" style="font-size: 15px; color: rgb(255, 102, 102); vertical-align: middle;">
        <svg viewBox="0 0 64 44" width="1em" height="1em" fill="currentColor">
          <path d="M63.115 13.956c.422 0 .703-.422.703-.844V.866c0-.422-.422-.844-.844-.844H.902C.48.022.057.444.057.866v12.386c0 .423.282.704.704.704 4.082.422 7.179 3.8 7.179 7.882S4.702 29.44.76 29.72c-.422 0-.704.423-.704.845v12.386c0 .422.423.845.845.845h62.213c.422 0 .844-.423.844-.845V30.565c0-.422-.281-.704-.704-.845-4.082-.422-7.178-3.8-7.178-7.882-.14-4.081 2.956-7.46 7.038-7.882zM45.239 29.861H18.778c-.986 0-1.971-.844-1.971-1.97s.845-1.97 1.97-1.97H45.24c.985 0 1.97.844 1.97 1.97s-.985 1.97-1.97 1.97zm0-12.104H18.778c-.986 0-1.971-.845-1.971-1.971 0-1.126.845-1.83 1.97-1.83H45.24c.985 0 1.97.845 1.97 1.97 0 1.127-.985 1.83-1.97 1.83z"
                fill="#000" fill-rule="nonzero"></path>
        </svg>
      </i>
      <span>Replenish</span>
    </button>`;

  Element.prototype.waitForChild = function (selector, timeout = 30) {
    return new Promise((resolve, reject) => {
      const check = () => this.querySelector(`:scope > ${selector}`);
      const element = check();
      if (element) return resolve(element);

      const observer = new MutationObserver(() => {
        const el = check();
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(this, { childList: true, subtree: true });

      if (timeout > 0) {
        setTimeout(() => {
          observer.disconnect();
          reject(new Error("Timeout while waiting for child"));
        }, timeout * 1000);
      }
    });
  };

  async function renderButton() {
    try {
      const STATE = await new Promise((resolve) =>
        chrome.runtime.sendMessage("STATE", resolve)
      );
      console.log("-".repeat(100), STATE);
      if (!STATE) return;
      const targetElement = await document.body.waitForChild(
        TARGET_SELECTOR,
        10
      );

      const isCouponNeeded = targetElement.querySelector(
        `:scope > button:not(${BUTTON_ID}) svg`
      );

      if (!isCouponNeeded) return;
      if (document.getElementById(BUTTON_ID)) return;

      targetElement.removeChild(await targetElement.waitForChild("span"));
      targetElement.insertAdjacentHTML("afterbegin", buttonHTML);

      const btn = document.getElementById(BUTTON_ID);
      let clicked = false;

      btn.onclick = async () => {
        if (clicked) return;
        clicked = true;
        try {
          chrome.runtime.sendMessage("SET_ACCOUNT");
        } catch (e) {
          console.error("Token injection failed", e);
        } finally {
          clicked = false;
        }
      };
    } catch (e) {
      console.warn("renderButton failed:", e);
    }
  }

  const reinjectObserver = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      console.log("Button removed by React, reinjecting...");
      renderButton();
    }
  });

  reinjectObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial delayed inject
  setTimeout(() => {
    requestIdleCallback(renderButton);
  }, 2000);
}
