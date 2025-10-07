"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface LogViewProps {
  logs: string[]
}

const LogView: React.FC<LogViewProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-purple-300 mb-4">Process Log</h3>
      <div
        ref={logContainerRef}
        className="h-64 bg-black/50 p-4 rounded-md overflow-y-auto font-mono text-sm text-gray-300 border border-gray-700"
      >
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            <span className={log.startsWith("✅") ? "text-green-400" : ""}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LogView
