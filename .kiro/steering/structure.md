# Project Structure

## Repository Organization

### `/repos/` - Reference Implementations (READ-ONLY)
- **wallet-core-master/**: Trust Wallet Core - CRYPTO TRUTH SOURCE
- **Rabby-develop/**: Browser extension wallet (UX reference only)
- **ethers.js-main/**: Ethereum library for network operations
- **js-wallet-sdk-main/**: OKX multi-chain SDK for reference
- **solana-web3.js-main/**: Solana blockchain interactions
- **phantom-wallet-main/**: Phantom wallet (UX reference only)
- **kraken-wallet-main/**: Kraken wallet (UX reference only)

### `/src/` - Active Development (WRITE-ONLY)
All new wallet implementation code must go here following the mandatory rules.

```
Wallet-core-lola/
├── repos/                          # External wallet implementations (READ-ONLY)
│   ├── wallet-core-master/         # Trust Wallet Core (CRYPTO TRUTH SOURCE)
│   ├── Rabby-develop/              # Browser extension wallet (UX reference only)
│   ├── ethers.js-main/             # Ethereum library
│   ├── js-wallet-sdk-main/         # OKX multi-chain SDK
│   ├── solana-web3.js-main/        # Solana JavaScript SDK
│   ├── phantom-wallet-main/        # Phantom wallet (UX reference only)
│   └── kraken-wallet-main/         # Kraken wallet (UX reference only)
├── src/                            # Main development directory (ALL NEW CODE HERE)
└── .kiro/                          # Kiro configuration and steering
    └── steering/                   # Project guidance documents
```

## Key Project Structures

### Rabby Wallet Architecture (Reference)
```
src/
├── background/          # Extension background scripts
│   ├── controller/      # Wallet and provider controllers
│   └── service/         # Background services
├── content-script/      # Injected content scripts
├── ui/                  # React UI components
│   ├── component/       # Reusable components
│   ├── views/           # Page views
│   └── utils/           # UI utilities
└── utils/               # Shared utilities
```

### OKX SDK Structure (Monorepo Reference)
```
bu-packages/
├── crypto-lib/          # Core cryptographic functions (DO NOT USE)
├── coin-base/           # Base interfaces
├── coin-ethereum/       # Ethereum implementation
├── coin-bitcoin/        # Bitcoin implementation
├── coin-solana/         # Solana implementation
└── coin-*/              # Other blockchain implementations
```

### Trust Wallet Core Structure (CRYPTO TRUTH SOURCE)
```
src/
├── Bitcoin/             # Bitcoin-specific code
├── Ethereum/            # Ethereum-specific code
├── Solana/              # Solana-specific code
├── interface/           # C interfaces
├── proto/               # Protocol buffer definitions
└── Generated/           # Auto-generated bindings
```

## Security Boundaries

### Crypto Operations (wallet-core ONLY)
- Private key generation and storage
- Mnemonic phrase handling
- Transaction signing
- Address derivation

### Network Operations (ethers.js/solana-web3.js)
- RPC calls and blockchain queries
- Transaction broadcasting
- Balance and fee estimation

### UI/UX Layer (src/)
- User interface components
- State management
- User interaction handling

## Configuration Files

### TypeScript Configuration
- `tsconfig.json` - TypeScript compiler settings
- Path aliases for clean imports (`@/*`, `ui/*`, etc.)

### Build Configuration
- `webpack.config.js` - Webpack build configuration
- `lerna.json` - Monorepo management
- `CMakeLists.txt` - Native build configuration

### Package Management
- `package.json` - Dependencies and scripts
- `yarn.lock` / `package-lock.json` - Dependency locks

## Development Workflow

1. **Reference Phase**: Study UX patterns from `/repos/` implementations
2. **Implementation Phase**: Write new code only in `/src/`
3. **Integration Phase**: Use Trust Wallet Core for all cryptographic operations
4. **Testing Phase**: Validate against mandatory test requirements

## File Naming Conventions

### TypeScript Files
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `interfaces.ts`

### Directory Structure
- Feature-based organization
- Shared utilities in common directories
- Clear separation between UI and business logic

## Import Patterns

### Allowed Imports
```typescript
// Cryptographic operations (Trust Wallet Core only)
import { /* crypto functions */ } from 'repos/wallet-core'

// Network operations
import { ethers } from 'ethers'
import { Connection } from '@solana/web3.js'

// UI patterns (reference only)
import { /* UI patterns */ } from 'repos/Rabby-develop/src/ui'
```

### Forbidden Imports
```typescript
// NEVER import crypto from other sources
import { /* any crypto */ } from 'repos/js-wallet-sdk-main'
import { /* any signing */ } from 'repos/Rabby-develop/src/background'
```