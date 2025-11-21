// components/ResultsTable.tsx
import type React from "react"
import type { NicheResult } from "../types"

interface ResultsTableProps {
  results: NicheResult[]
  countryCode: string
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-bold text-purple-300">Results</h3>
        <p className="mt-2 text-gray-400">
          No promising niches found yet. Results will appear here once they meet
          the criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg">
      <h3 className="text-xl sm:text-2xl font-bold text-purple-300 mb-4 px-2 sm:px-0">
        Promising Niches Found ({results.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead className="bg-gray-700/50">
            <tr>
              {/* Core metrics */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Niche Title
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Search Vol (360d)
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Growth (180d)
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Growth YoY
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Units Sold (360d)
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avg Reviews
              </th>

              {/* Competition columns */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Product Count
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top 5 Click Share
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top 5 Brand Share
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avg Rating (Top 15)
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avg Reviews (Top 15)
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Brand Dominance
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Selling Partners
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avg Top Seller Rank
              </th>

              {/* Launch metrics */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                New Launches
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Successful Launches
              </th>

              {/* Top 5 ASINs / Brands */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top ASIN 1
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top ASIN 2
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top ASIN 3
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top ASIN 4
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top ASIN 5
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top Brand 1
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top Brand 2
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top Brand 3
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top Brand 4
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Top Brand 5
              </th>

              {/* Score + link */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Score
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Link
              </th>
            </tr>
          </thead>

          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {results.map((result) => {
              return (
                <tr
                  key={result.nicheId}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                    {result.nicheTitle}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.totalSearchVolumes.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-green-400">
                    {result.growthPercentage.toFixed(2)}%
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-green-400">
                    {result.growthYoYPercentage.toFixed(1)}%
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.totalUnitsSold.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    ${result.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.avgReviewsNumber.toLocaleString()}
                  </td>

                  {/* Competition columns */}
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.productCount.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.top5ClickShare.toFixed(1)}%
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.top5BrandShare.toFixed(1)}%
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.avgRatingTop15.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {Math.round(result.avgReviewCountTop15).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.brandDominance ? "Yes" : "No"}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.sellingPartnerCount.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {Math.round(result.avgTopSellerRank).toLocaleString()}
                  </td>

                  {/* Launch metrics */}
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.newProductsLaunched.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.successfulProductsLaunched.toLocaleString()}
                  </td>

                  {/* Top 5 ASINs */}
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topAsins[0] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topAsins[1] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topAsins[2] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topAsins[3] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topAsins[4] || ""}
                  </td>

                  {/* Top 5 Brands */}
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topBrands[0] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topBrands[1] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topBrands[2] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topBrands[3] || ""}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300 max-w-[160px] truncate">
                    {result.topBrands[4] || ""}
                  </td>

                  {/* Score + Link */}
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-300">
                    {result.score.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <a
                      href={result.nicheUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResultsTable

