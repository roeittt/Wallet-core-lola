import { create } from 'zustand';
import { messaging } from '../utils/messaging';

interface WalletAccount {
  address: string;
  chainId: string;
  balance: string;
  balanceUSD?: number;
  tokens: any[];
}

interface WalletState {
  // Wallet state
  isUnlocked: boolean;
  hasWallet: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Accounts and balances
  accounts: WalletAccount[];
  currentChain: string;
  supportedChains: any[];
  
  // UI state
  currentScreen: 'home' | 'send' | 'receive' | 'buy' | 'setup' | 'settings';
  
  // Actions
  createWallet: (password: string) => Promise<string>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<void>;
  lockWallet: () => Promise<void>;
  refreshWalletState: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  switchChain: (chainId: string) => Promise<void>;
  setCurrentScreen: (screen: WalletState['currentScreen']) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  isUnlocked: false,
  hasWallet: false,
  isLoading: false,
  error: null,
  accounts: [],
  currentChain: localStorage.getItem('lola_current_chain') || 'ethereum',
  supportedChains: [],
  currentScreen: 'setup',

  // Actions
  createWallet: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import crypto utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      
      // Generate real BIP39 mnemonic
      const mnemonic = CryptoUtils.generateMnemonic();
      
      // Encrypt and store mnemonic
      const encryptedMnemonic = await CryptoUtils.encryptData(mnemonic, password);
      
      localStorage.setItem('lola_wallet_encrypted', JSON.stringify({
        hasWallet: true,
        encryptedMnemonic,
        createdAt: Date.now()
      }));
      
      // Store password temporarily for address derivation (in session only)
      sessionStorage.setItem('temp_password', password);
      
      set({ 
        hasWallet: true,
        isUnlocked: true,
        currentScreen: 'home',
        isLoading: false
      });
      
      // Refresh accounts with real addresses
      await get().refreshAccounts();
      
