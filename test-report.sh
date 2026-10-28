#!/bin/bash
for i in {1..6}; do
  curl -sS -X POST http://localhost:3001/api/reports \
    -H 'content-type: application/json' \
    -d '{"reportType":"user-summary"}'
  echo
done