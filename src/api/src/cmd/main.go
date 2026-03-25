package main

import (
	"context"
	"net/http"

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

	ctx := context.Background()

	// マイグレート
	//db.AutoMigrate(&Product{})

	// デフォルトミドルウェア（loggerとrecovery）を含むGinルーターを作成
	r := gin.Default()

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
