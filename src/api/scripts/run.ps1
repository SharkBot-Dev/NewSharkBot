if (-not (Test-Path ".\cmd\main.go")) {
    Write-Host "Please run this script from the src/ directory." -ForegroundColor Red
    exit 1
}

$COMMIT = git rev-parse --short HEAD
$BRANCH = git branch --show-current

swag i -g cmd/main.go

if ($args -contains "--dev") {
    $env:DB_DSN = "host=localhost user=postgres password=postgres dbname=devdb port=5432 sslmode=disable"
    $env:GIN_MODE = "debug"

    go run -ldflags "-X github.com/UniPro-tech/UniQUE-API/internal/config.GitCommit=$COMMIT -X github.com/UniPro-tech/UniQUE-API/internal/config.GitBranch=$BRANCH" cmd/main.go
}
else {
    $VERSION = git describe --tags --abbrev=0
    $env:GIN_MODE = "release"

    go build -ldflags "-X github.com/SharkBot-Dev/NewSharkBot/api/internal.Version=$VERSION -X github.com/SharkBot-Dev/NewSharkBot/api/internal.GitCommit=$COMMIT -X github.com/SharkBot-Dev/NewSharkBot/api/internal.GitBranch=$BRANCH" cmd/main.go
}