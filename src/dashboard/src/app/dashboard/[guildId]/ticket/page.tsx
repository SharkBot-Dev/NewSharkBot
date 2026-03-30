import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Terminal } from "lucide-react";
import CommandsControl from "@/components/commands";
import LoadingSkeleton from "@/components/LoadingSkeleton";

import getTicketSettings, { isModuleEnabled } from "@/lib/api/requests";
import Alert from "@/components/Alert";
import { getGuildRoles } from "@/lib/Discord/Bot";
import Client from "./Client";

export default async function TicketPanelSetting({ params }: { params: { guildId: string } }) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "ticket");

    if (!data.enabled) {
      return <Alert text="チケットが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">チケット</h1>
          <p className="mt-2 text-slate-600">
            ユーザーのお問い合わせに素早く返信するための<br/>
            ボタン（パネル）を作成できます。
          </p>
        </header>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <Suspense fallback={<LoadingSkeleton />}>
          <TicketDataLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function TicketDataLoader({ guildId }: { guildId: string }) {
  const [roles, settings] = await Promise.all([
    getGuildRoles(guildId),
    getTicketSettings(guildId).catch(() => null)
  ]);

  const initialPanels = settings ?? [];

  return (
    <Client 
      guildId={guildId} 
      roles={roles} 
      initialPanels={initialPanels} 
    />
  );
}