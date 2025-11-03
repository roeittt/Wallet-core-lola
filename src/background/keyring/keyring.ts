import { IKeyring, IStorage } from '@shared/interfaces';
import { KeyringState, UnsignedTransaction, SignedTransaction } from '@shared/types';
import { STORAGE_KEYS, ERRORS } from '@shared/constants';
import { WebCryptoEncryption } from './encryption';
import { TrustWalletCoreKeyring } from './trust-wallet-core';

/**
 * Main Keyring Implementation
 * SECURITY: All cryptographic operations MUST go through Trust Wallet Core
 */
export class Keyring implements IKeyring {
  private encryption: WebCryptoEncryption;
  private trustWalletCore: TrustWalletCoreKeyring;
  private storage: IStorage;
  private currentPassword: string | null = null;

  constructor(storage: IStorage) {
    this.encryption = new WebCryptoEncryption();
    this.trustWalletCore = new TrustWalletCoreKeyring();
    this.storage = storage;
  }

  /**
   * Create new wallet with mnemonic
   * SECURITY: Uses ONLY Trust Wallet Core for mnemonic generation
   */
  async createMnemonic(): Promise<string> {
    try {
      // Generate mnemonic using Trust Wallet Core ONLY
      const mnemonic = await this.trustWalletCore.generateMnemonic();
      return mnemonic;
    } catch (error) {
      throw new Error(`${ERRORS.SECURITY_FATAL_SECRET_EXFILTRATION}: ${error}`);
    }
  }

  /**
   * Import existing wallet from mnemonic
   * SECURITY: Encrypts mnemonic and stores securely
   */
  async importMnemonic(mnemonic: string): Promise<void> {
    if (!this.currentPassword) {
      throw new Error(ERRORS.WALLET_LOCKED);
    }

    try {
      // Import mnemonic using Trust Wallet Core ONLY
      await this.trustWalletCore.importMnemonic(mnemonic);
      
      // Encrypt and store mnemonic
      const encryptedMnemonic = await this.encryption.encrypt(mnemonic, this.currentPassword);
      await this.storage.set(STORAGE_KEYS.ENCRYPTED_MNEMONIC, encryptedMnemonic);
      
      // Update wallet state
      const state: KeyringState = {
        isUnlocked: true,
        hasWallet: true,
        accounts: []
      };
      await this.storage.set(STORAGE_KEYS.WALLET_STATE, state);
      
    } catch (error) {
      throw new Error(`${ERRORS.SECURITY_FATAL_SECRET_EXFILTRATION}: ${error}`);
    }
  }

  /**
   * Derive address for specific chain
   * SECURITY: Uses ONLY Trust Wallet Core for address derivation
   */
  async deriveAddress(chainId: string, derivationPath: string): Promise<string> {
    if (!this.trustWalletCore.getUnlockStatus()) {
      throw new Error(ERRORS.WALLET_LOCKED);
    }

    try {
      return await this.trustWalletCore.deriveAddress(chainId, derivationPath);
    } catch (error) {
      throw new Error(`${ERRORS.SECURITY_FATAL_SECRET_EXFILTRATION}: ${error}`);
    }
  }

  /**
   * Sign transaction
   * SECURITY: Uses ONLY Trust Wallet Core for transaction signing
   */
  async signTransaction(
    chainId: string, 
    derivationPath: string, 
    unsignedTx: UnsignedTransaction
  ): Promise<SignedTransaction> {
    if (!this.trustWalletCore.getUnlockStatus()) {
      throw new Error(ERRORS.WALLET_LOCKED);
    }

    try {
      const rawTransaction = await this.trustWalletCore.signTransaction(
        chainId, 
        derivationPath, 
        unsignedTx
      );
      
      return {
        chainId,
        txHash: `0x${Date.now().toString(16)}`, // Mock hash - real implementation would extract from signed tx
        rawTransaction
      };
    } catch (error) {
      throw new Error(`${ERRORS.SECURITY_FATAL_SECRET_EXFILTRATION}: ${error}`);
    }
  }

  /**
   * Sign message
   * SECURITY: Uses ONLY Trust Wallet Core for message signing
   */
  async signMessage(chainId: string, derivationPath: string, message: string): Promise<string> {
    if (!this.trustWalletCore.getUnlockStatus()) {
      throw new Error(ERRORS.WALLET_LOCKED);
    }

    try {
      return await this.trustWalletCore.signMessage(chainId, derivationPath, message);
    } catch (error) {
      throw new Error(`${ERRORS.SECURITY_FATAL_SECRET_EXFILTRATION}: ${error}`);
    }
  }

  /**
   * Unlock wallet with password
   */
  async unlock(password: string): Promise<boolean> {
    try {
      // Get encrypted mnemonic from storage
      const encryptedMnemonic = await this.storage.get<string>(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
      if (!encryptedMnemonic) {
        throw new Error(ERRORS.WALLET_NOT_FOUND);
      }

      // Decrypt mnemonic
      const mnemonic = await this.encryption.decrypt(encryptedMnemonic, password);
      
      // Import mnemonic into Trust Wallet Core
      await this.trustWalletCore.importMnemonic(mnemonic);
      this.trustWalletCore.unlock();
      
      this.currentPassword = password;
      
      // Update wallet state
      const state: KeyringState = {
        isUnlocked: true,
        hasWallet: true,
        accounts: []
      };
      await this.storage.set(STORAGE_KEYS.WALLET_STATE, state);
      
      return true;
    } catch (error) {
      throw new Error(ERRORS.INVALID_PASSWORD);
    }
  }

  /**
   * Lock wallet and clear sensitive data
   */
  async lock(): Promise<void> {
    this.trustWalletCore.lock();
    this.currentPassword = null;
    
    // Update wallet state
    const state: KeyringState = {
      isUnlocked: false,
      hasWallet: this.trustWalletCore.hasWallet(),
      accounts: []
    };
    await this.storage.set(STORAGE_KEYS.WALLET_STATE, state);
  }

  /**
   * Check if wallet is unlocked
   */
  isUnlocked(): boolean {
    return this.trustWalletCore.getUnlockStatus();
  }

  /**
   * Check if wallet exists
   */
  hasWallet(): boolean {
    return this.trustWalletCore.hasWallet();
  }

  /**
   * Get current keyring state
   */
  async getState(): Promise<KeyringState> {
    const state = await this.storage.get<KeyringState>(STORAGE_KEYS.WALLET_STATE);
    return state || {
      isUnlocked: false,
      hasWallet: false,
      accounts: []
    };
  }
}