package model

import (
	"encoding/json"
	"time"
)

// TicketPanel は個別のチケット入り口パネルごとの設定を保持します
type TicketPanel struct {
	// 識別子
	ID        string    `gorm:"primaryKey;column:id" json:"id"` // パネル固有のUUID等
	GuildID   string    `gorm:"index;column:guild_id" json:"guildId"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	Name string `json:"name"`

	// --- 1. 送信先・表示設定 ---
	// どのチャンネルにこのパネルを出すか
	TargetChannelID string `gorm:"column:target_channel_id" json:"targetChannelId"`
	EmbedID         string `gorm:"column:embed_id" json:"embedId"`
	Content         string `gorm:"column:content" json:"content"`

	// パネルに表示されるボタン群 (TicketButtonConfigの配列)
	// 例: [ {action: "create", label: "サポート"}, {action: "role", label: "通知希望"} ]
	PanelButtons json.RawMessage `gorm:"type:jsonb;column:panel_buttons" json:"panelButtons"`

	// --- 2. このパネルから作られるチケットの個別設定 ---
	// パネルごとに作成先や担当者を変えられるようにここに保持します
	CategoryID     string          `gorm:"column:category_id" json:"categoryId"`
	LogChannelID   string          `gorm:"column:log_channel_id" json:"logChannelId"`
	StaffRoleIDs   json.RawMessage `gorm:"type:jsonb;column:staff_role_ids" json:"staffRoleIds"`
	MentionRoleIDs json.RawMessage `gorm:"type:jsonb;column:mention_role_ids" json:"mentionRoleIds"`

	// チャンネル名の命名規則や制限もパネルごとに設定可能
	NameTemplate string `gorm:"column:name_template;default:'ticket-{user}'" json:"nameTemplate"`
	Cooldown     int    `gorm:"column:cooldown;default:60" json:"cooldown"`
	TicketLimit  int    `gorm:"column:ticket_limit;default:1" json:"ticketLimit"`

	InnerButtons json.RawMessage `gorm:"type:jsonb;column:inner_buttons" json:"innerButtons"`
	InnerContent string          `gorm:"column:inner_content" json:"innerContent"`
	InnerEmbedId string          `gorm:"column:inner_embed_id" json:"innerEmbedId"`
}

type TicketButtonConfig struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Emoji  string `json:"emoji"`
	Style  int    `json:"style"`
	Action string `json:"action"` // create, claim, close, reopen, delete, role
	RoleID string `json:"roleId,omitempty"`
}
