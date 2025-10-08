"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { NicheResult, NicheFilters } from "./types"
import { findNiches, MARKETPLACES } from "./services/api"
import ResultsTable from "./components/ResultsTable"
import LogView from "./components/LogView"
import * as XLSX from "xlsx"

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

  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false)
  const [results, setResults] = useState<NicheResult[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // === ETA state + live ticker ===
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

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])

    // A) “Found N potential niches …”
    {
      const m = message.match(/Found\s+(\d+)\s+potential niches for\s+"[^"]+"/i)
      if (m) {
        const found = Number(m[1] || 0)
        if (found > 0) setEtaAgg((a) => ({ ...a, total: a.total + found }))
        return
      }
    }
    // B) “- Checking: …”
    if (/-\s*Checking:/i.test(message)) {
      setEtaAgg((a) => {
        const now = Date.now()
        const firstCheckAt = a.firstCheckAt || now
        const done = a.done + 1
        const elapsed = Math.max(1, now - firstCheckAt)
        const avgPerItem = elapsed / done
        const remaining = Math.max(0, a.total - done)
        const endBy = remaining > 0 ? now + avgPerItem * remaining : 0
        return { ...a, done, firstCheckAt, endBy }
      })
      return
    }
    // C) finished
    if (/Search process finished/i.test(message)) {
      setEtaAgg({ total: 0, done: 0, firstCheckAt: 0, endBy: 0 })
    }
  }, [])

  function formatDuration(ms: number) {
    if (ms <= 0) return "00:00"
    const s = Math.floor(ms / 1000)
    const days = Math.floor(s / 86400)
    const hours = Math.floor((s % 86400) / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (days > 0) return `${days}d ${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
    return `${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
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

    const keywordList = keywords.split("\n").map((k) => k.trim()).filter(Boolean)
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
  }, [keywords, marketplaceId, countryCode, csrfToken, cookie, filters, addLog])

  const handleCancel = () => {
    if (isSearchingRef.current) {
      isSearchingRef.current = false
      setIsLoading(false)
      addLog("Cancelling search...")
    }
  }

  // === Extension autofill ===
  const requestTokensFromExtension = useCallback(() => {
    addLog("Asking extension for Cookie/CSRF…")
    let replied = false
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.data?.type !== "NICHES_TOKENS") return
      replied = true
      window.removeEventListener("message", onMsg)
      if (!e.data.ok) {
        addLog(`Extension error: ${e.data.error || "Unknown error"}`)
        return
      }
      if (e.data.cookie) {
        setCookie(String(e.data.cookie).replace(/[\r\n]+/g, "").replace(/;\s+/g, ";").trim())
      }
      if (e.data.csrf) setCsrfToken(e.data.csrf)
      if (e.data.country) setCountryCode(String(e.data.country).toUpperCase())
      addLog("Auto-filled Cookie/CSRF from extension.")
    }
    window.addEventListener("message", onMsg)
    window.postMessage({ type: "NICHES_REQ_TOKENS" }, window.location.origin)
    setTimeout(() => {
      if (!replied) {
        window.removeEventListener("message", onMsg)
        addLog("No reply from extension. Check extension setup and permissions.")
      }
    }, 2500)
  }, [addLog])

  // === Excel template + upload ===
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const downloadTemplate = useCallback(() => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([["keyword"], ["keyword 1"], ["keyword 2"]])
    XLSX.utils.book_append_sheet(wb, ws, "keywords")
    XLSX.writeFile(wb, "keywords_template.xlsx")
    addLog("Downloaded keywords_template.xlsx")
  }, [addLog])

  const onExcelSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const firstSheet = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheet]
      const rows = XLSX.utils.sheet_to_json<{ keyword?: string }>(ws, { defval: "" })
      const list = rows.map(r => String(r.keyword ?? "").trim()).filter(Boolean)
      if (list.length === 0) {
        addLog('No keywords found. Put them under a column named "keyword".')
        return
      }
      setKeywords(list.join("\n"))
      addLog(`Loaded ${list.length} keywords from "${file.name}".`)
      e.currentTarget.value = ""
    } catch (err) {
      addLog(`Failed to read Excel: ${err instanceof Error ? err.message : String(err)}`)
      console.error(err)
    }
  }, [addLog])

  // === Slide-in Filters Panel ===
  const FilterPanel = () => (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isFiltersVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsFiltersVisible(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isFiltersVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Filters</h2>
            <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
            <label className="block">
              <span className="block text-sm text-gray-400 mb-1">Min Search Volume</span>
              <input
                type="number"
                className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.minSearchVolume}
                onChange={(e) => setFilters({ ...filters, minSearchVolume: Number(e.target.value) })}
                disabled={isLoading}
              />
            </label>

            <label className="block">
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

            <label className="block">
              <span className="block text-sm text-gray-400 mb-1">Min Units Sold</span>
              <input
                type="number"
                className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.minUnitsSold}
                onChange={(e) => setFilters({ ...filters, minUnitsSold: Number(e.target.value) })}
                disabled={isLoading}
              />
            </label>

            <label className="block">
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

            <label className="block">
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

          <button
            onClick={() => setIsFiltersVisible(false)}
            className="mt-6 w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )

  const exportResults = useCallback(() => {
  if (!results.length) {
    addLog("No results to export.");
    return;
  }

  // Make values export-safe (flatten objects/arrays to JSON strings)
  const rows = results.map((r) => {
    const obj = r as any;
    const out: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      out[k] = (v !== null && typeof v === "object") ? JSON.stringify(v) : v;
    });
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "results");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `niches_results_${countryCode}_${stamp}.xlsx`;

  XLSX.writeFile(wb, filename);
  addLog(`Exported ${results.length} rows to "${filename}".`);
}, [results, countryCode, addLog]);


  // === Layout ===
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex">
      <FilterPanel />

      {/* LEFT SIDEBAR (pushed left, fixed width) */}
      <aside className="w-[450px] flex-shrink-0 bg-gray-800/60 p-6 h-screen overflow-y-auto border-r border-gray-700/40">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Amazon Niche Finder
          </h1>
          <p className="mt-1 text-md text-gray-400">Discover untapped opportunities.</p>
        </header>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2 text-white">Search Settings</h2>

          <label className="block">
            <span className="block text-sm text-gray-400 mb-1">Country</span>
            <select
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isLoading}
            >
              {MARKETPLACES.map((m) => (
                <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm text-gray-400 mb-1">Marketplace ID</span>
            <select
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={marketplaceId}
              onChange={(e) => setMarketplaceId(e.target.value)}
              disabled={isLoading}
            >
              {MARKETPLACES.map((m) => (
                <option key={m.id} value={m.id}>{m.code} — {m.id}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm text-gray-400 mb-1">anti-csrftoken-a2z</span>
            <input
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Paste your anti-csrftoken-a2z"
              value={csrfToken}
              onChange={(e) => setCsrfToken(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-400 mb-1">Cookie</span>
            <textarea
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              placeholder="Paste your full cookie string"
              rows={3}
              wrap="off"
              spellCheck={false}
              style={{ overflowX: "auto", whiteSpace: "pre" }}
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              onBlur={(e) => setCookie(e.target.value.replace(/[\r\n]+/g, "").replace(/;\s+/g, ";").trim())}
              disabled={isLoading}
            />
          </label>

          <button
            type="button"
            className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            onClick={requestTokensFromExtension}
            disabled={isLoading}
          >
            Auto-fill from extension
          </button>

          <label className="block pt-4">
            <span className="block text-sm text-gray-400 mb-2">Keywords (one per line)</span>

            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                onClick={downloadTemplate}
                disabled={isLoading}
              >
                Download Template
              </button>

              <button
                type="button"
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Upload Excel
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={onExcelSelect}
              />
            </div>

            <textarea
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={`keyword 1\nkeyword 2\nkeyword 3`}
              rows={6}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <div className="flex items-center gap-3 pt-4">
            <button
              className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "Searching…" : "Start Search"}
            </button>

            <button
              className="px-4 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 transition-colors font-semibold"
              onClick={() => setIsFiltersVisible(true)}
              disabled={isLoading}
            >
              Filters
            </button>

            <button
              className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              onClick={handleCancel}
              disabled={!isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT: BIG Content area (no horizontal swipe) */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="w-full mx-auto space-y-8">
          {/* ETA / Progress */}
          <div className="bg-gray-800/60 rounded-2xl p-4 shadow-lg border border-gray-700/40 flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-400">Progress</span>
              <div className="text-lg font-semibold">{etaAgg.done} / {etaAgg.total}</div>
            </div>
            <div>
              <span className="text-sm text-gray-400">ETA</span>
              <div className="text-lg font-semibold">{etaAgg.endBy > 0 ? formatDuration(remainingMs) : "—"}</div>
            </div>
            {etaAgg.total > 0 && (
              <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, (etaAgg.done / Math.max(1, etaAgg.total)) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Logs */}
          <LogView logs={logs} />

          {/* Results */}
          <div className="flex items-center justify-end">
  <button
    onClick={exportResults}
    disabled={!results.length || isLoading}
    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
  >
    Export results
  </button>
</div>
          <ResultsTable results={results} countryCode={countryCode} />
        </div>
      </main>
    </div>
  )
}

export default App
