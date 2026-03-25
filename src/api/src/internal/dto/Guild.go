package dto

import "github.com/SharkBot-Dev/NewSharkBot/api/internal/model"

type ListGuildsResponse struct {
	Data []model.GuildSetting `json:"data"`
}
