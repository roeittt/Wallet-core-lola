# Implementation Requirements — Lola Wallet Web App

## App Type
- Browser Extension (Manifest V3)
- React + Vite UI
- Background Service Worker for wallet logic
- All application code MUST be under `/src` directory

## Core Functionalities
1️⃣ Create/import wallet
2️⃣ Derive addresses for multiple chains
3️⃣ Show balances (native + tokens)
4️⃣ Send transactions (native + supported tokens)
5️⃣ Receive funds (QR code + copy address)
6️⃣ Integrated Buy Crypto screen (on-ramps)

## Supported Chains (Phase-1)
- Ethereum + ERC-20 tokens
- Solana + SPL tokens
- Bitcoin (native)
- Polygon, Binance Smart Chain, Avalanche C, Fantom, Arbitrum, Optimism (via ERC-20 compatibility)
- XRP (native, basic transfer only)
- Cosmos ATOM + IBC tokens (balance + send)
- Dogecoin + Litecoin (native send/receive only)

## Token Requirements
- Auto-detect tokens for all EVM/L2 networks (token lists + balanceOf)
- Auto-detect SPL tokens via Solana token accounts
- Cosmos IBC: list balances per denom
- Show:
  - symbol, name, decimals
  - balance formatted correctly
  - fiat estimate (optional/future)
  - token icon (or identicon fallback)

## Architecture Layout (MUST FOLLOW)
src/
 ├─ background/
 │    ├─ keyring.ts            # signing + derivation
 │    ├─ bus.ts                # UI <-> background bridge
 │    └─ chains/
 │         ├─ evm.ts
 │         ├─ sol.ts
 │         └─ btc.ts
 ├─ ui/
 │    ├─ main.tsx
 │    ├─ App.tsx
 │    └─ screens/
 │         ├─ Home.tsx
 │         ├─ Send.tsx
 │         ├─ Receive.tsx
 │         ├─ Buy.tsx
 │
 ├─ shared/
 │    ├─ types.ts
 │    └─ format.ts

## Screen Requirements
- **Home**
  - chain selector
  - wallet value
  - token list (native asset first)
- **Send**
  - select asset + amount + address
  - fee estimate + confirm
  - show tx hash after broadcast
- **Receive**
  - active address QR
  - tap-to-copy
- **Buy**
  - Integrate at least MoonPay widget
  - Additional provider optional (Ramp/Transak/Banxa)
  - Auto-fill active address + chain/asset

## Signing + Key Handling
- Must use Trust Wallet Core WASM for:
  - BIP39 mnemonic generation/import
  - Deriving addresses
  - Signing transactions
- Background only — UI cannot access mnemonics/privkeys
- Encrypted seed storage (WebCrypto AES-GCM locally)

## Networking
- EVM/L2 via ethers.js JSON-RPC provider defined in ENV
- Solana via @solana/web3.js + chosen RPC
- Bitcoin via Esplora endpoint ENV
- Cosmos, XRP via public RPC/REST (testnets allowed)

## ENV Variables Required
- `VITE_ETH_RPC` (Sepolia for tests)
- `VITE_SOL_RPC` (Devnet for tests)
- `VITE_BTC_API` (Blockstream testnet)
- Optional RPCs for other chains

## Technical Deliverables
✅ Browser-extension build in `/dist`  
✅ manifest.json included in `/dist`  
✅ Code compiles with no TypeScript errors  
✅ Background <-> UI messaging implemented

## Completion Success Token
Output after all features working:
LOLA_WEB_MVP_READY
