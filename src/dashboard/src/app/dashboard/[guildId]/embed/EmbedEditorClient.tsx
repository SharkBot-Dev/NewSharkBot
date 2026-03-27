"use client";

import { Terminal, Save } from "lucide-react";
import { useState } from "react";
import DiscordEmbedBuilder from "@/components/EmbedBuilder";
import CollapsibleSection from "@/components/CollapsibleSection";
import { EmbedSetting } from "@/lib/api/requests"; // 型定義

interface Props {
  guildId: string;
  initialEmbeds: EmbedSetting[]; // すでにGoバックエンドから取得済みのリスト
}

export default function EmbedEditorClient({ guildId, initialEmbeds }: Props) {
  const [savedEmbeds, setSavedEmbeds] = useState<EmbedSetting[]>(initialEmbeds);
  const [currentEmbedData, setCurrentEmbedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // 保存処理 (Next.jsのAPI Route /api/guilds/[id]/modules/embed を叩く)
  const handleSave = async () => {
    // Builder側で入力されたタイトルをNameとして扱う
    const name = currentEmbedData?.title;
    if (!name) {
      alert("埋め込みのタイトルを入力してください。");
      return;
    }

    setSaving(true);
    try {
      // 修正したNext.jsのAPI RouteへPOST
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentEmbedData), // Titleを含むEmbed Dict全体を送信
      });

      if (!response.ok) throw new Error("Failed to save");

      // Go側から返ってくる構造に合わせてリストを更新
      const newSetting: EmbedSetting = {
        guild_id: guildId,
        name: name,
        data: currentEmbedData,
      };

      setSavedEmbeds((prev) => {
        const filtered = prev.filter((e) => e.name !== name);
        return [...filtered, newSetting];
      });
      
      alert("埋め込みを保存しました！");
    } catch (error) {
      console.error(error);
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async (name: string, id: string) => {
    if (!confirm(`埋め込み「${name}」を削除してもよろしいですか？`)) return;

    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embed_id: Number(id) }),
      });

      if (response.ok) {
        setSavedEmbeds((prev) => prev.filter((e) => String(e.ID) !== id));
      } else {
        alert("削除に失敗しました。");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "現在の埋め込みを保存"}
        </button>
      </div>

      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">エディター</h2>
        </div>
        
        <DiscordEmbedBuilder 
          initialData={currentEmbedData} 
          onChange={setCurrentEmbedData} 
        />
      </section>

      <CollapsibleSection title={`保存済みの埋め込み (${savedEmbeds.length})`}>
        <div className="mt-4 space-y-3">
          {savedEmbeds.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400">保存されたテンプレートはありません。</p>
            </div>
          ) : (
            savedEmbeds.map((embed) => (
              <div key={embed.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-800 truncate">{embed.name}</h3>
                  <p className="text-xs text-slate-500 truncate">
                    {typeof embed.data.description === 'string' ? embed.data.description : "説明なし"}
                  </p>
                </div>
                <div className="flex gap-4 ml-4">
                  <button 
                    onClick={() => handleDelete(embed.name, String(embed.ID))}
                    className="text-sm font-semibold text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}