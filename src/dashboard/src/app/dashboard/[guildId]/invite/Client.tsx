"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import ChannelSelecter from "@/components/channel-selecter";
import EmbedSelecter from "@/components/EmbedSelecter";
import CommandsControl from "@/components/commands";
import commands from "@/constants/commands/invite";
import { saveInviteSetting } from "@/lib/api/requests";

interface Props {
  guildId: string;
  initChannels: any[];
  settings: any;
}

export default function Client({ guildId, initChannels, settings }: Props) {
  const [channelId, setChannelId] = useState(settings?.channel_id || "");
  const [content, setContent] = useState(() => {
    if (settings && Object.keys(settings).length > 0) {
      return settings.content ?? "";
    }
    return "🎉 {招待者名}さんが招待した {ユーザー名}が参加しました！使用回数は{カウント}です。";
  });
  const [embed, setEmbed] = useState(settings?.embed_id || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
        const res = await fetch(`/api/guilds/${guildId}/modules/invite`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                guildId,
                channelId,
                content,
                embed_id: embed
            }),
        });

        if (!res.ok) throw new Error("保存失敗");

        alert("保存しました。")
    } catch (e) {
        alert("保存に失敗しました");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <CollapsibleSection title="コマンド管理">
        <CommandsControl guildId={guildId} targetCommands={commands}></CommandsControl>
      </CollapsibleSection>

      <CollapsibleSection title="招待ログ">

        <div className="flex flex-col gap-6 text-black">
          
          {/* チャンネル選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">送信先チャンネル</label>
            <ChannelSelecter
              initChannels={initChannels}
              value={channelId}
              onChange={(v: string) => setChannelId(v)}
              guildId={guildId}
            />
          </div>

          {/* コンテンツ入力 (Textarea) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">メッセージ本文</label>
            <textarea
              className="w-full p-2 bg-secondary rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="メッセージを入力してください..."
            />
          </div>

          {/* Embed選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">埋め込み設定 (Embed)</label>
            <EmbedSelecter 
              value={embed} 
              onChange={(v: any) => setEmbed(v)} 
              guildId={guildId}
            />
          </div>

          {/* 保存ボタン */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "保存中..." : "保存"}
            </button>
          </div>

        </div>
      </CollapsibleSection>
    </div>
  );
}