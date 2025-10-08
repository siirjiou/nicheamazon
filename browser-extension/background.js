// background.js (MV3)

// --- All Seller Central hosts we support ---
const SC_HOSTS = [
  "sellercentral.amazon.com",
  "sellercentral.amazon.co.uk",
  "sellercentral.amazon.fr",
  "sellercentral.amazon.es",
  "sellercentral.amazon.it",
  "sellercentral.amazon.de",
  "sellercentral.amazon.nl",
  "sellercentral.amazon.se",
  "sellercentral.amazon.pl",
  "sellercentral.amazon.com.be",
  "sellercentral.amazon.ca",
  "sellercentral.amazon.com.mx",
  "sellercentral.amazon.co.jp",
  "sellercentral.amazon.com.au",
  "sellercentral.amazon.sg",
  "sellercentral.amazon.in",
  "sellercentral.amazon.ae",
  "sellercentral.amazon.sa",
  "sellercentral.amazon.eg",
  "sellercentral.amazon.com.tr",
  "sellercentral.amazon.com.br",
  "sellercentral.amazon.cn",
];

const toAmazonHost = (scHost) => scHost.replace(/^sellercentral\./, "amazon.");

// Keep last seen CSRF per host from OX requests.
const lastCsrfByHost = Object.create(null);

// Capture anti-csrftoken-a2z from OX GraphQL requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      const { host } = new URL(details.url);
      for (const h of details.requestHeaders ?? []) {
        if (h.name && h.name.toLowerCase() === "anti-csrftoken-a2z") {
          lastCsrfByHost[host] = h.value || "";
          break;
        }
      }
    } catch {}
  },
  { urls: SC_HOSTS.map((h) => `https://${h}/ox-api/graphql*`) },
  ["requestHeaders", "extraHeaders"]
);

// host -> country code (simple)
const hostToCountry = (host) => {
  if (host.endsWith(".co.uk")) return "UK";
  if (host.endsWith(".com")) return "US";
  if (host.endsWith(".fr")) return "FR";
  if (host.endsWith(".es")) return "ES";
  if (host.endsWith(".it")) return "IT";
  if (host.endsWith(".de")) return "DE";
  if (host.endsWith(".nl")) return "NL";
  if (host.endsWith(".se")) return "SE";
  if (host.endsWith(".pl")) return "PL";
  if (host.endsWith(".com.be")) return "BE";
  if (host.endsWith(".ca")) return "CA";
  if (host.endsWith(".com.mx")) return "MX";
  if (host.endsWith(".co.jp")) return "JP";
  if (host.endsWith(".com.au")) return "AU";
  if (host.endsWith(".sg")) return "SG";
  if (host.endsWith(".in")) return "IN";
  if (host.endsWith(".ae")) return "AE";
  if (host.endsWith(".sa")) return "SA";
  if (host.endsWith(".eg")) return "EG";
  if (host.endsWith(".com.tr")) return "TR";
  if (host.endsWith(".com.br")) return "BR";
  if (host.endsWith(".cn")) return "CN";
  return "FR";
};

// IMPORTANT: non-async listener, return true immediately for async response
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "NICHES_GET_TOKENS") return;

  (async () => {
    try {
      // Find any open Seller Central tab
      const patterns = SC_HOSTS.map((h) => `https://${h}/*`);
      const tabs = await chrome.tabs.query({ url: patterns });

      if (!tabs.length) {
        sendResponse({ ok: false, error: "Open a Seller Central tab and try again." });
        return;
      }

      const scHost = new URL(tabs[0].url).host; // e.g. sellercentral.amazon.de
      const amzHost = toAmazonHost(scHost);     // e.g. amazon.de

      // Read cookies from both hosts (requires host_permissions for BOTH)
      const [scCookies, baseCookies] = await Promise.all([
        chrome.cookies.getAll({ url: `https://${scHost}/` }),
        chrome.cookies.getAll({ url: `https://${amzHost}/` }),
      ]);

      // Dedupe by name (prefer Seller Central cookie if duplicate)
      const map = new Map();
      for (const c of [...baseCookies, ...scCookies]) map.set(c.name, c.value);
      // Build a single-line cookie header: no spaces, no newlines
const cookie = [...map.entries()]
  .map(([k, v]) => `${k}=${v}`)
  .join(";")               // no space after ;
  .replace(/[\r\n]+/g, ""); // strip accidental line breaks


      const csrf = lastCsrfByHost[scHost] || "";
      const country = hostToCountry(scHost);

      sendResponse({ ok: true, cookie, csrf, country });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  // Keep the message channel open for the async work
  return true;
});
