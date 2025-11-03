# Lola Wallet – Steering Notes (MANDATORY & IMMUTABLE)

## Key+Signing Authority

Trust Wallet Core (repos/wallet-core) is the ONLY component allowed to:
- Generate BIP39 mnemonics
- Derive keys (all chains: BTC/EVM/SOL/Cosmos/etc)
- Sign ANY transaction or message

Any other code attempting key/mnemonic/signature handling must HALT with:
**SECURITY_FATAL_SECRET_EXFILTRATION**

## Networking Layers

Only chain RPC & SDKs fetch balances, fees, token metadata:
- EVM chains: ethers.js
- Solana network: @solana/web3.js
- Bitcoin/Dogecoin/Litecoin: Esplora/Core RPC
- XRP: XRP JSON-RPC / reliable public indexer
- Cosmos (ATOM & IBC): LCD/gRPC endpoints
- Optional helpers: OKX Wallet SDK

## Multi-Chain Token Support (Required)

Wallet MUST support:
- ETH + ALL ERC-20 tokens (auto-discover via Token Lists)
- SOL + ALL SPL tokens (Solana token registry)
- BNB + BEP-20 tokens
- Polygon (MATIC ERC-20 ecosystem)
- Avalanche C-Chain (ERC-20 format)
- Fantom Opera (ERC-20 format)
- Arbitrum / Optimism (L2 ERC-20 compat)
- XRP (native)
- ATOM + IBC tokens (display + send)
- DOGE + LTC (native send/receive only)

Tokens must:
- auto-appear on detection
- show balance & fiat pricing if available
- include icon (fallback: identicon)

## Chain Abstraction Interfaces (Mandatory)

### IKeyring:
- createMnemonic(), importMnemonic()
- deriveAddress(chain, path)
- signTx(chain, path, unsignedTx)
- signMessage(chain, path, msg)

### IChain (per chain):
- getAddress(path)
- getBalance(address)
- listTokens(address?)        # for token balances
- buildUnsignedTx(params)
- estimateFee(txDraft)
- broadcast(signedTx)

## Security Rules

- No plaintext mnemonic in logs, disk, UI
- Seed encrypted with WebCrypto / OS keystore
- Background-only signing; UI receives only signed payloads
- NEVER export private keys
- NEVER use ethers.Wallet() for signing

(violations → **SECURITY_FATAL_SECRET_EXFILTRATION**)

## Retrieval Order

1. repos/wallet-core/** (CRYPTO_TRUTH)
2. ethers.js / solana-web3.js (CHAIN_SDK)
3. okx-sdk (NETWORK_HELPER)
4. phantom/rabby/kraken → UX_REF ONLY

(crypto usage forbidden → **CONFLICT_CRYPTO_SOURCE**)

## Test Gates (must pass)

- BTC: send 10k sats (testnet)
- ETH: send 0.001 ETH & ERC-20 transfer (Sepolia)
- SOL: send 0.01 SOL & SPL token transfer (devnet)
- BNB: BEP-20 token transfer on testnet
- XRP: send small tx on testnet
- ATOM: IBC token transfer simulation

All must validate:
signature integrity + txid + balance updates