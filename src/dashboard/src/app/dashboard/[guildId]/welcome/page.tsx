import { Suspense } from "react";
import { redirect } from "next/navigation";
import WelcomeGoodbyeEditor from "./WelcomeGoodbyeEditor";
import LoadingSkeleton from "@/components/LoadingSkeleton"; // 既存のローディングUI
import { fetchEmbedSettings, fetchMessageSetting, isModuleEnabled } from "@/lib/api/requests";
import Alert from "@/components/Alert";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function WelcomeGoodbyeModulePage({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "welcome");

    if (!data.enabled) {
      return <Alert text="よろしく＆さようならモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">
            よろしく＆さようなら設定
          </h1>
          <p className="mt-2 text-slate-600">
            サーバーの入退出メッセージを管理します。
          </p>
        </div>

        {/* データのフェッチ中はこの fallback が表示される */}
        <Suspense fallback={<LoadingSkeleton />}>
          <WelcomeGoodbyeDataLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * データを取得してエディターをレンダリングするサーバーコンポーネント
 */
async function WelcomeGoodbyeDataLoader({ guildId }: { guildId: string }) {
  const [welcomeRaw, goodbyeRaw] = await Promise.all([
    fetchMessageSetting(guildId, "welcome").catch(() => null),
    fetchMessageSetting(guildId, "goodbye").catch(() => null)
  ]);

  const data = {
    welcome: {
      enabled: !!welcomeRaw,
      channelId: welcomeRaw?.channel_id || "",
      content: welcomeRaw?.content || "",
      embed_id: welcomeRaw?.embed_id || null,
    },
    goodbye: {
      enabled: !!goodbyeRaw,
      channelId: goodbyeRaw?.channel_id || "",
      content: goodbyeRaw?.content || "",
      embed_id: goodbyeRaw?.embed_id || null,
    },
  };

  return <WelcomeGoodbyeEditor guildId={guildId} initialData={data} />;
}