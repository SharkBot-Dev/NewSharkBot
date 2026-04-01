import React from 'react';
import { 
  Trash2, ShieldCheck, ChevronRight, 
  Link as LinkIcon, MousePointer2, Type, 
  SmilePlus
} from 'lucide-react';

enum ButtonStyle {
  Primary = 1,   // Blurple
  Secondary = 2, // Gray
  Success = 3,   // Green
  Danger = 4,    // Red
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
  id: string;
  index: number;
  config: ButtonConfig;
  serverRoles: { id: string, name: string, managed: boolean }[];
  onUpdate: (id: string, updates: Partial<ButtonConfig>) => void;
  onDelete: (id: string) => void;
}

export default function ButtonEditorItem({ 
  id, index, config, serverRoles, onUpdate, onDelete 
}: Props) {

  const getStyleColor = (s: ButtonStyle) => {
    switch (s) {
      case ButtonStyle.Primary: return 'bg-[#5865F2] text-white hover:bg-[#4752C4]';
      case ButtonStyle.Secondary: return 'bg-[#4E5058] text-white hover:bg-[#404249]';
      case ButtonStyle.Success: return 'bg-[#248046] text-white hover:bg-[#1A6334]';
      case ButtonStyle.Danger: return 'bg-[#DA373C] text-white hover:bg-[#A12828]';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 overflow-hidden transition-all hover:border-slate-300">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500">
            {index + 1}
          </span>
        </div>
        
        <button 
          onClick={() => onDelete(id)}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors group/del"
          type="button"
        >
          <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
        </button>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-6">
        
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
            <SmilePlus size={12} /> 絵文字
          </label>
          <input 
            className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl text-2xl text-center focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
            value={config.emoji}
            onChange={(e) => onUpdate(id, { emoji: e.target.value })}
            placeholder="🛡️"
          />
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
              <Type size={12} /> ラベル
            </label>
            <input 
              className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none w-full transition-all"
              placeholder="ボタンに表示する文字"
              value={config.label}
              onChange={(e) => onUpdate(id, { label: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">タイプ</label>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => onUpdate(id, { type: 'click' })}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.type === 'click' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'
                }`}
              >
                <MousePointer2 size={14} /> Click
              </button>
              <button
                onClick={() => onUpdate(id, { type: 'web' })}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.type === 'web' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'
                }`}
              >
                <LinkIcon size={14} /> Web
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
              <ShieldCheck size={12} /> Role
            </label>
            <div className="relative">
              <select 
                className="text-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white appearance-none pr-8 cursor-pointer transition-all"
                value={config.roleId}
                onChange={(e) => onUpdate(id, { roleId: e.target.value })}
              >
                <option value="">選択してください</option>
                {serverRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Color</label>
            <select 
              className={`text-xs px-3 py-2.5 rounded-xl outline-none font-bold shadow-sm transition-all appearance-none text-center cursor-pointer ${getStyleColor(config.style)}`}
              value={config.style}
              onChange={(e) => onUpdate(id, { style: Number(e.target.value) })}
            >
              <option value={ButtonStyle.Primary}>Blurple</option>
              <option value={ButtonStyle.Secondary}>Gray</option>
              <option value={ButtonStyle.Success}>Green</option>
              <option value={ButtonStyle.Danger}>Red</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}