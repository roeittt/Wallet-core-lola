// Debug mode for testing UI without background script
export const DEBUG_MODE = false; // Set to true for UI-only testing

export const mockWalletState = {
  isUnlocked: false,
  hasWallet: false,
  accounts: []
};

export const mockSupportedChains = {
  chains: [
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
  ]
};

export const mockAccounts = {
  accounts: [
    {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
      chainId: 'ethereum',
      balance: '1.234567',
      balanceUSD: 2468.90,
      tokens: [
        {
          address: '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '100.50',
          balanceUSD: 100.50,
          chainId: 'ethereum'
        }
      ]
    }
  ]
};