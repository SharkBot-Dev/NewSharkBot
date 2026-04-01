'use client'

import { ShieldQuestion } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)
  return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <ShieldQuestion className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">エラーが発生しました。</h2>
          <p className="text-slate-600 mb-8">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
            >
              再試行
            </button>
          </p>
        </div>
      </div>
  )
}