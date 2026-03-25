package router

import (
	"github.com/SharkBot-Dev/NewSharkBot/api/src/internal/dto"
	"github.com/SharkBot-Dev/NewSharkBot/api/src/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterGuildsRoutes(router *gin.RouterGroup, db *gorm.DB) {
	guilds := router.Group("/guilds")
	{
		guilds.GET("/", listGuilds)
	}
}

// listGuilds godoc
// @Summary List guilds
// @Description Get a list of guilds
// @Tags Guilds
// @Accept json
// @Produce json
// @Success 200 {object} dto.ListGuildsResponse
// @Router /guilds/ [get]
func listGuilds(c *gin.Context) {
	// gormでDBのGuildSettingを取得
	var guildSettings []model.GuildSetting
	db, _ := c.Get("db")
	db.(*gorm.DB).Find(&guildSettings)
	c.JSON(200, dto.ListGuildsResponse{
		Data: guildSettings,
	})
}
