package router

import (
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterPremium(router *gin.RouterGroup) {
	premium := router.Group("/premium")
	{
		premium.GET("/:user_id", getPremiumSetting)
		premium.POST("/:user_id", updatePremiumSetting)
	}
}

func getPremiumSetting(c *gin.Context) {
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var premium model.Premium
	if err := db.Where("user_id = ?", userID).First(&premium).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, model.Premium{UserID: userID, PlanType: "free"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラーが発生しました"})
		return
	}

	if !premium.ExpiresAt.IsZero() && time.Now().After(premium.ExpiresAt) {
		if premium.PlanType != "free" {
			premium.PlanType = "free"
			db.Model(&premium).Update("plan_type", "free")
		}
	}

	c.JSON(http.StatusOK, premium)
}

func updatePremiumSetting(c *gin.Context) {
	userID := c.Param("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var input model.Premium
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	input.UserID = userID

	if err := db.Where("user_id = ?", userID).Assign(input).FirstOrCreate(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "設定の保存に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, input)
}
