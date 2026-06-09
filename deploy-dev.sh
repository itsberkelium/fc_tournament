#!/bin/bash
set -e

git pull origin dev
docker compose -p fc-dev -f docker-compose.dev.yml up --build -d
docker compose -p fc-dev -f docker-compose.dev.yml run --rm migrate
