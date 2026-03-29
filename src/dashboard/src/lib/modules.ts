import { HelpCircle, Hand, SearchIcon, SmilePlus, Rocket, BookCheck, Coins, Ban, LogsIcon, WholeWordIcon } from "lucide-react";

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
    "reaction_role",
    {
      id: "reaction_role",
      name: "リアクションロール",
      description: "メンバーがリアクションするとロールが付与されるモジュールです",
      enabled: true,
      icon: SmilePlus,
      group: "サーバー管理",
    },
  ],
  [
    "moderator",
    {
      id: "moderator",
      name: "モデレーター",
      description: "自動モデレートや、モデレートコマンドを使用できるようにします。",
      enabled: true,
      icon: Ban,
      group: "サーバー管理"
    }
  ],
  [
    "logging",
    {
      id: "logging",
      name: "サーバーログ",
      description: "メンバーやモデレーターの行動を記録できます。",
      enabled: true,
      icon: LogsIcon,
      group: "サーバー管理"
    }
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
      icon: BookCheck,
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
      icon: SearchIcon,
      group: "ユーティリティ",
    },
  ],
  [
    "levels",
    {
      id: "levels",
      name: "レベル",
      description: "サーバーに魅力的なレベルシステムを追加します。",
      enabled: true,
      icon: Rocket,
      group: "遊び",
    },
  ],
  [
    "economy",
    {
      id: "economy",
      name: "経済",
      description: "経済を使ってコミュニティを活性化します。",
      enabled: true,
      icon: Coins,
      group: "遊び",
    },
  ],
  [
    "globalchat",
    {
      id: "globalchat",
      name: "グローバルチャット",
      description: "複数のサーバーでチャンネルを接続することができます。",
      enabled: true,
      icon: WholeWordIcon,
      group: "グローバル",
    }
  ]
]);
