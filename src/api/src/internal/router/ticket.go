package router

import (
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func RegisterTicket(router *gin.RouterGroup) {
	ticket := router.Group("/guilds/ticket/:id")
	{
		ticket.GET("/", getTicketSettings)       // 全パネル取得
		ticket.POST("/save-all", saveAllPanels)  // 一括保存（作成・更新）
		ticket.DELETE("/:panel_id", deletePanel) // 特定パネル削除
	}
}

// getTicketSettings は特定のギルドに紐づく全てのチケットパネル設定を取得します
func getTicketSettings(c *gin.Context) {
	guildID := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var panels []model.TicketPanel
	result := db.Where("guild_id = ?", guildID).Find(&panels)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "設定の取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"panels": panels})
}

// saveAllPanels はフロントエンドから送られてきた複数のパネル情報を一括で保存します
func saveAllPanels(c *gin.Context) {
	guildID := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Panels []model.TicketPanel `json:"panels"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無効なリクエストデータです"})
		return
	}

	// トランザクション処理
	err := db.Transaction(func(tx *gorm.DB) error {
		for _, panel := range input.Panels {
			panel.GuildID = guildID // ギルドIDを強制的にパスのものに固定

			// Upsert (存在すれば更新、なければ挿入)
			// OnConflict を使用して ID が重複した場合は UpdatedAt 等を含め全フィールド更新
			if err := tx.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&panel).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "設定の保存に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "全てのパネルを保存しました"})
}

// deletePanel は特定のパネルを削除します
func deletePanel(c *gin.Context) {
	guildID := c.Param("id")
	panelID := c.Param("panel_id")
	db := c.MustGet("db").(*gorm.DB)

	result := db.Where("guild_id = ? AND id = ?", guildID, panelID).Delete(&model.TicketPanel{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "削除に失敗しました"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "指定されたパネルが見つかりません"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "パネルを削除しました"})
}
