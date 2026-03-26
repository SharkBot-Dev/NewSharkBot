import { HelpCircle, Hand } from "lucide-react";

export interface ModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
  group?: string;
}

export interface NoIconModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  group?: string;
}

export const modules = new Map<string, ModuleSetting>([
  [
    "test",
    {
      id: "test",
      name: "テスト",
      description: "テストモジュールです",
      enabled: false,
      icon: null,
      group: "デバッグ用",
    },
  ],
  [
    "welcome",
    {
      id: "welcome",
      name: "よろしく＆さようなら",
      description: "新規参加者に挨拶したり、退出者にさようならを言うモジュールです",
      enabled: true,
      icon: Hand,
      group: "サーバー管理",
    },
  ],
  [
    "help",
    {
      id: "help",
      name: "ヘルプ",
      description: "コマンドの説明を表示するモジュールです",
      enabled: true,
      icon: HelpCircle,
      group: "ユーティリティ",
    },
  ],
  [
    "embed",
    {
      id: "embed",
      name: "埋め込み作成",
      description: "サーバー内の埋め込みを作成＆管理できます",
      enabled: true,
      icon: Hand,
      group: "ユーティリティ",
    },
  ],
  [
    "search",
    {
      id: "search",
      name: "検索",
      description: "Web上のコンテンツをなんでも検索できます。",
      enabled: true,
      icon: Hand,
      group: "ユーティリティ",
    },
  ]
]);
