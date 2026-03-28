package router

import (
	"net/http"
	"strconv"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterCooldowns(router *gin.RouterGroup) {
	cooldowns := router.Group("/cooldowns")
	{
		cooldowns.POST("/:type/:key", func(c *gin.Context) {
			handleCooldown(c)
		})
	}
}

func handleCooldown(c *gin.Context) {
	key := c.Param("key")
	db := c.MustGet("db").(*gorm.DB)
	cooldownType := c.Param("type")

	hoursStr := c.DefaultQuery("hours", "24")
	hours, _ := strconv.Atoi(hoursStr)
	limitDuration := time.Duration(hours) * time.Hour

	var cd model.Cooldowns
	now := time.Now()

	result := db.Where("key = ? AND type = ?", key, cooldownType).First(&cd)

	if result.Error == nil {
		elapsed := now.Sub(cd.UpdatedAt)
		if elapsed < limitDuration {
			remaining := limitDuration - elapsed
			c.JSON(http.StatusTooManyRequests, gin.H{
				"allowed":           false,
				"message":           "Cooldown is active",
				"remaining_seconds": int(remaining.Seconds()),
				"remaining_hours":   int(remaining.Hours()),
			})
			return
		}
	}

	err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}, {Name: "type"}},
		DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
	}).Create(&model.Cooldowns{
		Key:       key,
		Type:      cooldownType,
		UpdatedAt: now,
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"allowed":        true,
		"last_execution": now,
	})
}
