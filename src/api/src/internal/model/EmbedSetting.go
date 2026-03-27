package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type EmbedData map[string]interface{}

func (ed *EmbedData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, ed)
}

func (ed EmbedData) Value() (driver.Value, error) {
	if len(ed) == 0 {
		return nil, nil
	}
	return json.Marshal(ed)
}

type EmbedSetting struct {
	ID        uint      `gorm:"primaryKey"`
	GuildID   string    `gorm:"index;not null" json:"guild_id"` // どのサーバーの設定か
	Name      string    `json:"name"`                           // "welcome_custom", "goodbye_v1" など
	Data      EmbedData `gorm:"type:jsonb" json:"data"`         // Discord EmbedのDict
	CreatedAt time.Time
	UpdatedAt time.Time
}
