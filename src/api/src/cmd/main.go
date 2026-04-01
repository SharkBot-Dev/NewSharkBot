package main

import (
	"log"
	"net/http"
	"time"

	"github.com/SharkBot-Dev/NewSharkBot/api/docs"
	config "github.com/SharkBot-Dev/NewSharkBot/api/internal"
	"github.com/SharkBot-Dev/NewSharkBot/api/internal/model"
	"github.com/SharkBot-Dev/NewSharkBot/api/internal/router"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type HealthResponse struct {
	Status string `json:"status"`
}

// @BasePath /

// HealthCheck godoc
// @Summary health check endpoint
// @Schemes
// @Description システムの稼働状況を確認するためのエンドポイントです。
// @Tags system info
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func healthCheck(c *gin.Context) {
	// JSONレスポンスを返す
	c.JSON(http.StatusOK, gin.H{
		"status": "OK",
	})
}

func InitDefaultRooms(db *gorm.DB, ownerID string) error {
	// ルールの共通テキスト
	commonRules := `・荒らさない
・スパムをしない
・喧嘩しない
・もめ事を持ち込まない
・宣伝しない
ルールに違反すると処罰されます。`

	adsRules := `・荒らさない
・スパムしない
・喧嘩しない
・もめ事を持ち込まない
・荒らしな内容を宣伝しない
・shopな内容を宣伝しない
・nsfwな内容を宣伝しない
・公序良俗に反した内容を宣伝しない
・運営の禁止した内容を宣伝しない
ルールに違反すると処罰されます。`

	artRules := `・荒らさない
・スパムをしない
・喧嘩しない
・もめ事を持ち込まない
・宣伝しない
・nsfwな内容を送信しない
・公序良俗に反した内容を送信しない
・運営の禁止した内容を送信しない
・AI画像はAIであることを明記すること
ルールに違反すると処罰されます。`

	// デフォルトデータのリスト
	defaultRooms := []model.GlobalChatRoom{
		{
			Name:          "main",
			Description:   "総合グローバルチャットです。",
			Rule:          commonRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
		{
			Name:          "ads",
			Description:   "宣伝しあえるグローバルチャットです。",
			Rule:          adsRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
		{
			Name:          "shiritori",
			Description:   "しりとりができます。",
			Rule:          commonRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
		{
			Name:          "art",
			Description:   "自分のイラストをみんなに見てもらおう！",
			Rule:          artRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
		{
			Name:          "sgc",
			Description:   "様々なBotのユーザーがいるグローバルチャットです。",
			Rule:          commonRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
		{
			Name:          "dsgc",
			Description:   "様々なBotのユーザーがいるテストグローバルチャットです。",
			Rule:          commonRules,
			Slowmode:      1,
			MinAccountAge: 1,
			IsActive:      true,
		},
	}

	for _, room := range defaultRooms {
		err := db.Where(model.GlobalChatRoom{Name: room.Name}).
			Attrs(room).
			FirstOrCreate(&room).Error

		if err != nil {
			return err
		}

		var count int64
		db.Model(&model.GlobalChatRoomUser{}).
			Where("room_name = ? AND user_id = ?", room.Name, ownerID).
			Count(&count)

		if count == 0 {
			owner := model.GlobalChatRoomUser{
				RoomName: room.Name,
				UserID:   ownerID,
				Role:     "owner",
				JoinedAt: time.Now(),
			}
			if err := db.Create(&owner).Error; err != nil {
				log.Printf("Failed to create owner for room %s: %v", room.Name, err)
			}
		}
	}

	log.Println("Default rooms check/creation completed.")
	return nil
}

func main() {
	// configをロード
	config, err := config.LoadConfig()
	if err != nil {
		panic(err)
	}

	// gormを使用してPostgreSQLデータベースに接続
	db, err := gorm.Open(postgres.Open(config.DatabaseURL), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// マイグレート
	err = db.AutoMigrate(
		&model.GuildSetting{},
		&model.EmbedSetting{},
		&model.MessageSetting{},
		&model.LevelSetting{},
		&model.LevelRewardSetting{},
		&model.LevelUserSetting{},
		&model.Inventory{},
		&model.EconomySetting{},
		&model.EconomyUserSetting{},
		&model.EconomyItemSetting{},
		&model.EconomyCooldown{},
		&model.ModeratorSetting{},
		&model.EnabledAutoModeratorSetting{},
		&model.LoggingSetting{},
		&model.Cooldowns{},
		&model.GlobalChatRoom{},
		&model.GlobalChatRoomUser{},
		&model.GlobalChatRoomRestriction{},
		&model.GlobalChatRoomFilter{},
		&model.GlobalChatConnect{},
		&model.CustomCommandsSetting{},
		&model.CustomCommandAction{},
		&model.PrefixSetting{},
		&model.PinMessageSetting{},
		&model.TicketPanel{},
		&model.Achievement{},
		&model.AchievementSetting{},
		&model.AchievementStep{},
		&model.UserAchievementProgress{},
		&model.Premium{},
		&model.BumpSetting{},
		&model.BumpBotsSetting{},
		&model.AuthCache{},
		&model.WebAuthBlockdGuild{},
	)
	if err != nil {
		panic("failed to migrate database")
	}

	// デフォルトミドルウェア（loggerとrecovery）を含むGinルーターを作成
	r := gin.Default()

	// Swagger Info
	docs.SwaggerInfo.BasePath = "/"
	docs.SwaggerInfo.Title = config.AppName + " API"
	docs.SwaggerInfo.Version = config.Version
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	// GinのContextを使用して、データベース接続とconfigをルートハンドラーに渡すためのミドルウェアを定義
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Set("config", config)
		c.Next()
	})

	// ルートグループを登録
	router.RegisterGuildsRoutes(r.Group("/"))
	router.RegisterEmbed(r.Group("/"))
	router.RegisterMessageSettings(r.Group("/"))
	router.RegisterLevelsSettings(r.Group("/"))
	router.RegisterEconomy(r.Group("/"))
	router.RegisterModeratorSetting(r.Group("/"))
	router.RegisterLoggingSetting(r.Group("/"))
	router.RegisterCooldowns(r.Group("/"))
	router.GlobalChatRegister(r.Group("/"))
	router.RegisterCommands(r.Group("/"))
	router.RegisterTicket(r.Group("/"))
	router.RegisterAchievement(r.Group("/"))
	router.RegisterPremium(r.Group("/"))
	router.RegisterBumps(r.Group("/"))
	router.RegisterAuth(r.Group("/"))

	// シンプルなGETエンドポイントを定義
	r.GET("/health", healthCheck)

	InitDefaultRooms(db, config.OWNER_ID)

	// ポート8080でサーバーを起動（デフォルト）
	// サーバーは0.0.0.0:8080でリッスンします（Windowsではlocalhost:8080）
	r.Run()
}
