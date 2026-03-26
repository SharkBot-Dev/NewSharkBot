"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { EmbedSetting } from "@/lib/api/requests"; 

interface Props {
  guildId: string;
  value?: string | number | null; // ID(number) または 未選択(null/empty)
  onChange?: (val: string) => void; 
}

export default function EmbedSelecter({ guildId, value, onChange }: Props) {
  const [embeds, setEmbeds] = useState<EmbedSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbeds = useCallback(async () => {
    if (!guildId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("データの取得に失敗しました");

      const data = await res.json();
      setEmbeds(data.settings || []);
    } catch (err) {
      console.error("Failed to fetch embeds:", err);
      setError("埋め込み一覧を読み込めませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchEmbeds();
  }, [fetchEmbeds]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <select
          value={value === null ? "" : String(value)}
          onChange={handleChange}
          disabled={isLoading || (embeds.length === 0 && !isLoading)}
          className={`
            w-full rounded-lg border border-slate-200 bg-white py-2 px-3 shadow-sm 
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
            sm:text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 
            disabled:cursor-not-allowed transition-all appearance-none
          `}
        >
          {isLoading ? (
            <option value="">読み込み中...</option>
          ) : (
            <>
              <option value="">
                {embeds.length === 0 ? "作成済みの埋め込みがありません" : "埋め込みを使用しない"}
              </option>
              {embeds.map((embed) => (
                <option key={embed.ID} value={String(embed.ID)}>
                  {embed.name}
                </option>
              ))}
            </>
          )}
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      
      {error ? (
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
          <button 
            onClick={() => fetchEmbeds()} 
            className="text-[10px] text-indigo-600 hover:underline font-bold"
          >
            再試行
          </button>
        </div>
      ) : embeds.length === 0 && !isLoading ? (
        <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
          まだ埋め込みが作成されていません。「埋め込み作成」から埋め込みを作成してください。
        </p>
      ) : null}
    </div>
  );
}