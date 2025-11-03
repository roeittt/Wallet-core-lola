import { IChain } from '@shared/interfaces';
import { BitcoinChainConfig, Token, UnsignedTransaction, SignedTransaction } from '@shared/types';

/**
 * Bitcoin Chain Adapter
 * SECURITY: Uses Blockstream API for network operations ONLY
 * All signing operations MUST go through Trust Wallet Core keyring
 */
export class BitcoinChain implements IChain {
  public readonly config: BitcoinChainConfig;
  private baseUrl: string;

  constructor(config: BitcoinChainConfig) {
    this.config = config;
    this.baseUrl = config.network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
  }

  /**
   * Get address - delegates to keyring for derivation
   */
  async getAddress(derivationPath: string): Promise<string> {
    // This method should be called through the keyring
    throw new Error('Address derivation must go through keyring');
  }

  /**
   * Validate Bitcoin address format (basic validation)
   */
  validateAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^(bc1|tb1)[a-z0-9]{39,59}$/;
    
    return p2pkhRegex.test(address) || bech32Regex.test(address);
  }

  /**
   * Get Bitcoin balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const balanceSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      
      // Convert satoshis to BTC
      return (balanceSats / 100000000).toString();
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Bitcoin doesn't have tokens like Ethereum
   */
  async listTokens(address: string): Promise<Token[]> {
    return []; // Bitcoin doesn't support tokens natively
  }

  /**
   * Bitcoin doesn't have tokens
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    return '0'; // Bitcoin doesn't support tokens natively
  }

  /**
   * Build unsigned Bitcoin transaction
   */
  async buildUnsignedTransaction(params: {
    from: string;
    to: string;
    amount: string;
    feeRate?: number;
  }): Promise<UnsignedTransaction> {
    try {
      const { from, to, amount, feeRate = 1 } = params;
      
      // Get UTXOs for the address
      const utxos = await this.getUTXOs(from);
      
      if (utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      const amountSats = Math.floor(parseFloat(amount) * 100000000);
      
      // Simple UTXO selection (use first available UTXO that covers the amount)
      let totalInput = 0;
      const selectedUtxos = [];
      
      for (const utxo of utxos) {
        selectedUtxos.push(utxo);
        totalInput += utxo.value;
        
        if (totalInput >= amountSats + (feeRate * 250)) { // Rough fee estimation
          break;
        }
      }
      
      if (totalInput < amountSats) {
        throw new Error('Insufficient balance');
      }

      const estimatedFee = feeRate * 250; // Rough estimation for P2PKH transaction
      
      return {
        chainId: this.config.id,
        from,
        params: {
          to,
          value: amount,
          data: JSON.stringify({
            utxos: selectedUtxos,
            outputs: [
              { address: to, value: amountSats },
              { address: from, value: totalInput - amountSats - estimatedFee } // Change output
            ],
            feeRate
          })
        },
        estimatedFee: (estimatedFee / 100000000).toString()
      };
    } catch (error) {
      throw new Error(`Failed to build transaction: ${error}`);
    }
  }

  /**
   * Estimate Bitcoin transaction fee
   */
  async estimateFee(txParams: any): Promise<string> {
    try {
      // Get current fee rates
      const response = await fetch(`${this.baseUrl}/fee-estimates`);
      const feeRates = await response.json();
      
      // Use fee rate for next block (fastest)
      const feeRate = feeRates['1'] || 1;
      
      // Estimate transaction size (rough estimation for P2PKH)
      const estimatedSize = 250; // bytes
      const feeSats = feeRate * estimatedSize;
      
      return (feeSats / 100000000).toString();
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error}`);
    }
  }

  /**
   * Broadcast signed Bitcoin transaction
   */
  async broadcast(signedTx: SignedTransaction): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: signedTx.rawTransaction
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Broadcast failed: ${error}`);
      }
      
      return await response.text(); // Returns transaction ID
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/blocks/tip/height`);
      return parseInt(await response.text());
    } catch (error) {
      throw new Error(`Failed to get block height: ${error}`);
    }
  }

  /**
   * Get Bitcoin transaction status
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txHash}/status`);
      if (!response.ok) {
        return 'failed';
      }
      
      const status = await response.json();
      return status.confirmed ? 'confirmed' : 'pending';
    } catch (error) {
      return 'pending';
    }
  }

  /**
   * Get UTXOs for an address
   */
  private async getUTXOs(address: string): Promise<Array<{ txid: string; vout: number; value: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}/utxo`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get UTXOs: ${error}`);
    }
  }
}