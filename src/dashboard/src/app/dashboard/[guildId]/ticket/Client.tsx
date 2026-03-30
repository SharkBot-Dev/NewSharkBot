"use client";

import { Save, Layout, Settings2, FolderPlus, FileText, Users, Bell, Hash, Info, Clock, Plus, Trash2, ChevronRight, Maximize } from "lucide-react";
import { useState, useMemo } from "react";
import ChannelSelecter from "@/components/channel-selecter";
import EmbedSelecter from "@/components/EmbedSelecter";
import CollapsibleSection from "@/components/CollapsibleSection";
import TicketButtonSelector, { TicketButtonConfig, TicketActionType } from "@/components/TicketButton";
import { ButtonStyle } from "@/constants/reaction_role/rolesmap";

interface TicketPanelData {
  id: string;
  name: string; // 管理用のパネル名
  targetChannelId: string;
  embedId: string;
  content: string;
  panelButtons: TicketButtonConfig[];
  categoryId: string;
  logChannelId: string;
  staffRoleIds: string[];
  mentionRoleIds: string[];
  nameTemplate: string;
  cooldown: number;
  ticketLimit: number;
  innerButtons: TicketButtonConfig[];
  innerEmbedId: string;
  innerContent: string;
}

interface Props {
  guildId: string;
  roles: any[];
  initialPanels?: TicketPanelData[]; // 初期データがある場合
}

