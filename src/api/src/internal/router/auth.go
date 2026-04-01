package router

import (
	"errors"
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAuth(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		// 認証コード関連
		auth.GET("/code/:guild_id/:code", getAuthCode)
		auth.POST("/code", createAuthCode)
		auth.DELETE("/code/:guild_id/:code", deleteAuthCode)

		// ブロックサーバー設定 (Web認証時に拒否するサーバーリスト)
		auth.PUT("/blockguilds/:guild_id", putAuthBlockGuilds)
		auth.GET("/blockguilds/:guild_id", getAuthBlockGuilds)
	}
}

// --- 認証コード取得 ---
func getAuthCode(c *gin.Context) {
	id := c.Param("guild_id")
	code := c.Param("code")
	db := c.MustGet("db").(*gorm.DB)

	var authCache model.AuthCache

	// 有効期限内かつ未検索のものを取得
	err := db.Where("guild_id = ? AND code = ? AND is_used = ? AND expires_at > ?", id, code, false, time.Now()).First(&authCache).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired code"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}
	c.JSON(http.StatusOK, authCache)
}

// --- 認証コード作成 ---
func createAuthCode(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var input model.AuthCache

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ExpiresAt = time.Now().Add(10 * time.Minute)
	input.IsUsed = false

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create code"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// --- 認証コード削除 ---
func deleteAuthCode(c *gin.Context) {
	id := c.Param("guild_id")
	code := c.Param("code")
	db := c.MustGet("db").(*gorm.DB)

	result := db.Where("guild_id = ? AND code = ?", id, code).Delete(&model.AuthCache{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

// --- ブロックサーバー設定保存 (PUT) ---
func putAuthBlockGuilds(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		BlockdGuildIDs []string `json:"blockd_guilds"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	blockSetting := model.WebAuthBlockdGuild{
		GuildID:        guildID,
		BlockdGuildIDs: input.BlockdGuildIDs,
	}

	// upsert (存在すれば更新、なければ作成)
	err := db.Where(model.WebAuthBlockdGuild{GuildID: guildID}).
		Assign(model.WebAuthBlockdGuild{BlockdGuildIDs: input.BlockdGuildIDs}).
		FirstOrCreate(&blockSetting).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Save failed"})
		return
	}

	c.JSON(http.StatusOK, blockSetting)
}

// --- ブロックサーバー設定取得 (GET) ---
func getAuthBlockGuilds(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.WebAuthBlockdGuild
	if err := db.Where("guild_id = ?", guildID).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{"guild_id": guildID, "blockd_guilds": []string{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fetch failed"})
		return
	}

	c.JSON(http.StatusOK, setting)
}
