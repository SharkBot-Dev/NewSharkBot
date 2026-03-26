"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { type ModuleSetting, modules as modules_list } from "@/lib/modules";

const ADMIN_PERMISSION = 0x8;

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleSetting[]>(
    Array.from(modules_list.values())
  );

  const groupedModules = useMemo(() => {
    return modules.reduce((acc, mod) => {
      const group = mod.group || "その他";
      if (!acc[group]) acc[group] = [];
      acc[group].push(mod);
      return acc;
    }, {} as Record<string, ModuleSetting[]>);
  }, [modules]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const guildRes = await fetch("/api/discord/guilds");
        if (!guildRes.ok) throw new Error("認証に失敗しました");

        const userGuilds = await guildRes.json();
        const targetGuild = userGuilds.find((g: any) => g.id === guildId);

        const hasPermission =
          targetGuild &&
          (BigInt(targetGuild.permissions) & BigInt(ADMIN_PERMISSION)) ===
            BigInt(ADMIN_PERMISSION);

        if (!hasPermission) {
          alert("このサーバーを管理する権限がありません。");
          router.push("/dashboard");
          return;
        }

        const res = await fetch(`/api/guilds/${guildId}/modules`);
        if (!res.ok) throw new Error("データの取得に失敗しました");

        const data = await res.json();

        if (data.modules) {
          setModules((prev) =>
            prev.map((m) => ({
              ...m,
              enabled: !!data.modules[m.id],
            }))
          );
        }
      } catch (error) {
        console.error("Initialization error:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [guildId, router]);

  const toggleModule = async (moduleId: string) => {
    const target = modules.find((m) => m.id === moduleId);
    if (!target) return;

    const newState = !target.enabled;

    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, enabled: newState } : m))
    );

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, enabled: newState }),
      });

      if (!res.ok) throw new Error("保存失敗");
    } catch {
      alert("設定の保存に失敗しました");
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, enabled: !newState } : m))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">サーバー管理</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">ID: {guildId}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${guildId}`)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← ダッシュボードへ戻る
          </button>
        </div>

        {Object.entries(groupedModules).map(([groupName, items]) => (
          <section key={groupName} className="mb-12">
            <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs mr-3">
                {items.length}
              </span>
              {groupName}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((mod) => (
                <div
                  key={mod.id}
                  className="group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/${guildId}/${mod.id}`)}
                    className="absolute inset-0 z-0 text-left rounded-2xl focus:outline-none"
                    aria-label={`${mod.name}の設定を開く`}
                  />

                  <div className="relative z-10 pointer-events-none mb-4">
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="relative z-20 mt-auto flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModule(mod.id);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        mod.enabled ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                          mod.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}