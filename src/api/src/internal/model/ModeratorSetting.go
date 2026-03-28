package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type StringArray []string

func (a StringArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan StringArray: unsupported type")
	}

	return json.Unmarshal(bytes, a)
}

const (
	TypeInvite  = "invite"
	TypeBadword = "badword"
	TypeBadlink = "badlink"
	TypeSpoiler = "spoiler"
)

type ModeratorSetting struct {
	GuildID      string    `gorm:"primaryKey;size:20" json:"guild_id"`
	LogChannelID string    `json:"log_channel_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type EnabledAutoModeratorSetting struct {
	GuildID string `gorm:"primaryKey;size:20" json:"guild_id" binding:"required"`
	Type    string `gorm:"primaryKey;size:50" json:"type" binding:"required,oneof=invite badword badlink spoiler"`

	Actions             StringArray `gorm:"type:text" json:"actions" binding:"required,dive,oneof=kick ban warn timeout delete"`
	WhitelistChannelIDs StringArray `gorm:"type:text" json:"whitelist_channel_ids"`
	WhitelistRoleIDs    StringArray `gorm:"type:text" json:"whitelist_role_ids"`

	Badwords     *StringArray `gorm:"type:text" json:"badwords,omitempty"`
	AllowedLinks *StringArray `gorm:"type:text" json:"allowed_links,omitempty"`

	AllowOnlyVerified *bool `json:"allow_only_verified,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
