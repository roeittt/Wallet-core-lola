import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useWalletStore } from './store/wallet-store';
import { Layout } from './components/Layout';
import { SetupScreen } from './screens/SetupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SendScreen } from './screens/SendScreen';
import { ReceiveScreen } from './screens/ReceiveScreen';
import { BuyScreen } from './screens/BuyScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DebugScreen } from './components/DebugScreen';

const App: React.FC = () => {
  const { 
    currentScreen, 
    refreshWalletState, 
    isLoading, 
    error,
    setError 
  } = useWalletStore();

  const [showDebug, setShowDebug] = React.useState(false);

  useEffect(() => {
    // Check if wallet exists and initialize
    const initializeWallet = () => {
      const stored = localStorage.getItem('lola_wallet_encrypted');
      const hasWallet = !!stored;
      
      useWalletStore.setState({
        isLoading: false,
        hasWallet,
        isUnlocked: false,
        currentScreen: hasWallet ? 'setup' : 'setup', // Always start with setup for unlock/create
        supportedChains: [
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 1 },
          { id: 'polygon', name: 'Polygon', symbol: 'MATIC', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 137 },
          { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 56 },
          { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ETH', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 42161 },
          { id: 'optimism', name: 'Optimism', symbol: 'ETH', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 10 },
          { id: 'avalanche', name: 'Avalanche C-Chain', symbol: 'AVAX', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 43114 },
          { id: 'fantom', name: 'Fantom Opera', symbol: 'FTM', decimals: 18, rpcUrl: '', explorerUrl: '', type: 'evm', chainId: 250 },
          { id: 'solana', name: 'Solana', symbol: 'SOL', decimals: 9, rpcUrl: '', explorerUrl: '', type: 'solana', cluster: 'mainnet-beta' },
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', decimals: 8, rpcUrl: '', explorerUrl: '', type: 'bitcoin', network: 'mainnet' }
        ],
        error: null
      });
    };
    
    initializeWallet();
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'setup':
        return <SetupScreen />;
      case 'home':
        return <HomeScreen />;
      case 'send':
        return <SendScreen />;
      case 'receive':
        return <ReceiveScreen />;
      case 'buy':
        return <BuyScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <SetupScreen />;
    }
  };

  // Show debug screen if stuck loading for too long
  if (showDebug) {
    return <DebugScreen />;
  }

  if (isLoading && currentScreen === 'setup') {
    return (
      <Layout showHeader={false}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading Lola Wallet...</p>
          <button 
            onClick={() => {
              console.log('Force refresh clicked');
              setError(null);
              refreshWalletState();
            }}
            className="debug-button"
          >
            Retry
          </button>
          <button 
            onClick={() => {
              console.log('Manual debug mode activated');
              setShowDebug(true);
            }}
            className="debug-button secondary"
          >
            Debug Mode
          </button>
          {error && (
            <div className="error-details">
              <p>Error: {error}</p>
              <small>Check browser console for details</small>
            </div>
          )}
        </div>

        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #64748b;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-screen p {
            margin: 0;
            font-size: 14px;
          }

          .debug-button {
            margin-top: 16px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }

          .debug-button:hover {
            background: #2563eb;
          }

          .debug-button.secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .debug-button.secondary:hover {
            background: #e5e7eb;
          }

          .error-details {
            margin-top: 16px;
            padding: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            color: #dc2626;
            font-size: 12px;
            text-align: left;
          }

          .error-details p {
            margin: 0 0 4px 0;
            font-weight: 600;
          }

          .error-details small {
            color: #991b1b;
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <>
      {currentScreen === 'setup' ? (
        renderScreen()
      ) : (
        <Layout>
          {renderScreen()}
        </Layout>
      )}

      {/* Global Error Toast */}
      {error && (
        <div className="error-toast">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="error-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f8fafc;
          color: #1a202c;
        }

        #root {
          width: 360px;
          height: 600px;
          overflow: hidden;
        }

        .error-toast {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 1000;
          animation: slideDown 0.3s ease-out;
        }

        .error-content {
          display: flex;
          align-items: center;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          margin-right: 8px;
          font-size: 16px;
        }

        .error-message {
          flex: 1;
          font-size: 14px;
          color: #dc2626;
        }

        .error-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #dc2626;
          margin-left: 8px;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}