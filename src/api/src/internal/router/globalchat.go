package router

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GlobalChatRegister(router *gin.RouterGroup) {
	gc := router.Group("/globalchat")
	{
		// Bot用
		gc.GET("/channels/:channel_id", getChannelConfig)
		gc.GET("/active-channels", getActiveChannelIDs)
		gc.GET("/active-channels/:name", getActiveRoomDetails)

		// Dashboard / 管理用
		gc.GET("/guilds/:guild_id", getGuildConnections)
		gc.POST("/rooms", createOrUpdateRoom) // 部屋の作成・更新

		gc.POST("/rooms/:name/members", joinRoom)

		gc.GET("/rooms/:name", getActiveRoomDetails)
		gc.GET("/rooms/:name/:user_id", GetUserRoomRole)

		gc.POST("/connect", connectChannel) // チャンネルを部屋に接続
		gc.DELETE("/connect/:channel_id", disconnectChannel)
	}
}

// 1. 接続情報と部屋の詳細を取得 (Botがメッセージ受信時に叩く)
func getChannelConfig(c *gin.Context) {
	channelID := c.Param("channel_id")
	db := c.MustGet("db").(*gorm.DB)

	var connection model.GlobalChatConnect

	// ネストしたPreloadの指定
	err := db.Preload("Room").
		Preload("Room.Restrictions"). // Room構造体内のRestrictionsフィールド
		Preload("Room.Filters").      // Room構造体内のFiltersフィールド
		Where("channel_id = ?", channelID).
		First(&connection).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not connected"})
		} else {
			log.Printf("[GlobalChat] DB Error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		}
		return
	}

	c.JSON(http.StatusOK, connection)
}

// 2. 有効なチャンネルIDリストのみ取得 (Bot起動時のキャッシュ用)
func getActiveChannelIDs(c *gin.Context) {
	var ids []string
	db := c.MustGet("db").(*gorm.DB)
	db.Model(&model.GlobalChatConnect{}).Pluck("channel_id", &ids)
	c.JSON(http.StatusOK, gin.H{"active_channels": ids})
}

func getActiveRoomDetails(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	roomName := c.Param("name")

	var room model.GlobalChatRoom

	err := db.Preload("Connections").Preload("Members").Preload("Restrictions").Preload("Filters").Where("name = ?", roomName).First(&room).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "ルームが見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// 3. 特定のギルドがどこに接続しているか一覧
func getGuildConnections(c *gin.Context) {
	guildID := c.Param("guild_id")
	db := c.MustGet("db").(*gorm.DB)

	var connections []model.GlobalChatConnect
	res := db.Where("guild_id = ?", guildID).Find(&connections)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}
	c.JSON(http.StatusOK, connections)
}

// 4. 部屋の作成または更新 (トランザクション処理)
func createOrUpdateRoom(c *gin.Context) {
	var input struct {
		model.GlobalChatRoom
		CreatorID string `json:"creator_id"` // 初回作成時のみ使用
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room name is missing in request"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)

	err := db.Transaction(func(tx *gorm.DB) error {
		// 部屋の保存 (Create or Update)
		if err := tx.Save(&input.GlobalChatRoom).Error; err != nil {
			return err
		}

		// 新規作成時、作成者をOwnerとして登録（まだ登録されていない場合のみ）
		if input.CreatorID != "" {
			var user model.GlobalChatRoomUser
			res := tx.Where("name = ? AND user_id = ?", input.Name, input.CreatorID).First(&user)
			if res.Error == gorm.ErrRecordNotFound {
				newUser := model.GlobalChatRoomUser{
					RoomName: input.Name, // ここが 'test' である必要がある
					UserID:   input.CreatorID,
					Role:     "owner",
					JoinedAt: time.Now(),
				}
				err := tx.Create(&newUser).Error
				if err != nil {
					log.Printf("Create User Error: %v", err) // ロールバックの原因を特定
					return err
				}
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Room processed successfully"})
}

// 5. チャンネルを部屋に紐付ける
func connectChannel(c *gin.Context) {
	// リクエスト専用の構造体を定義
	var input struct {
		ChannelID string `json:"channel_id"`
		GuildID   string `json:"guild_id"`
		RoomName  string `json:"name"` // Next.jsの "name" をここで受ける
		CreatorID string `json:"creator_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.RoomName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room name (key: 'name') is required"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)

	err := db.Transaction(func(tx *gorm.DB) error {
		var room model.GlobalChatRoom
		res := tx.Where("name = ?", input.RoomName).First(&room)

		if res.Error == gorm.ErrRecordNotFound {
			newRoom := model.GlobalChatRoom{
				Name:        input.RoomName,
				Description: "なし",
				IsActive:    true,
			}
			if err := tx.Create(&newRoom).Error; err != nil {
				return err
			}

			if input.CreatorID != "" {
				newUser := model.GlobalChatRoomUser{
					RoomName: input.RoomName,
					UserID:   input.CreatorID,
					Role:     "owner",
					JoinedAt: time.Now(),
				}
				if err := tx.Create(&newUser).Error; err != nil {
					return err
				}
			}
		}

		// 3. チャンネル接続情報の保存
		connect := model.GlobalChatConnect{
			ChannelID: input.ChannelID,
			RoomName:  input.RoomName,
			GuildID:   input.GuildID,
		}
		return tx.Save(&connect).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Connected successfully", "room": input.RoomName})
}

// 6. 接続を解除する
func disconnectChannel(c *gin.Context) {
	channelID := c.Param("channel_id")
	db := c.MustGet("db").(*gorm.DB)

	if err := db.Where("channel_id = ?", channelID).Delete(&model.GlobalChatConnect{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func GetUserRoomRole(c *gin.Context) {
	roomName := c.Param("name")
	userID := c.Query("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var roomUser model.GlobalChatRoomUser
	err := db.Where("room_name = ? AND user_id = ?", roomName, userID).First(&roomUser).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"role": "none"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"role": roomUser.Role})
}

func joinRoom(c *gin.Context) {
	roomName := c.Param("name")
	var input struct {
		UserID string `json:"user_id" binding:"required"`
		Role   string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := c.MustGet("db").(*gorm.DB)

	newUser := model.GlobalChatRoomUser{
		RoomName: roomName,
		UserID:   input.UserID,
		Role:     input.Role,
		JoinedAt: time.Now(),
	}

	err := db.Where(model.GlobalChatRoomUser{RoomName: roomName, UserID: input.UserID}).
		FirstOrCreate(&newUser).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined successfully"})
}
