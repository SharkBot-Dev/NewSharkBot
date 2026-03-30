#!/usr/bin/env bash
set -euo pipefail

sudo docker compose build bot api
sudo docker compose up bot redis api