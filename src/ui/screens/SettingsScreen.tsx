import React, { useState } from 'react';
import { useWalletStore } from '../store/wallet-store';

export const SettingsScreen: React.FC = () => {
  const { setCurrentScreen, accounts, supportedChains } = useWalletStore();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKeys, setPrivateKeys] = useState<{[chainId: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRevealMnemonic = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get stored wallet data
      const stored = localStorage.getItem('lola_wallet_encrypted');
      if (!stored) {
        throw new Error('No wallet found');
      }

      const data = JSON.parse(stored);
      
      // Import crypto utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      
      // Decrypt mnemonic
      const decryptedMnemonic = await CryptoUtils.decryptData(data.encryptedMnemonic, password);
      setMnemonic(decryptedMnemonic);
      setShowMnemonic(true);
    } catch (error) {
      setError('Invalid password or failed to decrypt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealPrivateKeys = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get stored wallet data
      const stored = localStorage.getItem('lola_wallet_encrypted');
      if (!stored) {
        throw new Error('No wallet found');
      }

      const data = JSON.parse(stored);
      
      // Import crypto utilities
      const { CryptoUtils } = await import('../utils/crypto-utils');
      
      // Decrypt mnemonic
      const decryptedMnemonic = await CryptoUtils.decryptData(data.encryptedMnemonic, password);
      
      // Generate private keys for each chain
      const keys: {[chainId: string]: string} = {};
      
      for (const chain of supportedChains) {
        try {
          let addressInfo;
          
          switch (chain.id) {
            case 'ethereum':
            case 'polygon':
            case 'bsc':
            case 'arbitrum':
            case 'optimism':
            case 'avalanche':
            case 'fantom':
              addressInfo = CryptoUtils.deriveEthereumAddress(decryptedMnemonic);
              keys[chain.id] = addressInfo.privateKey;
              break;
              
            case 'solana':
              addressInfo = CryptoUtils.deriveSolanaAddress(decryptedMnemonic);
              keys[chain.id] = addressInfo.privateKey;
              break;
              
            case 'bitcoin':
              addressInfo = CryptoUtils.deriveBitcoinAddress(decryptedMnemonic);
              keys[chain.id] = addressInfo.privateKey;
              break;
          }
        } catch (error) {
          console.error(`Failed to derive key for ${chain.id}:`, error);
          keys[chain.id] = 'Error deriving key';
        }
      }
      
      setPrivateKeys(keys);
      setShowPrivateKeys(true);
    } catch (error) {
      setError('Invalid password or failed to decrypt');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const handleLogout = () => {
    // Clear session data
    sessionStorage.removeItem('temp_password');
    
    // Update store
    useWalletStore.setState({
      isUnlocked: false,
      hasWallet: true,
      currentScreen: 'setup',
      accounts: []
    });
  };

  const handleDeleteWallet = () => {
    const confirmed = confirm(
      'Are you sure you want to delete this wallet? This action cannot be undone. Make sure you have backed up your mnemonic phrase!'
    );
    
    if (confirmed) {
      const doubleConfirm = confirm(
        'This will permanently delete your wallet. Type "DELETE" to confirm.'
      );
      
      if (doubleConfirm) {
        // Clear all wallet data
        localStorage.removeItem('lola_wallet_encrypted');
        sessionStorage.removeItem('temp_password');
        
        // Reset store
        useWalletStore.setState({
          isUnlocked: false,
          hasWallet: false,
          currentScreen: 'setup',
          accounts: [],
          error: null
        });
      }
    }
  };

  return (
    <div className="settings-screen">
      <div className="header">
        <button 
          onClick={() => setCurrentScreen('home')}
          className="back-button"
        >
          ← Back
        </button>
        <h1>Settings & Security</h1>
      </div>

      <div className="settings-content">
        {/* Password Input */}
        {(!showMnemonic && !showPrivateKeys) && (
          <div className="password-section">
            <h2>🔐 Access Wallet Secrets</h2>
            <p>Enter your password to view your mnemonic phrase or private keys</p>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your wallet password"
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="button-group">
              <button 
                onClick={handleRevealMnemonic}
                disabled={isLoading || !password}
                className="primary-button"
              >
                {isLoading ? 'Decrypting...' : '🔑 Show Mnemonic Phrase'}
              </button>
              
              <button 
                onClick={handleRevealPrivateKeys}
                disabled={isLoading || !password}
                className="secondary-button"
              >
                {isLoading ? 'Decrypting...' : '🗝️ Show Private Keys'}
              </button>
            </div>
          </div>
        )}

        {/* Mnemonic Display */}
        {showMnemonic && (
          <div className="secret-section">
            <h2>🔑 Your Mnemonic Phrase</h2>
            <div className="warning">
              <strong>⚠️ Keep this safe!</strong> Anyone with this phrase can access your wallet.
            </div>
            
            <div className="mnemonic-display">
              {mnemonic.split(' ').map((word, index) => (
                <span key={index} className="mnemonic-word">
                  <span className="word-number">{index + 1}</span>
                  {word}
                </span>
              ))}
            </div>

            <div className="button-group">
              <button 
                onClick={() => copyToClipboard(mnemonic, 'Mnemonic phrase')}
                className="copy-button"
              >
                📋 Copy Mnemonic
              </button>
              
              <button 
                onClick={() => {
                  setShowMnemonic(false);
                  setMnemonic('');
                  setPassword('');
                }}
                className="hide-button"
              >
                👁️ Hide
              </button>
            </div>
          </div>
        )}

        {/* Private Keys Display */}
        {showPrivateKeys && (
          <div className="secret-section">
            <h2>🗝️ Your Private Keys</h2>
            <div className="warning">
              <strong>⚠️ Never share these!</strong> Each key controls funds on its respective blockchain.
            </div>
            
            <div className="private-keys-list">
              {Object.entries(privateKeys).map(([chainId, privateKey]) => {
                const chain = supportedChains.find(c => c.id === chainId);
                const account = accounts.find(a => a.chainId === chainId);
                
                return (
                  <div key={chainId} className="private-key-item">
                    <div className="key-header">
                      <h3>{chain?.name} ({chain?.symbol})</h3>
                      <div className="key-address">
                        Address: {account?.address || 'Not loaded'}
                      </div>
                    </div>
                    
                    <div className="key-display">
                      <input 
                        type="text" 
                        value={privateKey} 
                        readOnly 
                        className="key-input"
                      />
                      <button 
                        onClick={() => copyToClipboard(privateKey, `${chain?.name} private key`)}
                        className="copy-key-button"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="button-group">
              <button 
                onClick={() => {
                  setShowPrivateKeys(false);
                  setPrivateKeys({});
                  setPassword('');
                }}
                className="hide-button"
              >
                👁️ Hide All Keys
              </button>
            </div>
          </div>
        )}

        {/* Wallet Actions */}
        <div className="wallet-actions">
          <h2>🔧 Wallet Actions</h2>
          
          <button onClick={handleLogout} className="logout-button">
            🚪 Lock Wallet
          </button>
          
          <button onClick={handleDeleteWallet} className="danger-button">
            🗑️ Delete Wallet
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings-screen {
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }

        .back-button {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #3b82f6;
          margin-right: 12px;
        }

        .header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .password-section, .secret-section, .wallet-actions {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .password-section h2, .secret-section h2, .wallet-actions h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #1a202c;
        }

        .password-section p {
          margin: 0 0 20px 0;
          color: #64748b;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .warning {
          background: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #92400e;
        }

        .mnemonic-display {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 20px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .mnemonic-word {
          display: flex;
          align-items: center;
          padding: 8px;
          background: white;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          border: 1px solid #e2e8f0;
        }

        .word-number {
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .private-keys-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 20px 0;
        }

        .private-key-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .key-header h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #1a202c;
        }

        .key-address {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
          margin-bottom: 12px;
        }

        .key-display {
          display: flex;
          gap: 8px;
        }

        .key-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          background: white;
        }

        .copy-key-button {
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary-button {
          flex: 1;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 140px;
        }

        .primary-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .primary-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .secondary-button {
          flex: 1;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 140px;
        }

        .secondary-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .copy-button {
          background: #059669;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .copy-button:hover {
          background: #047857;
        }

        .hide-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .hide-button:hover {
          background: #4b5563;
        }

        .logout-button {
          width: 100%;
          background: #f59e0b;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .logout-button:hover {
          background: #d97706;
        }

        .danger-button {
          width: 100%;
          background: #dc2626;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .danger-button:hover {
          background: #b91c1c;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};