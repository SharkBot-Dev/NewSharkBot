package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL string
	AppName     string
	Version     string
	OWNER_ID    string
}

var (
	Version   = "latest"
	GitCommit = "unknown"
	GitBranch = "unknown"
)

func LoadConfig() (*Config, error) {
	version := Version

	if Version == "latest" {
		version = GitBranch + "@" + GitCommit
	} else {
		version = Version + "+" + GitCommit
	}

	databaseURL := os.Getenv("DB_DSN")
	ownerId := os.Getenv("OWNER_ID")

	if databaseURL == "" {
		return nil, fmt.Errorf("DB_DSN environment variable is not set!")
	}

	if ownerId == "" {
		return nil, fmt.Errorf("OWNER_ID environment variable is not set!")
	}

	return &Config{
		DatabaseURL: databaseURL,
		AppName:     "SharkBot API",
		Version:     version,
		OWNER_ID:    ownerId,
	}, nil
}
