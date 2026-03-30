"use client";

import { useCallback, useEffect, useState } from "react";

interface CommandData {
  name: string;
  description: string;
  id?: string;
  options?: any[];
  default_member_permissions?: string;
}

interface Props {
  guildId: string;
  targetCommands: CommandData[];
}

export default function CommandsControl({ guildId, targetCommands }: Props) {
  const [liveCommands, setLiveCommands] = useState<CommandData[]>([]);
  const [enabledNames, setEnabledNames] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch" }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLiveCommands(data);
        setEnabledNames(new Set(data.map((c) => c.name)));
      }
    } catch (err) {
      console.error("Failed to fetch status", err);
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    if (guildId) fetchStatus();
  }, [guildId, fetchStatus]);

  const toggleLocal = (name: string) => {
    setEnabledNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const adds = targetCommands.filter(
        (cmd) => enabledNames.has(cmd.name) && !liveCommands.some((l) => l.name === cmd.name)
      );
      
      const deletes = liveCommands
        .filter((l) => !enabledNames.has(l.name))
        .map((l) => l.id)
        .filter(Boolean) as string[];

      const res = await fetch(`/api/guilds/${guildId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch", adds, deletes }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error + (data.remaining ? `\n${data.remaining}` : ""));
        return;
      }
      
      setLiveCommands(data.data)
    } catch (err) {
      console.error("Batch save failed", err);
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    enabledNames.size !== liveCommands.length ||
    Array.from(enabledNames).some((name) => !liveCommands.some((l) => l.name === name));

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="h-6 w-11 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-md flex flex-col gap-4">

      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
          <span className="text-sm text-indigo-700 text-black font-medium">
            未保存の変更があります
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading && liveCommands.length === 0 ? (
          <SkeletonLoader />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {targetCommands.map((cmd) => {
              const isEnabled = enabledNames.has(cmd.name);
              return (
                <li
                  key={cmd.name}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => toggleLocal(cmd.name)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      /{cmd.name}
                    </span>
                    <span className="text-xs text-slate-500">{cmd.description}</span>
                  </div>

                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      isEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}