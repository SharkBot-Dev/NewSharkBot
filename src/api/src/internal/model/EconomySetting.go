package model

import "time"

// ギルドごとの全体設定
type EconomySetting struct {
	GuildID   string    `gorm:"primaryKey;size:255" json:"guild_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ユーザーの経済状況
type EconomyUserSetting struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	GuildID string `gorm:"uniqueIndex:idx_guild_user;size:255" json:"guild_id"`
	UserID  string `gorm:"uniqueIndex:idx_guild_user;size:255" json:"user_id"`
	Money   int    `gorm:"not null;default:0" json:"money"`

	Items []EconomyItemSetting `gorm:"many2many:user_inventory;" json:"items"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// アイテムの定義
type EconomyItemSetting struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	GuildID string `gorm:"index;size:255" json:"guild_id"`
	Name    string `gorm:"size:255;not null" json:"name"`
	Price   int    `gorm:"not null" json:"price"`

	Type    *string `gorm:"size:50" json:"type"` // role, use, static
	RoleID  *string `gorm:"size:255" json:"role_id"`
	AutoUse *bool   `gorm:"default:false" json:"auto_use"`

	CanBuy         *bool `gorm:"default:true" json:"can_buy"`
	CanBuyMultiple *bool `gorm:"default:true" json:"can_buy_multiple"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ユーザーのクールダウン
type EconomyCooldown struct {
	GuildID string `gorm:"primaryKey;size:255" json:"guild_id"`
	UserID  string `gorm:"primaryKey;size:255" json:"user_id"`

	LastWorkTime  time.Time `json:"last_work_time"`
	LastDailyTime time.Time `json:"last_daily_time"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
