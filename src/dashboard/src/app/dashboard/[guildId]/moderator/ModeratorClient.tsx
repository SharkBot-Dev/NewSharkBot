"use client";

import { Terminal, Save, Shield, MessageSquare, Link, EyeOff, Settings } from "lucide-react";
import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import Modal from "@/components/Modal";
import ChannelSelecter from "@/components/channel-selecter";

import Permissions from "@/constants/Discord/Permissions";

interface Props {
  guildId: string;
  automod: Record<string, any>;
  setting: any;
  channels: any[];
  roles: any[];
}

const commands = [
  {
    name: "kick", 
    description: "メンバーをキックします。",
    default_member_permissions: Permissions.KickMembers.toString(), 
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "キックする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "ban",
    description: "ユーザーをBanします。",
    default_member_permissions: Permissions.BanMembers.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Banする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "unban",
    description: "ユーザーのBanを解除します。",
    default_member_permissions: Permissions.BanMembers.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Banを解除する理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "timeout",
    description: "ユーザーをタイムアウトします。",
    default_member_permissions: Permissions.ModerateMembers.toString(),
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "duration",
        description: "タイムアウトする時間を入力してください。",
        type: 3,
        required: true,
      },
      {
        name: "reason",
        description: "タイムアウトする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "remove-timeout",
    description: "ユーザーのタイムアウトを解除します。",
    default_member_permissions: Permissions.ModerateMembers.toString(),
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "タイムアウトする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "clear",
    description: "メッセージを複数個削除します。",
    default_member_permissions: Permissions.ManageMessages.toString(),
    options: [
      {
        name: "amount",
        description: "削除する個数を選択してください。",
        type: 4,
        required: true,
      },
    ]
  },
  {
    name: "user-info",
    description: "ユーザーの情報を表示します。",
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: false,
      }
    ]
  }
];

const automod_map: Record<string, string> = {
  "basic": "基本設定",
  "badword": "NGワード対策",
  "badlink": "リンク対策",
  "invite": "招待リンク対策",
  "spoiler": "大量のネタバレ対策",
}

