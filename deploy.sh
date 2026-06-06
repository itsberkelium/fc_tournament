#!/bin/bash
set -e

git pull origin master
docker compose up --build -d
docker compose run --rm migrate
