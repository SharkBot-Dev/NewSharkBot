package router

import (
	"errors"
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAchievement(router *gin.RouterGroup) {
	achievements := router.Group("/achievements")
	{
		// サーバー設定用
		achievements.GET("/settings/:guild_id", getAchievementSetting)
		achievements.POST("/settings/:guild_id", updateAchievementSetting)

		// サーバー内の実績定義 (Master Data)
		achievements.GET("/list/:guild_id", getAchievementList)
		achievements.POST("/list/:guild_id", createOrUpdateAchievement)
		achievements.DELETE("/list/:guild_id/:achievement_id", deleteAchievement)

		// ユーザーごとの進捗 (User Data)
		achievements.GET("/progress/:guild_id/:user_id", getUserProgress)
		achievements.POST("/progress/:guild_id/:user_id", updateUserProgress)
	}
}

// --- サーバー設定関連 ---

func getAchievementSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.AchievementSetting
	if err := db.Where("guild_id = ?", guildID).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "設定が見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラーが発生しました"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func updateAchievementSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input model.AchievementSetting
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	input.GuildID = guildID
	// GuildIDをキーにして保存または更新 (Upsert)
	if err := db.Where("guild_id = ?", guildID).Assign(input).FirstOrCreate(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "設定の保存に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, input)
}

// --- 実績定義関連 ---

func getAchievementList(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var list []model.Achievement
	// Preloadで関連するStepsも一緒に取得
	if err := db.Preload("Steps").Where("guild_id = ?", guildID).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データ取得に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func createOrUpdateAchievement(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input model.Achievement
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力データが不正です"})
		return
	}

	input.GuildID = guildID

	err := db.Transaction(func(tx *gorm.DB) error {
		if input.ID != 0 {
			result := tx.Model(&model.Achievement{}).
				Where("id = ? AND guild_id = ?", input.ID, guildID).
				Select("*").
				Updates(&input)

			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return errors.New("指定された実績が見つからないか、権限がありません")
			}

			if err := tx.Where("achievement_id = ?", input.ID).Delete(&model.AchievementStep{}).Error; err != nil {
				return err
			}

			if len(input.Steps) > 0 {
				for i := range input.Steps {
					input.Steps[i].ID = 0
					input.Steps[i].AchievementID = input.ID
				}
				if err := tx.Create(&input.Steps).Error; err != nil {
					return err
				}
			}
		} else {
			if err := tx.Create(&input).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "実績の保存に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, input)
}

func deleteAchievement(c *gin.Context) {
	guildID := c.Param("guild_id")
	achievementID := c.Param("achievement_id")
	db := c.MustGet("db").(*gorm.DB)

	// GuildIDのチェックも含めて削除（他サーバーの実績を消せないように）
	result := db.Where("id = ? AND guild_id = ?", achievementID, guildID).Delete(&model.Achievement{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "削除に失敗しました"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "対象の実績が見つかりません"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "削除完了"})
}

// --- ユーザー進捗関連 ---

func getUserProgress(c *gin.Context) {
	guildID := c.Param("guild_id")
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var progress []model.UserAchievementProgress
	if err := db.Where("guild_id = ? AND user_id = ?", guildID, userID).Find(&progress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "進捗の取得に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func updateUserProgress(c *gin.Context) {
	guildID := c.Param("guild_id")
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var input model.UserAchievementProgress
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "データが不正です"})
		return
	}

	input.GuildID = guildID
	input.UserID = userID

	var achievement model.Achievement
	if err := db.Where("id = ? AND guild_id = ?", input.AchievementID, guildID).First(&achievement).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "指定された実績が見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "実績の検証に失敗しました"})
		return
	}

	err := db.Where("guild_id = ? AND user_id = ? AND achievement_id = ?",
		guildID, userID, input.AchievementID).
		Assign(map[string]interface{}{
			"current_value":   input.CurrentValue,
			"is_completed":    input.IsCompleted,
			"last_step_order": input.LastStepOrder,
			"updated_at":      time.Now(),
		}).
		FirstOrCreate(&input).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "進捗の更新に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, input)
}
