package model

import (
	"time"

	"gorm.io/gorm"
)

type AuthCache struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	ExpiresAt time.Time      `gorm:"index;not null" json:"expires_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	GuildID string `gorm:"index:idx_guild_user,priority:1;not null" json:"guild_id"`
	UserID  string `gorm:"index:idx_guild_user,priority:2;not null" json:"user_id"`
	RoleID  string `gorm:"not null" json:"role_id"`

	Code   string `gorm:"uniqueIndex;not null" json:"code"`
	IsUsed bool   `gorm:"default:false" json:"is_used"`
}

type WebAuthBlockdGuild struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	GuildID        string      `gorm:"uniqueIndex;not null" json:"guild_id"`
	BlockdGuildIDs StringArray `gorm:"type:text" json:"blockd_guilds"`
}
