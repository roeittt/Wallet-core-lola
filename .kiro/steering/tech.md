# Technology Stack

## Build Systems

### Rabby Wallet (Browser Extension)
- **Build Tool**: Webpack 5 with custom configuration
- **Language**: TypeScript 5.3.3
- **Framework**: React 17.0.2
- **Styling**: Styled Components + TailwindCSS 2.2.2
- **State Management**: Redux + Rematch
- **Package Manager**: Yarn 1.22.22
- **Node Version**: >=22

### OKX Web3 SDK (Multi-chain)
- **Build Tool**: Lerna monorepo with TypeScript
- **Language**: TypeScript 4.9.5
- **Testing**: Jest 29.7.0
- **Package Manager**: npm
- **Architecture**: Modular packages per blockchain

### Ethers.js
- **Build Tool**: TypeScript + Rollup
- **Language**: TypeScript 5.0.4
- **Testing**: Mocha 10.7.3
- **Node Version**: >=14.0.0
- **Output**: ESM + CommonJS

### Trust Wallet Core
- **Build Tool**: CMake 3.18+
- **Language**: C++ with TypeScript/Swift/Kotlin bindings
- **Compiler**: Clang (required)
- **Architecture**: Cross-platform native library

## Common Build Commands

### Rabby Development
```bash
yarn install
yarn build:dev     # Development build with file watching
yarn build:pro     # Production build
yarn test          # Run tests
yarn lint:fix      # Fix linting issues
```

### OKX SDK Development
```bash
npm install
npm run build      # Build all packages
npm run test       # Run all tests
npm run clean      # Clean build artifacts
```

### Ethers.js Development
```bash
npm install
npm run build      # Build TypeScript
npm run test       # Run test suite
npm run build-dist # Build distribution files
```

### Trust Wallet Core
```bash
cmake -S . -B build
cmake --build build
```

## Key Dependencies

### Cryptographic Libraries
- `@noble/curves`, `@noble/hashes` (Ethers.js)
- `@scure/bip39` (BIP39 implementation)
- `hdkey` (HD wallet derivation)

### Blockchain SDKs
- `ethers` 5.8.0 (Ethereum interactions)
- `@solana/web3.js` (Solana blockchain)
- `viem` 2.23.15 (Modern Ethereum library)

### Browser Extension APIs
- `webextension-polyfill` (Cross-browser compatibility)
- `@metamask/*` packages (Wallet standards)

### Hardware Wallet Support
- `@ledgerhq/*` (Ledger integration)
- `@trezor/connect-webextension` (Trezor support)
- `@keystonehq/*` (Keystone hardware wallet)

## Testing Strategy

- **Unit Tests**: Jest for all TypeScript projects
- **Integration Tests**: Mocha for Ethers.js
- **Browser Testing**: Custom test runners for extension
- **Coverage**: c8 for coverage reporting