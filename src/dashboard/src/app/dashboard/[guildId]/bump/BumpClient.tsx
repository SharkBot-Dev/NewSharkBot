"use client";

import { Plus, Trash2, Bell, MessageSquare, Hash, Users, Save, Bot, X } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";
import MultiSelector from "@/components/MultiSelector";
import EmbedSelecter from "@/components/EmbedSelecter";

interface BumpBotConfig {
  bot_id: string;
  channel_id: string;
  role_ids: string[];
  content: string;
}

interface Props {
  guildId: string;
  channels: any[];
  roles: any[];
  initSettings: {
    bots?: BumpBotConfig[];
  };
}

const BUMP_BOT_PRESETS = [
  { id: "302050872383242240", name: "DISBOARD", defaultContent: "Bumpの時間が来たよ！\n</bump:947088344167366698>" },
  { id: "761562078095867916", name: "Dissoku", defaultContent: "Upの時間が来たよ！\n</up:1363739182672904354>" },
];

const DEFAULT_NEW_BOT: BumpBotConfig = {
  bot_id: "",
  channel_id: "",
  role_ids: [],
  content: "Bumpの時間が来たよ！",
};

function truncateWithEllipsis(str: string, limit: number = 10): string {
  return str.length > limit ? str.slice(0, limit) + "..." : str;
}

export default function BumpClient({ guildId, channels, roles, initSettings }: Props) {
  const [bots, setBots] = useState<BumpBotConfig[]>(initSettings?.bots || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newBot, setNewBot] = useState<BumpBotConfig>(DEFAULT_NEW_BOT);

  const handleSelectBot = (botId: string) => {
    const preset = BUMP_BOT_PRESETS.find(p => p.id === botId);
    setNewBot(prev => ({
      ...prev,
      bot_id: botId,
      content: preset ? preset.defaultContent : prev.content
    }));
  };

  const handleAddBot = () => {
    if (!newBot.bot_id || !newBot.channel_id) {
      alert("Botと通知先チャンネルを選択してください。");
      return;
    }
    setBots(prev => [...prev, newBot]);
    setNewBot(DEFAULT_NEW_BOT);
    setIsModalOpen(false);
  };

  const removeBot = (index: number) => {
    setBots(prev => prev.filter((_, i) => i !== index));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/bumps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bots }),
      });
      if (res.ok) {
        alert("設定を保存しました！");
      } else {
        throw new Error();
      }
    } catch (err) {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 text-slate-800">
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Bump通知設定</h1>
          <p className="text-sm text-slate-500">各種掲示板Botの通知リマインダーを管理します</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? "保存中..." : "変更を保存"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <div key={index} className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <button 
              onClick={() => removeBot(index)} 
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                <Bot size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {BUMP_BOT_PRESETS.find(p => p.id === bot.bot_id)?.name || "Custom Bot"}
                </p>
                <p className="text-sm font-mono font-medium truncate text-slate-600">{bot.bot_id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                <Hash size={14} className="text-slate-400" />
                <span className="truncate">#{channels.find(c => c.id === bot.channel_id)?.name || "不明なチャンネル"}</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {bot.role_ids.length > 0 ? (
                  bot.role_ids.map(rid => (
                    <span key={rid} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-medium border border-slate-200">
                      @{roles.find(r => r.id === rid)?.name || "Role"}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">メンションなし</span>
                )}
              </div>

              <div className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 italic leading-relaxed whitespace-pre-wrap">
                {truncateWithEllipsis(bot.content)}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-full min-h-[200px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-500 transition-all group"
        >
          <div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-100 transition-colors">
            <Plus size={28} />
          </div>
          <span className="mt-3 font-bold text-sm">新しいBotを追加</span>
        </button>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-800">Botの追加</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">対象のBot</label>
              <select
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all bg-white"
                value={newBot.bot_id}
                onChange={e => handleSelectBot(e.target.value)}
              >
                <option value="" disabled>選択してください</option>
                {BUMP_BOT_PRESETS.map(bot => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name} ({bot.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">通知先チャンネル</label>
              <select
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all bg-white"
                value={newBot.channel_id}
                onChange={e => setNewBot(prev => ({ ...prev, channel_id: e.target.value }))}
              >
                <option value="">選択してください</option>
                {channels.map(ch => (
                  <option key={ch.id} value={ch.id}>#{ch.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">通知メッセージ</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm min-h-[80px] focus:border-blue-500 transition-all outline-none"
                placeholder="メッセージを入力..."
                value={newBot.content}
                onChange={e => setNewBot(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">通知メッセージの埋め込み</label>
              <EmbedSelecter
                value={newBot.content}
                onChange={e => setNewBot(prev => ({ ...prev, content: e }))}
                guildId={guildId}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">メンションするロール</label>
              <MultiSelector
                label="ロールを選択"
                icon={Users}
                options={roles}
                selectedIds={newBot.role_ids}
                onChange={(ids: string[]) => setNewBot(prev => ({ ...prev, role_ids: ids }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddBot}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                追加
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}