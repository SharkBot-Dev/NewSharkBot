package router

import (
	"errors"
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterLoggingSetting(router *gin.RouterGroup) {
	basic := router.Group("/guilds/logging")
	{
		basic.GET("/:id", getLoggingSetting)
		basic.POST("/:id", saveLoggingSetting)
		basic.DELETE("/:id", deleteLoggingSetting)

		basic.GET("/:id/event/:name", getOneLoggingEventConfig)
		basic.POST("/:id/event/:name", setOneLoggingEvent)
		basic.DELETE("/:id/event/:name", deleteOneLoggingEvent)
	}
}

func getLoggingSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.LoggingSetting

	if err := db.Where("guild_id = ?", id).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Settings not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func saveLoggingSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.LoggingSetting

	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	setting.GuildID = id

	err := db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&setting).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func getOneLoggingEventConfig(c *gin.Context) {
	id := c.Param("id")
	eventName := c.Param("name")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.LoggingSetting
	if err := db.Where("guild_id = ?", id).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Settings not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}

	for _, e := range setting.Events {
		if e.EventName == eventName {
			c.JSON(http.StatusOK, e)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Event not configured"})
}

func setOneLoggingEvent(c *gin.Context) {
	id := c.Param("id")
	eventName := c.Param("name")
	db := c.MustGet("db").(*gorm.DB)

	var input model.LoggingEvent
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	input.EventName = eventName

	var setting model.LoggingSetting
	if err := db.FirstOrCreate(&setting, model.LoggingSetting{GuildID: id}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}

	updated := false
	for i, e := range setting.Events {
		if e.EventName == eventName {
			setting.Events[i] = input
			updated = true
			break
		}
	}
	if !updated {
		setting.Events = append(setting.Events, input)
	}

	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func deleteOneLoggingEvent(c *gin.Context) {
	id := c.Param("id")
	eventName := c.Param("name")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.LoggingSetting
	if err := db.Where("guild_id = ?", id).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	newEvents := model.LoggingEvents{}
	for _, e := range setting.Events {
		if e.EventName != eventName {
			newEvents = append(newEvents, e)
		}
	}
	setting.Events = newEvents

	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func deleteLoggingSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Delete(&model.LoggingSetting{}, "guild_id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
