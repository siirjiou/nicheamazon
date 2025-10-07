import type { NicheResult, FindNichesParams } from "../types"

export const MARKETPLACES = [
  // North America
  { code: "US", name: "United States", label: "US — United States", id: "ATVPDKIKX0DER" },
  { code: "CA", name: "Canada", label: "CA — Canada", id: "A2EUQ1WTGCTBG2" },
  { code: "MX", name: "Mexico", label: "MX — Mexico", id: "A1AM78C64UM0Y8" },

  // Europe
  { code: "UK", name: "United Kingdom", label: "UK — United Kingdom", id: "A1F83G8C2ARO7P" },
  { code: "IE", name: "Ireland", label: "IE — Ireland", id: "A28R8C7NBKEWEA" },
  { code: "DE", name: "Germany", label: "DE — Germany", id: "A1PA6795UKMFR9" },
  { code: "FR", name: "France", label: "FR — France", id: "A13V1IB3VIYZZH" },
  { code: "IT", name: "Italy", label: "IT — Italy", id: "APJ6JRA9NG5V4" },
  { code: "ES", name: "Spain", label: "ES — Spain", id: "A1RKKUPIHCS9HS" },
  { code: "NL", name: "Netherlands", label: "NL — Netherlands", id: "A1805IZSGTT6HS" },
  { code: "SE", name: "Sweden", label: "SE — Sweden", id: "A2NODRKZP88ZB9" },
  { code: "PL", name: "Poland", label: "PL — Poland", id: "A1C3SOZRARQ6R3" },
  { code: "BE", name: "Belgium", label: "BE — Belgium", id: "AMEN7PMS3EDWL" },

  // Middle East
  { code: "AE", name: "United Arab Emirates", label: "AE — United Arab Emirates", id: "A2VIGQ35RCS4UG" },
  { code: "SA", name: "Saudi Arabia", label: "SA — Saudi Arabia", id: "A17E79C6D8DWNP" },
  { code: "EG", name: "Egypt", label: "EG — Egypt", id: "ARBP9OOSHTCHU" },
  { code: "TR", name: "Turkey", label: "TR — Turkey", id: "A33AVAJ2PDY3EV" },

  // Asia-Pacific
  { code: "JP", name: "Japan", label: "JP — Japan", id: "A1VC38T7YXB528" },
  { code: "AU", name: "Australia", label: "AU — Australia", id: "A39IBJ37TRP1C6" },
  { code: "SG", name: "Singapore", label: "SG — Singapore", id: "A19VAU5U5O7RUS" },
  { code: "IN", name: "India", label: "IN — India", id: "A21TJRUUN4KGV" },

  // South America
  { code: "BR", name: "Brazil", label: "BR — Brazil", id: "A2Q3Y263D00KWC" },

  // Additional
  { code: "CN", name: "China", label: "CN — China", id: "AAHKV2X7AFYLW" },
]


// const API_PROXY = "/api/ox"
const API_PROXY = "/api/ox"


const GET_NICHES_QUERY = `
query getNiches($filter: NicheFilter!, $useNewQuery: Boolean, $searchImprovementsEnabled: Boolean) {
  niches(
    filter: $filter
    useNewQuery: $useNewQuery
    searchImprovementsEnabled: $searchImprovementsEnabled
  ) {
    nicheId
    obfuscatedMarketplaceId
    nicheTitle
    nicheSummary {
      searchVolumeT360
      searchVolumeGrowthT180
      maximumAverageUnitsSoldT360
      avgPriceT360
      __typename
    }
    __typename
  }
}`

const GET_NICHE_DETAILS_QUERY = `
query getNicheWithPurchaseDrivers($nicheInput: NicheInput!) {
  niche(request: $nicheInput) {
    launchPotential {
      avgReviewCount { currentValue }
      newProductsLaunchedT360 { currentValue }
      successfulLaunchesT360 { currentValue }
    }
  }
}`

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const randomUniform = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

