package main

import (
	"net/http"

	config "github.com/SharkBot-Dev/NewSharkBot/api/src/internal"
	"github.com/SharkBot-Dev/NewSharkBot/api/src/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

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
	db.AutoMigrate(&models.GuildSetting{})

	// デフォルトミドルウェア（loggerとrecovery）を含むGinルーターを作成
	r := gin.Default()

	// GinのContextを使用して、データベース接続とconfigをルートハンドラーに渡すためのミドルウェアを定義
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Set("config", config)
		c.Next()
	})

	// シンプルなGETエンドポイントを定義
	r.GET("/health", func(c *gin.Context) {
		// JSONレスポンスを返す
		c.JSON(http.StatusOK, gin.H{
			"status": "OK",
		})
	})

	// ポート8080でサーバーを起動（デフォルト）
	// サーバーは0.0.0.0:8080でリッスンします（Windowsではlocalhost:8080）
	r.Run()
}
