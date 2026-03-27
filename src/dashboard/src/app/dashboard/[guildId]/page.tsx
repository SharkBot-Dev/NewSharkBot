import { Suspense } from "react";
import { redirect } from "next/navigation";
import { modules as modules_list } from "@/lib/modules";
import ModuleCard from "@/components/ModuleCard";
import { fetchGuildSettings } from "@/lib/api/requests";
import ModuleList from "./client";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default async function DashboardPage({ params }: { params: { guildId: string } }) {
  const { guildId } = await params; 

  const dataPromise = fetchGuildSettings(guildId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">サーバー管理</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">ID: {guildId}</p>
          </div>
        </header>

        <Suspense fallback={<LoadingSkeleton />}>
          <ModuleListWrapper guildId={guildId} dataPromise={dataPromise} />
        </Suspense>
      </div>
    </div>
  );
}

async function ModuleListWrapper({ guildId, dataPromise }: { guildId: string, dataPromise: Promise<any | null> }) {
  const data = await dataPromise;
  
  if (!data) {
    redirect("/dashboard");
  }

  const initialModules = Array.from(modules_list.values()).map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    group: m.group,
    enabled: !!(data.EnabledModules && data.EnabledModules[m.id])
  }));

  return (
    <ModuleList 
      guildId={guildId} 
      initialModules={initialModules} 
    />
  );
}