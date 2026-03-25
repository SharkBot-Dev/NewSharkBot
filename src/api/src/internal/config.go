package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL string
}

func LoadConfig() (*Config, error) {
	databaseURL := os.Getenv("DB_DSN")

	if databaseURL == "" {
		return nil, fmt.Errorf("DB_DSN environment variable is not set!")
	}

	return &Config{
		DatabaseURL: databaseURL,
	}, nil
}
