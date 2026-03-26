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
export interface ButtonRoleConfig {
  label: string;
  roleId: string;
  style: Exclude<ButtonStyle, ButtonStyle.Link>; // ロール付与ボタンに Link スタイルは使えないため除外
  emoji?: string; // 絵文字はオプショナル（任意）にするのが一般的です
}

/**
 * 複数のボタンを ID や キーで管理するためのマップ型
 * 例: { "verify": { ... }, "announcement": { ... } }
 */
export type ButtonRoleMap = Record<string, ButtonRoleConfig>;