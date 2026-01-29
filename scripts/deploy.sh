#!/bin/bash
# WhaleScope deploy script
# Usage: bash scripts/deploy.sh [commit message]
# Builds, commits, pushes, and deploys to Cloudflare Pages

set -e

cd "$(dirname "$0")/.."

MSG="${1:-update}"

echo "🧹 Cleaning build cache..."
rm -rf .next out .vercel/output

echo "📦 Building for Cloudflare Pages..."
npm run pages:build

echo "📝 Committing changes..."
git add -A
git diff --cached --quiet && echo "No changes to commit" || git commit -m "$MSG"

echo "🚀 Pushing to GitHub..."
git push

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static

echo "✅ Deploy complete!"
