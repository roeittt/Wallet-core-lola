import { ethers } from 'ethers';
import { IChain } from '@shared/interfaces';
import { EVMChainConfig, Token, UnsignedTransaction, SignedTransaction } from '@shared/types';
import { ERRORS } from '@shared/constants';

/**
 * Ethereum Chain Adapter
 * SECURITY: Uses ethers.js for network operations ONLY
 * All signing operations MUST go through Trust Wallet Core keyring
 */
export class EthereumChain implements IChain {
  public readonly config: EVMChainConfig;
  private provider: ethers.JsonRpcProvider;

  constructor(config: EVMChainConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * Get address - delegates to keyring for derivation
   */
  async getAddress(derivationPath: string): Promise<string> {
    // This method should be called through the keyring
    throw new Error('Address derivation must go through keyring');
  }

  /**
   * Validate Ethereum address format
   */
  validateAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get native token balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Get ERC-20 token balances
   */
  async listTokens(address: string): Promise<Token[]> {
    try {
      // TODO: Implement token discovery using token lists
      // For now, return common tokens
      const commonTokens = await this.getCommonTokenBalances(address);
      return commonTokens;
    } catch (error) {
      console.error('Failed to list tokens:', error);
      return [];
    }
  }

  /**
   * Get specific ERC-20 token balance
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        this.provider
      );
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals()
      ]);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  /**
   * Build unsigned transaction
   */
  async buildUnsignedTransaction(params: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  }): Promise<UnsignedTransaction> {
    try {
      const { to, value = '0', data = '0x', gasLimit, gasPrice } = params;
      
      // Get current gas price if not provided
      const currentGasPrice = gasPrice || (await this.provider.getFeeData()).gasPrice?.toString() || '0';
      
      // Estimate gas limit if not provided
      const estimatedGasLimit = gasLimit || (await this.provider.estimateGas({
        to,
        value: ethers.parseEther(value),
        data
      })).toString();

      return {
        chainId: this.config.id,
        from: '', // Will be set by caller
        params: {
          to,
          value: ethers.parseEther(value).toString(),
          data,
          gasLimit: estimatedGasLimit,
          gasPrice: currentGasPrice
        },
        estimatedFee: (BigInt(estimatedGasLimit) * BigInt(currentGasPrice)).toString()
      };
    } catch (error) {
      throw new Error(`Failed to build transaction: ${error}`);
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(txParams: any): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasLimit = await this.provider.estimateGas(txParams);
      const gasPrice = feeData.gasPrice || BigInt(0);
      
      const fee = gasLimit * gasPrice;
      return ethers.formatEther(fee);
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error}`);
    }
  }

  /**
   * Broadcast signed transaction
   */
  async broadcast(signedTx: SignedTransaction): Promise<string> {
    try {
      const tx = await this.provider.broadcastTransaction(signedTx.rawTransaction);
      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return 'pending';
      }
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      return 'pending';
    }
  }

  /**
   * Get common token balances (placeholder implementation)
   */
  private async getCommonTokenBalances(address: string): Promise<Token[]> {
    // Common ERC-20 tokens by chain
    const commonTokens: { [chainId: number]: Array<{ address: string; symbol: string; name: string; decimals: number }> } = {
      1: [ // Ethereum
        { address: '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 }
      ],
      137: [ // Polygon
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ]
    };

    const tokens = commonTokens[this.config.chainId] || [];
    const tokenBalances: Token[] = [];

    for (const token of tokens) {
      try {
        const balance = await this.getTokenBalance(address, token.address);
        if (parseFloat(balance) > 0) {
          tokenBalances.push({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance,
            chainId: this.config.id
          });
        }
      } catch (error) {
        console.error(`Failed to get balance for ${token.symbol}:`, error);
      }
    }

    return tokenBalances;
  }
}