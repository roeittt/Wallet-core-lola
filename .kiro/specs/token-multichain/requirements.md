# Lola Wallet – Token & Multi-chain Spec

## Supported Token Standards

- EVM: ERC-20 (Phase-2 add ERC-721/1155)
- Solana: SPL tokens via token registry
- BNB: BEP-20 (ERC-20 format)
- Polygon/AVAX/FTM/Arbitrum/Optimism: ERC-20 format
- Cosmos/IBC: Tick/Tick2 formats
- XRP: native XRP asset
- Dogecoin/Litecoin: native coins only

## Token Discovery

- EVM: ERC-20 via:
  - standard balanceOf(address)
  - auto-load via token lists JSON + async detection
- SPL:
  - fetch from Solana token accounts for address
- Cosmos:
  - gRPC / LCD balance queries

## Display Rules

- Always show base asset + detected tokens
- Sort by fiat value desc
- Token icons:
  - official URI if present
  - fallback: deterministic identicon

## Minimal Wallet Operation per token

- Address display
- Balance fetch
- Transfer with proper decimals
- Fee estimation warning if too high
- Validate receiver address format per chain

## Success Condition

Wallet must show and transfer:
- ETH, USDT, USDC, LINK, UNI, MATIC, WBTC, DAI, SHIB
- SOL + SPL USDC/SRM/RAY
- BNB + BUSD/CAKE
- AVAX + any ERC-20
- ATOM + at least 1 IBC token
- DOGE + LTC (native only)