package main

import (
	"net/http"

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
	err = db.AutoMigrate(&model.GuildSetting{}, &model.EmbedSetting{}, &model.MessageSetting{})
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

	// シンプルなGETエンドポイントを定義
	r.GET("/health", healthCheck)

	// ポート8080でサーバーを起動（デフォルト）
	// サーバーは0.0.0.0:8080でリッスンします（Windowsではlocalhost:8080）
	r.Run()
}
