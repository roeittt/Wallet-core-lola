import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { IChain } from '@shared/interfaces';
import { SolanaChainConfig, Token, UnsignedTransaction, SignedTransaction } from '@shared/types';

/**
 * Solana Chain Adapter
 * SECURITY: Uses @solana/web3.js for network operations ONLY
 * All signing operations MUST go through Trust Wallet Core keyring
 */
export class SolanaChain implements IChain {
  public readonly config: SolanaChainConfig;
  private connection: Connection;

  constructor(config: SolanaChainConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  /**
   * Get address - delegates to keyring for derivation
   */
  async getAddress(derivationPath: string): Promise<string> {
    // This method should be called through the keyring
    throw new Error('Address derivation must go through keyring');
  }

  /**
   * Validate Solana address format
   */
  validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get SOL balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Get SPL token balances
   */
  async listTokens(address: string): Promise<Token[]> {
    try {
      const publicKey = new PublicKey(address);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
      });

      const tokens: Token[] = [];
      
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed;
        const tokenAmount = accountData.info.tokenAmount;
        
        if (parseFloat(tokenAmount.uiAmount) > 0) {
          // TODO: Get token metadata from Solana token registry
          tokens.push({
            address: accountData.info.mint,
            symbol: 'UNKNOWN', // Would be fetched from token registry
            name: 'Unknown Token',
            decimals: tokenAmount.decimals,
            balance: tokenAmount.uiAmount,
            chainId: this.config.id
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error('Failed to list tokens:', error);
      return [];
    }
  }

  /**
   * Get specific SPL token balance
   */
  async getTokenBalance(address: string, tokenMint: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const mintPublicKey = new PublicKey(tokenMint);
      
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: mintPublicKey
      });

      if (tokenAccounts.value.length === 0) {
        return '0';
      }

      const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      return tokenAmount.uiAmount || '0';
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  /**
   * Build unsigned SOL transfer transaction
   */
  async buildUnsignedTransaction(params: {
    from: string;
    to: string;
    amount: string;
  }): Promise<UnsignedTransaction> {
    try {
      const { from, to, amount } = params;
      const fromPublicKey = new PublicKey(from);
      const toPublicKey = new PublicKey(to);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
      });

      // Create transaction
      const transaction = new Transaction({
        feePayer: fromPublicKey,
        recentBlockhash: blockhash
      }).add(transferInstruction);

      // Estimate fee
      const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
      
      return {
        chainId: this.config.id,
        from,
        params: {
          to,
          value: amount,
          data: transaction.serialize({ requireAllSignatures: false }).toString('base64')
        },
        estimatedFee: ((fee.value || 5000) / LAMPORTS_PER_SOL).toString()
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
      // Solana fees are typically around 0.000005 SOL
      return '0.000005';
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error}`);
    }
  }

  /**
   * Broadcast signed transaction
   */
  async broadcast(signedTx: SignedTransaction): Promise<string> {
    try {
      // Parse the signed transaction
      const transaction = Transaction.from(Buffer.from(signedTx.rawTransaction, 'base64'));
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      
      return signature;
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
  }

  /**
   * Get current slot (block height equivalent)
   */
  async getBlockHeight(): Promise<number> {
    return await this.connection.getSlot();
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const status = await this.connection.getSignatureStatus(txHash);
      
      if (!status.value) {
        return 'pending';
      }
      
      if (status.value.err) {
        return 'failed';
      }
      
      return status.value.confirmationStatus === 'finalized' ? 'confirmed' : 'pending';
    } catch (error) {
      return 'pending';
    }
  }
}