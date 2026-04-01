"use client";

import { Terminal, Save, Pin, Trash2, Send, Delete, Edit2, Plus } from "lucide-react";
import { useState } from "react";
import DiscordEmbedBuilder from "@/components/EmbedBuilder";
import CollapsibleSection from "@/components/CollapsibleSection";
import { EmbedSetting, PinMessageSetting } from "@/lib/api/requests"; // 型定義
import Modal from "@/components/Modal";
import ChannelSelecter from "@/components/channel-selecter";
import { useRouter } from "next/navigation";
import CommandsControl from "@/components/commands";
import commands from "@/constants/commands/embed";

interface Props {
  guildId: string;
  initialEmbeds: EmbedSetting[]; // すでにGoバックエンドから取得済みのリスト
  initChannels: any[];
  initPins: PinMessageSetting[];
}

export default function EmbedEditorClient({ guildId, initialEmbeds, initChannels, initPins }: Props) {
  const router = useRouter();

  const [savedEmbeds, setSavedEmbeds] = useState<EmbedSetting[]>(initialEmbeds);
  const [currentEmbedData, setCurrentEmbedData] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string>("");
  const [sendingContent, setSendingContent] = useState<string>("");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [channelSelecterValue, setChannelSelecterValue] = useState("");

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pins, setPins] = useState(initPins);

  const reFetch = async () => {
    try {
      const res =await fetch(`/api/guilds/${guildId}/modules/embed`);
      if (!res.ok) throw new Error(`RefreshError: ${res.statusText}`)

      const json = await res.json();

      setSavedEmbeds(json.settings);
    } catch (e) {
      console.error(e);
      return;
    }
  }

  // 保存処理 (Next.jsのAPI Route /api/guilds/[id]/modules/embed を叩く)
  const handleSave = async () => {
    // Builder側で入力されたタイトルをNameとして扱う
    const name = currentEmbedData?.title;
    if (!name) {
      alert("埋め込みのタイトルを入力してください。");
      return;
    }

    setSaving(true);
    try {
      // 修正したNext.jsのAPI RouteへPOST
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentEmbedData), // Titleを含むEmbed Dict全体を送信
      });

      if (!response.ok) throw new Error("Failed to save");

      // Go側から返ってくる構造に合わせてリストを更新
      const newSetting: EmbedSetting = {
        guild_id: guildId,
        name: name,
        data: currentEmbedData,
      };

      setSavedEmbeds((prev) => {
        const filtered = prev.filter((e) => e.name !== name);
        return [...filtered, newSetting];
      });
      
      alert("埋め込みを保存しました！");
    } catch (error) {
      console.error(error);
      alert("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
      await reFetch();
    }
  };

  const handleEditInitiate = (embed: EmbedSetting) => {
    setCurrentEmbedData(embed.data); 
    setEditingId(String(embed.ID)); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetEditor = () => {
    setCurrentEmbedData(null);
    setEditingId(null);
  };

  // 削除処理
  const handleDelete = async (name: string, id: string) => {
    if (!confirm(`埋め込み「${name}」を削除してもよろしいですか？`)) return;

    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embed_id: Number(id) }),
      });

      if (response.ok) {
        setSavedEmbeds((prev) => prev.filter((e) => String(e.ID) !== id));
      } else {
        alert("削除に失敗しました。");
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      await reFetch();
    }
  };

  const handleSend = async () => {
    if (channelSelecterValue == "") {
      alert("チャンネルを選択してください。")
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedId: Number(sendingId), channelId: channelSelecterValue, content: sendingContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "送信に失敗しました");
      }

      setIsSendModalOpen(false);
      setSendingId("");
      setSendingContent("");
      setChannelSelecterValue("");

      alert("送信しました！")
    } catch (error) {
      console.error("Send error:", error);
      alert("送信中にエラーが発生しました。");
    } finally {
      setSending(false);
      await reFetch();
    }
  };

  const handleCreatePin = async () => {
    if (channelSelecterValue == "") {
      alert("チャンネルを選択してください。")
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channelSelecterValue,
          embedId: sendingId,
          content: sendingContent,
        }),
      });

      if (!response.ok) throw new Error("ピン作成失敗");
      
      const { data: created }: { data: PinMessageSetting } = await response.json();
      setPins((prev) => [
        ...prev.filter((pin) => pin.channel_id !== created.channel_id),
        created,
      ]);

      setIsPinModalOpen(false);
      setSendingId("");
      setSendingContent("");
      setChannelSelecterValue("");

      alert("ピンメッセージを設定しました！");
      setSending(false);
    } catch (error) {
      alert("ピン設定エラー");
    } finally {
      setSending(false);

      await reFetch();
    }
  };

  const handleDeletePin = async (channelId: string) => {
    if (!confirm("このチャンネルのピン留め設定を解除してもよろしいですか？\n(Discord上のメッセージは削除されませんが、自動更新は止まります)")) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/modules/embed/pin?channel_id=${channelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "削除に失敗しました");
      }

      setPins((prev) => prev.filter((p) => p.channel_id !== channelId));
      
      alert("ピン留め設定を削除しました。");
    } catch (error: any) {
      console.error("Delete Pin Error:", error);
      alert(`エラー: ${error.message}`);
    } finally {
      setSending(false);
      await reFetch();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <div className="flex gap-2">
          {editingId && (
            <button
              onClick={handleResetEditor}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              新規作成へ
            </button>
          )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "現在の埋め込みを保存"}
        </button>
      </div>
      </div>

      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">エディター</h2>
        </div>
        
        <DiscordEmbedBuilder 
          initialData={currentEmbedData} 
          onChange={setCurrentEmbedData} 
        />
      </section>

      <CollapsibleSection title={`保存済みの埋め込み (${savedEmbeds.length})`}>
        <div className="mt-4 space-y-3">
          {savedEmbeds.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400">保存された埋め込みはありません。</p>
            </div>
          ) : (
            savedEmbeds.map((embed) => (
              <div key={embed.name} className="flex-1 items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">               
                <div className="flex items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  
                  {/* 情報エリア：flex-1 で残りのスペースをすべて占有させる */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">
                      {embed.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {typeof embed.data.description === 'string' 
                        ? (embed.data.description.length > 20 
                            ? `${embed.data.description.slice(0, 20)}...` 
                            : embed.data.description)
                        : "説明なし"}
                    </p>
                  </div>

                  {/* アクションエリア：ml-auto で強制的に右端へ押し出す */}
                  <div className="flex items-center gap-2 ml-auto pl-4">
                    <button 
                      onClick={() => handleEditInitiate(embed)}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                      title="エディターで編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => { setIsSendModalOpen(true); setSendingId(String(embed.ID)); }}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => { 
                        const targetId = String(embed.ID);
                        if (!targetId || targetId === "undefined") {
                          console.error("IDが見つかりません:", embed);
                          return;
                        }
                        setSendingId(targetId);
                        setIsPinModalOpen(true);
  
                      }}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    <button 
                      onClick={() => handleDelete(embed.name, String(embed.ID))}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      <Modal isOpen={isSendModalOpen} onClose={() => {
        setIsSendModalOpen(false);
        setSendingContent("");
        setSendingId("");
      }}>
        <h2 className="text-xl font-bold mb-2 text-black">埋め込みを送信する</h2>
        <ChannelSelecter guildId={guildId} type_id={0} value={channelSelecterValue} onChange={(val) => setChannelSelecterValue(val)} initChannels={initChannels}></ChannelSelecter><br/>

        <textarea
          className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-slate-900"
          placeholder="埋め込みを見てください。"
          value={sendingContent}
          onChange={(e) => setSendingContent(e.target.value as any)}
        />

        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {sending ? "送信中..." : "送信する"}
        </button>
      </Modal>

      <CollapsibleSection title={`有効なピン留め設定 (${pins.length})`}>
        <div className="mt-4 space-y-3">
          {pins.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-slate-400 text-sm">現在、ピンメッセージはありません。</p>
            </div>
          ) : (
            pins.map((pin) => (
              <div 
                key={pin.channel_id} 
                className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-lg border border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Pin className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      チャンネル名：{initChannels.find(c => c.id === pin.channel_id)?.name || pin.channel_id}
                    </h3>
                    <p className="text-xs text-slate-500">最後のメッセージID: {pin.last_message_id}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeletePin(pin.channel_id)}
                  disabled={sending}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="設定を解除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      <Modal isOpen={isPinModalOpen} onClose={() => {
        setIsPinModalOpen(false)
        setSendingContent("");
        setSendingId("");
      }}>
        <h2 className="text-xl font-bold mb-4 text-black">
          ピンメッセージ設定
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">送信先チャンネル</label>
            <ChannelSelecter 
              guildId={guildId} 
              type_id={0} 
              value={channelSelecterValue} 
              onChange={setChannelSelecterValue} 
              initChannels={initChannels} 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">メッセージ本文 (オプション)</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-900 min-h-[80px]"
              placeholder="埋め込みの上に表示されるテキストを入力..."
              value={sendingContent}
              onChange={(e) => setSendingContent(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreatePin}
            disabled={sending || !channelSelecterValue}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md disabled:opacity-50 bg-blue-500`}
          >
            {sending ? "処理中..." : "ピンとして登録"}
          </button>
        </div>
      </Modal>
      
      <CollapsibleSection title="コマンド設定">
        <CommandsControl guildId={guildId} targetCommands={commands}></CommandsControl>
      </CollapsibleSection>
    </div>
  );
}