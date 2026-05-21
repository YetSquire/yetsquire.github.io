// Content script for the Chrome extension to interact with Google Docs.

console.log("Docs compiler extension loaded");

// Only render the compile button when the Google Doc title matches exactly.
// Update this value to the title you want to target.
const REQUIRED_DOC_TITLE = "Blog Posts";

function getDocId() {
  const match = window.location.pathname.match(/\/document\/d\/([^/]+)/);
  return match ? match[1] : null;
}

function getActiveTabId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || "kix.main"; // "kix.main" is usually the default first tab
}

function getDocTitle() {
  return document.title.replace(/\s*-\s*Google Docs\s*$/, "").trim();
}

function shouldShowCompileButton() {
  return getDocTitle() === REQUIRED_DOC_TITLE;
}

function showStatusPopup(message, kind = "success") {
  const popupId = "compile-status-popup";
  let popup = document.getElementById(popupId);

  if (!popup) {
    popup = document.createElement("div");
    popup.id = popupId;
    document.body.appendChild(popup);
  }

  popup.textContent = message;
  popup.className = `compile-status ${kind}`;

  window.clearTimeout(showStatusPopup._timeoutId);
  showStatusPopup._timeoutId = window.setTimeout(() => {
    const existing = document.getElementById(popupId);
    if (existing) {
      existing.classList.add("hide");
    }
  }, 3000);
}

async function compileCurrentTab(docId, tabId, tabTitle) {
  try {
    const response = await fetch("http://localhost:3001/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        docId: docId,
        tabId: tabId,
        tabTitle: tabTitle
      })
    });

    if (!response.ok) {
      console.error("Compiler returned error:", response.status, response.statusText);
      const text = await response.text();
      console.log("Response body:", text);

      let message = `Compile failed (${response.status}): ${response.statusText}`;
      try {
        const parsed = JSON.parse(text);
        const details = [parsed?.error, parsed?.details].filter(Boolean).join(" ");
        if (details) message = details;
      } catch {
        if (text) message = `${message} ${text}`;
      }

      return {
        ok: false,
        message
      };
    }

    const data = await response.json();
    console.log("Compiler response:", data);

    return {
      ok: true,
      message: data?.message || "Compile succeeded"
    };
  } catch (err) {
    console.error("Error calling local compiler:", err);
    return {
      ok: false,
      message: "Could not reach compiler at localhost:3001"
    };
  }
}


function createButton() {
  if (!shouldShowCompileButton()) {
    document.getElementById("compile-tab-btn")?.remove();
    document.getElementById("compile-status-popup")?.remove();
    return;
  }

  if (document.getElementById("compile-tab-btn")) return;

  const btn = document.createElement("button");

  btn.id = "compile-tab-btn";
  btn.innerText = "Compile Tab";

  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "999999";
  btn.style.padding = "10px";
  btn.style.background = "#1a73e8";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";

  btn.onclick = async () => {

    const docId = getDocId();
    const tabId = getActiveTabId();

    if (!docId || !tabId) {
      showStatusPopup("Could not detect document/tab", "error");
      return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Compiling...";

    const result = await compileCurrentTab(docId, tabId, "");

    showStatusPopup(result.message, result.ok ? "success" : "error");

    btn.innerText = originalText;
    btn.disabled = false;

  };

  document.body.appendChild(btn);

}



setInterval(createButton, 2000);
