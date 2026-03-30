import React, { useCallback } from 'react';
import { Trash2, Plus, GripVertical, Settings2, Ticket, Lock, RotateCcw, UserPlus } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  TouchSensor
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
}

interface TicketSelectorProps {
  mode: string;
  buttons: TicketButtonConfig[];
  serverRoles: { id: string; name: string }[];
  onChange: (newButtons: TicketButtonConfig[]) => void;
}


const SortableItem: React.FC<{
  config: TicketButtonConfig;
  onUpdate: (id: string, updates: Partial<TicketButtonConfig>) => void;
  onDelete: (id: string) => void;
  canUseAction: (id: string, action: TicketActionType) => boolean;
  mode: string;
}> = ({ config, onUpdate, onDelete, canUseAction, mode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const getStyleColor = (s: ButtonStyle) => {
    switch (s) {
      case ButtonStyle.Primary: return 'bg-[#5865F2] text-white';
      case ButtonStyle.Secondary: return 'bg-slate-500 text-white';
      case ButtonStyle.Success: return 'bg-emerald-500 text-white';
      case ButtonStyle.Danger: return 'bg-rose-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const getActionIcon = (type: TicketActionType) => {
    switch (type) {
      case TicketActionType.Create: return <Ticket size={12} />;
      case TicketActionType.Claim: return <UserPlus size={12} />;
      case TicketActionType.Close: return <Lock size={12} />;
      case TicketActionType.Reopen: return <RotateCcw size={12} />;
      case TicketActionType.Delete: return <Trash2 size={12} />;
      default: return <Settings2 size={12} />;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative mb-3 ${isDragging ? 'z-50 opacity-60' : 'z-0'}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all">
        
        <div className="flex items-center w-full md:w-auto gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="text-slate-300" size={24} />
          </div>
          
          <input 
            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-xl text-center outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
            value={config.emoji}
            onChange={(e) => onUpdate(config.id, { emoji: e.target.value })}
            placeholder="😀"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-end gap-3 w-full flex-1">
          <div className="flex flex-col flex-1 gap-1">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Label</label>
            <input 
              className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none w-full focus:border-indigo-400"
              value={config.label}
              onChange={(e) => onUpdate(config.id, { label: e.target.value })}
            />
          </div>

          <div className="flex flex-col flex-1 gap-1">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase flex items-center gap-1">
              {getActionIcon(config.action)} Action
            </label>
            <select 
              className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm w-full outline-none cursor-pointer hover:border-indigo-400"
              value={config.action}
              onChange={(e) => {
                const nextAction = e.target.value as TicketActionType;
                if (!canUseAction(config.id, nextAction)) {
                  alert("そのアクションは既に他のボタンで使用されています。");
                  return;
                }
                onUpdate(config.id, { action: nextAction });
              }}
            >
              {mode === "panel" && <option value={TicketActionType.Create}>作成 (Create)</option>}
              {mode === "ticket" && (
                <>
                  <option value={TicketActionType.Claim}>担当 (Claim)</option>
                  <option value={TicketActionType.Close}>終了 (Close)</option>
                  <option value={TicketActionType.Reopen}>再開 (Reopen)</option>
                  <option value={TicketActionType.Delete}>削除 (Delete)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full md:w-28">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Style</label>
            <select 
              className={`text-xs px-3 py-2 rounded-xl outline-none font-bold cursor-pointer transition-colors ${getStyleColor(config.style)}`}
              value={config.style}
              onChange={(e) => onUpdate(config.id, { style: Number(e.target.value) })}
            >
              <option value={ButtonStyle.Primary}>青 (Primary)</option>
              <option value={ButtonStyle.Secondary}>灰 (Secondary)</option>
              <option value={ButtonStyle.Success}>緑 (Success)</option>
              <option value={ButtonStyle.Danger}>赤 (Danger)</option>
            </select>
          </div>

          <button 
            onClick={() => onDelete(config.id)} 
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            title="削除"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TicketButtonSelector: React.FC<TicketSelectorProps> = ({ buttons, onChange, mode }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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

  const addNewButton = () => {
    if (buttons.length >= 5) {
      alert("ボタンは最大5個までです。"); 
      return;
    }
    const newButton: TicketButtonConfig = {
      id: `btn_${Date.now()}`,
      label: '新規ボタン',
      emoji: '📩',
      style: ButtonStyle.Primary,
      action: TicketActionType.Create,
    };
    onChange([...buttons, newButton]);
  };

  const canUseAction = useCallback((id: string, action: TicketActionType) => {
    if (action === TicketActionType.Role) return true;
    return !buttons.some(btn => btn.id !== id && btn.action === action);
  }, [buttons]);

  const onUpdate = (id: string, updates: Partial<TicketButtonConfig>) => {
    onChange(buttons.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const onDelete = (id: string) => {
    onChange(buttons.filter(b => b.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Settings2 className="text-indigo-500" /> ボタン構成
          </h3>
          <p className="text-xs text-slate-400 mt-1">ドラッグして順序を入れ替えられます</p>
        </div>
        {mode !== "panel" && <button 
          onClick={addNewButton}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
        >
          <Plus size={18} /> 追加
        </button>}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={buttons.map(b => b.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[100px]">
            {buttons.map((config) => (
              <SortableItem 
                key={config.id} 
                config={config} 
                canUseAction={canUseAction}
                onUpdate={onUpdate}
                onDelete={onDelete}
                mode={mode}
              />
            ))}
            
            {buttons.length === 0 && (
              <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                <p>ボタンが設定されていません</p>
                <button onClick={addNewButton} className="text-indigo-500 font-bold mt-2 hover:underline">
                  最初のボタンを追加する
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TicketButtonSelector;