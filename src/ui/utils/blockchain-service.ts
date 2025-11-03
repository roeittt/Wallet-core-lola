/**
 * Real blockchain service for fetching balances and interacting with networks
 * Uses actual RPC endpoints and APIs
 */

interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId?: number;
}

export class BlockchainService {
  private static instance: BlockchainService;
  
  // Default RPC endpoints (can be overridden with API keys)
  private rpcEndpoints = {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    polygon: 'https://polygon-rpc.com',
    bsc: 'https://bsc-dataseed1.binance.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ftm.tools',
    solana: 'https://solana-mainnet.g.alchemy.com/v2/demo',
    bitcoin: 'https://blockstream.info/api'
  };

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Update RPC endpoint with API key
   */
  setRpcEndpoint(chainId: string, rpcUrl: string) {
    this.rpcEndpoints[chainId as keyof typeof this.rpcEndpoints] = rpcUrl;
  }

  /**
   * Get Ethereum balance
   */
  async getEthereumBalance(address: string, chainId: string = 'ethereum'): Promise<string> {
    try {
      const rpcUrl = this.rpcEndpoints[chainId as keyof typeof this.rpcEndpoints];
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('RPC Error:', data.error);
        return '0';
      }

      // Convert from wei to ether
      const balanceWei = BigInt(data.result || '0x0');
      const balanceEth = Number(balanceWei) / Math.pow(10, 18);
      
      return balanceEth.toString();
    } catch (error) {
      console.error(`Failed to get ${chainId} balance:`, error);
      return '0';
    }
  }

  /**
   * Get Solana balance
   */
  async getSolanaBalance(address: string): Promise<string> {
    console.log('🔍 Fetching Solana balance for address:', address);
    try {
      const response = await fetch(this.rpcEndpoints.solana, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });

      const data = await response.json();
      console.log('📡 Solana RPC Response:', data);
      
      if (data.error) {
        console.error('❌ Solana RPC Error:', data.error);
        return '0';
      }

      // Convert from lamports to SOL
      const balanceLamports = data.result?.value || 0;
      const balanceSol = balanceLamports / Math.pow(10, 9);
      
      console.log('💰 Solana Balance:', {
        address,
        lamports: balanceLamports,
        sol: balanceSol
      });
      
      return balanceSol.toString();
    } catch (error) {
      console.error('❌ Failed to get Solana balance:', error);
      return '0';
    }
  }

  /**
   * Get Bitcoin balance
   */
  async getBitcoinBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.rpcEndpoints.bitcoin}/address/${address}`);
      
      if (!response.ok) {
        console.error('Bitcoin API Error:', response.status);
        return '0';
      }

      const data = await response.json();
      
      // Calculate balance from UTXO data
      const funded = data.chain_stats?.funded_txo_sum || 0;
      const spent = data.chain_stats?.spent_txo_sum || 0;
      const balanceSats = funded - spent;
      
      // Convert from satoshis to BTC
      const balanceBtc = balanceSats / Math.pow(10, 8);
      
      return balanceBtc.toString();
    } catch (error) {
      console.error('Failed to get Bitcoin balance:', error);
      return '0';
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(address: string, tokenAddress: string, chainId: string = 'ethereum'): Promise<{
    balance: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      const rpcUrl = this.rpcEndpoints[chainId as keyof typeof this.rpcEndpoints];
      
      // Get token balance
      const balanceResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: '0x70a08231' + address.slice(2).padStart(64, '0') // balanceOf(address)
          }, 'latest'],
          id: 1
        })
      });

      const balanceData = await balanceResponse.json();
      
      // Get token decimals
      const decimalsResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: '0x313ce567' // decimals()
          }, 'latest'],
          id: 2
        })
      });

      const decimalsData = await decimalsResponse.json();
      
      // Get token symbol
      const symbolResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: '0x95d89b41' // symbol()
          }, 'latest'],
          id: 3
        })
      });

      const symbolData = await symbolResponse.json();
      
      const rawBalance = BigInt(balanceData.result || '0x0');
      const decimals = parseInt(decimalsData.result || '0x12', 16); // Default 18 decimals
      const balance = Number(rawBalance) / Math.pow(10, decimals);
      
      // Decode symbol (basic hex to string conversion)
      let symbol = 'UNKNOWN';
      if (symbolData.result && symbolData.result !== '0x') {
        try {
          const hex = symbolData.result.slice(2);
          symbol = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
        } catch (e) {
          console.warn('Failed to decode token symbol');
        }
      }
      
      return {
        balance: balance.toString(),
        symbol,
        decimals
      };
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return {
        balance: '0',
        symbol: 'UNKNOWN',
        decimals: 18
      };
    }
  }

  /**
   * Get gas price for Ethereum networks
   */
  async getGasPrice(chainId: string = 'ethereum'): Promise<string> {
    try {
      const rpcUrl = this.rpcEndpoints[chainId as keyof typeof this.rpcEndpoints];
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      });

      const data = await response.json();
      return data.result || '0x0';
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0x0';
    }
  }
}