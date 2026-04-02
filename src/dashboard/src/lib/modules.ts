import { HelpCircle, Hand, SearchIcon, SmilePlus, Rocket, BookCheck, Coins, Ban, LogsIcon, WholeWordIcon, Command, Ticket, Ghost, UploadIcon, Check, Link } from "lucide-react";

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
    "auth",
    {
      id: "auth",
      name: "メンバー認証",
      description: "メンバーをロボットではないことを確認します。",
      enabled: true,
      icon: Check,
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
    "ticket",
    {
      id: "ticket",
      name: "チケット",
      description: "お問い合わせパネルを作成できます。",
      enabled: true,
      icon: Ticket,
      group: "サーバー管理",
    },
  ],
  [
    "commands",
    {
      id: "commands",
      name: "コマンド (自動返信)",
      description: "コマンドや自動返信を自作できます。",
      enabled: true,
      icon: Command,
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
    "invite",
    {
      id: "invite",
      name: "招待リンク管理",
      description: "招待リンクの管理やログをとることができます。",
      enabled: true,
      icon: Link,
      group: "サーバー管理",
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
    "bump",
    {
      id: "bump",
      name: "Bump通知",
      description: "Bumpの実行できる時間になったらお知らせします。",
      enabled: true,
      icon: UploadIcon,
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
    "achievements",
    {
      id: "achievements",
      name: "実績",
      description: "サーバー内の活動に応じて、メンバーに実績とロール報酬を自動付与します。",
      enabled: true,
      icon: Ghost,
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
