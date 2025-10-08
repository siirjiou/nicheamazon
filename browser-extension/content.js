// content.js

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  // replace with YOUR Netlify site URL:
  "https://tw-amazonnichefinder.netlify.app",
];

console.log("[Niche Helper] content script loaded on", location.href);

window.addEventListener("message", (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;
  if (event.data?.type !== "NICHES_REQ_TOKENS") return;

  // If not running as an extension content script, tell the page
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    window.postMessage(
      { type: "NICHES_TOKENS", ok: false, error: "Extension not active on this page" },
      event.origin
    );
    return;
  }

  chrome.runtime.sendMessage({ type: "NICHES_GET_TOKENS" }, (resp) => {
    // Handle the "message port closed" and other errors cleanly
    const err = chrome.runtime.lastError?.message;
    if (err) {
      console.warn("[Niche Helper] sendMessage lastError:", err);
      window.postMessage(
        { type: "NICHES_TOKENS", ok: false, error: err },
        event.origin
      );
      return;
    }

    window.postMessage(
      { type: "NICHES_TOKENS", ...(resp || { ok: false, error: "No response" }) },
      event.origin
    );
  });
});
