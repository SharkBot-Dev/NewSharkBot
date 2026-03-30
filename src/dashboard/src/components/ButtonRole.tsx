import React, { useMemo } from 'react';
import { 
  Trash2, Plus, GripVertical, ShieldCheck, 
  Ticket, Lock, RotateCcw, UserPlus, Layout, Settings2, ChevronRight 
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ButtonStyle } from '@/constants/reaction_role/rolesmap';

// --- 型定義 ---
export enum TicketActionType {
  Create = 'create',
  Claim = 'claim',
  Close = 'close',
  Reopen = 'reopen',
  Delete = 'delete',
  Role = 'role'
}

export interface TicketButtonConfig {
  id: string;
  label: string;
  emoji: string;
  style: ButtonStyle;
  action: TicketActionType;
  roleId?: string;
}

type SelectorMode = 'panel' | 'ticket';

interface TicketSelectorProps {
  mode: SelectorMode;
  buttons: TicketButtonConfig[];
  serverRoles: any[];
  onChange: (newButtons: TicketButtonConfig[]) => void;
}

// --- 個別のアイテムコンポーネント ---
const SortableButtonItem: React.FC<{
  config: TicketButtonConfig;
  mode: SelectorMode;
  serverRoles: any[];
  onUpdate: (id: string, updates: Partial<TicketButtonConfig>) => void;
  onDelete: (id: string) => void;
  index: number;
}> = ({ config, mode, serverRoles, onUpdate, onDelete, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  // モードごとに選択可能なオプションを定義
  const availableActions = useMemo(() => {
    if (mode === 'panel') {
      return [
        { value: TicketActionType.Create, label: 'チケット作成', icon: <Ticket size={12} /> },
        { value: TicketActionType.Role, label: 'ロール付与', icon: <ShieldCheck size={12} /> },
      ];
    }
    return [
      { value: TicketActionType.Claim, label: '担当(Claim)', icon: <UserPlus size={12} /> },
      { value: TicketActionType.Close, label: '閉じる(Close)', icon: <Lock size={12} /> },
      { value: TicketActionType.Reopen, label: '再開(Reopen)', icon: <RotateCcw size={12} /> },
      { value: TicketActionType.Delete, label: '削除(Delete)', icon: <Trash2 size={12} /> },
    ];
  }, [mode]);

  const getStyleColor = (s: ButtonStyle) => {
    switch (s) {
      case ButtonStyle.Primary: return 'bg-[#5865F2] text-white';
      case ButtonStyle.Secondary: return 'bg-slate-500 text-white';
      case ButtonStyle.Success: return 'bg-emerald-500 text-white';
      case ButtonStyle.Danger: return 'bg-rose-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none mb-3">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-indigo-300 transition-all">
        
        {/* ハンドル & 絵文字 */}
        <div className="flex items-center w-full md:w-auto gap-3 border-b md:border-none border-slate-50 pb-2 md:pb-0">
          <div {...attributes} {...listeners} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing">
            <GripVertical className="text-slate-300" size={24} />
          </div>
          <input 
            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-xl text-center focus:ring-2 focus:ring-indigo-100 outline-none"
            value={config.emoji}
            onChange={(e) => onUpdate(config.id, { emoji: e.target.value })}
          />
        </div>

        {/* 設定エリア */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-end gap-3 w-full flex-1">
          {/* ラベル */}
          <div className="flex flex-col flex-1 gap-1">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Label</label>
            <input 
              className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              value={config.label}
              onChange={(e) => onUpdate(config.id, { label: e.target.value })}
            />
          </div>

          {/* アクション選択 */}
          <div className="flex flex-col flex-1 gap-1">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Action</label>
            <div className="relative">
              <select 
                className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm w-full outline-none appearance-none pr-8 cursor-pointer"
                value={config.action}
                onChange={(e) => onUpdate(config.id, { action: e.target.value as TicketActionType })}
              >
                {availableActions.map(act => (
                  <option key={act.value} value={act.value}>{act.label}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={14} />
            </div>
          </div>

          {/* ロール選択 (Roleアクション時のみ) */}
          {config.action === TicketActionType.Role && (
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> Assign Role
              </label>
              <select 
                className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm w-full outline-none appearance-none cursor-pointer"
                value={config.roleId}
                onChange={(e) => onUpdate(config.id, { roleId: e.target.value })}
              >
                <option value="">未選択</option>
                {serverRoles.filter(r => !r.managed).map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* スタイル */}
          <div className="flex flex-col gap-1 w-full md:w-24">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase text-center">Style</label>
            <select 
              className={`text-xs px-3 py-2 rounded-xl outline-none font-bold appearance-none text-center ${getStyleColor(config.style)}`}
              value={config.style}
              onChange={(e) => onUpdate(config.id, { style: Number(e.target.value) })}
            >
              <option value={ButtonStyle.Primary}>青</option>
              <option value={ButtonStyle.Secondary}>灰</option>
              <option value={ButtonStyle.Success}>緑</option>
              <option value={ButtonStyle.Danger}>赤</option>
            </select>
          </div>

          {/* 削除 */}
          <button onClick={() => onDelete(config.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- メインコンポーネント ---
const TicketButtonSelector: React.FC<TicketSelectorProps> = ({ mode, buttons, serverRoles, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = buttons.findIndex(b => b.id === active.id);
      const newIndex = buttons.findIndex(b => b.id === over.id);
      onChange(arrayMove(buttons, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    const isPanel = mode === 'panel';
    const newBtn: TicketButtonConfig = {
      id: `btn_${Date.now()}`,
      label: isPanel ? 'チケットを作成' : 'アクション',
      emoji: isPanel ? '📩' : '⚙️',
      style: isPanel ? ButtonStyle.Primary : ButtonStyle.Secondary,
      action: isPanel ? TicketActionType.Create : TicketActionType.Close,
    };
    onChange([...buttons, newBtn]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-2 py-6">
      {/* モード表示ヘッダー */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${mode === 'panel' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {mode === 'panel' ? <Layout size={24} /> : <Settings2 size={24} />}
          </div>
          <div>
            <h3 className="font-black text-slate-800 tracking-tight">
              {mode === 'panel' ? '作成パネル設定' : 'チケット内ボタン設定'}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Mode: {mode.toUpperCase()}
            </p>
          </div>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Plus size={18} /> 追加
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={buttons.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {buttons.map((btn, index) => (
              <SortableButtonItem 
                key={btn.id}
                config={btn}
                mode={mode}
                index={index}
                serverRoles={serverRoles}
                onUpdate={(id, up) => onChange(buttons.map(b => b.id === id ? { ...b, ...up } : b))}
                onDelete={(id) => onChange(buttons.filter(b => b.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {buttons.length === 0 && (
        <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
          ボタンが設定されていません
        </div>
      )}
    </div>
  );
};

export default TicketButtonSelector;