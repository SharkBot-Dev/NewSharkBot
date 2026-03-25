"use client"

import { useEffect, useState } from "react"

const ADMIN_PERMISSION = 0x8;

export default function Client() {
  const [guilds, setGuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/discord/guilds")
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((g: any) => 
          (BigInt(g.permissions) & BigInt(ADMIN_PERMISSION)) === BigInt(ADMIN_PERMISSION)
        );
        setGuilds(filtered)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">サーバー選択</h1>
          <p className="text-sm text-slate-500 mt-2">管理するサーバーを選んでください</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <ul className="grid gap-4">
            {guilds.length > 0 ? (
              guilds.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => (window.location.href = `/dashboard/${g.id}`)}
                    className="w-full flex items-center p-4 rounded-2xl border bg-white border-slate-200 shadow-sm active:scale-[0.98] hover:border-indigo-300 transition-all duration-200"
                  >
                    <div className="relative flex-shrink-0">
                      {g.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                          alt={g.name}
                          className="w-12 h-12 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                          {g.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 text-left flex-grow">
                      <p className="font-bold text-slate-800 line-clamp-1">{g.name}</p>
                      <p className="text-xs text-indigo-600">管理可能</p>
                    </div>

                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                管理可能なサーバーが見つかりませんでした。
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}