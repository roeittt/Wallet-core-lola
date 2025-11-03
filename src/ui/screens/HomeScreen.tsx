import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/wallet-store';

export const HomeScreen: React.FC = () => {
  const { 
    accounts, 
    currentChain, 
    supportedChains, 
    switchChain, 
    refreshAccounts,
    setCurrentScreen,
    isLoading 
  } = useWalletStore();

  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    refreshAccounts();
  }, [currentChain]);

  useEffect(() => {
    console.log('HomeScreen: useEffect triggered - accounts:', accounts.length, 'currentChain:', currentChain);
    
    if (accounts.length > 0) {
      const account = accounts.find(acc => acc.chainId === currentChain) || accounts[0];
      console.log('HomeScreen: Selected account for', currentChain, ':', account);
      setSelectedAccount(account);
    } else {
      console.log('HomeScreen: No accounts available');
      setSelectedAccount(null);
    }
  }, [accounts, currentChain]);

  const currentChainConfig = supportedChains.find(chain => chain.id === currentChain);
  const totalBalanceUSD = accounts.reduce((sum, acc) => sum + (acc.balanceUSD || 0), 0);

  const handleChainSwitch = async (chainId: string) => {
    console.log('HomeScreen: Chain switch requested to:', chainId);
    console.log('Current chain before switch:', currentChain);
    
    try {
      await switchChain(chainId);
      console.log('HomeScreen: Chain switch completed');
    } catch (error) {
      console.error('HomeScreen: Failed to switch chain:', error);
    }
  };

  const formatBalance = (balance: string, decimals: number = 4) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="home-screen">
      {/* Chain Selector */}
      <div className="chain-selector">
        <select 
          value={currentChain} 
          onChange={(e) => handleChainSwitch(e.target.value)}
          className="chain-select"
        >
          {supportedChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      {/* Portfolio Overview */}
      <div className="portfolio-section">
        <div className="portfolio-header">
          <h2>Portfolio</h2>
          <div className="header-buttons">
            <button 
              onClick={() => setCurrentScreen('settings')}
              className="settings-button"
              title="Settings"
            >
              ⚙️
            </button>
            <button 
              onClick={refreshAccounts}
              className="refresh-button"
              disabled={isLoading}
              title="Refresh"
            >
              {isLoading ? '⟳' : '↻'}
            </button>
          </div>
        </div>

        <div className="total-balance">
          <div className="balance-amount">
            ${totalBalanceUSD.toFixed(2)}
          </div>
          <div className="balance-label">Total Balance</div>
        </div>

        {selectedAccount ? (
          <div className="current-account">
            <div className="account-info">
              <div className="account-chain">
                {currentChainConfig?.name || currentChain}
              </div>
              <div className="account-address">
                {selectedAccount.address.length > 20 ? formatAddress(selectedAccount.address) : selectedAccount.address}
              </div>
            </div>
            <div className="account-balance">
              <div className="native-balance">
                {formatBalance(selectedAccount.balance)} {currentChainConfig?.symbol}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-account">
            <div className="loading-message">
              {accounts.length === 0 ? 'Loading accounts...' : 'No account for this chain'}
            </div>
            <div className="debug-info">
              <small>Accounts loaded: {accounts.length}</small>
              <br />
              <small>Current chain: {currentChain}</small>
              {accounts.length > 0 && (
                <>
                  <br />
                  <small>Available chains: {accounts.map(a => a.chainId).join(', ')}</small>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Token List */}
      <div className="tokens-section">
        <h3>Assets</h3>
        
        {/* Native Token */}
        {selectedAccount && (
          <div className="token-item">
            <div className="token-info">
              <div className="token-icon">
                {currentChainConfig?.symbol === 'ETH' ? '⟠' : 
                 currentChainConfig?.symbol === 'BTC' ? '₿' :
                 currentChainConfig?.symbol === 'SOL' ? '◎' : '●'}
              </div>
              <div className="token-details">
                <div className="token-name">{currentChainConfig?.name}</div>
                <div className="token-symbol">{currentChainConfig?.symbol}</div>
              </div>
            </div>
            <div className="token-balance">
              <div className="balance-amount">
                {formatBalance(selectedAccount.balance)}
              </div>
              <div className="balance-usd">
                ${(selectedAccount.balanceUSD || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* ERC-20/SPL Tokens */}
        {selectedAccount?.tokens?.map((token: any, index: number) => (
          <div key={index} className="token-item">
            <div className="token-info">
              <div className="token-icon">
                {token.logoUrl ? (
                  <img src={token.logoUrl} alt={token.symbol} />
                ) : (
                  <div className="token-placeholder">
                    {token.symbol.charAt(0)}
                  </div>
                )}
              </div>
              <div className="token-details">
                <div className="token-name">{token.name}</div>
                <div className="token-symbol">{token.symbol}</div>
              </div>
            </div>
            <div className="token-balance">
              <div className="balance-amount">
                {formatBalance(token.balance)}
              </div>
              <div className="balance-usd">
                ${(token.balanceUSD || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))}

        {(!selectedAccount?.tokens || selectedAccount.tokens.length === 0) && (
          <div className="no-tokens">
            <p>No tokens found</p>
            <small>Tokens will appear automatically when detected</small>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => setCurrentScreen('receive')}
          className="action-button receive"
        >
          <span className="action-icon">📥</span>
          Receive
        </button>
        <button 
          onClick={() => setCurrentScreen('send')}
          className="action-button send"
        >
          <span className="action-icon">📤</span>
          Send
        </button>
        <button 
          onClick={() => setCurrentScreen('buy')}
          className="action-button buy"
        >
          <span className="action-icon">💳</span>
          Buy
        </button>
      </div>

      <style jsx>{`
        .home-screen {
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .chain-selector {
          margin-bottom: 20px;
        }

        .chain-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .portfolio-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          color: white;
        }

        .portfolio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .portfolio-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-buttons {
          display: flex;
          gap: 8px;
        }

        .settings-button, .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 16px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .settings-button:hover, .refresh-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .total-balance {
          text-align: center;
          margin-bottom: 20px;
        }

        .balance-amount {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .balance-label {
          font-size: 14px;
          opacity: 0.8;
        }

        .current-account {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
        }

        .account-info {
          flex: 1;
        }

        .account-chain {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .account-address {
          font-size: 12px;
          opacity: 0.8;
          font-family: monospace;
        }

        .account-balance {
          text-align: right;
        }

        .native-balance {
          font-size: 16px;
          font-weight: 600;
        }

        .no-account {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .loading-message {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .debug-info {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.4;
        }

        .tokens-section {
          margin-bottom: 24px;
        }

        .tokens-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .token-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: background-color 0.2s;
        }

        .token-item:hover {
          background: #f8fafc;
        }

        .token-info {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .token-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 20px;
        }

        .token-icon img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .token-placeholder {
          font-size: 16px;
          font-weight: 600;
          color: #6b7280;
        }

        .token-details {
          flex: 1;
        }

        .token-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 2px;
        }

        .token-symbol {
          font-size: 14px;
          color: #64748b;
        }

        .token-balance {
          text-align: right;
        }

        .token-balance .balance-amount {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 2px;
        }

        .balance-usd {
          font-size: 14px;
          color: #64748b;
        }

        .no-tokens {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .no-tokens p {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .no-tokens small {
          font-size: 14px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
        }

        .action-button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .action-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .action-button.receive {
          color: #059669;
        }

        .action-button.send {
          color: #dc2626;
        }

        .action-button.buy {
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
};