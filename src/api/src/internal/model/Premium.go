package model

import (
	"time"
)

// IsPremium ユーザーが現在有効なプレミアムか判定する
func IsPremium(p Premium) bool {
	if p.PlanType == "free" {
		return false
	}
	// 現在時刻が期限内であればtrue
	return time.Now().Before(p.ExpiresAt)
}

type Premium struct {
	// DiscordのユーザーID (Snowflake) を主キーにする
	UserID string `gorm:"primaryKey;size:20" json:"user_id"`

	// プランの種類
	PlanType string `gorm:"not null;default:'free'" json:"plan_type"`

	// Stripeの顧客IDやサブスクリプションID（返金やキャンセル処理に必須）
	StripeCustomerID string `json:"stripe_customer_id"`
	StripeSubID      string `json:"stripe_sub_id"`

	// 有効期限 (これを超えたら一般ユーザーに戻す)
	ExpiresAt time.Time `json:"expires_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
