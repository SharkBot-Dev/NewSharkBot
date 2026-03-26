"use client";

import { Terminal, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DiscordEmbedBuilder from "@/components/EmbedBuilder";
import CollapsibleSection from "@/components/CollapsibleSection";

export default function WelcomeGoodbyeModulePage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 現在ビルダーで編集中のデータ
  const [currentEmbed, setCurrentEmbed] = useState<any>(null);
  // 保存済みの埋め込みリスト
  const [savedEmbeds, setSavedEmbeds] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      try {
        // モジュール有効化チェック
        const statusRes = await fetch(`/api/guilds/${guildId}/modules/isEnabled?module=embed`);
        const statusData = await statusRes.json();
        
        if (!statusData.enabled) {
          alert("このサーバーではモジュールが有効になっていません。");
          router.push(`/dashboard/${guildId}`);
          return;
        }

        // 埋め込みデータの取得
        const res = await fetch(`/api/guilds/${guildId}/modules/embed`);
        const data = await res.json();
        
        if (res.ok) {
          setSavedEmbeds(Object.values(data.settings || {}));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [guildId, router]);

  const handleSave = async () => {
    if (!currentEmbed || !currentEmbed.title) {
      alert("埋め込みのタイトルを入力してください。");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentEmbed), 
      });

      if (response.ok) {
        setSavedEmbeds((prev) => {
          const filtered = prev.filter((e) => e.title !== currentEmbed.title);
          return [...filtered, currentEmbed];
        });
        alert("埋め込みを保存しました！");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleEmbedDelete = async (title: string) => {
    if (!confirm(`埋め込み「${title}」を削除してもよろしいですか？`)) return;

    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        setSavedEmbeds((prev) => prev.filter((e) => e.title !== title));
      } else {
        alert("削除に失敗しました。");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEditClick = (embed: any) => {
    setCurrentEmbed(embed);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">埋め込み作成モジュール</h1>
            <p className="mt-2 text-slate-600">特定のタイトルで埋め込みを保存・管理できます。</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-md"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "現在の埋め込みを保存"}
          </button>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800">エディター</h2>
            </div>
            
            <DiscordEmbedBuilder 
              initialData={currentEmbed} 
              onChange={setCurrentEmbed} 
            />
          </section>

          <CollapsibleSection title={`保存済みの埋め込み (${savedEmbeds.length})`}>
            <div className="mt-4 space-y-3">
              {savedEmbeds.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400">保存された埋め込みはまだありません。</p>
                </div>
              ) : (
                savedEmbeds.map((embed: any) => (
                  <div key={embed.title} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-800 truncate">{embed.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{embed.description || "説明なし"}</p>
                    </div>
                    <div className="flex gap-4 ml-4">
                      <button 
                        onClick={() => handleEmbedDelete(embed.title)}
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

        <p className="mt-10 text-center text-xs text-slate-400">
          ※ 同じタイトルの埋め込みを保存すると、上書きされます。
        </p>
      </div>
    </div>
  );
}