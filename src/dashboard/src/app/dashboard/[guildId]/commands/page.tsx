import { Suspense } from "react";
import { getCommandPrefix, getCommands, getEconomyItems, getEconomySetting, isModuleEnabled } from "@/lib/api/requests";
import CommandsEditorClient from "./Client";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels, getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function CommandsContent({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "commands");

    if (!data.enabled) {
      return <Alert text="コマンドモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">コマンド (自動返信) モジュール</h1>
          <p className="mt-2 text-slate-600">好きなコマンドを自作できます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <CustomCommandsContent guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function CustomCommandsContent({ guildId }: { guildId: string }) {
  const roles = await getGuildRoles(guildId);
  const channels = await getGuildChannels(guildId);
  const commands = await getCommands(guildId);
  const prefixs = (await getCommandPrefix(guildId)).prefix;

  return (
    <CommandsEditorClient 
      guildId={guildId} 
      commands={commands} 
      channels={channels}
      roles={roles}
      initialPrefixes={prefixs}
    />
  );
}