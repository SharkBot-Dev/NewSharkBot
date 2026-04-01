"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Plus, X, Save } from "lucide-react";
import { updateAuthBlockGuilds } from "@/lib/api/requests";

interface Props {
  guildId: string;
  initialBlockedIds: string[];
}

export default function AuthBlockSettings({ guildId, initialBlockedIds }: Props) {
  const [rawIds, setRawIds] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialBlockedIds && initialBlockedIds.length > 0) {
      setRawIds(initialBlockedIds.join("\n"));
    }
  }, [initialBlockedIds]);

  useEffect(() => {
    if (initialBlockedIds && initialBlockedIds.length > 0) {
      setRawIds(initialBlockedIds.join("\n"));
    }
  }, [initialBlockedIds]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const idList = rawIds
      .split(/\n/)
      .map(id => id.trim())
      .filter(id => id !== "")
      .filter((id, index, self) => self.indexOf(id) === index);

    const invalidIds = idList.filter(id => !/^\d+$/.test(id));
    if (invalidIds.length > 0) {
      alert(`無効なIDが含まれています`);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/auth/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockd_guilds: idList }),
      });

      if (!res.ok) throw new Error();
      alert("ブロックリストを更新しました");
    } catch (error) {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <ShieldAlert size={14} className="text-rose-500" /> Web認証時にブロックするサーバー
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? "保存中..." : "リストを保存"}
        </button>
      </div>

      <p className="text-xs text-black leading-relaxed">
        ここに登録されたサーバーに参加しているユーザーは、Web認証を完了できなくなります。
      </p>

      <div className="flex gap-2">
        <textarea
          value={rawIds}
          onChange={(e) => setRawIds(e.target.value)}
          placeholder={"123456789012345678\n987654321098765432"}
          className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-y text-black"
        />
      </div>
    </div>
  );
}