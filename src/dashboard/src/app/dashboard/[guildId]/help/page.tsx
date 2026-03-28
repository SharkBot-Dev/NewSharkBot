import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Terminal } from "lucide-react";
import CommandsControl from "@/components/commands";
import LoadingSkeleton from "@/components/LoadingSkeleton";

import { isModuleEnabled } from "@/lib/api/requests";
import Alert from "@/components/Alert";
import commands from "@/constants/commands/help";

export default async function HelpModuleSetting({ params }: { params: { guildId: string } }) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "help");

    if (!data.enabled) {
      return <Alert text="ヘルプモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">ヘルプモジュール</h1>
          <p className="mt-2 text-slate-600">
            サーバーで使用するスラッシュコマンドの有効・無効を切り替えます。
          </p>
        </header>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tight">
                コマンド管理
              </h2>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
              <div className="shadow-sm">
                <CommandsControl guildId={guildId} targetCommands={commands} />
              </div>
            </Suspense>

            <p className="mt-4 text-xs text-slate-900">
              ※ 反映まで数分かかる場合があります。同期が完了しない場合はページを更新してください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}