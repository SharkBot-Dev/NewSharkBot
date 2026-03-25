import { HelpCircle, Hand } from "lucide-react";

export interface ModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
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
    },
  ],
]);
