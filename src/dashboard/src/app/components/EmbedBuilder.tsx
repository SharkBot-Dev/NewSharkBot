import { useState, ReactNode, ChangeEvent, useEffect } from "react";
import { User, Text, AlignLeft, Palette, Image as ImageIcon, Footprints, Clock, X } from "lucide-react";
import tinycolor from "tinycolor2";
import ColorPicker from "./ColorPicker";

interface Embed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
}

interface FieldProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  onClear?: () => void;
}

const InputField = ({ label, icon, children, onClear }: FieldProps) => (
  <div className="mb-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {label}
      </div>
      {onClear && (
        <button onClick={onClear} className="text-xs text-red-500 hover:text-red-700">
          <X className="w-3 h-3 inline mr-1" />
          クリア
        </button>
      )}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full text-sm border border-gray-300 rounded-md py-1.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900"
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full text-sm border border-gray-300 rounded-md py-1.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900"
    rows={4}
  />
);

interface DiscordEmbedBuilderProps {
  initialData?: Embed;
  onChange?: (data: Embed) => void;
}

export default function DiscordEmbedBuilder({ initialData, onChange }: DiscordEmbedBuilderProps) {
  const defaultEmbed: Embed = {
    title: "こんにちは、Discord!",
    description: "これは埋め込みビルダーのプレビューです。",
    color: parseInt("5865f2", 16),
    author: {
      name: "ボットの名前",
      icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
    },
    timestamp: new Date().toISOString(),
  };

  const [embed, setEmbed] = useState<Embed>(initialData || defaultEmbed);

  useEffect(() => {
    if (onChange) {
      onChange(embed);
    }
  }, [embed, onChange]);

  const updateEmbed = (key: keyof Embed, value: any) => {
    setEmbed((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedEmbed = (parentKey: keyof Embed, key: string, value: any) => {
    setEmbed((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [key]: value || undefined,
      },
    }));
  };

  const handleColorChange = (colorInt: number) => {
    updateEmbed("color", colorInt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-slate-50 min-h-screen">
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-6 text-slate-900">埋め込みエディタ</h2>

        {/* Author */}
        <InputField label="Author (作成者)" icon={<User className="w-4 h-4" />} onClear={() => updateEmbed("author", undefined)}>
          <Input placeholder="名前" value={embed.author?.name || ""} onChange={(e) => updateNestedEmbed("author", "name", e.target.value)} />
          <Input placeholder="アイコン URL" value={embed.author?.icon_url || ""} onChange={(e) => updateNestedEmbed("author", "icon_url", e.target.value)} />
          <Input placeholder="作成者のリンク URL" value={embed.author?.url || ""} onChange={(e) => updateNestedEmbed("author", "url", e.target.value)} />
        </InputField>

        {/* Title */}
        <InputField label="タイトル" icon={<Text className="w-4 h-4" />}>
          <Input placeholder="タイトルを入力" value={embed.title || ""} onChange={(e) => updateEmbed("title", e.target.value)} />
          <Input placeholder="タイトルのリンク URL" value={embed.url || ""} onChange={(e) => updateEmbed("url", e.target.value)} />
        </InputField>

        {/* Description */}
        <InputField label="説明" icon={<AlignLeft className="w-4 h-4" />}>
          <Textarea placeholder="説明を入力 (Markdown 可)" value={embed.description || ""} onChange={(e) => updateEmbed("description", e.target.value)} />
        </InputField>

        {/* Color */}
        <InputField label="色 (Sidebar Color)" icon={<Palette className="w-4 h-4" />}>
          <ColorPicker value={embed.color || 0} onChange={handleColorChange} />
        </InputField>

        {/* Images */}
        <InputField label="画像 & サムネイル" icon={<ImageIcon className="w-4 h-4" />}>
          <Input placeholder="メイン画像 URL (下部)" value={embed.image?.url || ""} onChange={(e) => updateNestedEmbed("image", "url", e.target.value)} />
          <Input placeholder="サムネイル URL (右上)" value={embed.thumbnail?.url || ""} onChange={(e) => updateNestedEmbed("thumbnail", "url", e.target.value)} />
        </InputField>

        {/* Footer */}
        <InputField label="フッター" icon={<Footprints className="w-4 h-4" />} onClear={() => updateEmbed("footer", undefined)}>
          <Input placeholder="フッターテキスト" value={embed.footer?.text || ""} onChange={(e) => updateNestedEmbed("footer", "text", e.target.value)} />
          <Input placeholder="フッターアイコン URL" value={embed.footer?.icon_url || ""} onChange={(e) => updateNestedEmbed("footer", "icon_url", e.target.value)} />
        </InputField>

        {/* Timestamp */}
        <InputField label="時刻" icon={<Clock className="w-4 h-4" />}>
          <div className="flex gap-2">
            <Input type="datetime-local" value={embed.timestamp ? new Date(embed.timestamp).toISOString().slice(0, 16) : ""} onChange={(e) => updateEmbed("timestamp", e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
            <button onClick={() => updateEmbed("timestamp", new Date().toISOString())} className="text-xs bg-gray-100 px-3 rounded hover:bg-gray-200 text-gray-700">現在時刻</button>
            <button onClick={() => updateEmbed("timestamp", undefined)} className="text-xs text-red-500">削除</button>
          </div>
        </InputField>
      </div>

      <div className="lg:sticky lg:top-6 self-start bg-[#36393f] p-6 rounded-2xl shadow-xl font-['whitney','Helvetica Neue',Helvetica,Arial,sans-serif]">
        <h2 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-wider">Preview</h2>

        <div className="flex items-start gap-4">
          <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Bot Avatar" className="w-10 h-10 rounded-full mt-1" />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">システムボット</span>
              <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">BOT</span>
              <span className="text-xs text-gray-400">今日 12:00</span>
            </div>

            <div className="relative bg-[#2f3136] rounded border-l-4 p-4 max-w-[520px]" style={{ borderColor: tinycolor(embed.color?.toString(16) || "202225").toHexString() }}>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  {embed.author?.name && (
                    <div className="flex items-center gap-2 mb-2">
                      {embed.author.icon_url && <img src={embed.author.icon_url} className="w-6 h-6 rounded-full" />}
                      {embed.author.url ? (
                        <a href={embed.author.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white hover:underline">{embed.author.name}</a>
                      ) : (
                        <span className="text-sm font-semibold text-white">{embed.author.name}</span>
                      )}
                    </div>
                  )}

                  {embed.title && (
                    <div className="mb-2">
                      {embed.url ? (
                        <a href={embed.url} target="_blank" rel="noreferrer" className="text-base font-bold text-[#00a8fc] hover:underline">{embed.title}</a>
                      ) : (
                        <div className="text-base font-bold text-white">{embed.title}</div>
                      )}
                    </div>
                  )}

                  {embed.description && (
                    <div className="text-sm text-[#dcddde] whitespace-pre-wrap mb-3 leading-relaxed">
                      {embed.description}
                    </div>
                  )}
                </div>

                {embed.thumbnail?.url && (
                  <img src={embed.thumbnail.url} alt="Thumbnail" className="w-20 h-20 rounded object-cover mt-1 flex-shrink-0" />
                )}
              </div>

              {embed.image?.url && (
                <img src={embed.image.url} alt="Embed" className="mt-3 rounded max-w-full h-auto object-contain max-h-[300px]" />
              )}

              {(embed.footer?.text || embed.timestamp) && (
                <div className="flex items-center gap-2 mt-3 text-xs text-[#dcddde]">
                  {embed.footer?.icon_url && <img src={embed.footer.icon_url} className="w-5 h-5 rounded-full" />}
                  <div className="flex items-center gap-1.5">
                    {embed.footer?.text && <span>{embed.footer.text}</span>}
                    {embed.footer?.text && embed.timestamp && <span>•</span>}
                    {embed.timestamp && (
                      <time dateTime={embed.timestamp}>
                        {new Date(embed.timestamp).toLocaleString("ja-JP", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}