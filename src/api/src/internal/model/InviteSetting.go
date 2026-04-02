package model

import "time"

type InviteSetting struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"uniqueIndex;not null"`

	ChannelID string `json:"channel_id"`
	Content   string `json:"content"`
	EmbedId   string `json:"embed_id"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Rankings []InviteRanking `gorm:"foreignKey:GuildID;references:GuildID"`
}

type InviteRanking struct {
	ID      uint   `gorm:"primaryKey"`
	GuildID string `gorm:"index;not null"`
	UserID  string `gorm:"index;not null"`
	Count   int    `gorm:"default:0"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
