import { BackgroundMessage, MessageResponse } from '@shared/types';
import { MESSAGE_TYPES, DERIVATION_PATHS } from '@shared/constants';
import { Keyring } from '../keyring/keyring';
import { ChainManager } from '../chains/chain-manager';
import { ChromeStorage } from '../storage/chrome-storage';

/**
 * Background Message Handler
 * Handles all communication between UI and background service worker
 * SECURITY: All cryptographic operations go through keyring only
 */
export class MessageHandler {
  private keyring: Keyring;
  private chainManager: ChainManager;
  private storage: ChromeStorage;

  constructor() {
    this.storage = new ChromeStorage();
    this.keyring = new Keyring(this.storage);
    this.chainManager = new ChainManager();
  }

  /**
   * Handle incoming messages from UI
   */
  async handleMessage(message: BackgroundMessage): Promise<MessageResponse> {
    try {
      switch (message.type) {
        // Wallet operations
        case MESSAGE_TYPES.CREATE_WALLET:
          return await this.createWallet(message.payload);
        
        case MESSAGE_TYPES.IMPORT_WALLET:
          return await this.importWallet(message.payload);
        
        case MESSAGE_TYPES.UNLOCK_WALLET:
          return await this.unlockWallet(message.payload);
        
        case MESSAGE_TYPES.LOCK_WALLET:
          return await this.lockWallet();
        
        case MESSAGE_TYPES.GET_WALLET_STATE:
          return await this.getWalletState();

        // Account operations
        case MESSAGE_TYPES.GET_ACCOUNTS:
          return await this.getAccounts(message.payload);
        
        case MESSAGE_TYPES.GET_BALANCE:
          return await this.getBalance(message.payload);
        
        case MESSAGE_TYPES.GET_TOKENS:
          return await this.getTokens(message.payload);

        // Transaction operations
        case MESSAGE_TYPES.SEND_TRANSACTION:
          return await this.sendTransaction(message.payload);
        
        case MESSAGE_TYPES.SIGN_MESSAGE:
          return await this.signMessage(message.payload);
        
        case MESSAGE_TYPES.ESTIMATE_FEE:
          return await this.estimateFee(message.payload);

        // Chain operations
        case MESSAGE_TYPES.SWITCH_CHAIN:
          return await this.switchChain(message.payload);
        
        case MESSAGE_TYPES.GET_SUPPORTED_CHAINS:
          return await this.getSupportedChains();

        default:
          return {
            success: false,
            error: `Unknown message type: ${message.type}`,
            requestId: message.requestId
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId
      };
    }
  }

  /**
   * Create new wallet
   */
  private async createWallet(payload: { password: string }): Promise<MessageResponse> {
    const { password } = payload;
    
    // Generate mnemonic using Trust Wallet Core ONLY
    const mnemonic = await this.keyring.createMnemonic();
    
    // Unlock keyring with password
    await this.keyring.unlock(password);
    
    // Import the generated mnemonic
    await this.keyring.importMnemonic(mnemonic);
    
    return {
      success: true,
      data: { mnemonic }
    };
  }

  /**
   * Import existing wallet
   */
  private async importWallet(payload: { mnemonic: string; password: string }): Promise<MessageResponse> {
    const { mnemonic, password } = payload;
    
    // Unlock keyring with password
    await this.keyring.unlock(password);
    
    // Import mnemonic using Trust Wallet Core ONLY
    await this.keyring.importMnemonic(mnemonic);
    
    return {
      success: true,
      data: { imported: true }
    };
  }

  /**
   * Unlock wallet
   */
  private async unlockWallet(payload: { password: string }): Promise<MessageResponse> {
    const { password } = payload;
    
    const unlocked = await this.keyring.unlock(password);
    
    return {
      success: true,
      data: { unlocked }
    };
  }

  /**
   * Lock wallet
   */
  private async lockWallet(): Promise<MessageResponse> {
    await this.keyring.lock();
    
    return {
      success: true,
      data: { locked: true }
    };
  }

  /**
   * Get wallet state
   */
  private async getWalletState(): Promise<MessageResponse> {
    const state = await this.keyring.getState();
    
    return {
      success: true,
      data: state
    };
  }

  /**
   * Get accounts for supported chains
   */
  private async getAccounts(payload: { chainIds?: string[] }): Promise<MessageResponse> {
    if (!this.keyring.isUnlocked()) {
      throw new Error('Wallet is locked');
    }

    const chainIds = payload?.chainIds || this.chainManager.getSupportedChains().map(c => c.id);
    const accounts = [];

    for (const chainId of chainIds) {
      try {
        const derivationPath = this.getDerivationPath(chainId);
        const address = await this.keyring.deriveAddress(chainId, derivationPath);
        
        const chain = this.chainManager.getChain(chainId);
        if (chain) {
          const balance = await chain.getBalance(address);
          const tokens = await chain.listTokens(address);
          
          accounts.push({
            address,
            chainId,
            balance,
            tokens
          });
        }
      } catch (error) {
        console.error(`Failed to get account for chain ${chainId}:`, error);
      }
    }

    return {
      success: true,
      data: { accounts }
    };
  }

  /**
   * Get balance for specific address and chain
   */
  private async getBalance(payload: { address: string; chainId: string }): Promise<MessageResponse> {
    const { address, chainId } = payload;
    
    const chain = this.chainManager.getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const balance = await chain.getBalance(address);
    
    return {
      success: true,
      data: { balance }
    };
  }

  /**
   * Get tokens for address
   */
  private async getTokens(payload: { address: string; chainId: string }): Promise<MessageResponse> {
    const { address, chainId } = payload;
    
    const chain = this.chainManager.getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const tokens = await chain.listTokens(address);
    
    return {
      success: true,
      data: { tokens }
    };
  }

  /**
   * Send transaction
   */
  private async sendTransaction(payload: {
    chainId: string;
    to: string;
    amount: string;
    data?: string;
  }): Promise<MessageResponse> {
    if (!this.keyring.isUnlocked()) {
      throw new Error('Wallet is locked');
    }

    const { chainId, to, amount, data } = payload;
    
    const chain = this.chainManager.getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // Get sender address
    const derivationPath = this.getDerivationPath(chainId);
    const from = await this.keyring.deriveAddress(chainId, derivationPath);

    // Build unsigned transaction
    const unsignedTx = await chain.buildUnsignedTransaction({
      from,
      to,
      amount,
      data
    });

    // Sign transaction using Trust Wallet Core ONLY
    const signedTx = await this.keyring.signTransaction(chainId, derivationPath, unsignedTx);

    // Broadcast transaction
    const txHash = await chain.broadcast(signedTx);

    return {
      success: true,
      data: { txHash, signedTx }
    };
  }

  /**
   * Sign message
   */
  private async signMessage(payload: {
    chainId: string;
    message: string;
  }): Promise<MessageResponse> {
    if (!this.keyring.isUnlocked()) {
      throw new Error('Wallet is locked');
    }

    const { chainId, message } = payload;
    const derivationPath = this.getDerivationPath(chainId);
    
    // Sign message using Trust Wallet Core ONLY
    const signature = await this.keyring.signMessage(chainId, derivationPath, message);

    return {
      success: true,
      data: { signature }
    };
  }

  /**
   * Estimate transaction fee
   */
  private async estimateFee(payload: {
    chainId: string;
    to: string;
    amount: string;
    data?: string;
  }): Promise<MessageResponse> {
    const { chainId, to, amount, data } = payload;
    
    const chain = this.chainManager.getChain(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const fee = await chain.estimateFee({ to, value: amount, data });

    return {
      success: true,
      data: { fee }
    };
  }

  /**
   * Switch current chain
   */
  private async switchChain(payload: { chainId: string }): Promise<MessageResponse> {
    const { chainId } = payload;
    
    if (!this.chainManager.isChainSupported(chainId)) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    await this.storage.set('current_chain', chainId);

    return {
      success: true,
      data: { chainId }
    };
  }

  /**
   * Get supported chains
   */
  private async getSupportedChains(): Promise<MessageResponse> {
    const chains = this.chainManager.getSupportedChains();
    
    return {
      success: true,
      data: { chains }
    };
  }

  /**
   * Get derivation path for chain
   */
  private getDerivationPath(chainId: string): string {
    switch (chainId) {
      case 'ethereum':
      case 'polygon':
      case 'bsc':
      case 'arbitrum':
      case 'optimism':
      case 'avalanche':
      case 'fantom':
        return DERIVATION_PATHS.ETHEREUM;
      case 'bitcoin':
        return DERIVATION_PATHS.BITCOIN;
      case 'solana':
        return DERIVATION_PATHS.SOLANA;
      default:
        return DERIVATION_PATHS.ETHEREUM;
    }
  }
}