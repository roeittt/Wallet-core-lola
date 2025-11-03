import React from 'react';
import { useWalletStore } from '../store/wallet-store';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true, 
  title = 'Lola Wallet' 
}) => {
  const { lockWallet, isUnlocked } = useWalletStore();

  const handleLock = async () => {
    try {
      await lockWallet();
    } catch (error) {
      console.error('Failed to lock wallet:', error);
    }
  };

  return (
    <div className="wallet-layout">
      {showHeader && (
        <header className="wallet-header">
          <h1 className="wallet-title">{title}</h1>
          {isUnlocked && (
            <button 
              onClick={handleLock}
              className="lock-button"
              title="Lock Wallet"
            >
              🔒
            </button>
          )}
        </header>
      )}
      
      <main className="wallet-main">
        {children}
      </main>

      <style jsx>{`
        .wallet-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #1a202c;
        }

        .wallet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .wallet-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: white;
        }

        .lock-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: white;
          transition: background-color 0.2s;
        }

        .lock-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .wallet-main {
          flex: 1;
          overflow-y: auto;
          background: white;
          border-radius: 16px 16px 0 0;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};