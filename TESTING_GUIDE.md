# Lola Wallet Testing Guide 🧪

## Quick Start Testing

### 1. Load Extension in Chrome
```bash
cd src
npm run build
cp manifest.json ../dist/
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle top right)
3. Click "Load unpacked"
4. Select the `dist` folder
5. Lola Wallet should appear in extensions

### 2. Test Wallet Creation
- Click the Lola Wallet extension icon
- Choose "Create New Wallet"
- Set a password (e.g., "password123")
- Save the generated mnemonic phrase
- Wallet should unlock and show the home screen

### 3. Test Wallet Import
Use this test mnemonic for safe testing:
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**⚠️ WARNING: This is a well-known test mnemonic - NEVER use for real funds!**

## Testing Scenarios

### 🔐 Security Testing
- [ ] Create wallet generates unique mnemonic
- [ ] Password required to unlock wallet
- [ ] Wallet locks after closing extension
- [ ] Mnemonic is encrypted in storage
- [ ] No private keys visible in UI

### 🌐 Multi-Chain Testing
- [ ] Switch between Ethereum, Polygon, Solana, Bitcoin
- [ ] Each chain shows correct address format
- [ ] Balance fetching works (may show 0 for new addresses)
- [ ] Chain-specific tokens display correctly

### 💸 Transaction Testing
**Note: Use testnets for actual transaction testing**

- [ ] Send screen validates addresses
- [ ] Fee estimation works
- [ ] Transaction building completes
- [ ] Error handling for insufficient balance

### 📱 UI/UX Testing
- [ ] All screens navigate correctly
- [ ] QR codes generate for receive addresses
- [ ] Copy address functionality works
- [ ] Buy screen opens external providers
- [ ] Error messages display properly

### 🔗 dApp Integration Testing
1. Visit a test dApp like https://remix.ethereum.org
2. Check if Lola Wallet is detected as provider
3. Test connection requests
4. Verify account switching works

## Debug Tools

### Extension Debugging
- **UI Debug**: Right-click extension icon → "Inspect popup"
- **Background Debug**: chrome://extensions → Click "background page" link
- **Console Logs**: Check browser console for errors

### Network Testing
- Use browser DevTools Network tab
- Monitor RPC calls to blockchain networks
- Check for proper error handling

### Storage Inspection
- Go to DevTools → Application → Storage
- Check chrome.storage.local for encrypted data
- Verify no plaintext secrets stored

## Test Addresses & Networks

### Testnet Addresses for Testing
```
Ethereum (Sepolia): Use faucet at https://sepoliafaucet.com/
Polygon (Mumbai): Use faucet at https://faucet.polygon.technology/
Solana (Devnet): Use faucet at https://solfaucet.com/
```

### RPC Endpoints
The extension uses public RPC endpoints by default:
- Ethereum: Alchemy demo endpoint
- Polygon: Public RPC
- Solana: Official RPC
- Bitcoin: Blockstream API

## Common Issues & Solutions

### Extension Won't Load
- Check manifest.json is in dist folder
- Verify all required files are built
- Check Chrome console for errors

### Wallet Won't Unlock
- Verify password is correct
- Check background service worker logs
- Ensure storage permissions granted

### Balances Not Loading
- Check network connectivity
- Verify RPC endpoints are accessible
- Look for CORS or network errors

### dApp Integration Issues
- Refresh the dApp page after loading extension
- Check if dApp supports custom providers
- Verify content script injection

## Performance Testing

### Memory Usage
- Monitor extension memory in Chrome Task Manager
- Check for memory leaks during extended use
- Verify proper cleanup on wallet lock

### Network Efficiency
- Monitor RPC call frequency
- Check for unnecessary duplicate requests
- Verify proper caching of chain data

## Security Checklist

- [ ] No private keys in localStorage
- [ ] Mnemonic properly encrypted
- [ ] Background-only signing operations
- [ ] Input validation on all forms
- [ ] Proper error handling without data leaks
- [ ] Content Security Policy enforced
- [ ] No eval() or unsafe code execution

## Production Readiness

Before production deployment:
1. Replace all demo/test RPC endpoints with production keys
2. Integrate actual Trust Wallet Core WASM
3. Add comprehensive error tracking
4. Implement proper analytics (if desired)
5. Security audit of all cryptographic operations
6. Performance optimization and code splitting
7. Comprehensive end-to-end testing

---

**Happy Testing! 🦋**

Remember: This is a cryptocurrency wallet handling real funds. Always test thoroughly and verify all security measures before production use.