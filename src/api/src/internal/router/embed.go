package router

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterEmbed(router *gin.RouterGroup) {
	embeds := router.Group("/guilds/embeds")
	{
		embeds.GET("/:id", getEmbedSettingList)             // 一覧取得
		embeds.GET("/:id/:name", getEmbedSetting)           // 個別取得
		embeds.POST("/:id", createOrUpdateEmbedSetting)     // 作成・更新
		embeds.DELETE("/:id/:embed_id", deleteEmbedSetting) // 削除
	}

	pins := router.Group("/guilds/pin")
	{
		pins.GET("/:id", getPins)
		pins.POST("/:id", createPins)
		pins.DELETE("/:id", deletePins)
		pins.GET("/:id/:channel", getOnePin)
	}
}

// 全件取得
func getEmbedSettingList(c *gin.Context) {
	id := c.Param("id")
	var settings []model.EmbedSetting
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ?", id).Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// 個別取得
func getEmbedSetting(c *gin.Context) {
	id := c.Param("id")
	name := c.Param("name")
	var setting model.EmbedSetting
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ? AND name = ?", id, name).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Embed setting not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, setting)
}

// 作成・更新
func createOrUpdateEmbedSetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	// リクエストボディをパースするための構造体
	var input struct {
		Name string          `json:"name" binding:"required"`
		Data model.EmbedData `json:"data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var setting model.EmbedSetting
	// 既存の設定があるか確認
	result := db.Where("guild_id = ? AND name = ?", id, input.Name).First(&setting)

	setting.GuildID = id
	setting.Name = input.Name
	setting.Data = input.Data

	if result.Error == gorm.ErrRecordNotFound {
		// 新規作成
		if err := db.Create(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
			return
		}
	} else {
		// 更新
		if err := db.Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
			return
		}
	}

	c.JSON(http.StatusOK, setting)
}

// 削除
func deleteEmbedSetting(c *gin.Context) {
	guildID := c.Param("id")
	embedID := c.Param("embed_id")
	db := c.MustGet("db").(*gorm.DB)

	embedIdInt, err := strconv.Atoi(embedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid embed_id format"})
		return
	}

	result := db.Where("guild_id = ? AND id = ?", guildID, embedIdInt).Delete(&model.EmbedSetting{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getPins(c *gin.Context) {
	guildID := c.Param("id")

	var settings []model.PinMessageSetting
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ?", guildID).Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func getOnePin(c *gin.Context) {
	guildID := c.Param("id")
	channelId := c.Param("channel")

	var settings model.PinMessageSetting
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("guild_id = ? AND channel_id = ?", guildID, channelId).First(&settings).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pin setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func createPins(c *gin.Context) {
	guildID := c.Param("id") // URLパスから取得
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		ChannelId string `json:"channel_id" binding:"required"`
		MessageId string `json:"last_message_id"`
		Content   string `json:"content"`
		EmbedId   string `json:"embed_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var setting model.PinMessageSetting

	result := db.Where(model.PinMessageSetting{
		GuildID:   guildID,
		ChannelID: input.ChannelId,
	}).FirstOrInit(&setting)

	setting.LastMessageID = input.MessageId
	setting.Content = input.Content
	setting.EmbedID = input.EmbedId

	if result.Error == gorm.ErrRecordNotFound {
		if err := db.Create(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
			return
		}
	} else {
		if err := db.Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
			return
		}
	}

	c.JSON(http.StatusOK, setting)
}

func deletePins(c *gin.Context) {
	guildID := c.Param("id")
	channelID := c.Query("channel_id")

	if channelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "channel_id は必須です"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)

	result := db.Where("guild_id = ? AND channel_id = ?", guildID, channelID).Delete(&model.PinMessageSetting{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "削除に失敗しました"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "削除対象が見つかりませんでした"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "正常に削除されました"})
}
