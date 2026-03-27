package router

import (
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterLevelsSettings(router *gin.RouterGroup) {
	guilds := router.Group("/guilds/levels")
	{
		guilds.GET("/:id", getLevelSetting)
		guilds.POST("/:id", saveLevelSetting)
		guilds.DELETE("/:id", deleteLevelSetting)

		guilds.GET("/:id/rewards", getRewardsSetting)      // 全取得
		guilds.POST("/:id/rewards", saveRewardsSetting)    // 一括保存/更新
		guilds.DELETE("/:id/rewards/:level", deleteReward) // 特定レベルの報酬削除
	}
}

func getLevelSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var setting model.LevelSetting

	if err := db.Preload("Embed").Where("guild_id = ?", id).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, setting)
}

func saveLevelSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		ChannelID string `json:"channel_id"`
		Content   string `json:"content"`
		EmbedID   *uint  `json:"embed_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := model.LevelSetting{GuildID: id}
	err := db.Transaction(func(tx *gorm.DB) error {
		return tx.Where(model.LevelSetting{GuildID: id}).
			Assign(model.LevelSetting{
				ChannelID: input.ChannelID,
				Content:   input.Content,
				EmbedID:   input.EmbedID,
			}).
			FirstOrCreate(&setting).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save setting"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func deleteLevelSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ?", id).Delete(&model.LevelSetting{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Level setting deleted"})
}

func getRewardsSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)
	var rewards []model.LevelRewardSetting

	if err := db.Where("guild_id = ?", id).Order("level asc").Find(&rewards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rewards)
}

func saveRewardsSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var input []struct {
		Level  int    `json:"level"`
		RoleID string `json:"role_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("guild_id = ?", id).Delete(&model.LevelRewardSetting{}).Error; err != nil {
			return err
		}

		for _, item := range input {
			newReward := model.LevelRewardSetting{
				GuildID: id,
				Level:   item.Level,
				RoleID:  item.RoleID,
			}
			if err := tx.Create(&newReward).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save rewards"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func deleteReward(c *gin.Context) {
	id := c.Param("id")
	level := c.Param("level")
	db := c.MustGet("db").(*gorm.DB)

	result := db.Where("guild_id = ? AND level = ?", id, level).Delete(&model.LevelRewardSetting{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Reward deleted"})
}
