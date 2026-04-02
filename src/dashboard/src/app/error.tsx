'use client'

import { ShieldQuestion, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <ShieldQuestion className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">エラーが発生しました。</h2>
        
        <p className="text-red-500 font-medium mb-4">
          {error.message || "予期せぬエラーが発生しました。"}
        </p>

        <div className="mb-6 text-left">
          <button 
            onClick={() => setShowDetail(!showDetail)}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mx-auto"
          >
            {showDetail ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            エラーの詳細を表示
          </button>

          {showDetail && (
            <pre className="mt-4 p-4 bg-slate-100 rounded-lg text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-indigo-500 px-6 py-2 text-white hover:bg-indigo-600 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  )
}