"use client";

import { BotIcon, Home, HomeIcon, Menu, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { modules as modules_list } from "@/lib/modules";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      setLoading(true);
      try {
        const res = await fetch(`/api/discord/guild/${guildId}`);
        if (!res.ok) {
          alert("Botを導入する画面にリダイレクトします。");
          window.location.href = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot+applications.commands`;
          return;
        }
      } catch (error) {
        console.error("Error checking permission:", error);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [guildId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const navigation = [
    {
      category: "メイン",
      items: [{ name: "ホーム", href: `/dashboard/${guildId}`, icon: HomeIcon }],
    },
  ];

  const groupedModules: Record<string, any[]> = {};

  modules_list.forEach((m) => {
    const groupName = m.group || "その他";
    if (!groupedModules[groupName]) {
      groupedModules[groupName] = [];
    }
    groupedModules[groupName].push({
      name: m.name,
      href: `/dashboard/${guildId}/${m.id}`,
      icon: m.icon || ShieldQuestion,
    });
  });

  Object.entries(groupedModules).forEach(([category, items]) => {
    navigation.push({ category, items });
  });

  const NavItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-indigo-50 text-indigo-600 shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <item.icon
          className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
          transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col h-full
        `}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 px-2 mb-10 shrink-0">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BotIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              SharkBot
            </span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            <p className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            {navigation.map((category) => (
              <div key={category.category}>
                <p className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                  {category.category}
                </p>
                {category.items.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-100 shrink-0 mt-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Home className="h-5 w-5" />
              サーバー選択に戻る
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-slate-900 text-sm">
            管理ダッシュボード
          </span>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none bg-slate-50">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}