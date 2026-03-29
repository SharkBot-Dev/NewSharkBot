package model

import (
	"time"
)

// 1. 部屋のメイン設定
type GlobalChatRoom struct {
	Name          string `gorm:"primaryKey" json:"name"`
	Description   string `json:"description"`
	Rule          string `json:"rule"`
	Slowmode      int    `gorm:"default:0" json:"slowmode"`
	MinAccountAge int    `gorm:"default:0" json:"min_account_age"`

	// 統計・フラグ
	TotalMessages int64 `gorm:"default:0" json:"total_messages"`
	IsActive      bool  `gorm:"default:true" json:"is_active"`

	// リレーション (Has Many)
	// 取得時に .Preload("Members") などで一括取得可能
	Members      []GlobalChatRoomUser        `gorm:"foreignKey:RoomName;references:Name" json:"members"`
	Connections  []GlobalChatConnect         `gorm:"foreignKey:RoomName;references:Name" json:"connections"`
	Restrictions []GlobalChatRoomRestriction `gorm:"foreignKey:RoomName;references:Name" json:"restrictions"`
	Filters      []GlobalChatRoomFilter      `gorm:"foreignKey:RoomName;references:Name" json:"filters"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// 2. ユーザーの権限管理 (Owner, Admin, Moderator)
type GlobalChatRoomUser struct {
	ID       uint      `gorm:"primaryKey"`
	RoomName string    `gorm:"index;not null" json:"name"`
	UserID   string    `gorm:"index;not null" json:"user_id"`
	Role     string    `gorm:"type:varchar(20);default:'member'" json:"role"` // "owner", "admin", "mod"
	JoinedAt time.Time `gorm:"autoCreateTime" json:"joined_at"`
}

// 3. 禁止・制限 (Ban, Mute)
type GlobalChatRoomRestriction struct {
	ID        uint       `gorm:"primaryKey"`
	RoomName  string     `gorm:"index" json:"name"`
	TargetID  string     `gorm:"index" json:"target_id"`       // UserID または ServerID
	Type      string     `gorm:"type:varchar(20)" json:"type"` // "ban_user", "ban_server", "mute_user"
	Reason    string     `json:"reason"`
	ExpiresAt *time.Time `json:"expires_at"` // nilの場合は無期限
	CreatedAt time.Time  `gorm:"autoCreateTime"`
}

// 4. NGワード
type GlobalChatRoomFilter struct {
	ID       uint   `gorm:"primaryKey"`
	RoomName string `gorm:"index" json:"name"`
	Word     string `gorm:"not null" json:"word"`
}

// 5. チャンネルの接続設定
type GlobalChatConnect struct {
	ChannelID  string    `gorm:"primaryKey" json:"channel_id"`
	RoomName   string    `gorm:"index" json:"room_name"`
	GuildID    string    `gorm:"index" json:"guild_id"`
	WebhookURL string    `gorm:"not null" json:"webhook_url"`
	CreatedAt  time.Time `gorm:"autoCreateTime"`

	Room *GlobalChatRoom `gorm:"foreignKey:RoomName;references:Name" json:"room,omitempty"`
}
