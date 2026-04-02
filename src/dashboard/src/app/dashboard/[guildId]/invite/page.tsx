import { Suspense } from "react";
import { redirect } from "next/navigation";
import CommandsControl from "@/components/commands";
import LoadingSkeleton from "@/components/LoadingSkeleton";

import { getInviteSetting, isModuleEnabled, saveInviteSetting } from "@/lib/api/requests";
import Alert from "@/components/Alert";
import commands from "@/constants/commands/invite";
import CollapsibleSection from "@/components/CollapsibleSection";
import { getGuildChannels } from "@/lib/Discord/Bot";
import Client from "./Client";

export default async function InviteModulePage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "invite");

    if (!data.enabled) {
      return <Alert text="招待リンク管理が有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">招待リンク管理</h1>
          <p className="mt-2 text-slate-600">
            招待リンクの管理やログをとることができます。
          </p>
        </header>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <Suspense fallback={<LoadingSkeleton />}>
          <Content guildId={guildId}></Content>
        </Suspense>
      </div>
    </div>
  );
}

async function saveSetting(guildId: string, channelId: string, content: string, embed_id: string) {
  "use server";

  await saveInviteSetting(guildId, channelId, content, embed_id);
}

async function Content({ guildId }: { guildId: string }) {
  const initChannels = await getGuildChannels(guildId);
  let res;
  try {
    res = await getInviteSetting(guildId);
  } catch {}

  let settings = {};
  if (res && !res.error) {
    settings = res;
  }

  return (
    <Client
      guildId={guildId}
      initChannels={initChannels}
      settings={settings}
    />
  );
}