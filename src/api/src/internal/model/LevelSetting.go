package model

import "time"

type LevelSetting struct {
	GuildID string `gorm:"primaryKey;size:255" json:"guild_id"`

	ChannelID string `json:"channel_id"`
	Content   string `json:"content"`

	EmbedID *uint         `json:"embed_id"`
	Embed   *EmbedSetting `gorm:"foreignKey:EmbedID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"embed,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LevelRewardSetting struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	GuildID string `gorm:"index;size:255" json:"guild_id"`

	Level int `gorm:"not null" json:"level"`

	RoleID string `gorm:"size:255;not null" json:"role_id"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LevelUserSetting struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	GuildID string `gorm:"uniqueIndex:idx_guild_user;size:255" json:"guild_id"`
	UserID  string `gorm:"uniqueIndex:idx_guild_user;size:255" json:"user_id"`

	Level int `gorm:"not null;default:1" json:"level"`
	XP    int `gorm:"not null;default:0" json:"xp"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
