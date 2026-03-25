package model

import "time"

type GuildSetting struct {
	GuildID        string          `gorm:"primaryKey"`
	EnabledModules map[string]bool `gorm:"type:jsonb"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