      return mnemonic;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create wallet';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  importWallet: async (mnemonic: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import crypto utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      
      // Validate mnemonic
      const cleanMnemonic = mnemonic.trim();
      if (!CryptoUtils.validateMnemonic(cleanMnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Encrypt and store mnemonic
      const encryptedMnemonic = await CryptoUtils.encryptData(cleanMnemonic, password);
      
      localStorage.setItem('lola_wallet_encrypted', JSON.stringify({
        hasWallet: true,
        encryptedMnemonic,
        createdAt: Date.now()
      }));
      
      // Store password temporarily for address derivation (in session only)
      sessionStorage.setItem('temp_password', password);
      
      set({ 
        hasWallet: true,
        isUnlocked: true,
        currentScreen: 'home',
        isLoading: false
      });
      
      // Refresh accounts with real addresses
      await get().refreshAccounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import wallet';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  unlockWallet: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const stored = localStorage.getItem('lola_wallet_encrypted');
      if (!stored) {
        throw new Error('No wallet found');
      }
      
      const data = JSON.parse(stored);
      
      // Import crypto utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      
      // Try to decrypt mnemonic with password
      await CryptoUtils.decryptData(data.encryptedMnemonic, password);
      
      // Store password temporarily for address derivation (in session only)
      sessionStorage.setItem('temp_password', password);
      
      set({ 
        hasWallet: true,
        isUnlocked: true,
        currentScreen: 'home',
        isLoading: false
      });
      
      // Refresh accounts with real addresses and balances
      await get().refreshAccounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid password';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  lockWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      // Clear session password
      sessionStorage.removeItem('temp_password');
      
      set({ 
        isUnlocked: false, 
        accounts: [], 
        currentScreen: 'setup' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to lock wallet';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshWalletState: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if wallet exists locally
      const stored = localStorage.getItem('lola_wallet_encrypted');
      const hasWallet = !!stored;
      const tempPassword = sessionStorage.getItem('temp_password');
      const isUnlocked = hasWallet && !!tempPassword;
      
      set({
        isUnlocked,
        hasWallet,
        currentScreen: hasWallet 
          ? (isUnlocked ? 'home' : 'setup')
          : 'setup'
      });

      if (isUnlocked) {
        await get().refreshAccounts();
      }
    } catch (error) {
      console.error('Failed to refresh wallet state:', error);
      set({ 
        error: 'Failed to load wallet state',
        currentScreen: 'setup',
        hasWallet: false,
        isUnlocked: false
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshAccounts: async () => {
    const { isUnlocked, supportedChains } = get();
    if (!isUnlocked) return;

    try {
      // Get stored wallet data
      const stored = localStorage.getItem('lola_wallet_encrypted');
      if (!stored) return;
      
      const data = JSON.parse(stored);
      
      // For now, we'll use a temporary password storage (in production, this would be handled securely)
      const tempPassword = sessionStorage.getItem('temp_password');
      if (!tempPassword) {
        console.warn('No session password found, cannot derive addresses');
        return;
      }
      
      // Import utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      const { BlockchainService } = await import('../utils/blockchain-service');
      
      // Decrypt mnemonic
      const mnemonic = await CryptoUtils.decryptData(data.encryptedMnemonic, tempPassword);
      
      const blockchainService = BlockchainService.getInstance();
      const accounts = [];
      
      console.log('Generating accounts for chains:', supportedChains.map(c => c.id));
      
      // Generate accounts for each supported chain
      for (const chain of supportedChains) {
        try {
          let addressInfo;
          let balance = '0';
          
          console.log(`Generating address for ${chain.id}...`);
          
          switch (chain.id) {
            case 'ethereum':
            case 'polygon':
            case 'bsc':
            case 'arbitrum':
            case 'optimism':
            case 'avalanche':
            case 'fantom':
              addressInfo = CryptoUtils.deriveEthereumAddress(mnemonic);
              console.log(`${chain.id} address:`, addressInfo.address);
              try {
                balance = await blockchainService.getEthereumBalance(addressInfo.address, chain.id);
              } catch (balanceError) {
                console.warn(`Failed to get balance for ${chain.id}:`, balanceError);
                balance = '0';
              }
              break;
              
            case 'solana':
              addressInfo = CryptoUtils.deriveSolanaAddress(mnemonic);
              console.log(`${chain.id} address:`, addressInfo.address);
              try {
                balance = await blockchainService.getSolanaBalance(addressInfo.address);
              } catch (balanceError) {
                console.warn(`Failed to get balance for ${chain.id}:`, balanceError);
                balance = '0';
              }
              break;
              
            case 'bitcoin':
              addressInfo = CryptoUtils.deriveBitcoinAddress(mnemonic);
              console.log(`${chain.id} address:`, addressInfo.address);
              try {
                balance = await blockchainService.getBitcoinBalance(addressInfo.address);
              } catch (balanceError) {
                console.warn(`Failed to get balance for ${chain.id}:`, balanceError);
                balance = '0';
              }
              break;
              
            default:
              console.warn(`Unsupported chain: ${chain.id}`);
              continue;
          }
          
          const account = {
            address: addressInfo.address,
            chainId: chain.id,
            balance,
            balanceUSD: 0, // Would calculate from price API
            tokens: [] // Would fetch token balances
          };
          
          accounts.push(account);
          console.log(`Added account for ${chain.id}:`, account);
          
        } catch (error) {
          console.error(`Failed to get account for ${chain.id}:`, error);
          // Add account with error message
          accounts.push({
            address: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            chainId: chain.id,
            balance: '0',
            balanceUSD: 0,
            tokens: []
          });
        }
      }
      
      console.log('Final accounts array:', accounts);
      
      set({ accounts });
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
      set({ error: 'Failed to load accounts' });
    }
  },

  switchChain: async (chainId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Switching to chain: ${chainId}`);
      
      // Check if chain is supported
      const { supportedChains } = get();
      const chain = supportedChains.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not supported`);
      }
      
      // Update current chain
      set({ currentChain: chainId });
      
      // Store in localStorage for persistence
      localStorage.setItem('lola_current_chain', chainId);
      
      console.log(`Successfully switched to ${chain.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch chain';
      console.error('Chain switch error:', errorMessage);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentScreen: (screen) => {
    set({ currentScreen: screen, error: null });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  }
}));