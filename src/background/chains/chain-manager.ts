import { IChain, IChainManager } from '@shared/interfaces';
import { ChainConfig, EVMChainConfig, SolanaChainConfig, BitcoinChainConfig } from '@shared/types';
import { SUPPORTED_CHAINS } from '@shared/constants';
import { EthereumChain } from './ethereum-chain';
import { SolanaChain } from './solana-chain';
import { BitcoinChain } from './bitcoin-chain';

/**
 * Chain Manager - Manages all blockchain adapters
 * SECURITY: Each chain adapter handles network operations only
 * All cryptographic operations go through Trust Wallet Core keyring
 */
export class ChainManager implements IChainManager {
  private chains: Map<string, IChain> = new Map();

  constructor() {
    this.initializeChains();
  }

  /**
   * Initialize all supported chains
   */
  private initializeChains(): void {
    for (const config of SUPPORTED_CHAINS) {
      try {
        const chain = this.createChainAdapter(config);
        this.chains.set(config.id, chain);
      } catch (error) {
        console.error(`Failed to initialize chain ${config.id}:`, error);
      }
    }
  }

  /**
   * Create appropriate chain adapter based on type
   */
  private createChainAdapter(config: ChainConfig): IChain {
    switch (config.type) {
      case 'evm':
        return new EthereumChain(config as EVMChainConfig);
      case 'solana':
        return new SolanaChain(config as SolanaChainConfig);
      case 'bitcoin':
        return new BitcoinChain(config as BitcoinChainConfig);
      default:
        throw new Error(`Unsupported chain type: ${(config as any).type}`);
    }
  }

  /**
   * Get chain adapter by ID
   */
  getChain(chainId: string): IChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all supported chain configurations
   */
  getSupportedChains(): ChainConfig[] {
    return SUPPORTED_CHAINS;
  }

  /**
   * Add new chain configuration
   */
  addChain(config: ChainConfig): void {
    try {
      const chain = this.createChainAdapter(config);
      this.chains.set(config.id, chain);
      
      // TODO: Persist custom chain configuration
      console.log(`Added custom chain: ${config.name}`);
    } catch (error) {
      throw new Error(`Failed to add chain ${config.id}: ${error}`);
    }
  }

  /**
   * Remove chain
   */
  removeChain(chainId: string): boolean {
    return this.chains.delete(chainId);
  }

  /**
   * Get chain by network ID (for EVM chains)
   */
  getChainByNetworkId(networkId: number): IChain | undefined {
    for (const [chainId, chain] of this.chains) {
      if (chain.config.type === 'evm' && (chain.config as EVMChainConfig).chainId === networkId) {
        return chain;
      }
    }
    return undefined;
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: string): boolean {
    return this.chains.has(chainId);
  }

  /**
   * Get EVM chains only
   */
  getEVMChains(): IChain[] {
    return Array.from(this.chains.values()).filter(
      chain => chain.config.type === 'evm'
    );
  }

  /**
   * Get non-EVM chains
   */
  getNonEVMChains(): IChain[] {
    return Array.from(this.chains.values()).filter(
      chain => chain.config.type !== 'evm'
    );
  }
}