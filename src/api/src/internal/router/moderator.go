package router

import (
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterModeratorSetting(router *gin.RouterGroup) {
	basic := router.Group("/guilds/moderator")
	{
		basic.GET("/:id", getModeratorSetting)
		basic.POST("/:id", saveModeratorSetting)
		basic.DELETE("/:id", deleteModeratorSetting)
	}

	automod := router.Group("/guilds/automod")
	{
		automod.GET("/:id/all", getAllAutoModSettings)
		automod.GET("/:id/:type", getAutoModSetting)
		automod.POST("/:id/:type", saveAutoModSetting)
		automod.DELETE("/:id/:type", deleteAutoModSetting)
	}
}

func getModeratorSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.ModeratorSetting

	if err := db.Where("guild_id = ?", id).First(&setting).Error; err != nil {
		handleDBError(c, err)
		return
	}
	c.JSON(http.StatusOK, setting)
}

func saveModeratorSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.ModeratorSetting

	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	setting.GuildID = id

	if err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "guild_id"}},
		UpdateAll: true,
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func deleteModeratorSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	if err := db.Where("guild_id = ?", id).Delete(&model.ModeratorSetting{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func getAutoModSetting(c *gin.Context) {
	id := c.Param("id")
	modType := c.Param("type")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.EnabledAutoModeratorSetting

	if err := db.Where("guild_id = ? AND type = ?", id, modType).First(&setting).Error; err != nil {
		handleDBError(c, err)
		return
	}
	c.JSON(http.StatusOK, setting)
}

func getAllAutoModSettings(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var settings []model.EnabledAutoModeratorSetting

	if err := db.Where("guild_id = ?", id).Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	result := make(map[string]model.EnabledAutoModeratorSetting)
	for _, s := range settings {
		result[s.Type] = s
	}

	c.JSON(http.StatusOK, result)
}

func saveAutoModSetting(c *gin.Context) {
	id := c.Param("id")
	modType := c.Param("type")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.EnabledAutoModeratorSetting

	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting.GuildID = id
	setting.Type = modType

	if err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "guild_id"}, {Name: "type"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"actions",
			"whitelist_channel_ids",
			"whitelist_role_ids",
			"badwords",
			"allowed_links",
			"updated_at",
		}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save automod setting"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func deleteAutoModSetting(c *gin.Context) {
	id := c.Param("id")
	modType := c.Param("type")
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ? AND type = ?", id, modType).Delete(&model.EnabledAutoModeratorSetting{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func handleDBError(c *gin.Context, err error) {
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
	}
}
