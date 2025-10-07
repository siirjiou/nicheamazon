import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

const COUNTRY_DOMAINS: Record<string, string> = {
  US: "amazon.com",
  FR: "amazon.fr",
  ES: "amazon.es",
  IT: "amazon.it",
  DE: "amazon.de",
  UK: "amazon.co.uk",
  IE: "amazon.co.uk",
  NL: "amazon.nl",
  SE: "amazon.se",
  PL: "amazon.pl",
  BE: "amazon.com.be",
  CA: "amazon.ca",
  MX: "amazon.com.mx",
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "")

  const AMAZON_SC_COOKIE = (env.AMAZON_SC_COOKIE || "").trim()
  const AMAZON_SC_CSRF = (env.AMAZON_SC_CSRF || "").trim()

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api/ox": {
          target: "https://sellercentral.amazon.fr", // Default fallback
          changeOrigin: true,
          secure: true,
          rewrite: (p: string) => p.replace(/^\/api\/ox/, "/ox-api/graphql"),
          router: (req: any) => {
            const countryCode = (req.headers["x-amz-country"] || "FR").toString().toUpperCase()
            const domain = COUNTRY_DOMAINS[countryCode] || "amazon.fr"
            console.log(`[v0] Routing request to: https://sellercentral.${domain}`)
            return `https://sellercentral.${domain}`
          },
          configure: (proxy: any) => {
            proxy.on("proxyReq", (proxyReq: any, req: any) => {
              const countryCode = (req.headers["x-amz-country"] || "FR").toString().toUpperCase()
              const domain = COUNTRY_DOMAINS[countryCode] || "amazon.fr"
              const baseUrl = `https://sellercentral.${domain}`

              proxyReq.setHeader("Origin", baseUrl)
              proxyReq.setHeader("Referer", `${baseUrl}/opportunity-explorer/search`)
              proxyReq.setHeader("Accept", "application/graphql+json, application/json")
              proxyReq.setHeader("Content-Type", "application/json")
              proxyReq.setHeader("User-Agent", "Mozilla/5.0")
              proxyReq.setHeader("Accept-Language", "en-US,en;q=0.9,fr;q=0.8")
              proxyReq.setHeader("Sec-Fetch-Site", "same-origin")
              proxyReq.setHeader("Sec-Fetch-Mode", "cors")
              proxyReq.setHeader("Sec-Fetch-Dest", "empty")

              const dynCsrf = (req.headers["x-amz-csrf"] || "").toString().trim()
              const dynCookie = (req.headers["x-amz-cookie"] || "").toString().trim()

              if (dynCsrf) proxyReq.setHeader("anti-csrftoken-a2z", dynCsrf)
              if (dynCookie) proxyReq.setHeader("Cookie", dynCookie)

              if (!dynCsrf && AMAZON_SC_CSRF) proxyReq.setHeader("anti-csrftoken-a2z", AMAZON_SC_CSRF)
              if (!dynCookie && AMAZON_SC_COOKIE) proxyReq.setHeader("Cookie", AMAZON_SC_COOKIE)
            })
          },
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  }
})
