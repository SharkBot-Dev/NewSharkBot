"use client";

import { useState, useMemo } from "react";
import { NoIconModuleSetting, type ModuleSetting } from "@/lib/modules";
import ModuleCard from "@/components/ModuleCard";
import { modules as modules_list } from "@/lib/modules";
import CollapsibleSection from "@/components/CollapsibleSection";
import SyncButton from "@/components/SyncButton";

export default function ModuleList({ 
  guildId, 
  initialModules 
}: { 
  guildId: string, 
  initialModules: NoIconModuleSetting[] 
}) {
  const [modules, setModules] = useState<NoIconModuleSetting[]>(initialModules);

  const modulesWithIcons = useMemo(() => {
    return modules.map(m => {
      const original = modules_list.get(m.id);
      return {
        ...m,
        icon: original?.icon 
      };
    });
  }, [modules]);

  const groupedModules = useMemo(() => {
    return modulesWithIcons.reduce((acc, mod) => {
      const group = mod.group || "その他";
      if (!acc[group]) acc[group] = [];
      acc[group].push(mod);
      return acc;
    }, {} as Record<string, any[]>);
  }, [modulesWithIcons]);

  const toggleModule = async (moduleId: string) => {
    const target = modules.find((m) => m.id === moduleId);
    if (!target) return;

    const newState = !target.enabled;

    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, enabled: newState } : m))
    );

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          moduleId: moduleId,
          enabled: newState 
        }),
      });

      if (!res.ok) throw new Error("保存失敗");
      
    } catch (error) {
      console.error("Failed to update module:", error);
      alert("設定の保存に失敗しました");
      
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, enabled: !newState } : m))
      );
    }
  };

  return (
    <>
      {Object.entries(groupedModules).map(([groupName, items]) => (
        <section key={groupName} className="mb-12">
          <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center">
            {groupName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((mod) => (
               <ModuleCard key={mod.id} mod={mod} guildId={guildId} onToggle={toggleModule} />
            ))}
          </div>
        </section>
      ))}

      <CollapsibleSection title="重要な設定">
        <SyncButton guildId={guildId}></SyncButton>
      </CollapsibleSection>
    </>
  );
}