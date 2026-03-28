import { Suspense } from "react";
import { getEconomyItems, getEconomySetting, isModuleEnabled } from "@/lib/api/requests";
import EconomyEditorClient from "./EconomyEditorClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function EconomyPafe({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "economy");

    if (!data.enabled) {
      return <Alert text="経済モジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">経済モジュール</h1>
          <p className="mt-2 text-slate-600">経済を使ってコミュニティを活性化できます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <EconomyContent guildId={guildId} />
        </Suspense>

        <p className="mt-10 text-center text-xs text-slate-400">
          ※ 同じ名前のアイテムを保存すると、上書きされます。
        </p>
      </div>
    </div>
  );
}

async function EconomyContent({ guildId }: { guildId: string }) {
  let items = [];

  try {
    items = await getEconomyItems(guildId);
  } catch {
    items = []
  }
  
  const roles = await getGuildRoles(guildId);

  return (
    <EconomyEditorClient 
      guildId={guildId} 
      init_items={items} 
      roles={roles}
    />
  );
}