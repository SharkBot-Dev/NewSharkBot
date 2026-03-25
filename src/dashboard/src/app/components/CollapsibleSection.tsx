import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      {/* ヘッダー部分（クリックで開閉） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <span className="font-medium text-slate-800">{title}</span>
        {/* アイコンの切り替え */}
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* コンテンツ部分（isOpen が true の時だけ表示） */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}