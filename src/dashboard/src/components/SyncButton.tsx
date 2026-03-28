"use client";

import { useState } from "react";

interface Props {
  guildId: string;
}

export default function SyncButton({ guildId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/guilds/${guildId}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync"
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessage({
          type: "error",
          text: `クールダウン中です。あと約 ${data.remaining_hours || 0} 時間待機してください。`,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "同期に失敗しました");
      }

      setMessage({
        type: "success",
        text: "コマンドの同期が完了しました！",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "予期せぬエラーが発生しました",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-2xl text-black">
    <div className="flex items-center gap-4 mb-5">
        <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
        >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
        </svg>
        </div>
        
        <div>
        <h3 className="text-xl font-bold text-gray-900">
            有効のモジュールのコマンドをすべてONにする
        </h3>
        </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">
            コマンドを一括更新
        </p>
        <p className="text-xs text-gray-500">
            無効化したモジュールのコマンドは自動的に削除されます。
        </p>
        </div>
        
        <div className="flex-shrink-0">
        <button
            onClick={handleSync}
            disabled={loading}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-white transition-all duration-150 text-sm flex items-center justify-center gap-2 ${
            loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm"
            }`}
        >
            {loading ? (
            <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                同期中...
            </>
            ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.218-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389 5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5h4.243a.75.75 0 00.75-.75V11.424a.75.75 0 00-1.5 0v2.43z" clipRule="evenodd" />
                </svg>
                同期する (24時間に一回)
            </>
            )}
        </button>
        </div>
    </div>

    {message && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
        message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div>
            <p className="font-semibold">{message.type === "success" ? "成功" : "エラー"}</p>
            <p>{message.text}</p>
        </div>
        </div>
    )}
    </div>
  );
}