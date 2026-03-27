"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";

interface Props {
  guildId: string;
  type_id?: number | null;
  value?: string;
  onChange?: (channelId: string) => void; 
}

export default function RoleSelector({ guildId, type_id, value, onChange }: Props) {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (!guildId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/guilds/${guildId}/roles`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("データの取得に失敗しました");

      const data: any[] = await res.json();

      if (Array.isArray(data)) {
        const filtered = (type_id === undefined || type_id === null)
          ? data
          : data.filter((channel) => channel.type === type_id);
        
        setRoles(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setError("ロール一覧を読み込めませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [guildId, type_id]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="w-full">
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={isLoading || roles.length === 0}
        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          {isLoading ? "読み込み中..." : "ロールを選択してください"}
        </option>
        
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            @{role.name}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}