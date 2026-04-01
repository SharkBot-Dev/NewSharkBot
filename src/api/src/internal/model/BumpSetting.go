package model

import (
	"time"
)

type BumpSetting struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"index;unique;not null" json:"guild_id"`

	Bots []BumpBotsSetting `gorm:"foreignKey:GuildID;references:GuildID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"bots"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

type BumpBotsSetting struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"index;not null" json:"guild_id"`

	BotID          string      `gorm:"index;not null" json:"bot_id"` // disboard、dissoku
	ChannelID      string      `json:"channel_id"`
	MentionsRoleID StringArray `gorm:"type:text" json:"role_ids"`
	Content        string      `json:"content"`
	EmbedID        string      `json:"embed_id"`

	CreatedAt    time.Time
	UpdatedAt    time.Time
	LastBumpedAt time.Time `json:"last_bumped_at"`
	NextNotifyAt time.Time `json:"next_notify_at" gorm:"index"`
}
