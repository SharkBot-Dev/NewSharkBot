package model

import (
	"time"
)

// CustomCommandsSetting はコマンドの親定義
type CustomCommandsSetting struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"index;not null" json:"guild_id"`
	Name    string `gorm:"not null" json:"name"` // トリガー名

	// 実行するアクションのリスト（Order順に取得・実行）
	Actions []CustomCommandAction `gorm:"foreignKey:CommandID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"actions"`

	AllowedRoles       StringArray `gorm:"type:json" json:"allowed_roles"`    // 許可ロールID
	AllowedChannels    StringArray `gorm:"type:json" json:"allowed_channels"` // 許可チャンネルID
	RequiredPermission string      `json:"required_permission"`               // 必要権限 (ADMINISTRATOR等)

	IsAutoReply bool   `json:"is_auto_reply"`
	MatchMode   string `json:"match_mode"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

// CustomCommandAction は個別の処理（Reply, Send, Role操作など）
type CustomCommandAction struct {
	ID        uint `gorm:"primaryKey"`
	CommandID uint `gorm:"index" json:"command_id"`

	// 実行順序
	Order int `gorm:"column:action_order;default:0" json:"order"`

	// アクション種別: "reply", "send", "dm", "var_set", "loop", "role_add", "kick", "thread_create" 等
	Type string `json:"type"`

	// 設定内容をJSON形式で保存（柔軟なパラメータ対応のため）
	// 例: {"content": "hi", "embed_id": 1, "is_random": true, "roles": ["123..."]}
	Payload string `gorm:"type:text" json:"payload"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

type PrefixSetting struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"index;unique;not null" json:"guild_id"`
	// Prefixをリストに変更 (デフォルト: ["!"])
	Prefixes StringArray `gorm:"type:json;not null" json:"prefixes"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
