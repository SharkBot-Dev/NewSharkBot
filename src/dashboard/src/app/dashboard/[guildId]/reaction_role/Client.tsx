"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import ChannelSelecter from "@/components/channel-selecter";
import EmbedSelecter from "@/components/EmbedSelecter";
import ToggleSwitch from "@/components/toggleSwitch";
import CollapsibleSection from "@/components/CollapsibleSection";
import { ButtonRoleMap } from "@/constants/reaction_role/rolesmap";
import ButtonRoleSelector from "@/components/ButtonRole";

interface Props {
  guildId: string;
  roles: any[];
}

export default function ReactionRoleClient({ guildId, roles }: Props) {
    const [saving, setSaving] = useState(false);

    const [reactionType, setReactionType] = useState("button");

    const [ButtonRoleMap, setButtonRoleMap] = useState<ButtonRoleMap>({});

    const [channel, setChannel] = useState();
    const [embed, setEmbed] = useState();
    const [content, setContent] = useState<string>("");

    const sendButtonRolePanel = async () => {
        if (!channel) {
          alert("チャンネルを選択してください。");
          return;
        }

        if (Object.keys(ButtonRoleMap).length === 0) {
          alert("ロールを最低でも一つ選択してください。");
          return;
        }

        setSaving(true);
        try {
            const body = {
                reaction_type: reactionType,
                roles: ButtonRoleMap,
                channelId: channel,
                embedId: embed,
                content: content,
            }
    
            const response = await fetch(`/api/guilds/${guildId}/modules/reactionRole/button`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error();
            alert("送信しました！");

        } catch (e) {
            alert("送信に失敗しました。");
        } finally {
            setSaving(false);
        }
    }

  return (
    <div className="space-y-8">
      <CollapsibleSection title="ボタン式ロールパネルを作成">
        <div className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">送信先チャンネル</label>
                <ChannelSelecter 
                  guildId={guildId} 
                  value={channel} 
                  onChange={(id) => setChannel(id as any)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">使用する埋め込み</label>
                <EmbedSelecter 
                  guildId={guildId} 
                  value={embed} 
                  onChange={(val) => setEmbed(val as any)} 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">メッセージ本文</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-slate-900"
                placeholder="@✅認証: 認証ができます。"
                value={content}
                onChange={(e) => setContent(e.target.value as any)}
              />
            </div>

            <ButtonRoleSelector serverRoles={roles} roles={ButtonRoleMap} onChange={(newRoles) => setButtonRoleMap(newRoles)}></ButtonRoleSelector>

            <div className="flex justify-end">
                <button
                onClick={sendButtonRolePanel}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "送信中..." : "送信する"}
                </button>
            </div>
          </div>
      </CollapsibleSection>
    </div>
  );
}