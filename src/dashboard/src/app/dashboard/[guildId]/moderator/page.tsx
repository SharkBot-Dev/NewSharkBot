import { Suspense } from "react";
import { fetchAutomodSettings, fetchEmbedSettings, fetchModeratorSettings, isModuleEnabled } from "@/lib/api/requests"; // ラッパー関数の場所
import ModeratorClient from "./ModeratorClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";

interface Props {
  params: { guildId: string };
}

export default async function ModeratorPage({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "moderator");

    if (!data.enabled) {
      return <Alert text="モデレーターモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">モデレーターモジュール</h1>
          <p className="mt-2 text-slate-600">自動モデレートや、モデレートコマンドを使用できるようにします。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <ModeratorContent guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function ModeratorContent({ guildId }: { guildId: string }) {
  let automod = {};
  let setting = {};

  try {
    automod = await fetchAutomodSettings(guildId, "all");
  } catch (err) {
    automod = {};
  }

  try {
    setting = await fetchModeratorSettings(guildId);
  } catch (err) {
    setting = {};
  }

  return (
    <ModeratorClient 
      guildId={guildId} 
      setting={setting}
      automod={automod}
    />
  );
}