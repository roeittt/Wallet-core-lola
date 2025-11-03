#!/bin/bash

# Lola Wallet - Build and Test Script
echo "🦋 Building Lola Wallet Extension..."

# Build the extension
npm run build

# Copy manifest to dist
cp manifest.json ../dist/

echo "✅ Build complete!"
echo ""
echo "📋 Testing Instructions:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' button"
echo "4. Select the 'dist' folder: $(pwd)/../dist"
echo "5. The Lola Wallet extension should appear in your extensions"
echo "6. Click the extension icon to open the wallet"
echo ""
echo "🧪 Test Scenarios:"
echo "• Create a new wallet (generates mnemonic)"
echo "• Import an existing wallet with test mnemonic"
echo "• Switch between different chains"
echo "• View portfolio and token balances"
echo "• Test send/receive screens"
echo "• Try the buy crypto integration"
echo ""
echo "🔍 Debug Tips:"
echo "• Right-click extension icon → 'Inspect popup' for UI debugging"
echo "• Go to chrome://extensions → 'background page' for service worker logs"
echo "• Check browser console for any errors"
echo ""
echo "📁 Extension files ready in: $(pwd)/../dist"