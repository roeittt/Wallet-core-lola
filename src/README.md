# Lola Wallet 🦋

A secure, multi-chain cryptocurrency wallet browser extension built with React, TypeScript, and Trust Wallet Core.

## Features

### 🔐 Security First
- **Trust Wallet Core Integration**: All cryptographic operations (key generation, signing) use Trust Wallet Core WASM
- **WebCrypto Encryption**: Mnemonic phrases encrypted with AES-GCM and stored locally
- **Background-only Signing**: Private keys never exposed to UI layer
- **Manifest V3**: Modern browser extension security model

### 🌐 Multi-Chain Support
- **Ethereum & EVM Chains**: Ethereum, Polygon, BNB Chain, Arbitrum, Optimism, Avalanche, Fantom
- **Solana**: Native SOL and SPL token support
- **Bitcoin**: Native BTC transactions
- **Auto Token Detection**: ERC-20 and SPL tokens automatically discovered

### 💫 User Experience
- **Clean Interface**: Modern, intuitive design
- **QR Code Support**: Easy address sharing for receiving funds
- **On-ramp Integration**: Buy crypto with MoonPay, Ramp, and Transak
- **dApp Integration**: Ethereum provider injection for web3 dApps

## Architecture

### Security Model
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Background SW   │    │ Trust Wallet    │
│                 │    │                  │    │ Core (WASM)     │
│ • React App     │◄──►│ • Keyring        │◄──►│                 │
│ • User Input    │    │ • Chain Adapters │    │ • Key Gen       │
│ • Display Only  │    │ • Messaging      │    │ • Signing       │
└─────────────────┘    └──────────────────┘    │ • Derivation    │
                                               └─────────────────┘
```

### Chain Adapters
- **Ethereum Chain**: Uses ethers.js for network operations
- **Solana Chain**: Uses @solana/web3.js for network operations  
- **Bitcoin Chain**: Uses Blockstream API for network operations
- **Chain Manager**: Unified interface for all blockchain interactions

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Chrome/Chromium browser for testing

### Setup
```bash
# Clone and install dependencies
cd src
npm install

# Copy environment configuration
cp .env.example .env

# Build for development
npm run dev

# Build for production
npm run build
```

### Loading Extension
1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### Project Structure
```
src/
├── manifest.json              # Extension manifest
├── background/                # Service worker
│   ├── service-worker.ts     # Main background script
│   ├── keyring/              # Cryptographic operations
│   ├── chains/               # Blockchain adapters
│   └── messaging/            # Runtime messaging
├── ui/                       # React frontend
│   ├── screens/              # Main app screens
│   ├── components/           # Reusable components
│   ├── store/                # State management
│   └── utils/                # Utilities
├── content-script/           # dApp integration
└── shared/                   # Shared types/constants
```

## Security Guidelines

### Mandatory Rules
1. **ONLY Trust Wallet Core** for cryptographic operations
2. **No private key exposure** to UI or content scripts
3. **WebCrypto encryption** for all stored sensitive data
4. **Background-only signing** - UI receives signed transactions only
5. **Input validation** on all user inputs and external data

### Error Handling
- `SECURITY_FATAL_SECRET_EXFILTRATION`: Unauthorized crypto operation
- `CONFLICT_CRYPTO_SOURCE`: Multiple crypto libraries detected
- All errors logged and reported to user appropriately

## Supported Networks

### Mainnet
- Ethereum (ETH)
- Polygon (MATIC) 
- BNB Smart Chain (BNB)
- Arbitrum One (ETH)
- Optimism (ETH)
- Avalanche C-Chain (AVAX)
- Fantom Opera (FTM)
- Solana (SOL)
- Bitcoin (BTC)

### Testnet Support
- Sepolia (Ethereum)
- Mumbai (Polygon)
- Solana Devnet
- Bitcoin Testnet

## Token Standards
- **ERC-20**: Ethereum and EVM-compatible chains
- **SPL**: Solana Program Library tokens
- **Native**: Chain native assets (ETH, BTC, SOL, etc.)

## Build & Distribution

### Production Build
```bash
npm run build:prod
```

### Extension Package
The built extension in `dist/` folder contains:
- `manifest.json`: Extension configuration
- `background/`: Service worker bundle
- `ui/`: React app bundle
- `content-script/`: dApp integration script

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Brave (Chromium-based)
- Other Chromium browsers

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes following security guidelines
3. Test thoroughly with multiple chains
4. Submit pull request with security review

### Testing Requirements
- Unit tests for all cryptographic operations
- Integration tests for chain adapters
- End-to-end tests for user workflows
- Security audit for any crypto-related changes

## License

MIT License - see LICENSE file for details.

## Security Disclosure

For security issues, please email security@lolawallet.com instead of using public issues.

---

**⚠️ Important**: This is a cryptocurrency wallet that handles real funds. Always verify transactions carefully and keep your recovery phrase secure.