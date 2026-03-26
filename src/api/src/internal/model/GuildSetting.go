package model

import "time"

type GuildSetting struct {
	GuildID        string          `gorm:"primaryKey" json:"guild_id"`
	EnabledModules map[string]bool `gorm:"type:jsonb;serializer:json"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
