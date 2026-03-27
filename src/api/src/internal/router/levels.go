package router

import (
	"errors"
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

		guilds.POST("/:id/users/reset", ResetAllUserLevels)

		guilds.GET("/:id/users/:user", GetUserLevel)
		guilds.POST("/:id/users/:user", SaveUserLevel)

		guilds.GET("/:id/leaderboard", GetLevelLeaderboard)
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

	// log.Printf("%+v", input)

	setting := model.LevelSetting{GuildID: id}

	err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "guild_id"},
		},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"channel_id": input.ChannelID,
			"content":    input.Content,
			"embed_id":   input.EmbedID,
		}),
	}).Create(&setting).Error

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

func GetLevelLeaderboard(c *gin.Context) {
	guildID := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var settings []model.LevelUserSetting

	err := db.Where("guild_id = ?", guildID).
		Order("xp DESC, id ASC").
		Limit(10).
		Find(&settings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ランキングの取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func GetUserLevel(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.LevelUserSetting

	if err := db.Where("guild_id = ? AND user_id = ?", guildID, userID).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "ユーザー設定が見つかりません"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "サーバーエラーが発生しました"})
		}
		return
	}
	c.JSON(http.StatusOK, setting)
}

func SaveUserLevel(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Level int `json:"level"`
		XP    int `json:"xp"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error."})
		return
	}

	var setting model.LevelUserSetting

	result := db.Where(model.LevelUserSetting{GuildID: guildID, UserID: userID}).
		FirstOrCreate(&setting)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベース操作に失敗しました"})
		return
	}

	setting.Level = input.Level
	setting.XP = input.XP

	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func ResetAllUserLevels(c *gin.Context) {
	guildID := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	result := db.Model(&model.LevelUserSetting{}).
		Where("guild_id = ?", guildID).
		Updates(map[string]interface{}{
			"level": 0,
			"xp":    0,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "成功しました。",
		"affectedRows": result.RowsAffected,
	})
}
