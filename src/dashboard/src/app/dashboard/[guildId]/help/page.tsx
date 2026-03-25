"use client";

import { Terminal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CommandsControl from "@/app/components/commands";

const commands = [
  {
    name: "help",
    description: "Botのコマンド一覧や詳細を表示します。",
    options: [
      {
        name: "command",
        description: "詳細を表示したいコマンド名を入力してください。",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "dashboard",
    description: "ダッシュボードの案内を表示します。",
  },
];

export default function HelpModuleSetting() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      (await fetch(`/api/guilds/${guildId}/modules/isEnabled?module=help`))
        .json()
        .then((data) => {
          if (data.enabled) {
            setLoading(false);
          } else {
            alert("このサーバーではモジュールが有効になっていません。");
            router.push(`/dashboard/${guildId}`);
          }
        });
    }
    init();
  }, [guildId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              ヘルプモジュール
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
              <CommandsControl guildId={guildId} targetCommands={commands} />
            </div>

            <p className="mt-4 text-xs text-slate-900">
              ※
              反映まで数分かかる場合があります。同期が完了しない場合はページを更新してください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
