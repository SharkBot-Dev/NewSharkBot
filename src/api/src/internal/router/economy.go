package router

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterEconomy(router *gin.RouterGroup) {
	guilds := router.Group("/guilds/economy")
	{
		// 設定
		guilds.GET("/:id", getEconomySetting)

		// アイテム
		guilds.GET("/:id/items", getEconomyItems)
		guilds.POST("/:id/items", createEconomyItem)
		guilds.DELETE("/:id/items/:item_id", deleteEconomyItem)

		// ユーザー
		guilds.GET("/:id/users", getEconomyUserLeaderboard)

		guilds.GET("/:id/users/:user", getEconomyUserSetting)
		guilds.POST("/:id/users/:user", saveEconomyUserSetting)

		// クールダウン
		guilds.GET("/:id/users/:user/cooldown", getEconomyCooldown)
		guilds.POST("/:id/users/:user/cooldown", saveEconomyCooldown)
	}
}

func getEconomySetting(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.EconomySetting

	if err := db.Where("guild_id = ?", id).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, setting)
}

func getEconomyItems(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var items []model.EconomyItemSetting

	if err := db.Where("guild_id = ?", id).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch items"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func createEconomyItem(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Name           string `json:"name" binding:"required"`
		Price          int    `json:"price" binding:"required"`
		Type           string `json:"type" binding:"required"`
		RoleID         string `json:"role_id"`
		AutoUse        bool   `json:"auto_use"`
		CanBuy         bool   `json:"can_buy"`
		CanBuyMultiple bool   `json:"can_buy_multiple"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var setting model.EconomyItemSetting

	result := db.Where("guild_id = ? AND name = ?", id, input.Name).First(&setting)

	setting.GuildID = id
	setting.Name = input.Name
	setting.Price = input.Price

	t := input.Type
	setting.Type = &t

	au := input.AutoUse
	setting.AutoUse = &au

	cb := input.CanBuy
	setting.CanBuy = &cb

	cbm := input.CanBuyMultiple
	setting.CanBuyMultiple = &cbm

	if input.RoleID != "" {
		rid := input.RoleID
		setting.RoleID = &rid
	} else {
		setting.RoleID = nil
	}

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if result.Error == gorm.ErrRecordNotFound {
		if err := db.Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save item"})
			return
		}
	}

	c.JSON(http.StatusOK, setting)
}

func deleteEconomyItem(c *gin.Context) {
	guildID := c.Param("id")
	itemID := c.Param("item_id")
	db := c.MustGet("db").(*gorm.DB)
	itemIDInt, err := strconv.Atoi(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item_id format"})
		return
	}

	result := db.Where("guild_id = ? AND id = ?", guildID, itemIDInt).Delete(&model.EconomyItemSetting{})

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

func getEconomyUserLeaderboard(c *gin.Context) {
	guildID := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var leaderboards []model.EconomyUserSetting

	err := db.Where("guild_id = ?", guildID).
		Order("money DESC").
		Limit(10).
		Find(&leaderboards).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, leaderboards)
}

func getEconomyUserSetting(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")
	db := c.MustGet("db").(*gorm.DB)

	var userSetting model.EconomyUserSetting

	err := db.Preload("Items").Where("guild_id = ? AND user_id = ?", guildID, userID).First(&userSetting).Error

	if err == gorm.ErrRecordNotFound {
		userSetting = model.EconomyUserSetting{
			GuildID: guildID,
			UserID:  userID,
			Money:   0,
			Items:   []model.EconomyItemSetting{},
		}
		if err := db.Create(&userSetting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user setting"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, userSetting)
}

func saveEconomyUserSetting(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Money   *int   `json:"money"`
		ItemIDs []uint `json:"item_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userSetting model.EconomyUserSetting
	if err := db.Where("guild_id = ? AND user_id = ?", guildID, userID).First(&userSetting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			userSetting = model.EconomyUserSetting{GuildID: guildID, UserID: userID}
			if err := db.Create(&userSetting).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user setting"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if input.Money != nil {
			userSetting.Money = *input.Money
		}

		if input.ItemIDs != nil {
			var items []model.EconomyItemSetting
			if len(input.ItemIDs) > 0 {
				if err := tx.Where("id IN ? AND guild_id = ?", input.ItemIDs, guildID).Find(&items).Error; err != nil {
					return err
				}
				if len(items) != len(input.ItemIDs) {
					return fmt.Errorf("invalid item IDs provided")
				}
			}
			if err := tx.Model(&userSetting).Association("Items").Replace(items); err != nil {
				return err
			}
		}

		return tx.Save(&userSetting).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user setting"})
		return
	}

	c.JSON(http.StatusOK, userSetting)
}

func getEconomyCooldown(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")

	// 1. パラメータが空の場合は即座に弾く
	if guildID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "guild_id or user_id is missing"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var cooldown model.EconomyCooldown

	// 2. FirstOrCreate の第2引数に ID を明示的に指定する
	// これにより、レコードがない場合に正しい ID で作成されます
	if err := db.Where("guild_id = ? AND user_id = ?", guildID, userID).FirstOrCreate(&cooldown, model.EconomyCooldown{
		GuildID: guildID,
		UserID:  userID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	now := time.Now()
	workDuration := 1 * time.Hour
	dailyDuration := 24 * time.Hour

	// 3. UNIXタイムスタンプも返すとBot側での表示が楽になります
	response := gin.H{
		"work": gin.H{
			"last_time":      cooldown.LastWorkTime,
			"last_time_unix": cooldown.LastWorkTime.Unix(),
			"remaining":      math.Max(0, cooldown.LastWorkTime.Add(workDuration).Sub(now).Seconds()),
			"can_ready":      now.After(cooldown.LastWorkTime.Add(workDuration)),
		},
		"daily": gin.H{
			"last_time":      cooldown.LastDailyTime,
			"last_time_unix": cooldown.LastDailyTime.Unix(),
			"remaining":      math.Max(0, cooldown.LastDailyTime.Add(dailyDuration).Sub(now).Seconds()),
			"can_ready":      now.After(cooldown.LastDailyTime.Add(dailyDuration)),
		},
	}

	c.JSON(http.StatusOK, response)
}

func saveEconomyCooldown(c *gin.Context) {
	guildID := c.Param("id")
	userID := c.Param("user")

	if guildID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "guild_id or user_id is missing"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Type string `json:"type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var cooldown model.EconomyCooldown
	if err := db.Where("guild_id = ? AND user_id = ?", guildID, userID).FirstOrCreate(&cooldown, model.EconomyCooldown{
		GuildID: guildID,
		UserID:  userID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	now := time.Now()
	if input.Type == "work" {
		cooldown.LastWorkTime = now
	} else if input.Type == "daily" {
		cooldown.LastDailyTime = now
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type"})
		return
	}

	if err := db.Save(&cooldown).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cooldown"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "updated_at": now})
}
