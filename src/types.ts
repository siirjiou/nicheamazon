export interface NicheResult {
  nicheId: string
  nicheTitle: string
  totalSearchVolumes: number
  growthPercentage: number
  totalUnitsSold: number
  avgPrice: number
  avgReviewsNumber: number
  newProductsLaunched: number
  successfulProductsLaunched: number
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

export interface NicheFilters {
  minSearchVolume: number
  minGrowthRatio: number
  minUnitsSold: number
  minPrice: number
  maxReviews: number
}
