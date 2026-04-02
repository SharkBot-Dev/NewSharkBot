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
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <ShieldQuestion className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">エラーが発生しました。</h2>
        
        <p className="text-red-500 font-medium mb-4">
          {error.message || "予期せぬエラーが発生しました。"}
        </p>

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