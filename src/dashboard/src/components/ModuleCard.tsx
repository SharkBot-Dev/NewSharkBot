"use client";

import { useRouter } from "next/navigation";
import { type ModuleSetting } from "@/lib/modules";

interface ModuleCardProps {
  mod: ModuleSetting;
  guildId: string;
  onToggle?: (moduleId: string) => Promise<void>;
}

export default function ModuleCard({ mod, guildId, onToggle }: ModuleCardProps) {
  const router = useRouter();

  return (
    <div
      className="group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/dashboard/${guildId}/${mod.id}`)}
    >
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
          {mod.name}
        </h3>
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {mod.description}
        </p>
      </div>

      <div className="mt-auto flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); 
            if (onToggle) {
              onToggle(mod.id);
            }
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            mod.enabled ? "bg-indigo-600" : "bg-slate-200"
          }`}
          aria-label={`${mod.name}の有効・無効を切り替え`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
              mod.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}