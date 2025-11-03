import React, { useState } from 'react';
import { useWalletStore } from '../store/wallet-store';
import { FallbackWalletStore } from '../utils/fallback-mode';
import { SimpleSetup } from './SimpleSetup';

export const DebugScreen: React.FC = () => {
  const { setCurrentScreen, setError, setLoading } = useWalletStore();
  const [useSimpleSetup, setUseSimpleSetup] = useState(false);

  if (useSimpleSetup) {
    return <SimpleSetup />;
  }

  const handleBypassToSetup = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Use fallback mode to initialize wallet state
      const fallback = FallbackWalletStore.getInstance();
      const [walletState, chains] = await Promise.all([
        fallback.getWalletState(),
        fallback.getSupportedChains()
      ]);
      
      // Update store directly (bypassing messaging)
      useWalletStore.setState({
        isUnlocked: walletState.isUnlocked,
        hasWallet: walletState.hasWallet,
        supportedChains: chains.chains,
        currentScreen: walletState.hasWallet 
          ? (walletState.isUnlocked ? 'home' : 'setup')
          : 'setup',
        isLoading: false,
        error: null
      });
      
      console.log('Fallback mode enabled - UI only testing');
    } catch (error) {
      setError(`Fallback mode failed: ${error}`);
      setLoading(false);
    }
  };

  const handleTestBackgroundConnection = async () => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage({ type: 'PING' });
      console.log('Background response:', response);
      setError(null);
      alert('Background script is working!');
    } catch (error) {
      console.error('Background script error:', error);
      setError(`Background script error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="debug-screen">
      <div className="debug-card">
        <h2>🔧 Debug Mode</h2>
        <p>The extension seems to be stuck loading. Let's debug this:</p>
        
        <div className="debug-info">
          <h3>Possible Issues:</h3>
          <ul>
            <li>Background service worker not starting</li>
            <li>Chrome extension permissions</li>
            <li>Message passing between UI and background</li>
          </ul>
        </div>

        <div className="debug-actions">
          <button onClick={() => setUseSimpleSetup(true)} className="debug-button primary">
            🚀 Launch Wallet Demo
          </button>
          
          <button onClick={handleBypassToSetup} className="debug-button">
            Skip to Setup (Advanced)
          </button>
          
          <button onClick={handleTestBackgroundConnection} className="debug-button">
            Test Background Connection
          </button>
        </div>

        <div className="debug-instructions">
          <h3>Manual Debug Steps:</h3>
          <ol>
            <li>Open Chrome DevTools (F12)</li>
            <li>Go to chrome://extensions/</li>
            <li>Find Lola Wallet → Click "background page"</li>
            <li>Check console for errors</li>
            <li>Try refreshing the extension</li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        .debug-screen {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .debug-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .debug-card h2 {
          margin: 0 0 16px 0;
          color: #dc2626;
          font-size: 20px;
        }

        .debug-card p {
          margin: 0 0 20px 0;
          color: #64748b;
        }

        .debug-info {
          background: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .debug-info h3 {
          margin: 0 0 12px 0;
          color: #92400e;
          font-size: 16px;
        }

        .debug-info ul {
          margin: 0;
          padding-left: 20px;
          color: #92400e;
        }

        .debug-info li {
          margin-bottom: 4px;
        }

        .debug-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .debug-button {
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .debug-button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .debug-button.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .debug-button.primary:hover {
          background: #2563eb;
        }

        .debug-instructions {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 16px;
        }

        .debug-instructions h3 {
          margin: 0 0 12px 0;
          color: #0c4a6e;
          font-size: 16px;
        }

        .debug-instructions ol {
          margin: 0;
          padding-left: 20px;
          color: #0c4a6e;
        }

        .debug-instructions li {
          margin-bottom: 8px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};