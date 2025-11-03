// Fallback mode for when background script isn't working
export class FallbackWalletStore {
  private static instance: FallbackWalletStore;
  
  static getInstance(): FallbackWalletStore {
    if (!FallbackWalletStore.instance) {
      FallbackWalletStore.instance = new FallbackWalletStore();
    }
    return FallbackWalletStore.instance;
  }

  async createWallet(password: string): Promise<{ mnemonic: string }> {
    // Generate a test mnemonic (in real app, this would use Trust Wallet Core)
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    
    // Store in localStorage for demo
    localStorage.setItem('lola_wallet_demo', JSON.stringify({
      hasWallet: true,
      isUnlocked: true,
      mnemonic: testMnemonic
    }));
    
    return { mnemonic: testMnemonic };
  }

  async importWallet(mnemonic: string, password: string): Promise<{ imported: boolean }> {
    // Store in localStorage for demo
    localStorage.setItem('lola_wallet_demo', JSON.stringify({
      hasWallet: true,
      isUnlocked: true,
      mnemonic: mnemonic
    }));
    
    return { imported: true };
  }

  async unlockWallet(password: string): Promise<{ unlocked: boolean }> {
    const stored = localStorage.getItem('lola_wallet_demo');
    if (stored) {
      const data = JSON.parse(stored);
      data.isUnlocked = true;
      localStorage.setItem('lola_wallet_demo', JSON.stringify(data));
      return { unlocked: true };
    }
    throw new Error('No wallet found');
  }

  async getWalletState(): Promise<{
    isUnlocked: boolean;
    hasWallet: boolean;
    accounts: any[];
  }> {
    const stored = localStorage.getItem('lola_wallet_demo');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        isUnlocked: data.isUnlocked || false,
        hasWallet: data.hasWallet || false,
        accounts: []
      };
    }
    
    return {
      isUnlocked: false,
      hasWallet: false,
      accounts: []
    };
  }

  async getSupportedChains(): Promise<{ chains: any[] }> {
    return {
      chains: [
        {
          id: 'ethereum',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          type: 'evm'
        },
        {
          id: 'polygon',
          name: 'Polygon',
          symbol: 'MATIC',
          decimals: 18,
          type: 'evm'
        },
        {
          id: 'solana',
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
          type: 'solana'
        },
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          decimals: 8,
          type: 'bitcoin'
        }
      ]
    };
  }

  async getAccounts(): Promise<{ accounts: any[] }> {
    return {
      accounts: [
        {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
          chainId: 'ethereum',
          balance: '1.234567',
          balanceUSD: 2468.90,
          tokens: []
        },
        {
          address: 'DemoSolanaAddress123456789',
          chainId: 'solana',
          balance: '5.67890',
          balanceUSD: 567.89,
          tokens: []
        }
      ]
    };
  }
}