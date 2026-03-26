# Shark Bot API

このディレクトリは Shark Bot の API サービス実装を格納しているコンポーネントです。

## 概要

- 役割: ダッシュボードやBotから読み出されるデータを提供するREST APIサーバ。
- 言語: Go
- 主要機能: ユーザー・ギルド設定の取得・更新、OpenAPI（Swagger）によるAPIドキュメント生成

## 前提条件

- Go 1.20 以上（環境に合わせて Go バージョンを確認してください）
- 環境変数の設定（`.env.example` を参照）

## すぐに動かす（開発向け）

1. リポジトリルートから API ディレクトリに移動:

```bash
cd src/api/src
```

2. 環境変数を用意（例）:

```bash
cp .env.example .env
# 編集して適切な値を設定
```

3. 開発サーバ起動:

```bash
go run ./cmd
```

## ビルド/リリース

- ビルドやリリース用の簡易スクリプトは `scripts/build.sh` を参照してください。

## API ドキュメント

- OpenAPI（Swagger）仕様は `src/docs/swagger.yaml` / `src/docs/swagger.json` にあります。
- ドキュメント生成に関するスクリプト: `scripts/swag.sh`

## ディレクトリ構成（要点）

- `src/cmd` — サーバ起動のエントリ
- `src/internal` — アプリケーション内部実装（config、router、model、dto 等）
- `scripts/` — 補助スクリプト（ビルド、Swagger生成など）
- `src/docs` — 生成済みの OpenAPI 定義

## 環境変数

- `.env.example` をベースに設定してください。主に DB 接続文字列やポート番号、認証用のキーなどを指定します。

## 開発メモ

- API の責務はデータ提供に集中しており、DB スキーマや移行はここで管理しています（ダッシュボード／Bot から読み出す形を想定）。
- Swagger を使ったドキュメント更新フロー: まずハンドラのコメント等から swagger 定義を更新し、`scripts/swag.sh` を実行して `src/docs` を更新します。

## 連絡先 / 参照

- 実装の詳細は `src/internal/router` や `src/internal/model` を参照してください。
