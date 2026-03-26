package router

import (
	"net/http"
	"strconv"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterEmbed(router *gin.RouterGroup) {
	guilds := router.Group("/guilds/embeds")
	{
		guilds.GET("/:id", getEmbedSettingList)             // 一覧取得
		guilds.GET("/:id/:name", getEmbedSetting)           // 個別取得
		guilds.POST("/:id", createOrUpdateEmbedSetting)     // 作成・更新
		guilds.DELETE("/:id/:embed_id", deleteEmbedSetting) // 削除
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