async function postWithRetry<T>(
  data: object,
  log: (msg: string) => void,
  perRequestHeaders: { csrfToken?: string; cookie?: string; countryCode?: string },
  maxRetries = 3,
): Promise<T> {
  let lastErr: unknown

  const extraHeaders: HeadersInit = {}
  if (perRequestHeaders?.csrfToken) extraHeaders["x-amz-csrf"] = perRequestHeaders.csrfToken.trim()
  if (perRequestHeaders?.cookie) extraHeaders["x-amz-cookie"] = perRequestHeaders.cookie.trim()
  if (perRequestHeaders?.countryCode) extraHeaders["x-amz-country"] = perRequestHeaders.countryCode.trim()

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log("[v0] Making request to:", API_PROXY, "with country:", perRequestHeaders?.countryCode)
      const url = API_PROXY
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...extraHeaders, // includes x-amz-csrf, x-amz-cookie, x-amz-country if present
  },
  body: JSON.stringify(data),
})


      console.log("[v0] Response status:", res.status, "Content-Type:", res.headers.get("content-type"))

      if (res.status === 429) {
        const waitTime = 15000 + attempt * 15000
        log(`Rate limit hit (attempt ${attempt + 1}), waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.log("[v0] Error response body:", text.substring(0, 200))
        throw new Error(`Request failed with status ${res.status}: ${text}`)
      }

      const jsonResponse = await res.json()
      if (jsonResponse?.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(jsonResponse.errors)}`)
      }
      return jsonResponse as T
    } catch (error) {
      lastErr = error
      console.error("[v0] Request error:", error)
      if (attempt === maxRetries - 1) break
      log(`Request failed (attempt ${attempt + 1}). Retrying...`)
      await delay(2000 + attempt * 1000)
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Failed after all retries.")
}

export const findNiches = async (params: FindNichesParams): Promise<void> => {
  const { keyword, marketplaceId, countryCode, csrfToken, cookie, log, addResult, filters } = params

  log(`Processing keyword: "${keyword}" for ${countryCode} marketplace`)
  console.log("[v0] findNiches called with countryCode:", countryCode)

  const nichesData = {
    query: GET_NICHES_QUERY,
    operationName: "getNiches",
    variables: {
      filter: {
        obfuscatedMarketplaceId: marketplaceId,
        rangeFilters: [],
        multiSelectFilters: [],
        searchTermsFilter: { searchInput: keyword },
      },
      useNewQuery: true,
      searchImprovementsEnabled: true,
    },
  }

  try {
    const nichesResponse = await postWithRetry<{ data?: { niches: any[] } }>(nichesData, log, {
      csrfToken,
      cookie,
      countryCode,
    })

    const niches = nichesResponse.data?.niches || []

    if (niches.length === 0) {
      log(`No niches found for "${keyword}"`)
      return
    }

    log(`Found ${niches.length} potential niches for "${keyword}". Analyzing details...`)

    for (const niche of niches) {
      const nicheId = niche.nicheId
      const nicheTitle = niche.nicheTitle
      const summary = niche.nicheSummary

      await delay(randomUniform(1500, 3500))

      const detailData = {
        query: GET_NICHE_DETAILS_QUERY,
        operationName: "getNicheWithPurchaseDrivers",
        variables: {
          nicheInput: {
            nicheId,
            obfuscatedMarketplaceId: marketplaceId,
          },
        },
      }

      const detailResponse = await postWithRetry<{
        data?: { niche?: { launchPotential?: any } }
      }>(detailData, log, { csrfToken, cookie, countryCode })

      const launchPotential = detailResponse.data?.niche?.launchPotential

      if (!launchPotential) {
        log(`Skipping niche "${nicheTitle}" due to missing launch data.`)
        continue
      }

      const total_search_volumes = Number(summary?.searchVolumeT360 ?? 0)
      const growth_ratio = Number(summary?.searchVolumeGrowthT180 ?? 0)
      const total_units_sold = Number(summary?.maximumAverageUnitsSoldT360 ?? 0)
      const avg_price = Number(summary?.avgPriceT360 ?? 0)
      const avg_reviews_number = Number(launchPotential?.avgReviewCount?.currentValue ?? 0)
      const new_products_launched = Number(launchPotential?.newProductsLaunchedT360?.currentValue ?? 0)
      const successful_products_launched = Number(launchPotential?.successfulLaunchesT360?.currentValue ?? 0)

      log(`  - Checking: "${nicheTitle}" (Reviews: ${avg_reviews_number}, Price: ${avg_price.toFixed(2)})`)

      if (
        total_search_volumes >= filters.minSearchVolume &&
        growth_ratio > filters.minGrowthRatio &&
        total_units_sold >= filters.minUnitsSold &&
        avg_price >= filters.minPrice &&
        avg_reviews_number <= filters.maxReviews
      ) {
        const growth_percentage = growth_ratio * 100
        log(`✅ Found a promising niche: "${nicheTitle}"`)
        const result: NicheResult = {
          nicheId,
          nicheTitle,
          totalSearchVolumes: total_search_volumes,
          growthPercentage: growth_percentage,
          totalUnitsSold: total_units_sold,
          avgPrice: avg_price,
          avgReviewsNumber: avg_reviews_number,
          newProductsLaunched: new_products_launched,
          successfulProductsLaunched: successful_products_launched,
        }
        addResult(result)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`Error processing keyword "${keyword}": ${errorMessage}`)
    console.error(`Error for keyword ${keyword}:`, error)
  }

  await delay(randomChoice([3000, 6000, 8000, 9000]))
}
