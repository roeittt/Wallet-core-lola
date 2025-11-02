# Technology Stack

## Build Systems & Package Management

- **Webpack**: Primary build system for Rabby browser extension
- **Lerna**: Monorepo management for OKX Web3 SDK
- **CMake**: Build system for Trust Wallet Core (C++)
- **Rollup**: Module bundler for Ethers.js
- **Yarn**: Package manager for Rabby (v1.22.22)
- **npm**: Package manager for other projects
- **TypeScript**: Primary language across all JavaScript/TypeScript projects

## Core Technologies

### Frontend & UI
- **React 17**: UI framework for Rabby extension
- **Styled Components**: CSS-in-JS styling
- **Antd 4.15**: UI component library
- **TailwindCSS**: Utility-first CSS framework

### Blockchain & Crypto
- **Ethers.js**: Ethereum interaction library
- **Viem**: TypeScript Ethereum library
- **Web3**: Blockchain interaction utilities
- **Hardware Wallet SDKs**: Ledger, Trezor, Keystone integrations

### Development Tools
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Patch Package**: Runtime patching of dependencies

## Common Build Commands

### Rabby Wallet
```bash
# Development build with file watching
yarn build:dev

# Production build
yarn build:pro

# Debug build
yarn build:debug

# Clean build artifacts
yarn clean

# Run tests
yarn test

# Lint and fix code
yarn lint:fix
```

### OKX Web3 SDK
```bash
# Build all packages
npm run build

# Run tests across all packages
npm run test

# Clean all dependencies
npm run rmd

# Test with coverage
npm run test:coverage
```

### Ethers.js
```bash
# Build ESM modules
npm run build

# Build all formats
npm run build-all

# Run tests
npm run test

# Build distribution files
npm run build-dist
```

### Trust Wallet Core
```bash
# Bootstrap dependencies
./bootstrap.sh

# Build with CMake
mkdir build && cd build
cmake ..
make
```

## Node.js Requirements

- **Rabby**: Node.js >=22
- **Ethers.js**: Node.js >=14
- **General**: Node.js 14+ recommended for all projects