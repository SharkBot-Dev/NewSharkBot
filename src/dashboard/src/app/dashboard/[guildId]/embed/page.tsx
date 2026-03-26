import { Suspense } from "react";
import { fetchEmbedSettings } from "@/lib/api/requests"; // ラッパー関数の場所
import EmbedEditorClient from "./EmbedEditorClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";

interface Props {
  params: { guildId: string };
}

export default async function WelcomeGoodbyeModulePage({ params }: Props) {
  const { guildId } = await params;

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">埋め込み作成モジュール</h1>
          <p className="mt-2 text-slate-600">特定のタイトルで埋め込みを保存・管理できます。</p>
        </div>

        {/* データの取得とエディター部分を分離 */}
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