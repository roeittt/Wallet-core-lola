/**
 * Content Script for dApp Integration
 * Injects Lola Wallet provider into web pages for dApp interaction
 */

// Ethereum Provider Interface
interface EthereumProvider {
  isLola?: boolean;
  isMetaMask?: boolean;
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
  selectedAddress?: string;
  chainId?: string;
  networkVersion?: string;
}

class LolaProvider implements EthereumProvider {
  public isLola = true;
  public isMetaMask = false; // Some dApps check for MetaMask
  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  private eventListeners: { [event: string]: ((...args: any[]) => void)[] } = {};

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get current wallet state from background
      const response = await this.sendMessage('GET_WALLET_STATE');
      if (response.success && response.data.isUnlocked) {
        await this.updateAccountInfo();
      }
    } catch (error) {
      console.error('Failed to initialize Lola provider:', error);
    }
  }

  private async sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type, payload, requestId: Date.now().toString() },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  private async updateAccountInfo() {
    try {
      const accountsResponse = await this.sendMessage('GET_ACCOUNTS', { chainIds: ['ethereum'] });
      if (accountsResponse.success && accountsResponse.data.accounts.length > 0) {
        const account = accountsResponse.data.accounts[0];
        this.selectedAddress = account.address;
        this.chainId = '0x1'; // Ethereum mainnet
        this.networkVersion = '1';
        
        this.emit('accountsChanged', [this.selectedAddress]);
        this.emit('chainChanged', this.chainId);
      }
    } catch (error) {
      console.error('Failed to update account info:', error);
    }
  }

  async request(args: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = args;

    try {
      switch (method) {
        case 'eth_requestAccounts':
          // Request account access
          const accountsResponse = await this.sendMessage('GET_ACCOUNTS', { chainIds: ['ethereum'] });
          if (accountsResponse.success && accountsResponse.data.accounts.length > 0) {
            const addresses = accountsResponse.data.accounts.map((acc: any) => acc.address);
            this.selectedAddress = addresses[0];
            this.emit('accountsChanged', addresses);
            return addresses;
          }
          throw new Error('No accounts available');

        case 'eth_accounts':
          // Get current accounts
          return this.selectedAddress ? [this.selectedAddress] : [];

        case 'eth_chainId':
          // Get current chain ID
          return this.chainId || '0x1';

        case 'net_version':
          // Get network version
          return this.networkVersion || '1';

        case 'eth_getBalance':
          // Get account balance
          const [address, blockTag] = params;
          const balanceResponse = await this.sendMessage('GET_BALANCE', {
            address: address || this.selectedAddress,
            chainId: 'ethereum'
          });
          if (balanceResponse.success) {
            // Convert balance to wei (assuming balance is in ETH)
            const balanceEth = parseFloat(balanceResponse.data.balance);
            const balanceWei = Math.floor(balanceEth * 1e18);
            return `0x${balanceWei.toString(16)}`;
          }
          throw new Error('Failed to get balance');

        case 'eth_sendTransaction':
          // Send transaction
          const [txParams] = params;
          const sendResponse = await this.sendMessage('SEND_TRANSACTION', {
            chainId: 'ethereum',
            to: txParams.to,
            amount: txParams.value ? (parseInt(txParams.value, 16) / 1e18).toString() : '0',
            data: txParams.data
          });
          if (sendResponse.success) {
            return sendResponse.data.txHash;
          }
          throw new Error('Transaction failed');

        case 'personal_sign':
          // Sign message
          const [message, signAddress] = params;
          const signResponse = await this.sendMessage('SIGN_MESSAGE', {
            chainId: 'ethereum',
            message
          });
          if (signResponse.success) {
            return signResponse.data.signature;
          }
          throw new Error('Signing failed');

        case 'wallet_switchEthereumChain':
          // Switch chain
          const [{ chainId: newChainId }] = params;
          const chainMap: { [key: string]: string } = {
            '0x1': 'ethereum',
            '0x89': 'polygon',
            '0x38': 'bsc',
            '0xa4b1': 'arbitrum',
            '0xa': 'optimism',
            '0xa86a': 'avalanche',
            '0xfa': 'fantom'
          };
          
          const chainName = chainMap[newChainId];
          if (chainName) {
            const switchResponse = await this.sendMessage('SWITCH_CHAIN', { chainId: chainName });
            if (switchResponse.success) {
              this.chainId = newChainId;
              this.emit('chainChanged', newChainId);
              return null;
            }
          }
          throw new Error(`Unsupported chain: ${newChainId}`);

        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      console.error(`Lola Provider error for ${method}:`, error);
      throw error;
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  removeListener(event: string, handler: (...args: any[]) => void): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(handler);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Inject Lola provider into the page
function injectProvider() {
  try {
    const provider = new LolaProvider();
    
    // Define ethereum object
    Object.defineProperty(window, 'ethereum', {
      value: provider,
      writable: false,
      configurable: false
    });

    // Also define lola for specific detection
    Object.defineProperty(window, 'lola', {
      value: provider,
      writable: false,
      configurable: false
    });

    // Dispatch ethereum provider events
    window.dispatchEvent(new Event('ethereum#initialized'));
    
    console.log('Lola Wallet provider injected successfully');
  } catch (error) {
    console.error('Failed to inject Lola provider:', error);
  }
}

// Inject immediately if document is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectProvider);
} else {
  injectProvider();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WALLET_STATE_CHANGED') {
    // Update provider state when wallet state changes
    const provider = (window as any).ethereum;
    if (provider && provider.isLola) {
      if (message.payload.isUnlocked) {
        provider.updateAccountInfo();
      } else {
        provider.selectedAddress = null;
        provider.emit('accountsChanged', []);
      }
    }
  }
  
  sendResponse({ success: true });
});