import { ChainConfig } from './types';

// Derivation Paths
export const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  BITCOIN: "m/44'/0'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  POLYGON: "m/44'/60'/0'/0/0", // Same as Ethereum
  BNB: "m/44'/60'/0'/0/0", // Same as Ethereum
  AVALANCHE: "m/44'/60'/0'/0/0", // Same as Ethereum
} as const;

// Supported Chains Configuration
export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    explorerUrl: 'https://etherscan.io',
    chainId: 1,
    type: 'evm'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    chainId: 137,
    type: 'evm'
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    chainId: 56,
    type: 'evm'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    chainId: 42161,
    type: 'evm'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    chainId: 10,
    type: 'evm'
  },
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    chainId: 43114,
    type: 'evm'
  },
  {
    id: 'fantom',
    name: 'Fantom Opera',
    symbol: 'FTM',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    chainId: 250,
    type: 'evm'
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    type: 'solana',
    cluster: 'mainnet-beta'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    rpcUrl: 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info',
    type: 'bitcoin',
    network: 'mainnet'
  }
];

// Message Types
export const MESSAGE_TYPES = {
  // Keyring operations
  CREATE_WALLET: 'CREATE_WALLET',
  IMPORT_WALLET: 'IMPORT_WALLET',
  UNLOCK_WALLET: 'UNLOCK_WALLET',
  LOCK_WALLET: 'LOCK_WALLET',
  GET_WALLET_STATE: 'GET_WALLET_STATE',
  
  // Account operations
  GET_ACCOUNTS: 'GET_ACCOUNTS',
  GET_BALANCE: 'GET_BALANCE',
  GET_TOKENS: 'GET_TOKENS',
  
  // Transaction operations
  SEND_TRANSACTION: 'SEND_TRANSACTION',
  SIGN_MESSAGE: 'SIGN_MESSAGE',
  ESTIMATE_FEE: 'ESTIMATE_FEE',
  
  // Chain operations
  SWITCH_CHAIN: 'SWITCH_CHAIN',
  GET_SUPPORTED_CHAINS: 'GET_SUPPORTED_CHAINS',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ENCRYPTED_MNEMONIC: 'encrypted_mnemonic',
  WALLET_STATE: 'wallet_state',
  CURRENT_CHAIN: 'current_chain',
  ACCOUNTS: 'accounts',
  TOKENS: 'tokens',
} as const;

// Security Constants
export const SECURITY = {
  ENCRYPTION_ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
  PBKDF2_ITERATIONS: 100000,
} as const;

// Error Messages
export const ERRORS = {
  SECURITY_FATAL_SECRET_EXFILTRATION: 'SECURITY_FATAL_SECRET_EXFILTRATION: Unauthorized crypto operation detected',
  CONFLICT_CRYPTO_SOURCE: 'CONFLICT_CRYPTO_SOURCE: Multiple crypto sources detected',
  WALLET_LOCKED: 'Wallet is locked',
  WALLET_NOT_FOUND: 'No wallet found',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_MNEMONIC: 'Invalid mnemonic phrase',
  CHAIN_NOT_SUPPORTED: 'Chain not supported',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
} as const;