package router

import (
	"net/http"
	"strings"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterCommands(router *gin.RouterGroup) {
	commands := router.Group("/commands")
	{
		commands.GET("/:guild_id", getCommands)
		commands.GET("/:guild_id/prefixs", getPrefixes)
		commands.POST("/:guild_id/prefixs", updatePrefixes)
		commands.GET("/:guild_id/autoreply", getAutoReplies)
		commands.GET("/:guild_id/:name", getCommandDetail)
		commands.POST("/:guild_id", createCommand)
		commands.DELETE("/:guild_id/:name", deleteCommand)
	}
}

func createCommand(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input []model.CustomCommandsSetting

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	nameTracker := make(map[string]bool)

	for i := range input {
		trimmedName := strings.TrimSpace(input[i].Name)

		if trimmedName == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Empty command name",
				"message": "コマンド名を入力してください。",
			})
			return
		}

		if _, exists := nameTracker[trimmedName]; exists {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Duplicate command name",
				"message": "同じ名前のコマンドが複数含まれています: " + trimmedName,
			})
			return
		}
		nameTracker[trimmedName] = true

		if len(input[i].Actions) > 15 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Too many actions",
				"message": "アクション数が上限(15個)を超えています。",
			})
			return
		}

		input[i].Name = trimmedName
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		var oldCmds []model.CustomCommandsSetting
		if err := tx.Where("guild_id = ?", guildID).Find(&oldCmds).Error; err != nil {
			return err
		}

		for _, old := range oldCmds {
			if err := tx.Unscoped().Where("command_id = ?", old.ID).Delete(&model.CustomCommandAction{}).Error; err != nil {
				return err
			}
			if err := tx.Unscoped().Delete(&old).Error; err != nil {
				return err
			}
		}

		for i := range input {
			input[i].GuildID = guildID

			for j := range input[i].Actions {
				input[i].Actions[j].Order = j
			}

			if err := tx.Create(&input[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync commands"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "count": len(input)})
}

func getCommands(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var commands []model.CustomCommandsSetting

	if err := db.Preload("Actions", func(db *gorm.DB) *gorm.DB {
		return db.Order("custom_command_actions.action_order ASC")
	}).Where("guild_id = ?", guildID).Find(&commands).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, commands)
}

func getCommandDetail(c *gin.Context) {
	guildID := c.Param("guild_id")
	name := c.Param("name")
	db := c.MustGet("db").(*gorm.DB)

	var command model.CustomCommandsSetting
	err := db.Preload("Actions", func(db *gorm.DB) *gorm.DB {
		return db.Order("custom_command_actions.action_order ASC")
	}).Where("guild_id = ? AND name = ?", guildID, name).First(&command).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Command not found"})
		return
	}

	c.JSON(http.StatusOK, command)
}

func deleteCommand(c *gin.Context) {
	guildID := c.Param("guild_id")
	name := c.Param("name")
	db := c.MustGet("db").(*gorm.DB)

	var cmd model.CustomCommandsSetting
	if err := db.Where("guild_id = ? AND name = ?", guildID, name).First(&cmd).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Command not found"})
		return
	}

	db.Unscoped().Where("command_id = ?", cmd.ID).Delete(&model.CustomCommandAction{})
	result := db.Delete(&cmd)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete command"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Command deleted successfully"})
}

func getValue(arr model.StringArray) model.StringArray {
	if len(arr) > 0 {
		return arr
	}
	return model.StringArray{"!"}
}

func getPrefixes(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var setting model.PrefixSetting
	err := db.FirstOrCreate(&setting, model.PrefixSetting{
		GuildID: guildID,
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"prefix": getValue(setting.Prefixes),
	})
}

func updatePrefixes(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Prefixes []string `json:"prefixes" binding:"required,min=1,dive,max=5"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input. Provide at least one prefix (max 5 chars each)."})
		return
	}

	err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "guild_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"prefixes", "updated_at"}),
	}).Create(&model.PrefixSetting{
		GuildID:   guildID,
		Prefixes:  input.Prefixes,
		UpdatedAt: time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"prefixes": input.Prefixes})
}

func getAutoReplies(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)
	var cmds []model.CustomCommandsSetting
	err := db.Where("guild_id = ? AND is_auto_reply = ?", guildID, true).Preload("Actions").Find(&cmds)
	if err.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, cmds)
}
