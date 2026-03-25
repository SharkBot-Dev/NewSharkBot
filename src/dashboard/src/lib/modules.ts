import { HelpCircle } from "lucide-react";

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
]);
