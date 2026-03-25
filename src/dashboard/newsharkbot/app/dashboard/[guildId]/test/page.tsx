"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function TestModuleSetting() {
  const params = useParams()
  const router = useRouter()
  const guildId = params.guildId as string

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">テストモジュール</h1>
          </div>
          <button 
            onClick={() => router.push(`/dashboard/${guildId}`)}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  )
}