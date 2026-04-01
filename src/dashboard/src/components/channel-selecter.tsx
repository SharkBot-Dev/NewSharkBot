import { useCallback, useEffect, useState, useMemo, ChangeEvent } from "react";

interface Channel {
  id: string;
  name: string;
  type: number;
}

interface Props {
  guildId: string;
  type_id?: number | null;
  value?: string;
  onChange?: (channelId: string) => void;
  initChannels?: Channel[]; // anyを排除
  required?: boolean;
}

const getChannelIcon = (type: number) => {
  switch (type) {
    case 0: return "# ";      // Text
    case 2: return "🔊 ";     // Voice
    case 5: return "📢 ";     // Announcement
    case 13: return "🎙️ ";    // Stage
    case 15: return "📑 ";     // Forum
    default: return "📄 ";     // Others
  }
};

export default function ChannelSelecter({
  guildId,
  type_id,
  value,
  onChange,
  initChannels,
  required
}: Props) {
  const [rawChannels, setRawChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (initChannels || !guildId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/guilds/${guildId}/channels`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("データの取得に失敗しました");

      const data: Channel[] = await res.json();
      setRawChannels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
      setError("チャンネル一覧を読み込めませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [guildId, initChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const displayChannels = useMemo(() => {
    const source = initChannels || rawChannels;
    if (type_id === undefined || type_id === null) {
      return source;
    }
    return source.filter((channel) => channel.type === type_id);
  }, [initChannels, rawChannels, type_id]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  const getPlaceholderText = () => {
    if (isLoading) return "読み込み中...";
    if (displayChannels.length === 0) return "利用可能なチャンネルがありません";
    return "チャンネルを選択してください";
  };

  return (
    <div className="w-full">
      <select
        value={value || ""}
        onChange={handleChange}
        required={required}
        disabled={isLoading || (displayChannels.length === 0 && !isLoading)}
        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <option value="" disabled={required}>
          {getPlaceholderText()}
        </option>

        {displayChannels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {getChannelIcon(channel.type)}
            {channel.name}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}