export default function ModeratorClient({ guildId, automod, setting, channels, roles }: Props) {
  // 基本設定のステート
  const [logChannelId, setLogChannelId] = useState(setting?.log_channel_id || "");
  
  // AutoMod設定のステート (保存用の一時データ)
  const [automodSettings, setAutomodSettings] = useState(automod);
  
  // モーダル・編集用ステート
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);

  // 保存処理
  const handleSave = async (target: string, payload: any) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/moderator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guild_id: guildId, type: editingType, target, ...payload }),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      const result = await res.json();
      alert(`${automod_map[target] || target} の設定を保存しました`);
      
      // ローカルステートの更新
      if (target === "basic") {
        // 基本設定更新
      } else {
        setAutomodSettings((prev: any) => ({ ...prev, [target]: result.data }));
      }
      setModalOpen(false);
    } catch (err) {
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <CollapsibleSection title="コマンド設定">
        <CommandsControl guildId={guildId} targetCommands={commands} />
      </CollapsibleSection>

      {/* 1. 基本設定セクション */}
      <CollapsibleSection title="基本設定">
        <div className="space-y-4 p-4 bg-secondary/20 rounded-lg text-black">
          <div>
            <label className="block text-sm font-medium mb-2">ログ送信先チャンネル</label>
            <ChannelSelecter 
              guildId={guildId} 
              value={logChannelId} 
              onChange={setLogChannelId} 
              initChannels={channels}
            />
          </div>
          <button 
            onClick={() => handleSave("basic", { log_channel_id: logChannelId })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
          >
            <Save className="w-4 h-4" /> 設定を保存
          </button>
        </div>
      </CollapsibleSection>

      {/* 2. AutoMod 各機能セクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
        {[
          { type: "invite", name: "招待リンク対策", icon: <Link /> },
          { type: "badword", name: "NGワード対策", icon: <MessageSquare /> },
          { type: "badlink", name: "リンク対策", icon: <Shield /> },
          { type: "spoiler", name: "大量のネタバレ対策", icon: <EyeOff /> },
        ].map((item) => (
          <div key={item.type} className="p-4 border border-gray-300 rounded-xl bg-card hover:shadow-md transition">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-primary/10 rounded-lg text-primary">{item.icon}</span>
                <h3 className="font-bold">{item.name}</h3>
              </div>
              <button 
                onClick={() => {
                  setEditingType(item.type);
                  setModalOpen(true);
                }}
                className="text-sm bg-secondary px-3 py-1 rounded-md hover:bg-secondary/80"
              >
                編集
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              ステータス: {
                (automodSettings[item.type] && 
                automodSettings[item.type].actions && 
                automodSettings[item.type].actions.length > 0) 
                  ? "✅ 有効" 
                  : "❌ 未設定"
              }
            </p>
          </div>
        ))}
      </div>

      {/* 編集用モーダル */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-bold mb-2 text-black">{`${automod_map[editingType as string] || editingType} 設定`}</h2>
        {editingType && (
          <AutoModEditor 
            guildId={guildId}
            type={editingType}
            initialData={automodSettings[editingType] || {}}
            onSave={(data: any) => handleSave(editingType, data)}
            initChannels={channels}
            initRoles={roles}
          />
        )}
      </Modal>
    </div>
  );
}

// モーダル内蔵の編集フォームコンポーネント
import { X, Plus } from "lucide-react";
import RoleSelector from "@/components/role-selector";
import CommandsControl from "@/components/commands";

function AutoModEditor({ guildId, type, initialData, onSave, initChannels, initRoles }: any) {
  const [actions, setActions] = useState<string[]>(initialData.actions || []);
  const [whitelistChannels, setWhitelistChannels] = useState<string[]>(initialData.whitelist_channel_ids || []);
  const [whitelistRoles, setWhitelistRoles] = useState<string[]>(initialData.whitelist_role_ids || []);
  const [badwords, setBadwords] = useState<string>(initialData.badwords?.join(", ") || "");
  const [allowedLinks, setAllowedLinks] = useState<string>(initialData.allowed_links?.join(", ") || ""); 
  const [allowOnlyVerified, setAllowOnlyVerified] = useState<boolean>(initialData.allow_only_verified || false);

  const actionOptions = ["delete", "warn", "timeout", "kick", "ban"];

  // ヘルパー: リストの追加
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    if (!id) return;
    if (list.includes(id)) {
      setList(prev => prev.filter(item => item !== id));
    } else {
      setList(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6 text-black">
      {/* 1. アクション設定 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-white">実行するアクション</label>
        <div className="flex flex-wrap gap-2">
            {actionOptions.map(opt => {
            const isSelected = actions.includes(opt);
            return (
                <button
                key={opt}
                type="button"
                onClick={() => toggleItem(actions, setActions, opt)}
                aria-pressed={isSelected}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-black border-gray-200 hover:border-gray-400' 
                }`}
                >
                {opt}
                </button>
            );
            })}
        </div>
      </div>

      {/* 2. ホワイトリスト (チャンネル) */}
      <div>
        <label className="block text-sm font-bold mb-2">除外チャンネル</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {whitelistChannels.map(id => (
            <span key={id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs border border-border">
              ID: {id}
              <button
                type="button"
                aria-label={`除外チャンネル ${id} を削除`}
                onClick={() => toggleItem(whitelistChannels, setWhitelistChannels, id)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <ChannelSelecter guildId={guildId} value="" onChange={(v) => toggleItem(whitelistChannels, setWhitelistChannels, v)} initChannels={initChannels} />
      </div>

      {/* 3. ホワイトリスト (ロール) */}
      <div>
        <label className="block text-sm font-bold mb-2">除外ロール</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {whitelistRoles.map(id => (
            <span key={id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs border border-border">
              ID: {id}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => toggleItem(whitelistRoles, setWhitelistRoles, id)} />
            </span>
          ))}
          
        </div>
        <RoleSelector guildId={guildId} value="" onChange={(v) => toggleItem(whitelistRoles, setWhitelistRoles, v)} initRoles={initRoles} />
      </div>

      {/* 4. 各タイプ固有の設定 */}
      <div className="border-t border-border pt-4">
        {type === "badword" && (
          <div>
            <label className="block text-sm font-bold mb-2">NGワード (カンマ区切り)</label>
            <textarea 
              className="w-full p-2 bg-secondary/50 rounded-md border border-border min-h-[100px] text-sm"
              placeholder="死ね, 殺す, ..."
              value={badwords}
              onChange={(e) => setBadwords(e.target.value)}
            />
          </div>
        )}

        {type === "badlink" && (
          <div>
            <label className="block text-sm font-bold mb-2">許可するドメイン (カンマ区切り)</label>
            <textarea 
              className="w-full p-2 bg-secondary/50 rounded-md border border-border min-h-[100px] text-sm"
              placeholder="google.com, github.com, youtube.com"
              value={allowedLinks}
              onChange={(e) => setAllowedLinks(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              ※ ここに記載されたドメインを含むリンクは削除されません。
            </p>
          </div>
        )}

        {type === "invite" && (
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div>
              <p className="text-sm font-bold">Discord公式サーバーのみ許可</p>
              <p className="text-xs text-muted-foreground">Discord公式サーバーへの招待リンクを無視します</p>
            </div>
            <input 
              type="checkbox" 
              className="toggle toggle-primary"
              checked={allowOnlyVerified}
              onChange={(e) => setAllowOnlyVerified(e.target.checked)}
            />
          </div>
        )}
      </div>

      {/* 5. 保存ボタン */}
      <button 
        onClick={() => onSave({
          actions,
          whitelist_channel_ids: whitelistChannels,
          whitelist_role_ids: whitelistRoles,
          badwords: type === "badword" ? badwords.split(",").map(s => s.trim()).filter(s => s !== "") : undefined,
          allowed_links: type === "badlink" ? allowedLinks.split(",").map(s => s.trim()).filter(s => s !== "") : undefined,
          allow_only_verified: type === "invite" ? allowOnlyVerified : undefined
        })}
        className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold hover:opacity-90 transition shadow-lg"
      >
        設定を保存する
      </button>
    </div>
  );
}