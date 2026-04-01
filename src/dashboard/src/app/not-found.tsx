'use client'

import { ShieldQuestion } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <ShieldQuestion className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">ページが見つかりません。</h2>
          <p className="text-slate-600 mb-8">
            <a href="/">トップに戻る</a>
          </p>
        </div>
      </div>
  )
}