chrome.runtime.onMessage.addListener(async (msg) => {

  if (msg.type !== "compile_tab") return;

  try {

    const res = await fetch("http://localhost:3001/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        docId: msg.docId,
        tabId: msg.tabId,
        tabTitle: msg.tabTitle
      })
    });

    const data = await res.json();

    console.log("Compile result:", data);

  } catch (err) {

    console.error("Compile server error:", err);

  }

});