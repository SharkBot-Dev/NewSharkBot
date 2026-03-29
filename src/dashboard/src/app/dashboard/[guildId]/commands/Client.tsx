"use client";

import { Plus, Trash2, Shield, Lock, Hash, Save, GripVertical, MessageSquare, UserPlus, Trash, Variable, Send, Mail, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import MultiSelector from "@/components/MultiSelector";
import EmbedSelecter from "@/components/EmbedSelecter";

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  guildId: string;
  commands: any[];
  roles: any[];
  channels: any[];
  initialPrefixes: string[];
}

function parseActionPayload(payload: unknown) {
  if (!payload) return {};
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

export default function CommandsClient({ guildId, commands: initialCommands, roles, channels, initialPrefixes }: Props) {
  const [commands, setCommands] = useState(initialCommands);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<any>(null);
  
  const [prefixes, setPrefixes] = useState<string[]>(initialPrefixes);
  const [newPrefix, setNewPrefix] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSaveAll = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands, prefixes }),
      });
      if (res.ok) {
        alert("全設定を保存しました");
      } else {
        const data = await res.json();
        alert(`保存に失敗しました: ${data.error || res.statusText}`);
      }
    } catch (e) {
      alert("保存に失敗しました");
    }
  };

  const openEditModal = (cmd: any, index: number | null = null) => {
    setEditingCommand(JSON.parse(JSON.stringify(cmd)));
    setEditingIndex(index); 
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
    const newCmds = [...prev];
      
      if (editingIndex !== null && editingIndex !== -1) {
        newCmds[editingIndex] = editingCommand;
      } else {
        newCmds.push(editingCommand);
      }
      
      return newCmds;
    });
    setIsModalOpen(false);
    setEditingIndex(null);
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
          <div key={idx} className="bg-white/5 p-4 rounded-xl border border-black/10 hover:border-blue-500/50 transition">
            <div className="flex justify-between items-start mb-3">
              <span className="text-blue-400 font-mono text-xl font-bold">{!cmd.is_auto_reply && prefixes[0]}{cmd.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(cmd, idx)} className="p-2 hover:bg-white/10 rounded-lg text-xs">編集</button>
                <button className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg" onClick={() => handleDeleteCommand(idx)}><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase">{cmd.required_permission}</span>
              {cmd.actions.length > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{cmd.actions.length} Actions</span>}
            </div>
          </div>
        ))}
        <button onClick={() => openEditModal({ name: "", allowed_roles: [], allowed_channels: [], required_permission: "NONE", actions: [], is_auto_reply: false, match_mode: "contains" }, null)} 
                className="border-2 border-dashed border-black/10 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition text-black">
          <Plus size={24} /> <span>新規作成</span>
        </button>
        <button
        onClick={handleSaveAll}
        className="border-2 border-dashed border-black/10 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition text-black"
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

            <section className="bg-white/5 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">自動応答モード</h3>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Prefixなしで反応</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                  checked={editingCommand.is_auto_reply}
                  onChange={e => setEditingCommand({...editingCommand, is_auto_reply: e.target.checked, match_mode: e.target.checked ? "contains" : "exact"})}
                />
              </div>

              {editingCommand.is_auto_reply && (
                <div className="pt-2 border-t border-white/5">
                  <label className="text-[10px] text-gray-400 uppercase font-bold">一致方式</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => setEditingCommand({...editingCommand, match_mode: "exact"})}
                      className={`py-2 text-xs rounded-lg border transition ${editingCommand.match_mode === "exact" ? "bg-blue-600 border-blue-500" : "bg-black/20 border-white/10 text-gray-400"}`}
                    >
                      完全一致
                    </button>
                    <button 
                      onClick={() => setEditingCommand({...editingCommand, match_mode: "contains"})}
                      className={`py-2 text-xs rounded-lg border transition ${editingCommand.match_mode === "contains" ? "bg-blue-600 border-blue-500" : "bg-black/20 border-white/10 text-gray-400"}`}
                    >
                      部分一致
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 italic">
                    {editingCommand.match_mode === "exact" ? "「こんにちは」というメッセージのみ反応します。" : "「あ、こんにちは！」などの文章内でも反応します。"}
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={16}/> 実行アクション</h3>
              <CustomCommandsControl 
                roles={roles}
                actions={editingCommand.actions} 
                onChange={(newActions: any) => setEditingCommand({...editingCommand, actions: newActions})} 
                guildId={guildId}
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

export function CustomCommandsControl({ actions, onChange, roles, guildId }: { actions: any[], onChange: any, roles: any[], guildId: string }) {
  const MAX_ACTIONS = 15;

  const itemIds = useMemo(() => actions.map((_, i) => `action-${i}`), [actions.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string);
      const newIndex = itemIds.indexOf(over.id as string);
      onChange(arrayMove(actions, oldIndex, newIndex));
    }
  };

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <ActionButton onClick={() => addAction("reply")} icon={<MessageSquare size={14}/>} label="Reply" />
        <ActionButton onClick={() => addAction("send")} icon={<Send size={14}/>} label="Send" />
        <ActionButton onClick={() => addAction("role")} icon={<UserPlus size={14}/>} label="Role" />
        <ActionButton onClick={() => addAction("variable")} icon={<Variable size={14}/>} label="Var" />
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {actions.map((action, index) => (
              <SortableActionItem 
                key={`action-${index}`}
                id={`action-${index}`}
                index={index}
                action={action}
                payload={parseActionPayload(action.payload)}
                updatePayload={updatePayload}
                removeAction={(idx: number) => onChange(actions.filter((_, i) => i !== idx))}
                roles={roles}
                guildId={guildId}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
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

function SortableActionItem({ id, index, action, payload, updatePayload, removeAction, roles, guildId }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-3">
      <div className="bg-white/5 px-3 py-2 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <div {...listeners} {...attributes} className="p-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white transition">
            <GripVertical size={14} />
          </div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{action.type}</span>
        </div>
        <button onClick={() => removeAction(index)} className="text-gray-500 hover:text-red-400 transition">
          <Trash size={14}/>
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {(action.type === "reply" || action.type === "send" || action.type === "dm") && (
          <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">ランダム応答モード</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                  checked={payload.is_random || false}
                  onChange={e => updatePayload(index, { ...payload, is_random: e.target.checked })}
                />
              </div>

              {!payload.is_random ? (
                <textarea 
                  className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-sm h-24 outline-none focus:border-blue-500/50"
                  placeholder="送信内容を入力..."
                  value={payload.content || ""}
                  onChange={e => updatePayload(index, { ...payload, content: e.target.value })}
                />
              ) : (
                <div className="space-y-2">
                  {(payload.messages || [""]).map((msg: string, mIdx: number) => (
                    <div key={mIdx} className="flex gap-2">
                      <input 
                        className="flex-1 bg-black/20 border border-white/10 p-2 rounded-lg text-sm outline-none focus:border-blue-500/50"
                        placeholder={`候補 ${mIdx + 1}`}
                        value={msg}
                        onChange={e => {
                          const newMsgs = [...(payload.messages || [""])];
                          newMsgs[mIdx] = e.target.value;
                          updatePayload(index, { ...payload, messages: newMsgs });
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newMsgs = payload.messages.filter((_: any, i: number) => i !== mIdx);
                          updatePayload(index, { ...payload, messages: newMsgs.length ? newMsgs : [""] });
                        }}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => updatePayload(index, { ...payload, messages: [...(payload.messages || [""]), ""] })}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> 候補を追加
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">共通 Embed (任意)</label>
                <EmbedSelecter guildId={guildId} value={payload.embed_id || ""} onChange={e => updatePayload(index, { ...payload, embed_id: e })} />
              </div>
            </div>
        )}

        {action.type === "role" && (
          <div className="flex gap-2">
            <select className="bg-black/40 border border-white/10 p-2 rounded text-xs"value={payload.type || "add"} onChange={e => updatePayload(index, { ...payload, type: e.target.value })}>
              <option value="add">付与</option>
              <option value="remove">剥奪</option>
            </select>
            <select className="flex-1 bg-black/40 border border-white/10 p-2 rounded text-xs" value={payload.role_id || ""} onChange={e => updatePayload(index, { ...payload, role_id: e.target.value })}>
              <option value="">ロールを選択...</option>
              {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
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
}

function getDefaultPayload(type: string) {
  switch(type) {
    case "reply": case "send": case "dm": 
      return { 
        content: "", 
        embed_id: "", 
        is_random: false, 
        messages: [""] 
      };
    case "role": return { role_id: "", type: "add" };
    case "variable": return { key: "", value: "" };
    default: return {};
  }
}