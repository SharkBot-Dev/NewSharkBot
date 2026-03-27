"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import ChannelSelecter from "@/components/channel-selecter";
import EmbedSelecter from "@/components/EmbedSelecter";
import ToggleSwitch from "@/components/toggleSwitch";
import CollapsibleSection from "@/components/CollapsibleSection";

interface Setting {
  enabled: boolean;
  channelId: string;
  content: string;
  embed_id: any;
}

interface Props {
  guildId: string;
  initialData: { welcome: Setting; goodbye: Setting };
}

export default function WelcomeGoodbyeEditor({ guildId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [welcome, setWelcome] = useState<Setting>({
    ...initialData.welcome,
    channelId: initialData.welcome.channelId || "",
    content: initialData.welcome.content || "",
    embed_id: initialData.welcome.embed_id || null,
  });
  const [goodbye, setGoodbye] = useState<Setting>({
    ...initialData.goodbye,
    channelId: initialData.goodbye.channelId || "",
    content: initialData.goodbye.content || "",
    embed_id: initialData.goodbye.embed_id || null,
  });

  const handleWelcomeSave = async () => {
    setSaving(true);
    try {
      if (!welcome.enabled) {
        const response = await fetch(`/api/guilds/${guildId}/modules/welcome`, {
          headers: { "Content-Type": "application/json" },
          method: "DELETE",
        });

        if (!response.ok) throw new Error();

        alert("保存しました！");
        return
      }

      const body = {
        welcome: {
          channel_id: welcome.channelId,
          content: welcome.content,
          embed_id: welcome.embed_id ? Number(welcome.embed_id) : null,
        }
      };

      const response = await fetch(`/api/guilds/${guildId}/modules/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error();
      alert("保存しました！");
    } catch (e) {
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleGoodbyeSave = async () => {
    setSaving(true);
    try {
      if (!goodbye.enabled) {
        const response = await fetch(`/api/guilds/${guildId}/modules/goodbye`, {
          headers: { "Content-Type": "application/json" },
          method: "DELETE",
        });

        if (!response.ok) throw new Error();

        alert("保存しました！");
        return
      }

      const body = {
        goodbye: {
          channel_id: goodbye.channelId,
          content: goodbye.content,
          embed_id: goodbye.embed_id ? Number(goodbye.embed_id) : null,
        }
      };

      const response = await fetch(`/api/guilds/${guildId}/modules/goodbye`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error();
      alert("保存しました！");
    } catch (e) {
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 参加メッセージ設定 */}
      <CollapsibleSection title="参加メッセージの設定">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-700">機能を有効にする</span>
            <ToggleSwitch 
              isEnabled={welcome.enabled} 
              onToggle={() => setWelcome({ ...welcome, enabled: !welcome.enabled })} 
            />
          </div>
          
          <div className={`space-y-4 transition-opacity ${welcome.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">送信先チャンネル</label>
                <ChannelSelecter 
                  guildId={guildId} 
                  value={welcome.channelId} 
                  onChange={(id) => setWelcome({ ...welcome, channelId: id })} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">使用する埋め込み</label>
                <EmbedSelecter 
                  guildId={guildId} 
                  value={welcome.embed_id} 
                  onChange={(val) => setWelcome({ ...welcome, embed_id: val })} 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">メッセージ本文</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-slate-900"
                placeholder="例: {user} さん、サーバーへようこそ！"
                value={welcome.content}
                onChange={(e) => setWelcome({ ...welcome, content: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleWelcomeSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "設定を保存"}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* 退出メッセージ設定 */}
      <CollapsibleSection title="退出メッセージの設定">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-700">機能を有効にする</span>
            <ToggleSwitch 
              isEnabled={goodbye.enabled} 
              onToggle={() => setGoodbye({ ...goodbye, enabled: !goodbye.enabled })} 
            />
          </div>

          <div className={`space-y-4 transition-opacity ${goodbye.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">送信先チャンネル</label>
                <ChannelSelecter 
                  guildId={guildId} 
                  value={goodbye.channelId} 
                  onChange={(id) => setGoodbye({ ...goodbye, channelId: id })} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">使用する埋め込み</label>
                <EmbedSelecter 
                  guildId={guildId} 
                  value={goodbye.embed_id} 
                  onChange={(val) => setGoodbye({ ...goodbye, embed_id: val })} 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">メッセージ本文</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px] text-slate-500"
                placeholder="例: {user} さんがサーバーを去りました。"
                value={goodbye.content}
                onChange={(e) => setGoodbye({ ...goodbye, content: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGoodbyeSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "設定を保存"}
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}