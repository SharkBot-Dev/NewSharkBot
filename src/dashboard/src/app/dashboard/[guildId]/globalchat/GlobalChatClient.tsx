"use client";

import { Save, Trash2, Globe, X, Settings2, InfoIcon } from "lucide-react";
import { useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import ChannelSelecter from "@/components/channel-selecter";
import { useRouter } from "next/navigation";

interface Props {
  guildId: string;
  initChannels: any[]; // サーバー内の全チャンネル
  settings: any[];     // 現在の接続設定一覧
  userId: string;
}

export default function GlobalChatClient({ guildId, initChannels, settings, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("main");

  const [roomEditModal, setRoomEditModal] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<any>(null);

  const [infoModal, setInfoModal] = useState<boolean>(false);
  const [infoData, setInfoData] = useState<any>(null);

  const handleConnect = async () => {
    if (!selectedChannel || !roomName) {
      alert("チャンネルと部屋名を選択してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/globalchat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: selectedChannel, room_name: roomName }),
      });
      if (!res.ok) throw new Error();
      alert("接続設定を保存しました。");
      router.refresh();
    } catch {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm("この接続を解除しますか？")) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/globalchat`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId }),
      });
      if (!res.ok) throw new Error();
      alert("接続を解除しました");
      router.refresh();
    } catch {
      alert("削除に失敗しました");
    }
  };

  const checkEditRoom = async (roomName: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/globalchat/rooms/${encodeURIComponent(roomName)}`);
      if (!res.ok) throw new Error("Forbidden");

      const data = await res.json();
      const isOwner = data.members.some((m: any) => m.user_id === userId && m.role === "owner");

      if (!isOwner) throw new Error("NoOwnerRole");

      setEditingData(data);
      setRoomEditModal(true);
    } catch (error) {
      alert("このルームを編集する権限がありません。");
    }
  };

  const handleUpdateRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/globalchat/rooms/${encodeURIComponent(editingData.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            description: editingData.description || "",
            rule: editingData.rule || "",
            slowmode: parseInt(editingData.slowmode) || 0,
            min_account_age: parseInt(editingData.min_account_age) || 0,
        }),
      });

      if (!res.ok) throw new Error();
      alert("ルーム設定を更新しました");
      setRoomEditModal(false);
      router.refresh();
    } catch {
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleInfoRoom = async (roomName: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/globalchat/rooms/${encodeURIComponent(roomName)}`);
      if (!res.ok) throw new Error("Forbidden");

      const data = await res.json();

      setInfoData(data);
      setInfoModal(true);
    } catch (error) {
      alert("エラーが発生しました。");
    }
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection title="現在の接続状況" defaultOpen={true}>
        <div className="overflow-x-auto text-black">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-4 font-medium">チャンネル</th>
                <th className="py-3 px-4 font-medium">接続先部屋</th>
                <th className="py-3 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="">
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center">接続なし</td>
                </tr>
              ) : (
                settings.map((conn) => (
                  <tr key={conn.channel_id} className="border-b border-white/5">
                    <td className="py-3 px-4">
                      {initChannels.find(c => c.id === conn.channel_id)?.name || conn.channel_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
                        # {conn.room_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleInfoRoom(conn.room_name)}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition"
                        aria-label="ルーム情報"
                      >
                        <InfoIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => checkEditRoom(conn.room_name)}
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition"
                        aria-label="ルーム設定"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(conn.channel_id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition"
                        aria-label="退出"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title="新しいチャンネルを接続" 
      >
        <div className="p-4 space-y-4 bg-white/5 rounded-xl border border-white/10 text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">送信先チャンネル</label>
              <ChannelSelecter 
                initChannels={initChannels} 
                value={selectedChannel} 
                onChange={setSelectedChannel} 
                guildId={guildId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">参加する部屋名</label>
              <input 
                type="text"
                placeholder="例: test"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition"
            >
              <Save className="w-4 h-4" />
              {loading ? "保存中..." : "接続を保存"}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {infoModal && infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl text-gray-800">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold flex items-center gap-2 text-gray-900">
                <Globe className="w-4 h-4 text-blue-600" />
                ルーム情報: {infoData.name}
              </h3>
              <button 
                onClick={() => setInfoModal(false)}
                className="hover:bg-gray-200 p-1 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">説明</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={infoData.description || ""}
                  disabled={true}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">ルール</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={infoData.rule || ""}
                  disabled={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">低速モード (秒)</label>
                  <input type="number" 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={infoData.slowmode}
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">最小アカウント作成日数</label>
                  <input type="number"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={infoData.min_account_age}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {roomEditModal && editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl text-gray-800">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold flex items-center gap-2 text-gray-900">
                <Globe className="w-4 h-4 text-blue-600" />
                ルーム設定: {editingData.name}
              </h3>
              <button 
                onClick={() => setRoomEditModal(false)}
                className="hover:bg-gray-200 p-1 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">説明</label>
                <input 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editingData.description || ""}
                  onChange={e => setEditingData({...editingData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">ルール</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editingData.rule || ""}
                  onChange={e => setEditingData({...editingData, rule: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">低速モード (秒)</label>
                  <input type="number" 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingData.slowmode}
                    onChange={e => setEditingData({...editingData, slowmode: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">最小アカウント作成日数</label>
                  <input type="number"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingData.min_account_age}
                    onChange={e => setEditingData({...editingData, min_account_age: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setRoomEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleUpdateRoom}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {loading ? "保存中..." : <><Save className="w-4 h-4" /> 保存</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}