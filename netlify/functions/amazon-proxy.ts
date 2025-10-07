// netlify/functions/amazon-proxy.ts
import type { Handler } from "@netlify/functions";

const COUNTRY_DOMAIN_MAP: Record<string, string> = {
  us: "amazon.com",
  fr: "amazon.fr",
  es: "amazon.es",
  it: "amazon.it",
  de: "amazon.de",
  uk: "amazon.co.uk",
  ie: "amazon.co.uk", // Seller Central domain
  nl: "amazon.nl",
  se: "amazon.se",
  pl: "amazon.pl",
  be: "amazon.com.be",
  ca: "amazon.ca",
  mx: "amazon.com.mx",
  jp: "amazon.co.jp",
  au: "amazon.com.au",
  sg: "amazon.sg",
  in: "amazon.in",
  ae: "amazon.ae",
  sa: "amazon.sa",
  eg: "amazon.eg",
  tr: "amazon.com.tr",
  br: "amazon.com.br",
  cn: "amazon.cn",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const headers = event.headers || {};
    // country can come from query ?country=xx or header x-amz-country
    const qsCountry = (event.queryStringParameters?.country || "").toLowerCase();
    const hdrCountry = (headers["x-amz-country"] || headers["X-Amz-Country"] || "").toLowerCase();
    const country = (qsCountry || hdrCountry || "fr").toLowerCase();

    const domain = COUNTRY_DOMAIN_MAP[country] || "amazon.fr";
    const csrf = (headers["x-amz-csrf"] || headers["X-Amz-Csrf"] || "").toString().trim();
    const cookie = (headers["x-amz-cookie"] || headers["X-Amz-Cookie"] || "").toString().trim();

    const body = event.body || "";

    const resp = await fetch(`https://sellercentral.${domain}/ox-api/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        origin: `https://sellercentral.${domain}`,
        referer: `https://sellercentral.${domain}/`,
        "anti-csrftoken-a2z": csrf,
        cookie,
      },
      body,
    });

    const text = await resp.text();
    // Pass through Amazon's response/body
    return {
      statusCode: resp.status,
      headers: { "content-type": "application/json" },
      body: text,
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy failed", details: String(e?.message || e) }),
    };
  }
};

