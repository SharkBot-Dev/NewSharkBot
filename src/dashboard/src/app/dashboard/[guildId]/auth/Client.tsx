"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmbedSelecter from "@/components/EmbedSelecter";
import ButtonEditorItem from "@/components/ButtonEditorItem"; 
import { Send, ShieldCheck, Plus, Layout } from "lucide-react";

enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
}

interface ButtonConfig {
  id: string;
  label: string;
  emoji: string;
  style: ButtonStyle;
  roleId: string;
  type: 'click' | 'web';
}

interface Props {
  guildId: string;
  roles: { id: string, name: string, managed: boolean }[];
  channels: { id: string, name: string }[];
}

export default function AuthClient({ guildId, roles, channels }: Props) {
  const [embed, setEmbed] = useState<string | null>(null);

  const [content, setContent] = useState("サーバーへようこそ！下のボタンから認証を行ってください。");
  const [targetChannelId, setTargetChannelId] = useState("");
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { id: "btn-1", label: "認証する", emoji: "✅", style: ButtonStyle.Success, roleId: "", type: "web" }
  ]);

  const addButton = () => {
    if (buttons.length >= 5) {
      alert("ボタンは最大5個までです。");
      return;
    }
    const newId = `btn-${Math.random().toString(36).substr(2, 9)}`;
    setButtons([...buttons, { 
      id: newId, 
      label: "新規ボタン", 
      emoji: "🛡️", 
      style: ButtonStyle.Primary, 
      roleId: "", 
      type: "click" 
    }]);
  };

  const updateButton = (id: string, updates: Partial<ButtonConfig>) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteButton = (id: string) => {
    if (buttons.length <= 1) {
      alert("最低でも1つのボタンが必要です。");
      return;
    }
    setButtons(buttons.filter(b => b.id !== id));
  };

  const handleSaveAndSend = async () => {
    if (!targetChannelId) {
      alert("送信先チャンネルを選択してください。");
      return;
    }
    if (buttons.some(b => !b.roleId)) {
      alert("すべてのボタンに付与するロールを設定してください。");
      return;
    }
    if (buttons.some(b => !b.label && !b.emoji)) {
      alert("ボタンにはラベルまたは絵文字のどちらかが必要です。");
      return;
    }

    const payload = {
      channelId: targetChannelId,
      embed: embed,
      buttons: buttons,
      content: content
    };

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("送信に失敗しました");
      
      alert("認証パネルを送信しました！");
    } catch (error) {
      console.error(error);
      alert("サーバーエラーが発生しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" size={28} /> 認証パネル設定
            </h1>
            <p className="text-sm text-slate-500 font-medium">認証ボタンとメッセージをカスタマイズして送信します。</p>
          </div>
          <button 
            onClick={handleSaveAndSend}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Send size={20} />
            パネルを送信
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1">
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                <Layout size={14} /> 送信先チャンネル
              </label>
              <select 
                value={targetChannelId}
                onChange={(e) => setTargetChannelId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="">チャンネルを選択してください</option>
                {channels.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
              </select>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                <Layout size={14} /> メッセージ本文
              </label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="埋め込みの上に表示されるテキストを入力..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all min-h-[100px] resize-none"
              />
            </div>

            <CollapsibleSection title="認証ボタンの設定">
              <div className="space-y-4 p-2">
                {buttons.map((btn, idx) => (
                  <ButtonEditorItem 
                    key={btn.id}
                    id={btn.id}
                    index={idx}
                    config={btn}
                    serverRoles={roles}
                    onUpdate={updateButton}
                    onDelete={deleteButton}
                  />
                ))}
                
                {buttons.length < 5 && (
                  <button 
                    onClick={addButton}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                    ボタンを追加 ({buttons.length}/5)
                  </button>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="メッセージの見た目">
              <div className="p-2">
                <EmbedSelecter value={embed} onChange={setEmbed} guildId={guildId} />
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}