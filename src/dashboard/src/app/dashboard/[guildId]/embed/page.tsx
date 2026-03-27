import { Suspense } from "react";
import { fetchEmbedSettings, isModuleEnabled } from "@/lib/api/requests"; // ラッパー関数の場所
import EmbedEditorClient from "./EmbedEditorClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";

interface Props {
  params: { guildId: string };
}

export default async function EmbedModulePage({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "embed");

    if (!data.enabled) {
      return <Alert text="埋め込みモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">埋め込み作成モジュール</h1>
          <p className="mt-2 text-slate-600">特定のタイトルで埋め込みを保存・管理できます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <EmbedContent guildId={guildId} />
        </Suspense>

        <p className="mt-10 text-center text-xs text-slate-400">
          ※ 同じ名前の埋め込みを保存すると、上書きされます。
        </p>
      </div>
    </div>
  );
}

async function EmbedContent({ guildId }: { guildId: string }) {
  const initialEmbeds = await fetchEmbedSettings(guildId);

  return (
    <EmbedEditorClient 
      guildId={guildId} 
      initialEmbeds={initialEmbeds} 
    />
  );
}