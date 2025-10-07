import type React from "react"
import type { NicheResult } from "../types"

interface ResultsTableProps {
  results: NicheResult[]
  countryCode: string // Added countryCode prop for link generation
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, countryCode }) => {
  if (results.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-bold text-purple-300">Results</h3>
        <p className="mt-2 text-gray-400">
          No promising niches found yet. Results will appear here once they meet the criteria.
        </p>
      </div>
    )
  }

  const getAmazonDomain = (code: string) => {
    const domainMap: Record<string, string> = {
      US: "com",
      UK: "co.uk",
      CA: "ca",
      MX: "com.mx",
      BE: "com.be",
      FR: "fr",
      DE: "de",
      IT: "it",
      ES: "es",
      NL: "nl",
      SE: "se",
      PL: "pl",
      IE: "ie",
    }
    return domainMap[code] || code.toLowerCase()
  }

  return (
    <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg">
      <h3 className="text-xl sm:text-2xl font-bold text-purple-300 mb-4 px-2 sm:px-0">
        Promising Niches Found ({results.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Niche Title
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Search Vol (360d)
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Growth (180d)
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Units Sold (360d)
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Avg Price
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Avg Reviews
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                New Launches
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Successful Launches
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Link
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {results.map((result) => {
              const nicheLink = `https://sellercentral.amazon.${getAmazonDomain(countryCode)}/opportunity-explorer/explore/niche/${result.nicheId}/launch-potential`

              return (
                <tr key={result.nicheId} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {result.nicheTitle}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {result.totalSearchVolumes.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-400">
                    {result.growthPercentage.toFixed(2)}%
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {result.totalUnitsSold.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${result.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {result.avgReviewsNumber.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {result.newProductsLaunched.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {result.successfulProductsLaunched.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={nicheLink}
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
