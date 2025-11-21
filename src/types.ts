// types.ts
export interface NicheResult {
  nicheId: string
  nicheTitle: string

  // Demand / growth
  totalSearchVolumes: number
  growthPercentage: number // from 180d growth (%)
  growthYoYPercentage: number // from searchVolumeGrowthT360 (%)
  totalUnitsSold: number

  // Pricing / reviews (global)
  avgPrice: number
  avgReviewsNumber: number

  // Launch metrics
  newProductsLaunched: number
  successfulProductsLaunched: number

  // Competition / structure metrics
  productCount: number
  top5ClickShare: number // percentage (0–100)
  top5BrandShare: number // percentage (0–100)
  avgRatingTop15: number
  avgReviewCountTop15: number
  brandDominance: boolean
  sellingPartnerCount: number
  avgTopSellerRank: number

  // Top 5 competitors
  topAsins: string[]
  topBrands: string[]

  // Composite score
  score: number

  // Direct link to the niche page
  nicheUrl: string
}

export interface NicheFilters {
  // Demand / price
  minSearchVolume: number
  minGrowthRatio: number // 180d ratio (0.05 = 5%)
  minGrowthYoY?: number // YoY growth in %, from searchVolumeGrowthT360
  minUnitsSold: number
  minPrice: number
  maxPrice?: number
  maxReviews: number

  // Competition
  maxProductCount?: number
  maxTop5ClickShare?: number
  maxTop5BrandShare?: number
  maxAvgRatingTop15?: number
  maxAvgReviewCountTop15?: number
  excludeBrandDominance?: boolean
}

export interface FindNichesParams {
  keyword: string
  marketplaceId: string
  countryCode: string
  csrfToken: string
  cookie: string
  log: (message: string) => void
  addResult: (result: NicheResult) => void
  filters: NicheFilters
}

