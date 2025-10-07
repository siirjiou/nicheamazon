// app/api/ox/route.ts
import { NextRequest, NextResponse } from "next/server"

const COUNTRY_DOMAIN_MAP: Record<string, string> = {
  us: "amazon.com",
  fr: "amazon.fr",
  es: "amazon.es",
  it: "amazon.it",
  de: "amazon.de",
  uk: "amazon.co.uk",
  ie: "amazon.co.uk",
  nl: "amazon.nl",
  se: "amazon.se",
  pl: "amazon.pl",
  be: "amazon.com.be",
  ca: "amazon.ca",
  mx: "amazon.com.mx",
}

export async function POST(req: NextRequest) {
  try {
    // headers coming from your client
    const csrf = req.headers.get("x-amz-csrf") || ""
    const cookie = req.headers.get("x-amz-cookie") || ""
    const countryHeader = (req.headers.get("x-amz-country") || "fr").toLowerCase()
    const domain = COUNTRY_DOMAIN_MAP[countryHeader] || "amazon.fr"

    const body = await req.text() // pass-through JSON

    const resp = await fetch(`https://sellercentral.${domain}/ox-api/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "origin": `https://sellercentral.${domain}`,
        "referer": `https://sellercentral.${domain}/`,
        "anti-csrftoken-a2z": csrf,
        "cookie": cookie,
      },
      body,
    })

    const text = await resp.text()
    return new NextResponse(text, {
      status: resp.status,
      headers: { "content-type": "application/json" },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: "Proxy request failed", details: String(e?.message || e) },
      { status: 500 }
    )
  }
}
