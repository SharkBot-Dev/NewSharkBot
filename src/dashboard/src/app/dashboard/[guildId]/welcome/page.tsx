"use client";

import { Terminal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CommandsControl from "@/app/components/commands";
import ChannelSelecter from "@/app/components/channel-selecter";
import CollapsibleSection from "@/app/components/CollapsibleSection";

export default function WelcomeGoodbyeModulePage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);

  // 参加時用
  const [welcomeSelectedChannel, setWelcomeSelectedChannel] = useState<string>("");
  const [welcomeContent, setWelcomeContent] = useState<string>("{ユーザー名}、よろしくお願いします。");
  // よろしく埋め込みはあとで埋め込みビルダーを作ってから実装する
  const [welcomeEmbed, setWelcomeEmbed] = useState<string>("");

  // 退出時用
  const [goodbyeSelectedChannel, setGoodbyeSelectedChannel] = useState<string>("");
  const [goodbyeContent, setGoodbyeContent] = useState<string>("{ユーザー名}、さようなら。");
  const [goodbyeEmbed, setGoodbyeEmbed] = useState<string>("");

  useEffect(() => {
    async function init() {
      (await fetch(`/api/guilds/${guildId}/modules/isEnabled?module=welcome`))
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
              よろしく＆さようならモジュール
            </h1>
            <p className="mt-2 text-slate-600">
              サーバー内の設定を確認・変更できます。設定を変更すると、反映まで数分かかる場合があります。
            </p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tight">
                ユーザーがサーバーに参加、退出したときにメッセージを送信する
              </h2>
            </div>

            <CollapsibleSection title="参加時の設定" defaultOpen>
                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    よろしくメッセージチャンネル
                    <ChannelSelecter guildId={guildId} type_id={0} value={welcomeSelectedChannel} onChange={(id) => setWelcomeSelectedChannel(id)} />
                </div>

                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    よろしくメッセージ
                    <textarea
                        value={welcomeContent}
                        onChange={(e) => setWelcomeContent(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
                        rows={4}
                    />
                </div>

                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    よろしく埋め込み
                    <input
                        defaultValue={welcomeEmbed}
                        onChange={(e) => setWelcomeEmbed(e.target.value)}
                        type="text"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="退出時の設定">
                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    さようならメッセージチャンネル
                    <ChannelSelecter guildId={guildId} type_id={0} value={goodbyeSelectedChannel} onChange={(id) => setGoodbyeSelectedChannel(id)} />
                </div>

                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    さようならメッセージ
                    <textarea
                        value={goodbyeContent}
                        onChange={(e) => setGoodbyeContent(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
                        rows={4}
                    />
                </div>

                <div className="shadow-sm mt-4 text-xs text-slate-900">
                    さようなら埋め込み
                    <input
                        defaultValue={goodbyeEmbed}
                        onChange={(e) => setGoodbyeEmbed(e.target.value)}
                        type="text"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
                    />
                </div>
            </CollapsibleSection>

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
