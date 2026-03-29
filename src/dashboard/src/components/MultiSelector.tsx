import { Trash2 } from "lucide-react";

export default function MultiSelector({ selectedIds = [], options, onChange, label, icon: Icon }: any) {
  const toggleId = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((i: string) => i !== id)
      : [...selectedIds, id];
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedIds.length === 0 && <span className="text-xs text-gray-500 italic">制限なし</span>}
        {selectedIds.map((id: string) => {
          const item = options.find((o: any) => o.id === id);
          return (
            <span key={id} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30">
              <Icon size={12} className="opacity-70" />
              {item?.name || id}
              <button onClick={() => toggleId(id)} className="hover:text-white ml-1">
                <Trash2 size={12}/>
              </button>
            </span>
          );
        })}
      </div>
      <select 
        className="w-full bg-black/40 p-2 rounded text-sm border border-white/10 focus:border-blue-500 outline-none"
        onChange={(e) => {
          if (e.target.value) toggleId(e.target.value);
          e.target.value = ""; 
        }}
      >
        <option value="">{label}を追加...</option>
        {options.filter((o: any) => !selectedIds.includes(o.id)).map((o: any) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}