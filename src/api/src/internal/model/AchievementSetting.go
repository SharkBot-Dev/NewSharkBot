package model

import (
	"time"
)

// AchievementSetting: サーバーごとの全般設定（必要に応じて拡張）
type AchievementSetting struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	GuildID string `gorm:"index;unique;not null" json:"guild_id"`

	NotifyChannelID string `json:"notify_channel_id"`

	IsNotifyEnabled bool `gorm:"default:true" json:"is_notify_enabled"`

	Content string `json:"content"`
	EmbedId string `json:"embed_id"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

// Achievement: 実績の定義
type Achievement struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	GuildID     string `gorm:"index;not null" json:"guild_id"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"` // 実績の説明
	Type        string `json:"type"`        // "messages", "reactions", "manual" (手動付与) など

	IsStep bool `json:"is_step"` // true: 段階的, false: 一回きり

	Steps    []AchievementStep         `gorm:"foreignKey:AchievementID;constraint:OnDelete:CASCADE;" json:"steps"`
	Progress []UserAchievementProgress `gorm:"foreignKey:AchievementID;constraint:OnDelete:CASCADE;" json:"-"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

// AchievementStep: 実績の条件（単発実績なら1つだけ作成する）
type AchievementStep struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	AchievementID uint   `gorm:"index" json:"achievement_id"`
	Name          string `json:"name"`           // 例: "ビギナー", "エキスパート"
	Threshold     int    `json:"threshold"`      // 達成に必要な数値 (単発なら 1 または 目標値)
	RewardRoleID  string `json:"reward_role_id"` // 達成時に付与するロールID
}

// UserAchievementProgress: ユーザーごとの進捗と達成済みフラグ
type UserAchievementProgress struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	GuildID       string `gorm:"uniqueIndex:idx_user_ach;not null"`
	UserID        string `gorm:"uniqueIndex:idx_user_ach;not null"`
	AchievementID uint   `gorm:"uniqueIndex:idx_user_ach;not null" json:"achievement_id"`

	CurrentValue int `json:"current_value"` // 現在のカウント

	IsCompleted   bool `json:"is_completed"`    // 全ステップ完了、または単発実績完了
	LastStepOrder int  `json:"last_step_order"` // どこまでクリアしたか (0, 1, 2...)

	UpdatedAt time.Time
}
