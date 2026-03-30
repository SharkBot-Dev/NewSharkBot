export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5, // リンクスタイルも追加しておくと便利です
}

/**
 * ボタンの設定単位（1つのボタンの定義）
 */
export enum TicketActionType {
  Create = 'create',   // チケット作成
  Claim = 'claim',     // 担当として参加
  Close = 'close',     // クローズ
  Reopen = 'reopen',   // 再開
  Delete = 'delete',   // 削除
  Role = 'role'        // 通常のロール付与
}

export interface TicketButtonConfig {
  id: string;
  label: string;
  emoji: string;
  style: ButtonStyle;
  action: TicketActionType;
}

/**
 * 複数のボタンを ID や キーで管理するためのマップ型
 * 例: { "verify": { ... }, "announcement": { ... } }
 */
export type TicketButtonMap = Record<string, TicketButtonConfig>;