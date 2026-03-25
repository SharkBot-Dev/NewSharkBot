"use client";

import { useCallback, useEffect, useState } from "react";

interface CommandData {
  name: string;
  description: string;
  id?: string;
  options?: any[];
}

interface Props {
  guildId: string;
  targetCommands: CommandData[];
}

export default function CommandsControl({ guildId, targetCommands }: Props) {
  const [liveCommands, setLiveCommands] = useState<CommandData[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await fetch(`/api/guilds/${guildId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch" }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setLiveCommands(data);
    } catch (err) {
      console.error("Failed to fetch status", err);
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    if (guildId) fetchStatus();
  }, [guildId, fetchStatus]);

  const toggleCommand = async (cmd: CommandData) => {
    const existing = liveCommands.find((l) => l.name === cmd.name);
    setLoadingIds((prev) => [...prev, cmd.name]);

    try {
      const action = existing ? "delete" : "add";
      const payload = existing
        ? { commandId: existing.id }
        : { command: { name: cmd.name, description: cmd.description, options: cmd.options } };

      const res = await fetch(`/api/guilds/${guildId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error("Toggle failed", err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== cmd.name));
    }
  };

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800"
        >
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
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {isLoading && liveCommands.length === 0 ? (
        <SkeletonLoader />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {targetCommands.map((cmd) => {
            const isEnabled = liveCommands.some((l) => l.name === cmd.name);
            const isProcessing = loadingIds.includes(cmd.name);

            return (
              <li
                key={cmd.name}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold transition-opacity ${isProcessing ? "opacity-50" : "text-slate-700 dark:text-slate-200"}`}
                  >
                    /{cmd.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {cmd.description}
                  </span>
                </div>

                <div className="relative z-20 flex items-center">
                  <button
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCommand(cmd);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isProcessing ? "opacity-50 cursor-wait" : ""
                    } ${
                      isEnabled
                        ? "bg-indigo-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {isProcessing && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="animate-spin h-3 w-3 text-white"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </span>
                    )}
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      } ${isProcessing ? "opacity-0" : "opacity-100"}`}
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && targetCommands.length === 0 && (
        <div className="p-8 text-center text-sm text-slate-500">
          管理可能なコマンドがありません。
        </div>
      )}
    </div>
  );
}
