export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
}

export enum TicketActionType {
  Create = 'create',   // チケット作成
  Claim = 'claim',     // 担当として参加
  Close = 'close',     // クローズ
  Reopen = 'reopen',   // 再開
  Delete = 'delete',   // 削除
}

export interface TicketButtonConfig {
  id: string;
  label: string;
  emoji: string;
  style: ButtonStyle;
  action: TicketActionType;
}

export type TicketButtonMap = Record<string, TicketButtonConfig>;