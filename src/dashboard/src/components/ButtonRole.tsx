import React, { useMemo } from 'react';
import { Trash2, Plus, GripVertical, ShieldCheck, Layers, ChevronRight } from 'lucide-react';
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
import { ButtonStyle, ButtonRoleConfig, ButtonRoleMap } from '@/constants/reaction_role/rolesmap';

interface RoleSelectorProps {
  roles: ButtonRoleMap;
  serverRoles: any[];
  onChange: (newRoles: ButtonRoleMap) => void;
}

interface SortableItemProps {
  id: string;
  config: ButtonRoleConfig;
  serverRoles: any[];
  usedRoleIds: Set<string>;
  onUpdate: (id: string, updates: Partial<ButtonRoleConfig>) => void;
  onDelete: (id: string) => void;
  index: number;
}

const SortableRoleItem: React.FC<{
  id: string;
  config: ButtonRoleConfig;
  serverRoles: any[];
  usedRoleIds: Set<string>;
  onUpdate: (id: string, updates: Partial<ButtonRoleConfig>) => void;
  onDelete: (id: string) => void;
  index: number;
}> = ({ id, config, serverRoles, usedRoleIds, onUpdate, onDelete, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  const getStyleColor = (s: ButtonStyle) => {
    switch (s) {
      case ButtonStyle.Primary: return 'bg-[#5865F2] text-white'; // Discord Blurple
      case ButtonStyle.Secondary: return 'bg-slate-500 text-white';
      case ButtonStyle.Success: return 'bg-emerald-500 text-white';
      case ButtonStyle.Danger: return 'bg-rose-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none">
      {/* 行の区切り線 (5個ごと) */}
      {index > 0 && index % 5 === 0 && (
        <div className="flex items-center gap-2 my-6 px-2">
          <div className="h-[2px] bg-indigo-50 flex-1" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-full">
            Row {Math.floor(index / 5) + 1}
          </span>
          <div className="h-[2px] bg-indigo-50 flex-1" />
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-indigo-300 transition-all">
        
        {/* ヘッダー部分（スマホでは横並び、PCでは一部） */}
        <div className="flex items-center w-full md:w-auto gap-3 border-b md:border-none border-slate-50 pb-2 md:pb-0">
          <div {...attributes} {...listeners} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing">
            <GripVertical className="text-slate-300" size={24} />
          </div>
          
          <input 
            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-xl text-center focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            value={config.emoji}
            onChange={(e) => onUpdate(id, { emoji: e.target.value })}
            placeholder="😀"
          />

          <div className="flex-1 md:hidden">
             <span className="text-[10px] font-bold text-slate-400 uppercase">Button {index + 1}</span>
             <p className="text-xs font-semibold text-slate-600 truncate">{config.label || 'ラベル未設定'}</p>
          </div>

          <button onClick={() => onDelete(id)} className="md:hidden p-2 text-rose-400">
            <Trash2 size={20} />
          </button>
        </div>

        {/* 設定エリア（スマホで縦に並ぶ部分） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-end gap-3 w-full flex-1">
          {/* ラベル入力 */}
          <div className="flex flex-col flex-1 gap-1 w-full">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Label</label>
            <input 
              className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none w-full"
              placeholder="例: ロール付与"
              value={config.label}
              onChange={(e) => onUpdate(id, { label: e.target.value })}
            />
          </div>

          {/* ロール選択 */}
          <div className="flex flex-col flex-1 gap-1 w-full">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase flex items-center gap-1">
              <ShieldCheck size={12} /> Assign Role
            </label>
            <div className="relative">
              <select 
                className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-indigo-100 appearance-none pr-8 cursor-pointer"
                value={config.roleId}
                onChange={(e) => onUpdate(id, { roleId: e.target.value })}
              >
                <option value="">未選択</option>
                {serverRoles.filter(r => r.name !== "@everyone" && !r.managed).map(role => {
                  const isUsed = usedRoleIds.has(role.id) && config.roleId !== role.id;
                  return <option key={role.id} value={role.id} disabled={isUsed}>{role.name}</option>
                })}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          {/* スタイル選択 */}
          <div className="flex flex-col gap-1 w-full md:w-32">
            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase text-center md:text-left">Style</label>
            <select 
              className={`text-xs px-3 py-2.5 rounded-xl outline-none font-bold shadow-sm transition-all appearance-none text-center ${getStyleColor(config.style)}`}
              value={config.style}
              onChange={(e) => onUpdate(id, { style: Number(e.target.value) })}
            >
              <option value={ButtonStyle.Primary}>青</option>
              <option value={ButtonStyle.Secondary}>灰</option>
              <option value={ButtonStyle.Success}>緑</option>
              <option value={ButtonStyle.Danger}>赤</option>
            </select>
          </div>

          {/* PC用削除ボタン */}
          <button 
            onClick={() => onDelete(id)} 
            className="hidden md:flex p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mb-0.5"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const ButtonRoleSelector: React.FC<RoleSelectorProps> = ({ roles, serverRoles, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }), // スマホのスクロールを阻害しないための制約
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const roleEntries = useMemo(() => Object.entries(roles), [roles]);
  const usedRoleIds = useMemo(() => new Set(roleEntries.map(([_, r]) => r.roleId).filter(id => id !== '')), [roleEntries]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const keys = Object.keys(roles);
      const oldIndex = keys.indexOf(active.id as string);
      const newIndex = keys.indexOf(over.id as string);
      const newKeys = arrayMove(keys, oldIndex, newIndex);
      const newRoles: ButtonRoleMap = {};
      newKeys.forEach(key => { newRoles[key] = roles[key]; });
      onChange(newRoles);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-2 sm:px-4 md:px-6 py-6 bg-slate-50 md:bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={roleEntries.map(([id]) => id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-20 md:pb-0">
            {roleEntries.map(([id, config], index) => (
              <SortableRoleItem 
                key={id} id={id} index={index} config={config} 
                serverRoles={serverRoles} usedRoleIds={usedRoleIds} 
                onUpdate={(id, up) => onChange({ ...roles, [id]: { ...roles[id], ...up } })}
                onDelete={(tid) => { const nr = { ...roles }; delete nr[tid]; onChange(nr); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {roleEntries.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic">
          設定が空です
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2">
        <button 
          onClick={() => {
            const id = `role_${Date.now()}`;
            onChange({ ...roles, [id]: { label: '新規ボタン', roleId: '', style: ButtonStyle.Secondary, emoji: '🔘' } });
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> ボタンを追加
        </button>
      </div>
    </div>
  );
};

export default ButtonRoleSelector;