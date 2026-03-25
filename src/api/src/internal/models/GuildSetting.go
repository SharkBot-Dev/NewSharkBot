package models

type GuildSetting struct {
	GuildID        string          `gorm:"primaryKey"`
	EnabledModules map[string]bool `gorm:"type:jsonb"`
}
