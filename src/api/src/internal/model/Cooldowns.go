package model

import "time"

type Cooldowns struct {
	Key  string `gorm:"primaryKey;size:255" json:"key"`
	Type string `gorm:"primaryKey;size:255" json:"type"`

	LastUsedAt time.Time `json:"last_used_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
