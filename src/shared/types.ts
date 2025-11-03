// Chain and Asset Types
export interface Chain {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  chainId?: number; // For EVM chains
  isTestnet?: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  balance?: string;
  balanceUSD?: number;
  chainId: string;
}

export interface WalletAccount {
  address: string;
  chainId: string;
  balance: string;
  balanceUSD?: number;
  tokens: Token[];
}

// Transaction Types
export interface TransactionParams {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface UnsignedTransaction {
  chainId: string;
  from: string;
  params: TransactionParams;
  estimatedFee: string;
}

export interface SignedTransaction {
  chainId: string;
  txHash: string;
  rawTransaction: string;
}

// Keyring Types
export interface KeyringState {
  isUnlocked: boolean;
  hasWallet: boolean;
  accounts: WalletAccount[];
}

// Message Types for Runtime Communication
export interface BackgroundMessage {
  type: string;
  payload?: any;
  requestId?: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

// Chain-specific Types
export interface EVMChainConfig extends Chain {
  chainId: number;
  type: 'evm';
}

export interface SolanaChainConfig extends Chain {
  type: 'solana';
  cluster: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface BitcoinChainConfig extends Chain {
  type: 'bitcoin';
  network: 'mainnet' | 'testnet';
}

export type ChainConfig = EVMChainConfig | SolanaChainConfig | BitcoinChainConfig;

// UI State Types
export interface UIState {
  currentChain: string;
  isLoading: boolean;
  error?: string;
}

// Security Types
export interface EncryptedData {
  iv: string;
  data: string;
  salt: string;
}