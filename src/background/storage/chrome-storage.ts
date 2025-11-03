import { IStorage } from '@shared/interfaces';

/**
 * Chrome Extension Storage Implementation
 * Uses chrome.storage.local for persistent storage
 */
export class ChromeStorage implements IStorage {
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] || null;
    } catch (error) {
      console.error(`Failed to get storage key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set storage key ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove([key]);
    } catch (error) {
      console.error(`Failed to remove storage key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMultiple<T>(keys: string[]): Promise<{ [key: string]: T }> {
    try {
      const result = await chrome.storage.local.get(keys);
      return result as { [key: string]: T };
    } catch (error) {
      console.error('Failed to get multiple storage keys:', error);
      return {};
    }
  }

  /**
   * Set multiple key-value pairs at once
   */
  async setMultiple(items: { [key: string]: any }): Promise<void> {
    try {
      await chrome.storage.local.set(items);
    } catch (error) {
      console.error('Failed to set multiple storage keys:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   */
  async getBytesInUse(keys?: string[]): Promise<number> {
    try {
      return await chrome.storage.local.getBytesInUse(keys);
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }
}