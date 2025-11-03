import { BackgroundMessage, MessageResponse } from '@shared/types';

/**
 * Messaging utility for UI to background communication
 * Handles all runtime messaging with the background service worker
 */
export class MessagingService {
  private static instance: MessagingService;
  private requestId = 0;

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Send message to background service worker
   */
  async sendMessage<T = any>(type: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = (++this.requestId).toString();
      
      const message: BackgroundMessage = {
        type,
        payload,
        requestId
      };

      console.log(`[Messaging] Sending message: ${type}`, message);

      try {
        chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
          console.log(`[Messaging] Response for ${type}:`, response);
          
          if (chrome.runtime.lastError) {
            console.error(`[Messaging] Runtime error for ${type}:`, chrome.runtime.lastError);
            reject(new Error(`Runtime error: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (!response) {
            console.error(`[Messaging] No response for ${type}`);
            reject(new Error(`No response from background script for ${type}`));
            return;
          }

          if (response.success) {
            resolve(response.data as T);
          } else {
            console.error(`[Messaging] Error response for ${type}:`, response.error);
            reject(new Error(response.error || `Unknown error for ${type}`));
          }
        });
      } catch (error) {
        console.error(`[Messaging] Exception sending ${type}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Wallet operations
   */
  async createWallet(password: string): Promise<{ mnemonic: string }> {
    return this.sendMessage('CREATE_WALLET', { password });
  }

  async importWallet(mnemonic: string, password: string): Promise<{ imported: boolean }> {
    return this.sendMessage('IMPORT_WALLET', { mnemonic, password });
  }

  async unlockWallet(password: string): Promise<{ unlocked: boolean }> {
    return this.sendMessage('UNLOCK_WALLET', { password });
  }

  async lockWallet(): Promise<{ locked: boolean }> {
    return this.sendMessage('LOCK_WALLET');
  }

  async getWalletState(): Promise<{
    isUnlocked: boolean;
    hasWallet: boolean;
    accounts: any[];
  }> {
    try {
      return await this.sendMessage('GET_WALLET_STATE');
    } catch (error) {
      console.error('[Messaging] Failed to get wallet state, using defaults:', error);
      // Return safe defaults if background script isn't responding
      return {
        isUnlocked: false,
        hasWallet: false,
        accounts: []
      };
    }
  }

  /**
   * Account operations
   */
  async getAccounts(chainIds?: string[]): Promise<{
    accounts: Array<{
      address: string;
      chainId: string;
      balance: string;
      tokens: any[];
    }>;
  }> {
    return this.sendMessage('GET_ACCOUNTS', { chainIds });
  }

  async getBalance(address: string, chainId: string): Promise<{ balance: string }> {
    return this.sendMessage('GET_BALANCE', { address, chainId });
  }

  async getTokens(address: string, chainId: string): Promise<{ tokens: any[] }> {
    return this.sendMessage('GET_TOKENS', { address, chainId });
  }

  /**
   * Transaction operations
   */
  async sendTransaction(
    chainId: string,
    to: string,
    amount: string,
    data?: string
  ): Promise<{ txHash: string; signedTx: any }> {
    return this.sendMessage('SEND_TRANSACTION', { chainId, to, amount, data });
  }

  async signMessage(chainId: string, message: string): Promise<{ signature: string }> {
    return this.sendMessage('SIGN_MESSAGE', { chainId, message });
  }

  async estimateFee(
    chainId: string,
    to: string,
    amount: string,
    data?: string
  ): Promise<{ fee: string }> {
    return this.sendMessage('ESTIMATE_FEE', { chainId, to, amount, data });
  }

  /**
   * Chain operations
   */
  async switchChain(chainId: string): Promise<{ chainId: string }> {
    return this.sendMessage('SWITCH_CHAIN', { chainId });
  }

  async getSupportedChains(): Promise<{ chains: any[] }> {
    try {
      return await this.sendMessage('GET_SUPPORTED_CHAINS');
    } catch (error) {
      console.error('[Messaging] Failed to get supported chains, using defaults:', error);
      // Return default chains if background script isn't responding
      return {
        chains: [
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
          { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
          { id: 'solana', name: 'Solana', symbol: 'SOL' },
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' }
        ]
      };
    }
  }
}

// Export singleton instance
export const messaging = MessagingService.getInstance();