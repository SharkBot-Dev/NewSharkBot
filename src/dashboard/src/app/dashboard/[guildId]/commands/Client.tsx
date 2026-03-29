"use client";

import { Plus, Trash2, Shield, Lock, Hash, Save, GripVertical, MessageSquare, UserPlus, Trash, Variable, Send, Mail, Zap } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";
import MultiSelector from "@/components/MultiSelector";

interface Props {
  guildId: string;
  commands: any[];
  roles: any[];
  channels: any[];
  initialPrefixes: string[];
}

// --- メインコンポーネント ---
export default function CommandsClient({ guildId, commands: initialCommands, roles, channels, initialPrefixes }: Props) {
  const [commands, setCommands] = useState(initialCommands);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<any>(null);
  
  const [prefixes, setPrefixes] = useState<string[]>(initialPrefixes);
  const [newPrefix, setNewPrefix] = useState("");

  const handleSaveAll = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands, prefixes }),
      });
      if (res.ok) alert("全設定を保存しました");
    } catch (e) {
      alert("保存に失敗しました");
    }
  };

  const openEditModal = (cmd: any) => {
    setEditingCommand(JSON.parse(JSON.stringify(cmd)));
    setIsModalOpen(true);
  };

  const handleDeleteCommand = (index: number) => {
    if (!confirm("このコマンドを削除してもよろしいですか？")) return;

    const newCommands = [...commands];
    newCommands.splice(index, 1); 
    setCommands(newCommands);
    
    alert("削除しました。\n保存ボタンを押すと完全に保存されます。")
  };

  const confirmEdit = () => {
    setCommands(prev => {
      const index = prev.findIndex(c => c.name === editingCommand.name);
      if (index === -1) return [...prev, editingCommand];
      const newCmds = [...prev];
      newCmds[index] = editingCommand;
      return newCmds;
    });
    setIsModalOpen(false);
  };

  const addPrefix = () => {
    if (newPrefix && !prefixes.includes(newPrefix)) {
      setPrefixes([...prefixes, newPrefix]);
      setNewPrefix("");
    }
  };

  const removePrefix = (p: string) => {
    if (prefixes.length > 1) {
      setPrefixes(prefixes.filter(x => x !== p));
    } else {
      alert("最低でも1つのPrefixが必要です");
    }
  };

  return (
    <div className="p-6 space-y-6 text-black">
      <div className="flex justify-between items-center">
        <section className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 text-black">
            <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            <h2 className="text-lg font-bold">Prefix (頭文字) 設定</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
            {prefixes.map(p => (
                <div key={p} className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/50 px-3 py-1.5 rounded-lg font-mono">
                {p}
                <button onClick={() => removePrefix(p)} className="hover:text-white transition">
                    <Trash2 size={14} />
                </button>
                </div>
            ))}
            </div>

            <div className="flex gap-2">
            <input 
                className="bg-black/40 border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500 flex-1 font-mono"
                placeholder="新しいPrefixを入力 (例: !)"
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPrefix()}
            />
            <button onClick={addPrefix} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg transition">
                追加
            </button>
            </div>
            <p className="text-[10px] text-gray-500">※ Prefixは複数設定可能です。ここで設定したPrefixは、以下のコマンドに使います。</p>
        </section>
        <button onClick={handleSaveAll} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition">
          <Save size={18} /> 保存
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commands.map((cmd, idx) => (
          <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-blue-500/50 transition">
            <div className="flex justify-between items-start mb-3">
              <span className="text-blue-400 font-mono text-xl font-bold">{prefixes[0]}{cmd.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(cmd)} className="p-2 hover:bg-white/10 rounded-lg text-xs">編集</button>
                <button className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg" onClick={() => handleDeleteCommand(idx)}><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase">{cmd.required_permission}</span>
              {cmd.actions.length > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{cmd.actions.length} Actions</span>}
            </div>
          </div>
        ))}
        <button onClick={() => openEditModal({ name: "", allowed_roles: [], allowed_channels: [], required_permission: "NONE", actions: [] })} 
                className="border-2 border-dashed border-white/10 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition text-black">
          <Plus size={24} /> <span>新規作成</span>
        </button>
        <button
        onClick={handleSaveAll}
        className="border-2 border-dashed border-white/10 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition text-black"
        >
            <Save size={18} /> 全て保存
        </button>
      </div>

      {isModalOpen && editingCommand && (
        <Modal onClose={() => setIsModalOpen(false)} isOpen={isModalOpen}>
          <h2 className="text-xl font-bold mb-2 text-black">コマンドを編集する</h2>
          <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
            
            <section className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">コマンド名</label>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/10">
                <span className="text-gray-500">{prefixes[0]}</span>
                <input className="bg-transparent outline-none w-full" value={editingCommand.name} onChange={e => setEditingCommand({...editingCommand, name: e.target.value})} placeholder="hello" />
              </div>
            </section>

            <section className="bg-white/5 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/10 pb-2"><Lock size={16}/> 実行制限の設定</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase">許可ロール (複数選択可)</label>
                  <MultiSelector icon={Shield} label="ロール" options={roles} selectedIds={editingCommand.allowed_roles} onChange={(ids: any) => setEditingCommand({...editingCommand, allowed_roles: ids})} />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase">許可チャンネル (複数選択可)</label>
                  <MultiSelector icon={Hash} label="チャンネル" options={channels} selectedIds={editingCommand.allowed_channels} onChange={(ids: any) => setEditingCommand({...editingCommand, allowed_channels: ids})} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={16}/> 実行アクション</h3>
              <CustomCommandsControl 
                roles={roles}
                actions={editingCommand.actions} 
                onChange={(newActions: any) => setEditingCommand({...editingCommand, actions: newActions})} 
              />
            </section>

            <button onClick={confirmEdit} className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-bold transition sticky bottom-0 shadow-2xl">
              変更を確定する
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function CustomCommandsControl({ actions, onChange, roles }: { actions: any[], onChange: any, roles: any[] }) {
  
  const MAX_ACTIONS = 15;

  const addAction = (type: string) => {
    if (actions.length >= MAX_ACTIONS) {
      alert(`アクションは最大${MAX_ACTIONS}個までです。`);
      return;
    }

    const newAction = { type, order: actions.length, payload: JSON.stringify(getDefaultPayload(type)) };
    onChange([...actions, newAction]);
  };

  const updatePayload = (index: number, newData: any) => {
    const newActions = [...actions];
    newActions[index].payload = JSON.stringify(newData);
    onChange(newActions);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ActionButton onClick={() => addAction("reply")} icon={<MessageSquare size={14}/>} label="Reply" />
        <ActionButton onClick={() => addAction("send")} icon={<Send size={14}/>} label="Send" />
        <ActionButton onClick={() => addAction("dm")} icon={<Mail size={14}/>} label="DM" />
        <ActionButton onClick={() => addAction("role_op")} icon={<UserPlus size={14}/>} label="Role" />
        <ActionButton onClick={() => addAction("variable")} icon={<Variable size={14}/>} label="Variable" />
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const payload = JSON.parse(action.payload || "{}");
          return (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 px-3 py-2 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-600 cursor-move" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{action.type}</span>
                </div>
                <button onClick={() => onChange(actions.filter((_, i) => i !== index))} className="text-gray-500 hover:text-red-400 transition">
                  <Trash size={14}/>
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {(action.type === "reply" || action.type === "send" || action.type === "dm") && (
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-sm h-24 outline-none focus:border-blue-500/50"
                    placeholder="送信内容を入力... {user} や {args[0]} が使えます"
                    value={payload.content || ""}
                    onChange={e => updatePayload(index, { ...payload, content: e.target.value })}
                  />
                )}

                {action.type === "role_op" && (
                  <div className="flex gap-2">
                    <select className="bg-black/40 border border-white/10 p-2 rounded text-xs" value={payload.op || "add"} onChange={e => updatePayload(index, { ...payload, op: e.target.value })}>
                      <option value="add">付与</option>
                      <option value="remove">剥奪</option>
                    </select>
                    <select className="flex-1 bg-black/40 border border-white/10 p-2 rounded text-xs" value={payload.role_id || ""} onChange={e => updatePayload(index, { ...payload, role_id: e.target.value })}>
                      <option value="">ロールを選択...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                )}

                {action.type === "variable" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input className="bg-black/40 border border-white/10 p-2 rounded text-xs" placeholder="変数名" value={payload.key || ""} onChange={e => updatePayload(index, { ...payload, key: e.target.value })} />
                    <input className="bg-black/40 border border-white/10 p-2 rounded text-xs" placeholder="値" value={payload.value || ""} onChange={e => updatePayload(index, { ...payload, value: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 py-2 px-3 rounded-lg text-[10px] font-bold transition">
      {icon} {label}
    </button>
  );
}

function getDefaultPayload(type: string) {
  switch(type) {
    case "reply": case "send": case "dm": return { content: "" };
    case "role_op": return { role_id: "", op: "add" };
    case "variable": return { key: "", value: "", op: "set" };
    default: return {};
  }
}