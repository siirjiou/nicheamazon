"use client"

import type React from "react"
import { useState, useCallback, useRef,useEffect } from "react"
import type { NicheResult, NicheFilters } from "./types"
import { findNiches, MARKETPLACES } from "./services/api"
import ResultsTable from "./components/ResultsTable"
import LogView from "./components/LogView"

const App: React.FC = () => {
  const [countryCode, setCountryCode] = useState<string>("FR")
  const [marketplaceId, setMarketplaceId] = useState<string>("A13V1IB3VIYZZH")
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [cookie, setCookie] = useState<string>("")
  const [keywords, setKeywords] = useState<string>("")

  const [filters, setFilters] = useState<NicheFilters>({
    minSearchVolume: 360000,
    minGrowthRatio: 0,
    minUnitsSold: 1000,
    minPrice: 20,
    maxReviews: 1000,
  })

  const [results, setResults] = useState<NicheResult[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
// ETA state + live ticker
const [etaAgg, setEtaAgg] = useState<{ total: number; done: number; firstCheckAt: number; endBy: number }>({
  total: 0,
  done: 0,
  firstCheckAt: 0,
  endBy: 0,
})
const [nowTs, setNowTs] = useState(() => Date.now())

useEffect(() => {
  if (etaAgg.endBy <= 0) return
  const id = setInterval(() => setNowTs(Date.now()), 1000)
  return () => clearInterval(id)
}, [etaAgg.endBy])

const remainingMs = Math.max(0, etaAgg.endBy - nowTs)


  const isSearchingRef = useRef(false)

  const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  // 1) append to UI
  setLogs((prev) => [...prev, `[${timestamp}] ${message}`])

  // 2) ETA updates from recognizable lines ---------------------------

  // A) "Found 145 potential niches for "zinc". Analyzing details..."
  {
    const m = message.match(/Found\s+(\d+)\s+potential niches for\s+"[^"]+"/i)
    if (m) {
      const found = Number(m[1] || 0)
      if (found > 0) {
        setEtaAgg((a) => ({ ...a, total: a.total + found }))
      }
      return
    }
  }

  // B) "  - Checking: ..."
  if (/-\s*Checking:/i.test(message)) {
    setEtaAgg((a) => {
      const now = Date.now()
      const firstCheckAt = a.firstCheckAt || now
      const done = a.done + 1
      const elapsed = Math.max(1, now - firstCheckAt) // ms
      const avgPerItem = elapsed / done              // ms per item
      const remaining = Math.max(0, a.total - done)
      const endBy = remaining > 0 ? now + avgPerItem * remaining : 0
      return { ...a, done, firstCheckAt, endBy }
    })
    return
  }

  // C) "Search process finished."
  if (/Search process finished/i.test(message)) {
    setEtaAgg({ total: 0, done: 0, firstCheckAt: 0, endBy: 0 })
    return
  }
}



  // === ETA state + helpers ===
type EtaAgg = {
  total: number;        // total "Checking" items expected across all keywords
  done: number;         // how many "Checking" items processed so far
  firstCheckAt: number; // timestamp when first "Checking" line appeared
  endBy: number;        // predicted finish timestamp (ms since epoch)
};

function formatDuration(ms: number) {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  return `${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
}


  const handleSearch = useCallback(async () => {
    if (isSearchingRef.current) return

    if (!keywords.trim() || !cookie.trim() || !csrfToken.trim()) {
      addLog("Please fill in all required fields: CSRF Token, Cookie, and Keywords.")
      return
    }

    setIsLoading(true)
    isSearchingRef.current = true
    setResults([])
    setLogs([])
    addLog(`Starting search process for ${countryCode} marketplace...`)

    const keywordList = keywords
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean)
    addLog(`Found ${keywordList.length} keywords to process.`)

    try {
      for (const keyword of keywordList) {
        if (!isSearchingRef.current) {
          addLog("Search process was cancelled.")
          break
        }
        await findNiches({
          keyword,
          marketplaceId,
          countryCode,
          csrfToken,
          cookie,
          log: addLog,
          addResult: (result) => setResults((prev) => [...prev, result]),
          filters,
        })
      }
      addLog("Search process finished.")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addLog(`An unexpected error occurred: ${errorMessage}`)
      console.error(error)
    } finally {
      setIsLoading(false)
      isSearchingRef.current = false
    }
  }, [keywords, marketplaceId, countryCode, csrfToken, cookie, filters])

  const handleCancel = () => {
    if (isSearchingRef.current) {
      isSearchingRef.current = false
      setIsLoading(false)
      addLog("Cancelling search...")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Amazon Niche Finder
          </h1>
          <p className="mt-2 text-lg text-gray-400">Discover untapped product opportunities on Amazon.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/60 rounded-2xl p-5 shadow-lg border border-gray-700/40">
              <h2 className="text-xl font-semibold mb-4">Search Settings</h2>

              <label className="block mb-4">
                <span className="block text-sm text-gray-400 mb-1">Country</span>
                <select
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isLoading}
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 mt-1 block">
                  URL: sellercentral.amazon.{countryCode.toLowerCase()}
                </span>
              </label>

              <label className="block mb-4">
                <span className="block text-sm text-gray-400 mb-1">Marketplace ID</span>
                <select
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={marketplaceId}
                  onChange={(e) => setMarketplaceId(e.target.value)}
                  disabled={isLoading}
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mb-4">
                <span className="block text-sm text-gray-400 mb-1">anti-csrftoken-a2z</span>
                <input
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Paste your anti-csrftoken-a2z value"
                  value={csrfToken}
                  onChange={(e) => setCsrfToken(e.target.value)}
                  disabled={isLoading}
                />
              </label>

              <label className="block mb-4">
                <span className="block text-sm text-gray-400 mb-1">Cookie</span>
                <textarea
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Paste your full Seller Central cookie string"
                  rows={4}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  disabled={isLoading}
                />
                <span className="text-xs text-gray-500 mt-1 block">Use one full line; do not wrap in quotes.</span>
              </label>

              <label className="block mb-4">
                <span className="block text-sm text-gray-400 mb-1">Keywords (one per line)</span>
                <textarea
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. bento box&#10;glp-1 patches"
                  rows={6}
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isLoading}
                />
              </label>

              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "Searching…" : "Start Search"}
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  onClick={handleCancel}
                  disabled={!isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-gray-800/60 rounded-2xl p-5 shadow-lg border border-gray-700/40">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>

              <label className="block mb-3">
                <span className="block text-sm text-gray-400 mb-1">Min Search Volume</span>
                <input
                  type="number"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={filters.minSearchVolume}
                  onChange={(e) => setFilters({ ...filters, minSearchVolume: Number(e.target.value) })}
                  disabled={isLoading}
                />
              </label>

              <label className="block mb-3">
                <span className="block text-sm text-gray-400 mb-1">Min Growth Ratio</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={filters.minGrowthRatio}
                  onChange={(e) => setFilters({ ...filters, minGrowthRatio: Number(e.target.value) })}
                  disabled={isLoading}
                />
              </label>

              <label className="block mb-3">
                <span className="block text-sm text-gray-400 mb-1">Min Units Sold</span>
                <input
                  type="number"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={filters.minUnitsSold}
                  onChange={(e) => setFilters({ ...filters, minUnitsSold: Number(e.target.value) })}
                  disabled={isLoading}
                />
              </label>

              <label className="block mb-3">
                <span className="block text-sm text-gray-400 mb-1">Min Price</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                  disabled={isLoading}
                />
              </label>

              <label className="block mb-3">
                <span className="block text-sm text-gray-400 mb-1">Max Reviews</span>
                <input
                  type="number"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={filters.maxReviews}
                  onChange={(e) => setFilters({ ...filters, maxReviews: Number(e.target.value) })}
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* ETA / Progress */}
<div className="bg-gray-800/60 rounded-2xl p-4 shadow-lg border border-gray-700/40 flex items-center gap-4">
  <div><span className="text-sm text-gray-400">Progress</span><div className="font-semibold">{etaAgg.done}/{etaAgg.total}</div></div>
  <div><span className="text-sm text-gray-400">ETA</span><div className="font-semibold">
    {etaAgg.endBy > 0 ? formatDuration(remainingMs) : "—"}
  </div></div>
  {etaAgg.total > 0 && (
    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
      <div
        className="h-full bg-purple-600 transition-[width] duration-300"
        style={{ width: `${Math.min(100, (etaAgg.done / Math.max(1, etaAgg.total)) * 100)}%` }}
      />
    </div>
  )}
</div>

            <LogView logs={logs} />
            <ResultsTable results={results} countryCode={countryCode} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
