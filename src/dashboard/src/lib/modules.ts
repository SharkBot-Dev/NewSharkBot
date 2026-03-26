import { HelpCircle, Hand } from "lucide-react";

export interface ModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
  group?: string;
}

export const modules = new Map<string, ModuleSetting>([
  [
    "test",
    {
      id: "test",
      name: "テストモジュール",
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
      name: "よろしく＆さようならモジュール",
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
      name: "ヘルプモジュール",
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
      name: "埋め込み作成モジュール",
      description: "サーバー内の埋め込みを作成＆管理できます",
      enabled: true,
      icon: Hand,
      group: "ユーティリティ",
    },
  ]
]);
