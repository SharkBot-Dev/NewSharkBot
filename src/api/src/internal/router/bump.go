package router

import (
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterBumps(router *gin.RouterGroup) {
	bump := router.Group("/bump")
	{
		bump.GET("/:guild_id", getBumpsSetting)
		bump.POST("/:guild_id", saveBumpSetting)
		bump.GET("/:guild_id/pending", GetPendingBumps)
	}
}

func getBumpsSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.BumpSetting
	if err := db.Preload("Bots").Where("guild_id = ?", guildID).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "設定が見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラーが発生しました"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func saveBumpSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input model.BumpSetting
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です: " + err.Error()})
		return
	}

	input.GuildID = guildID
	for i := range input.Bots {
		input.Bots[i].GuildID = guildID
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		var existing model.BumpSetting
		result := tx.Where("guild_id = ?", guildID).First(&existing)

		if result.Error == gorm.ErrRecordNotFound {
			return tx.Create(&input).Error
		} else if result.Error != nil {
			return result.Error
		}

		input.ID = existing.ID

		if err := tx.Where("guild_id = ?", guildID).Delete(&model.BumpBotsSetting{}).Error; err != nil {
			return err
		}

		return tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(&input).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "設定の保存に失敗しました: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, input)
}

func GetPendingBumps(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var pendingSettings []model.BumpBotsSetting

	now := time.Now()
	if err := db.Where("next_notify_at <= ? AND next_notify_at > ?", now, time.Unix(0, 0)).Find(&pendingSettings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "取得失敗"})
		return
	}
	c.JSON(http.StatusOK, pendingSettings)
}
