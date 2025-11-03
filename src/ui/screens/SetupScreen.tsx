import React, { useState } from 'react';
import { useWalletStore } from '../store/wallet-store';

export const SetupScreen: React.FC = () => {
  const { 
    createWallet, 
    importWallet, 
    unlockWallet, 
    hasWallet, 
    isLoading, 
    error 
  } = useWalletStore();

  const [mode, setMode] = useState<'unlock' | 'create' | 'import'>('unlock');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      return;
    }

    try {
      const mnemonic = await createWallet(password);
      setGeneratedMnemonic(mnemonic);
      setShowMnemonic(true);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleImportWallet = async () => {
    if (password !== confirmPassword) {
      return;
    }

    try {
      await importWallet(mnemonic.trim(), password);
    } catch (error) {
      console.error('Failed to import wallet:', error);
    }
  };

  const handleUnlockWallet = async () => {
    try {
      await unlockWallet(password);
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(generatedMnemonic);
  };

  if (showMnemonic) {
    return (
      <div className="setup-screen">
        <div className="setup-card">
          <h2>🔐 Backup Your Wallet</h2>
          <p className="warning">
            Write down these 12 words in order and store them safely. 
            This is the only way to recover your wallet.
          </p>
          
          <div className="mnemonic-display">
            {generatedMnemonic.split(' ').map((word, index) => (
              <span key={index} className="mnemonic-word">
                <span className="word-number">{index + 1}</span>
                {word}
              </span>
            ))}
          </div>

          <div className="button-group">
            <button onClick={copyMnemonic} className="secondary-button">
              📋 Copy
            </button>
            <button 
              onClick={() => setShowMnemonic(false)} 
              className="primary-button"
            >
              I've Saved It
            </button>
          </div>
        </div>

        <style jsx>{`
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

          .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
            color: #92400e;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="logo">
          <div className="logo-icon">🦋</div>
          <h1>Lola Wallet</h1>
          <p>Multi-chain cryptocurrency wallet</p>
        </div>

        {!hasWallet ? (
          <div className="setup-options">
            <button 
              onClick={() => setMode('create')}
              className={`option-button ${mode === 'create' ? 'active' : ''}`}
            >
              Create New Wallet
            </button>
            <button 
              onClick={() => setMode('import')}
              className={`option-button ${mode === 'import' ? 'active' : ''}`}
            >
              Import Existing Wallet
            </button>
          </div>
        ) : (
          <div className="setup-options">
            <button 
              onClick={() => setMode('unlock')}
              className={`option-button ${mode === 'unlock' ? 'active' : ''}`}
            >
              🔓 Unlock Wallet
            </button>
            <button 
              onClick={() => setMode('import')}
              className={`option-button ${mode === 'import' ? 'active' : ''}`}
            >
              📥 Import Different Wallet
            </button>
          </div>
        )}

        {mode === 'unlock' && hasWallet && (
          <div className="unlock-section">
            <p>Enter your password to access your current wallet</p>
          </div>
        )}

        {mode === 'import' && hasWallet && (
          <div className="import-section">
            <p className="warning-text">
              ⚠️ Importing a new wallet will replace your current wallet. 
              Make sure you have backed up your current recovery phrase.
            </p>
          </div>
        )}

        <div className="form-section">
          {mode === 'import' && (
            <div className="form-group">
              <label>Recovery Phrase</label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12-word recovery phrase"
                rows={3}
                className="form-textarea"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          {(mode === 'create' || mode === 'import') && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="form-input"
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {mode === 'import' && (
            <div className="debug-info">
              <small>
                Debug: Mode={mode}, Password={password ? '✓' : '✗'}, 
                Mnemonic={mnemonic ? '✓' : '✗'}, 
                Match={password === confirmPassword ? '✓' : '✗'}
              </small>
            </div>
          )}

          <div className="button-group">
            {mode === 'create' && (
              <button 
                onClick={handleCreateWallet}
                disabled={isLoading || !password || password !== confirmPassword}
                className="primary-button"
              >
                {isLoading ? 'Creating...' : 'Create Wallet'}
              </button>
            )}

            {mode === 'import' && (
              <button 
                onClick={handleImportWallet}
                disabled={isLoading || !password || !mnemonic || password !== confirmPassword}
                className="primary-button"
                title={`Debug: loading=${isLoading}, password=${!!password}, mnemonic=${!!mnemonic}, match=${password === confirmPassword}`}
              >
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </button>
            )}

            {mode === 'unlock' && hasWallet && (
              <button 
                onClick={handleUnlockWallet}
                disabled={isLoading || !password}
                className="primary-button"
              >
                {isLoading ? 'Unlocking...' : 'Unlock'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .setup-screen {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-height: 600px;
          max-height: 600px;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow-y: auto;
        }

        .setup-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 360px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          margin: auto 0;
        }

        .logo {
          text-align: center;
          margin-bottom: 20px;
        }

        .logo-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1a202c;
        }

        .logo p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .setup-options {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .option-button {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .option-button:hover {
          border-color: #3b82f6;
        }

        .option-button.active {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #3b82f6;
        }

        .unlock-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .unlock-section h2 {
          font-size: 20px;
          margin: 0 0 8px 0;
          color: #1a202c;
        }

        .unlock-section p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .import-section {
          text-align: center;
          margin-bottom: 16px;
        }

        .warning-text {
          background: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 12px;
          margin: 0;
          font-size: 13px;
          color: #92400e;
          line-height: 1.4;
        }

        .debug-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 4px;
          padding: 8px;
          margin: 8px 0;
          font-size: 11px;
          color: #0369a1;
        }

        .form-section {
          margin-top: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: monospace;
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

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .primary-button {
          flex: 1;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .primary-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .secondary-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .secondary-button:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};