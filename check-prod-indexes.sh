#!/bin/bash
echo "Checking if indexes exist in production DB..."
DATABASE_URL=$(grep DATABASE_URL .env.vercel 2>/dev/null | cut -d= -f2-)
if [ -z "$DATABASE_URL" ]; then
  echo "❌ No DATABASE_URL found in .env.vercel"
  exit 1
fi
