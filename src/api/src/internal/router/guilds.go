package router

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterGuildsRoutes(router *gin.RouterGroup, db *gorm.DB) {
	guilds := router.Group("/guilds")
	{
		guilds.GET("/", getGuilds)
	}
}

func getGuilds(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Get guilds",
	})
}
