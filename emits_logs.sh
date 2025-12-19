#!/bin/bash
URL="http://127.0.0.1:5000/internal/log"

categories=("TEST.FILE" "TEST.NETWORK" "TEST.AUTH" "TEST.CONFIG")
codes=("MISSING" "TIMEOUT" "INVALID" "WARNING")
messages=(
  "Simulated file missing: config.json"
  "Simulated timeout: upstream did not respond"
  "Simulated auth invalid: token rejected"
  "Simulated config warning: default value used"
)

while true; do
  i=$((RANDOM % 4))

  curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"category\": \"${categories[$i]}\",
      \"code\": \"${codes[$i]}\",
      \"message\": \"${messages[$i]}\"
    }" > /dev/null

  sleep 1
done

