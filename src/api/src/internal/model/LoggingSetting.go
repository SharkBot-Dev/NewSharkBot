package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) { return json.Marshal(s) }
func (s *StringSlice) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, s)
}

type LoggingEvent struct {
	EventName  string  `json:"event_name"`
	ChannelId  string  `json:"log_channel_id"`
	WebhookUrl *string `json:"webhook_url"`

	IgnoredChannels StringSlice `json:"ignored_channels"`
}

type LoggingEvents []LoggingEvent

func (l LoggingEvents) Value() (driver.Value, error) { return json.Marshal(l) }
func (l *LoggingEvents) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, l)
}

type LoggingSetting struct {
	GuildID string `gorm:"primaryKey;size:20" json:"guild_id"`

	Events LoggingEvents `gorm:"type:json" json:"events"`

	GlobalIgnoredChannels StringSlice `gorm:"type:json" json:"global_ignored_channels"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
