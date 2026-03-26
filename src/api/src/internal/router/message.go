package router

import (
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterMessageSettings(router *gin.RouterGroup) {
	// /guilds/message/welcome や /guilds/message/goodbye でアクセス
	guilds := router.Group("/guilds/message")
	{
		guilds.GET("/:id/:type", getMessageSetting)       // 取得
		guilds.POST("/:id/:type", saveMessageSetting)     // 作成・更新 (Upsert)
		guilds.DELETE("/:id/:type", deleteMessageSetting) // 削除
	}
}

// 取得 (Welcome または Goodbye)
func getMessageSetting(c *gin.Context) {
	id := c.Param("id")
	msgType := c.Param("type") // "welcome" or "goodbye"

	db := c.MustGet("db").(*gorm.DB)
	var setting model.MessageSetting

	// Embedデータも一緒に取得するために Preload を使用
	result := db.Preload("Embed").Where("guild_id = ? AND type = ?", id, msgType).First(&setting)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, setting)
}

// 保存 (作成・更新)
func saveMessageSetting(c *gin.Context) {
	id := c.Param("id")
	msgType := c.Param("type")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		ChannelID string `json:"channel_id"`
		Content   string `json:"content"`
		EmbedID   *uint  `json:"embed_id"` // nullを許容
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var setting model.MessageSetting
	// 既存レコードを探す
	result := db.Where("guild_id = ? AND type = ?", id, msgType).First(&setting)

	// フィールド更新
	setting.GuildID = id
	setting.Type = msgType
	setting.ChannelID = input.ChannelID
	setting.Content = input.Content
	setting.EmbedID = input.EmbedID

	if result.Error == gorm.ErrRecordNotFound {
		// 新規作成
		if err := db.Create(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create setting"})
			return
		}
	} else {
		// 更新
		if err := db.Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting"})
			return
		}
	}

	c.JSON(http.StatusOK, setting)
}

// 削除
func deleteMessageSetting(c *gin.Context) {
	id := c.Param("id")
	msgType := c.Param("type")
	db := c.MustGet("db").(*gorm.DB)

	result := db.Where("guild_id = ? AND type = ?", id, msgType).Delete(&model.MessageSetting{})

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": msgType + " setting deleted successfully"})
}
