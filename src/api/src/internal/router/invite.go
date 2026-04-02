package router

import (
	"errors"
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterInvite(router *gin.RouterGroup) {
	invites := router.Group("/invites")
	{
		// サーバー設定用
		invites.GET("/settings/:guild_id", getInviteSetting)
		invites.POST("/settings/:guild_id", saveInviteSetting)

		invites.GET("/ranking/:guild_id", getInviteRanking)

		invites.GET("/users/:guild_id/:user_id", getUserInviteSetting)
		invites.POST("/users/:guild_id/:user_id", saveUserInviteSetting)
	}
}

type UpdateInviteRequest struct {
	Count int  `json:"count"` // 加算値 or 絶対値
	Add   bool `json:"add"`   // trueなら加算、falseなら上書き
}

func getInviteSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.InviteSetting
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

func saveInviteSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var req model.InviteSetting
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不正なリクエスト"})
		return
	}

	var setting model.InviteSetting
	err := db.Where("guild_id = ?", guildID).First(&setting).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		req.GuildID = guildID
		req.CreatedAt = time.Now()
		req.UpdatedAt = time.Now()

		if err := db.Create(&req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "作成失敗"})
			return
		}

		c.JSON(http.StatusOK, req)
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	setting.ChannelID = req.ChannelID
	setting.Content = req.Content
	setting.UpdatedAt = time.Now()
	setting.EmbedId = req.EmbedId

	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func getInviteRanking(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var rankings []model.InviteRanking

	if err := db.
		Where("guild_id = ?", guildID).
		Order("count DESC").
		Limit(50).
		Find(&rankings).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	c.JSON(http.StatusOK, rankings)
}

func getUserInviteSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var ranking model.InviteRanking

	err := db.
		Where("guild_id = ? AND user_id = ?", guildID, userID).
		First(&ranking).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"guild_id": guildID,
				"user_id":  userID,
				"count":    0,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	c.JSON(http.StatusOK, ranking)
}

func saveUserInviteSetting(c *gin.Context) {
	guildID := c.Param("guild_id")
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var req UpdateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不正なリクエスト"})
		return
	}

	var ranking model.InviteRanking
	err := db.
		Where("guild_id = ? AND user_id = ?", guildID, userID).
		First(&ranking).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ranking = model.InviteRanking{
				GuildID: guildID,
				UserID:  userID,
				Count:   0,
			}
			if err := db.Create(&ranking).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "作成失敗"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
			return
		}
	}

	if req.Add {
		db.Model(&ranking).Update("count", gorm.Expr("count + ?", req.Count))
	} else {
		db.Model(&ranking).Update("count", req.Count)
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}
