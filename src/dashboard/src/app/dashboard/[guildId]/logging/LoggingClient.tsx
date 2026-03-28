"use client";

import { Trash2, Plus, X, Hash, ListPlus } from "lucide-react";
import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import ChannelSelecter from "@/components/channel-selecter";

const EVENT_PRESETS = [
  { name: "message_delete", label: "メッセージ削除" },
  { name: "message_edit", label: "メッセージ編集" },
  { name: "member_kick", label: "メンバーキック (監査ログ)" },
  { name: "member_ban", label: "メンバーBAN (監査ログ)" },
  { name: "channel_create", label: "チャンネル作成" },
  { name: "channel_delete", label: "チャンネル削除" },
  { name: "role_create", label: "ロール作成" },
  { name: "role_delete", label: "ロール削除" },
];

interface LoggingEvent {
  event_name: string;
  log_channel_id: string;
  webhook_url: string;
  ignored_channels: string[];
}

interface LoggingSetting {
  guild_id: string;
  events: LoggingEvent[];
  global_ignored_channels: string[];
}

export default function LoggingClient({ guildId, setting: initialSetting, channels }: { guildId: string, setting: LoggingSetting, channels: any[] }) {
  const [setting, setSetting] = useState<LoggingSetting>(initialSetting || {
    guild_id: guildId,
    events: [],
    global_ignored_channels: []
  });

  const [loading, setLoading] = useState(false);

  const getChannelById = (targetId: string) => {
    const channel = channels.find(c => c.id === targetId);
    
    return channel ? channel.name : "不明なチャンネル";
  };

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    if (setting.events.filter((value) => value.log_channel_id === "")) {
      alert("ログには必ずチャンネルidを指定してください。");
      return
    }

    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/logging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setting),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "保存に失敗しました。");
      }

      alert("保存しました。");
    } catch (error) {
      console.error("Save Error:", error);
      alert("エラーが発生しました。"); 
    } finally {
      setLoading(false);
    }
  };

  const addEvent = (eventName: string) => {
    if (setting.events.some(e => e.event_name === eventName)) {
      return;
    }
    const newEvent: LoggingEvent = {
      event_name: eventName,
      log_channel_id: "",
      webhook_url: "",
      ignored_channels: []
    };
    setSetting({ ...setting, events: [...setting.events, newEvent] });

    const Name = EVENT_PRESETS.find((preset) => preset.name === eventName)?.label || ""
  };

  const isInEvent = (eventName: string) => {
    if (setting.events.some(e => e.event_name === eventName)) {
      return true;
    }

    return false;
  }

  const removeChannel = (list: string[], id: string) => list.filter(item => item !== id);
  const addChannel = (list: string[], id: string) => id && !list.includes(id) ? [...list, id] : list;

  return (
    <div className="space-y-8 p-6 pb-32 max-w-5xl mx-auto text-black">
      <div className="bg-muted/20 p-6 rounded-xl border border-dashed border-muted-foreground/30">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <ListPlus size={18} /> ログを追加する
        </h3>
        <div className="flex flex-wrap gap-3">
          {EVENT_PRESETS.map(preset => (
            !isInEvent(preset.name) && (
            <button
              key={preset.name}
              onClick={() => addEvent(preset.name)}
              className="bg-background hover:bg-primary hover:text-primary-foreground border px-4 py-2 rounded-lg text-sm transition-all shadow-sm flex items-center gap-2 bg-white"
            >
              <Plus size={14} /> {preset.label}
            </button>
            )
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">現在の設定リスト</h2>
        
        {setting.events.map((event, index) => (
          <div key={index} className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 w-2 h-6 rounded-full" />
                {EVENT_PRESETS.find((preset) => preset.name === event.event_name)?.label || ""} 
              </div>
              <button onClick={() => setSetting({...setting, events: setting.events.filter((_, i) => i !== index)})} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">送信先チャンネル</label>
                <ChannelSelecter guildId={guildId} value={event.log_channel_id} onChange={val => {
                  const evs = [...setting.events];
                  evs[index].log_channel_id = val;
                  setSetting({...setting, events: evs});
                }} />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-bold uppercase text-orange-500">このイベントのみ無視するチャンネル</label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-orange-500/5 border-orange-500/10">
                  {event.ignored_channels?.map(id => (
                    <span key={id} className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-xs border border-orange-500/20">
                      {getChannelById(id)}
                      <button onClick={() => {
                        const evs = [...setting.events];
                        evs[index].ignored_channels = removeChannel(evs[index].ignored_channels, id);
                        setSetting({...setting, events: evs});
                      }}><X size={14} /></button>
                    </span>
                  ))}
                  <div className="w-40"><ChannelSelecter guildId={guildId} value="" onChange={val => {
                    const evs = [...setting.events];
                    evs[index].ignored_channels = addChannel(evs[index].ignored_channels, val);
                    setSetting({...setting, events: evs});
                  }} /></div>
                </div><br/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CollapsibleSection title="グローバル無視設定">
        <div className="p-5 space-y-4 bg-card/50 rounded-b-lg">
          <label className="text-sm font-semibold">全てのログで無視するチャンネル</label>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background/50">
            {setting.global_ignored_channels.map(id => (
              <div key={id} className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs border">
                <Hash size={12} /> {getChannelById(id)}
                <button onClick={() => setSetting({ ...setting, global_ignored_channels: removeChannel(setting.global_ignored_channels, id) })}><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="max-w-xs">
            <ChannelSelecter guildId={guildId} value="" onChange={(val) => setSetting({ ...setting, global_ignored_channels: addChannel(setting.global_ignored_channels, val) })} />
          </div>
        </div>
      </CollapsibleSection>

      <button onClick={() => handleSave()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-md">設定を保存する</button>
    </div>
  );
}