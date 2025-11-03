#!/bin/bash

# Lola Wallet - Development Watch Script
echo "🦋 Starting Lola Wallet Development Mode..."
echo "This will watch for changes and rebuild automatically"
echo ""

# Initial build
npm run build
cp manifest.json ../dist/

echo "✅ Initial build complete!"
echo ""
echo "📋 Extension loaded at: $(pwd)/../dist"
echo "💡 Load this folder as unpacked extension in Chrome"
echo "🔄 Watching for changes... (Ctrl+C to stop)"
echo ""

# Watch for changes and rebuild
npm run dev &
VITE_PID=$!

# Watch for manifest changes
fswatch -o manifest.json | while read f; do
  echo "📝 Manifest changed, copying..."
  cp manifest.json ../dist/
  echo "✅ Manifest updated"
done &
FSWATCH_PID=$!

# Cleanup on exit
trap "kill $VITE_PID $FSWATCH_PID 2>/dev/null" EXIT

# Wait for user to stop
wait