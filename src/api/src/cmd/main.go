package main

import (
	"net/http"

	"github.com/SharkBot-Dev/NewSharkBot/api/src/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// gormを使用してPostgreSQLデータベースに接続
	dsn := "postgres://postgres:password@localhost:5432/mydb?sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// マイグレート
	db.AutoMigrate(&models.GuildSetting{})

	// デフォルトミドルウェア（loggerとrecovery）を含むGinルーターを作成
	r := gin.Default()

	// GinのContextを使用して、データベース接続をルートハンドラーに渡すためのミドルウェアを定義
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
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