export default function TicketClient({ guildId, roles, initialPanels }: Props) {
  const [saving, setSaving] = useState(false);

  const [panels, setPanels] = useState<TicketPanelData[]>(() => {
    if (initialPanels && initialPanels.length > 0) {
      return initialPanels;
    }
    return [
      {
        id: 'panel_' + Date.now(),
        name: '新規パネル 1',
        targetChannelId: '',
        embedId: '',
        content: '',
        panelButtons: [{ id: 'btn_1', label: 'チケット作成', emoji: '📩', style: ButtonStyle.Primary, action: TicketActionType.Create }],
        categoryId: '',
        logChannelId: '',
        staffRoleIds: [],
        mentionRoleIds: [],
        nameTemplate: 'ticket-{ユーザー名}',
        cooldown: 60,
        ticketLimit: 1,
        innerButtons: [
          { id: 'btn_claim', label: '担当する', emoji: '🙋', style: ButtonStyle.Success, action: TicketActionType.Claim },
          { id: 'btn_close', label: '閉じる', emoji: '🔒', style: ButtonStyle.Secondary, action: TicketActionType.Close }
        ],
        innerEmbedId: "",
        innerContent: ""
      }
    ];
  });

  const [activeIndex, setActiveIndex] = useState(0);

  // 現在編集中のパネル
  const activePanel = panels[activeIndex];

  // パネルのデータを更新するヘルパー
  const updateActivePanel = (updates: Partial<TicketPanelData>) => {
    const newPanels = [...panels];
    newPanels[activeIndex] = { ...activePanel, ...updates };
    setPanels(newPanels);
  };

  const addNewPanel = () => {
    const newPanel: TicketPanelData = {
      ...panels[0], // 1つ目のパネルをテンプレートにする
      id: 'panel_' + Date.now(),
      name: `新規パネル ${panels.length + 1}`,
    };
    setPanels([...panels, newPanel]);
    setActiveIndex(panels.length);
  };

  const deletePanel = (index: number) => {
    if (panels.length <= 1) return alert("最低でも1つのパネルが必要です。");
    if (!confirm("このパネル設定を削除しますか？")) return;
    const newPanels = panels.filter((_, i) => i !== index);
    setPanels(newPanels);
    setActiveIndex(0);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    console.log(panels)
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panels }),
      });
      if (!response.ok) throw new Error();
      alert("全パネルの設定を保存しました！");
    } catch (e) {
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const deployPanel = async (panel: TicketPanelData) => {
    if (!panel.targetChannelId) return alert("送信先チャンネルを選択してください。");
    
    setSaving(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/ticket/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panel }),
      });

      if (!response.ok) throw new Error();
      alert(`パネル「${panel.name}」を送信しました！`);
    } catch (e) {
      alert("送信に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4">
      
      {/* パネル選択タブ UI */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl">
        {panels.map((panel, i) => (
          <div key={panel.id} className="relative group">
            <button
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeIndex === i 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              <Layout size={16} />
              {panel.name}
            </button>
            {panels.length > 1 && (
              <button 
                onClick={() => deletePanel(i)}
                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={addNewPanel}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm text-indigo-600 hover:bg-indigo-50 transition-all border-2 border-dashed border-indigo-200"
        >
          <Plus size={16} /> 追加
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
           <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">管理用パネル名</label>
              <input 
                className="w-full text-xl font-black text-slate-800 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all bg-transparent"
                value={activePanel.name}
                onChange={(e) => updateActivePanel({ name: e.target.value })}
                placeholder="パネル名を入力..."
              />
           </div>
           <div className="text-right">
              <button
                onClick={() => deployPanel(activePanel)}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-emerald-200"
              >
                <Layout className="w-4 h-4" />
                Discordに送信
              </button>
           </div>
        </div>
      </div>

      {/* 1. パネル発行設定 */}
      <CollapsibleSection title="1. パネルの設置設定">
        <div className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">送信先チャンネル</label>
              <ChannelSelecter guildId={guildId} value={activePanel.targetChannelId} onChange={(id) => updateActivePanel({ targetChannelId: id as string })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">使用する埋め込み</label>
              <EmbedSelecter guildId={guildId} value={activePanel.embedId} onChange={(val) => updateActivePanel({ embedId: val as string })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">メッセージ内容</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-slate-900"
                placeholder="以下からチケットを作成できます。"
                value={activePanel.content}
                onChange={(e) => updateActivePanel({ content: e.target.value as any })}
              />
            </div>
          </div>
          <TicketButtonSelector 
            mode="panel" 
            serverRoles={roles} 
            buttons={activePanel.panelButtons} 
            onChange={(btns) => updateActivePanel({ panelButtons: btns })} 
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="2. チケット管理・権限設定">
        <div className="p-6 space-y-8">
          {/* 基本設定: カテゴリとログ */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                <FolderPlus size={14} className="text-indigo-500" /> チャンネル作成先カテゴリ
              </label>
              <ChannelSelecter 
                guildId={guildId} 
                type_id={4}
                value={activePanel.categoryId} 
                onChange={(id) => updateActivePanel({ categoryId: id as string })} 
                required={false}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                <FileText size={14} className="text-indigo-500" /> ログ送信先
              </label>
              <ChannelSelecter 
                guildId={guildId} 
                value={activePanel.logChannelId} 
                onChange={(id) => updateActivePanel({ logChannelId: id as string })} 
                type_id={0}
                required={false}
              />
            </div>
          </div>

          {/* ロール設定 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                <Users size={14} className="text-indigo-500" /> 対応者ロール
              </label>
              <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300">
                {roles.filter(r => r.name !== "@everyone").map(role => (
                  <label key={role.id} className="flex items-center gap-3 p-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer text-sm transition-all group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={activePanel.staffRoleIds.includes(role.id)}
                      onChange={(e) => {
                        const ids = e.target.checked 
                          ? [...activePanel.staffRoleIds, role.id] 
                          : activePanel.staffRoleIds.filter(id => id !== role.id);
                        updateActivePanel({ staffRoleIds: ids });
                      }}
                    />
                    <span style={{ color: role.color ? `#${role.color.toString(16)}` : 'inherit' }} className="font-bold group-hover:translate-x-1 transition-transform">
                      {role.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                <Bell size={14} className="text-indigo-500" /> 通知ロール
              </label>
              <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300">
                {roles.filter(r => r.name !== "@everyone").map(role => (
                  <label key={role.id} className="flex items-center gap-3 p-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer text-sm transition-all group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={activePanel.mentionRoleIds.includes(role.id)}
                      onChange={(e) => {
                        const ids = e.target.checked 
                          ? [...activePanel.mentionRoleIds, role.id] 
                          : activePanel.mentionRoleIds.filter(id => id !== role.id);
                        updateActivePanel({ mentionRoleIds: ids });
                      }}
                    />
                    <span style={{ color: role.color ? `#${role.color.toString(16)}` : 'inherit' }} className="font-medium group-hover:translate-x-1 transition-transform">
                      {role.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 詳細設定: テンプレートとクールダウン */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                <Hash size={14} /> チャンネル名規則
              </label>
              <input 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                value={activePanel.nameTemplate}
                placeholder="ticket-{user}"
                onChange={(e) => updateActivePanel({ nameTemplate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                <Clock size={14} /> クールダウン (秒)
              </label>
              <input 
                type="number"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                value={activePanel.cooldown}
                onChange={(e) => updateActivePanel({ cooldown: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                <Maximize size={14} /> 最大作成数
              </label>
              <input 
                type="number"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                value={activePanel.ticketLimit}
                onChange={(e) => updateActivePanel({ ticketLimit: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 3. チケット内アクション設定 */}
      <CollapsibleSection title="3. チケット内アクション設定">
        <div className="p-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                メッセージ内容
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] text-slate-900 bg-white"
                placeholder="チケット作成時に送信されるメッセージを入力してください..."
                value={activePanel.innerContent}
                onChange={(e) => updateActivePanel({ innerContent: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                チケット内の埋め込み
              </label>
              <div className="h-full">
                <EmbedSelecter 
                  guildId={guildId} 
                  value={activePanel.innerEmbedId} 
                  onChange={(val) => updateActivePanel({ innerEmbedId: val as string })} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block mb-4 text-xs font-black text-slate-500 uppercase tracking-wider">
              アクションボタンの設定
            </label>
            <TicketButtonSelector 
              mode="ticket" 
              serverRoles={roles} 
              buttons={activePanel.innerButtons} 
              onChange={(btns) => updateActivePanel({ innerButtons: btns })} 
            />
          </div>
        </div>
      </CollapsibleSection>

      <div className="sticky bottom-6 flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-12 py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? "保存中..." : "全てのパネル設定を保存"}
        </button>
      </div>
    </div>
  );
}