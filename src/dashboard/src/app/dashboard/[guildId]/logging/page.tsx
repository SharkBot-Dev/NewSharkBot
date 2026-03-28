import { Suspense } from "react";
import { fetchEmbedSettings, fetchLoggingSetting, getLevelRewards, getLevelSetting, isModuleEnabled } from "@/lib/api/requests";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels, getGuildRoles } from "@/lib/Discord/Bot";
import LoggingClient from "./LoggingClient";

interface Props {
  params: { guildId: string };
}

export default async function LoggingPage({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "logging");

    if (!data.enabled) {
      return <Alert text="ログモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">ログモジュール</h1>
          <p className="mt-2 text-slate-600">メンバーやモデレーターの行動を記録できます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <LoggingContent guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoggingContent({ guildId }: { guildId: string }) {
  const loggingSetting = await fetchLoggingSetting(guildId);
  const channels = await getGuildChannels(guildId);

  return (
    <LoggingClient 
      guildId={guildId} 
      setting={loggingSetting}
      channels={channels}
    />
  );
}