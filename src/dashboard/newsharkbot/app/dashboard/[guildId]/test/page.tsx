"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Terminal, Settings2 } from "lucide-react"; // アイコンを追加
import CommandsControl from "@/app/components/commands";

export default function TestModuleSetting() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              テストモジュール
            </h1>
            <p className="mt-2 text-slate-600">
              サーバーで使用するスラッシュコマンドの有効・無効を切り替えます。
            </p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tight">
                コマンド管理
              </h2>
            </div>
            
            <div className="shadow-sm">
              <CommandsControl 
                guildId={guildId} 
                targetCommands={[
                  {
                    name: "test",
                    description: "テストと返します。動作確認用に使用してください。",
                  }
                ]} 
              />
            </div>
            
            <p className="mt-4 text-xs text-slate-900">
              ※ 反映まで数分かかる場合があります。同期が完了しない場合はページを更新してください。
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}