package router

import (
	"github.com/SharkBot-Dev/NewSharkBot/api/internal/dto"
	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterGuildsRoutes(router *gin.RouterGroup) {
	guilds := router.Group("/guilds")
	{
		guilds.GET("/", listGuilds)
		guilds.GET("/:id", getGuildSettingByID)
		guilds.PUT("/:id", createOrUpdateGuildSetting)
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
	db, exists := c.Get("db")
	if !exists {
		c.JSON(500, gin.H{"error": "Database connection not found"})
		return
	}
	db.(*gorm.DB).Find(&guildSettings)
	c.JSON(200, dto.ListGuildsResponse{
		Data: guildSettings,
	})
}

// getGuildSettingByID godoc
// @Summary Get guild setting by ID
// @Description Get guild setting by ID
// @Tags Guilds
// @Accept json
// @Produce json
// @Param id path string true "Guild ID"
// @Success 200 {object} model.GuildSetting
// @Router /guilds/{id} [get]
func getGuildSettingByID(c *gin.Context) {
	id := c.Param("id")
	var guildSetting model.GuildSetting
	db, _ := c.Get("db")
	result := db.(*gorm.DB).First(&guildSetting, "guild_id = ?", id)
	if result.Error != nil {
		c.JSON(404, gin.H{"error": "Guild not found"})
		return
	}
	c.JSON(200, guildSetting)
}

// createOrUpdateGuildSetting godoc
// @Summary Create or update guild setting
// @Description Create or update guild setting
// @Tags Guilds
// @Accept json
// @Produce json
// @Param id path string true "Guild ID"
// @Param setting body dto.CreateOrUpdateGuildSettingRequest true "Guild setting"
// @Success 200 {object} model.GuildSetting
// @Router /guilds/{id} [put]
func createOrUpdateGuildSetting(c *gin.Context) {
	id := c.Param("id")
	var req dto.CreateOrUpdateGuildSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var guildSetting model.GuildSetting
	db, _ := c.Get("db")
	result := db.(*gorm.DB).First(&guildSetting, "guild_id = ?", id)
	if result.Error != nil {
		// Create new guild setting
		guildSetting = model.GuildSetting{
			GuildID:        id,
			EnabledModules: req.EnabledModules,
		}
		db.(*gorm.DB).Create(&guildSetting)
	} else {
		// Update existing guild setting
		guildSetting.EnabledModules = req.EnabledModules
		db.(*gorm.DB).Save(&guildSetting)
	}
	c.JSON(200, guildSetting)
}
