import { ChainConfig, Token, UnsignedTransaction, SignedTransaction, WalletAccount } from './types';

// Keyring Interface - MUST use Trust Wallet Core only
export interface IKeyring {
  // Mnemonic operations
  createMnemonic(): Promise<string>;
  importMnemonic(mnemonic: string): Promise<void>;
  
  // Address derivation
  deriveAddress(chainId: string, derivationPath: string): Promise<string>;
  
  // Signing operations - BACKGROUND ONLY
  signTransaction(chainId: string, derivationPath: string, unsignedTx: UnsignedTransaction): Promise<SignedTransaction>;
  signMessage(chainId: string, derivationPath: string, message: string): Promise<string>;
  
  // State management
  unlock(password: string): Promise<boolean>;
  lock(): Promise<void>;
  isUnlocked(): boolean;
  hasWallet(): boolean;
}

// Chain Interface - Per blockchain implementation
export interface IChain {
  readonly config: ChainConfig;
  
  // Address operations
  getAddress(derivationPath: string): Promise<string>;
  validateAddress(address: string): boolean;
  
  // Balance operations
  getBalance(address: string): Promise<string>;
  
  // Token operations
  listTokens(address: string): Promise<Token[]>;
  getTokenBalance(address: string, tokenAddress: string): Promise<string>;
  
  // Transaction operations
  buildUnsignedTransaction(params: any): Promise<UnsignedTransaction>;
  estimateFee(txParams: any): Promise<string>;
  broadcast(signedTx: SignedTransaction): Promise<string>;
  
  // Network operations
  getBlockHeight(): Promise<number>;
  getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'>;
}

// Chain Manager Interface
export interface IChainManager {
  getChain(chainId: string): IChain | undefined;
  getSupportedChains(): ChainConfig[];
  addChain(config: ChainConfig): void;
}

// Storage Interface
export interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Encryption Interface
export interface IEncryption {
  encrypt(data: string, password: string): Promise<string>;
  decrypt(encryptedData: string, password: string): Promise<string>;
  generateSalt(): string;
}