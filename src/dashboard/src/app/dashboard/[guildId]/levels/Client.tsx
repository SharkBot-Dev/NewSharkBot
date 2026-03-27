"use client";

import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import ChannelSelecter from "@/components/channel-selecter";
import EmbedSelecter from "@/components/EmbedSelecter";
import RoleSelector from "@/components/role-selector";
import { LevelRewardRole, LevelRewardRoleSetting } from "@/constants/levels/levels_reward_rolemap";
import CommandsControl from "@/components/commands";
import Permissions from "@/constants/Discord/Permissions";

const commands = [
  {
    name: "rank",
    description: "ユーザーのランクを表示します。",
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: "levels",
    description: "レベルのランキングを表示します。"
  },
{
    name: "give-xp", 
    description: "ユーザーにXPを追加します。",
    default_member_permissions: Permissions.ManageGuild.toString(), 
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "amount",
        description: "削除するXPの量を入力してください。",
        type: 4,
        required: true,
      },
    ]
  },
  {
    name: "remove-xp",
    description: "ユーザーのXPを削除します。",
    default_member_permissions: Permissions.ManageGuild.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "amount",
        description: "削除するXPの量を入力してください。",
        type: 4,
        required: true,
      },
    ]
  }
];

interface Props {
  guildId: string;
  roles: any[];
  levelup_channel: string;
  levelup_message: string;
  levelup_embed: string;
  reward_roles: LevelRewardRole[];
}

export default function LevelsEditorClient({ 
  guildId, 
  levelup_channel, 
  levelup_message, 
  levelup_embed, 
  reward_roles 
}: Props) {
  const [embed, setEmbed] = useState<string>(levelup_embed);
  const [message, setLevelupMessage] = useState<string>(levelup_message || "");
  const [channel, setChannel] = useState<string>(levelup_channel);
  const [rewardRoles, setRewardRoles] = useState<LevelRewardRole[]>(reward_roles || []);
  const [isSaving, setIsSaving] = useState(false);

  const addRewardRole = () => {
    setRewardRoles([...rewardRoles, { roleId: "", level: 1 }]);
  };

  const updateRewardRole = (index: number, field: keyof LevelRewardRole, value: any) => {
    const updated = [...rewardRoles];
    updated[index] = { ...updated[index], [field]: value };
    setRewardRoles(updated);
  };

  const removeRewardRole = (index: number) => {
    setRewardRoles(rewardRoles.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channel,
          content: message,
          embed_id: embed ? parseInt(embed) : null,
          reward_roles: rewardRoles.map(r => ({
            level: r.level,
            role_id: r.roleId
          }))
        }),
      });

      if (!response.ok) throw new Error("保存に失敗しました");
      
      alert("設定を保存しました");
    } catch (error) {
      console.error(error);
      alert("保存中にエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-8 pb-32">
      <CollapsibleSection title="レベルアップ時のメッセージ設定">
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                送信先チャンネル
              </label>
              <ChannelSelecter 
                guildId={guildId} 
                value={channel} 
                onChange={(id) => setChannel(id)} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                使用する埋め込み
              </label>
              <EmbedSelecter 
                guildId={guildId} 
                value={embed} 
                onChange={(val) => setEmbed(val)} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              メッセージ本文
            </label>
            <textarea
              className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-slate-900"
              placeholder="🎉 {ユーザー名}さんがレベル{現在レベル}に到達しました！"
              value={message} 
              onChange={(e) => setLevelupMessage(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-slate-400">
              利用可能な変数: {"{ユーザー名}"}, {"{メンション}"}, {"{現在レベル}"}, {"{前のレベル}"}
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="レベルアップ時の報酬ロール設定">
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {rewardRoles.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                報酬ロールが設定されていません
              </div>
            ) : (
              rewardRoles.map((reward, index) => (
                <div key={index} className="flex items-end gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">到達レベル</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                      value={reward.level}
                      onChange={(e) => updateRewardRole(index, "level", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex-[2] space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">付与するロール</label>
                    <RoleSelector 
                      guildId={guildId} 
                      value={reward.roleId} 
                      onChange={(id) => updateRewardRole(index, "roleId", id)} 
                    />
                  </div>
                  <button 
                    onClick={() => removeRewardRole(index)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}

            <button 
              onClick={addRewardRole}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Plus size={18} />
              新しい報酬を追加
            </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="必要なコマンド設定">
        <CommandsControl guildId={guildId} targetCommands={commands} />
      </CollapsibleSection>
    </div>
  );
}