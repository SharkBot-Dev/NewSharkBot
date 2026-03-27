package router

import (
	"fmt"
	"log"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/dto"
	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterGuildsRoutes(router *gin.RouterGroup) {
	guilds := router.Group("/guilds")
	{
		guilds.GET("/", listGuilds)
		guilds.GET("/:id", getGuildSettingByID)
		guilds.PUT("/:id", createOrUpdateGuildSetting)
		guilds.GET("/:id/module", isGuildModuleEnabled)
		guilds.PATCH("/:id/module", updateGuildModuleSetting)
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
	db, exists := c.Get("db")
	if !exists {
		c.JSON(500, gin.H{"error": "Database connection not found"})
		return
	}
	result := db.(*gorm.DB).First(&guildSetting, "guild_id = ?", id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "Guild not found"})
		} else {
			log.Printf("Error: %s", result.Error.Error())
			c.JSON(500, gin.H{"error": "Internal server error"})
		}
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
	db, exists := c.Get("db")
	if !exists {
		c.JSON(500, gin.H{"error": "Database connection not found"})
		return
	}
	result := db.(*gorm.DB).First(&guildSetting, "guild_id = ?", id)
	if result.Error != nil {
		if result.Error != gorm.ErrRecordNotFound {
			log.Printf("Error: %s", result.Error.Error())
			c.JSON(500, gin.H{"error": "Internal server error"})
			return
		}
		// Create new guild setting
		guildSetting = model.GuildSetting{
			GuildID:        id,
			EnabledModules: req.EnabledModules,
		}
		result := db.(*gorm.DB).Create(&guildSetting)
		if result.Error != nil {
			log.Printf("Error: %s", result.Error.Error())
			c.JSON(500, gin.H{"error": "Internal server error"})
			return
		}
	} else {
		// Update existing guild setting
		guildSetting.EnabledModules = req.EnabledModules
		result := db.(*gorm.DB).Save(&guildSetting)
		if result.Error != nil {
			log.Printf("Error: %s", result.Error.Error())
			c.JSON(500, gin.H{"error": "Internal server error"})
			return
		}
	}
	c.JSON(200, guildSetting)
}

// isGuildModuleEnabled godoc
// @Summary Check if a specific module is enabled
// @Tags Guilds
// @Param id path string true "Guild ID"
// @Param module query string true "Module Name"
// @Success 200 {object} map[string]bool
// @Router /guilds/{id}/module/check [get]
func isGuildModuleEnabled(c *gin.Context) {
	id := c.Param("id")
	moduleName := c.Query("module")

	if moduleName == "" {
		c.JSON(400, gin.H{"error": "Module parameter is required"})
		return
	}

	dbRaw, exists := c.Get("db")
	if !exists {
		c.JSON(500, gin.H{"error": "Database connection not found"})
		return
	}
	db := dbRaw.(*gorm.DB)

	var guildSetting model.GuildSetting
	result := db.First(&guildSetting, "guild_id = ?", id)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(200, gin.H{"module": moduleName, "enabled": false})
		} else {
			log.Printf("Error: %s", result.Error.Error())
			c.JSON(500, gin.H{"error": "Internal server error"})
		}
		return
	}

	enabled := false
	if guildSetting.EnabledModules != nil {
		enabled = guildSetting.EnabledModules[moduleName]
	}

	c.JSON(200, gin.H{
		"guild_id": id,
		"module":   moduleName,
		"enabled":  enabled,
	})
}

func updateGuildModuleSetting(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	dbRaw, _ := c.Get("db")
	db := dbRaw.(*gorm.DB)

	path := fmt.Sprintf("{%s}", req.Module)
	value := fmt.Sprintf("%t", req.Enabled)

	var guildSetting model.GuildSetting

	err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "guild_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"enabled_modules": gorm.Expr("jsonb_set(COALESCE(enabled_modules, '{}'), ?, ?::jsonb)", path, value),
			"updated_at":      gorm.Expr("NOW()"),
		}),
	}).Create(&model.GuildSetting{
		GuildID:        id,
		EnabledModules: map[string]bool{req.Module: req.Enabled},
	}).Error

	if err != nil {
		log.Printf("Update Error: %v", err)
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}

	db.First(&guildSetting, "guild_id = ?", id)
	c.JSON(200, guildSetting)
}
