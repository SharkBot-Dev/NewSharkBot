#!/bin/sh

if [ ! -f ./cmd/main.go ]; then
  echo "Please run this script from the src/ directory."
  exit 1
fi

export COMMIT=$(git rev-parse --short HEAD)
export BRANCH=$(git branch --show-current)

swag i -g cmd/main.go

# if --dev flag is provided, set gin to debug mode
if [ "$1" = "--dev" ]; then
  export DB_DSN="host=localhost user=postgres password=postgres dbname=devdb port=5432 sslmode=disable"  
  export GIN_MODE=debug
  go run -ldflags "\
  -X github.com/UniPro-tech/UniQUE-API/internal/config.GitCommit=$COMMIT \
  -X github.com/UniPro-tech/UniQUE-API/internal/config.GitBranch=$BRANCH" \
  cmd/main.go
else
  export VERSION=$(git describe --tags --abbrev=0)
  export GIN_MODE=release
  go build -ldflags "\
  -X github.com/UniPro-tech/UniQUE-API/internal/config.Version=$VERSION \
  -X github.com/UniPro-tech/UniQUE-API/internal/config.GitCommit=$COMMIT \
  -X github.com/UniPro-tech/UniQUE-API/internal/config.GitBranch=$BRANCH" \
  cmd/main.go
fi
