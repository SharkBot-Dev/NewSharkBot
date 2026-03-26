package model

import "time"

type MessageSetting struct {
	GuildID string `gorm:"primaryKey" json:"guild_id"`
	Type    string `gorm:"primaryKey" json:"type"` // "welcome" or "goodbye"

	ChannelID string `json:"channel_id"`
	Content   string `json:"content"`

	EmbedID *uint        `json:"embed_id"`
	Embed   EmbedSetting `gorm:"foreignKey:EmbedID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
