package dto

import "github.com/SharkBot-Dev/NewSharkBot/api/internal/model"

type ListGuildsResponse struct {
	Data []model.GuildSetting `json:"data"`
}

type CreateOrUpdateGuildSettingRequest struct {
	EnabledModules map[string]bool `json:"enabledModules"`
}
