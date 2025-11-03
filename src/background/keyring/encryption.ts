import { IEncryption, EncryptedData } from '@shared/types';
import { SECURITY } from '@shared/constants';

export class WebCryptoEncryption implements IEncryption {
  async encrypt(data: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SECURITY.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(SECURITY.IV_LENGTH));
    
    // Derive key from password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: SECURITY.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: SECURITY.ENCRYPTION_ALGORITHM, length: SECURITY.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: SECURITY.ENCRYPTION_ALGORITHM, iv },
      key,
      new TextEncoder().encode(data)
    );
    
    // Combine salt, iv, and encrypted data
    const result: EncryptedData = {
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
    };
    
    return JSON.stringify(result);
  }
  
  async decrypt(encryptedData: string, password: string): Promise<string> {
    const { salt, iv, data }: EncryptedData = JSON.parse(encryptedData);
    
    // Convert hex strings back to Uint8Arrays
    const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const ivBytes = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const dataBytes = new Uint8Array(data.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Derive the same key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: SECURITY.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: SECURITY.ENCRYPTION_ALGORITHM, length: SECURITY.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: SECURITY.ENCRYPTION_ALGORITHM, iv: ivBytes },
      key,
      dataBytes
    );
    
    return new TextDecoder().decode(decrypted);
  }
  
  generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(SECURITY.SALT_LENGTH));
    return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}