import React, { useState } from 'react';
import { useWalletStore } from '../store/wallet-store';

export const BuyScreen: React.FC = () => {
  const { 
    accounts, 
    currentChain, 
    supportedChains, 
    setCurrentScreen 
  } = useWalletStore();

  const [selectedProvider, setSelectedProvider] = useState<'moonpay' | 'ramp' | 'transak'>('moonpay');
  const [amount, setAmount] = useState('100');

  const currentAccount = accounts.find(acc => acc.chainId === currentChain);
  const currentChainConfig = supportedChains.find(chain => chain.id === currentChain);

  const providers = [
    {
      id: 'moonpay' as const,
      name: 'MoonPay',
      description: 'Buy crypto with credit card or bank transfer',
      fees: '3.5% + network fees',
      logo: '🌙'
    },
    {
      id: 'ramp' as const,
      name: 'Ramp',
      description: 'Fast and secure crypto purchases',
      fees: '2.9% + network fees',
      logo: '🚀'
    },
    {
      id: 'transak' as const,
      name: 'Transak',
      description: 'Global fiat-to-crypto gateway',
      fees: '3.0% + network fees',
      logo: '💳'
    }
  ];

  const handleBuy = () => {
    if (!currentAccount) return;

    let url = '';
    
    switch (selectedProvider) {
      case 'moonpay':
        const moonpayParams = new URLSearchParams({
          apiKey: 'pk_test_123', // Replace with actual API key
          walletAddress: currentAccount.address,
          currencyCode: currentChainConfig?.symbol || 'ETH',
          baseCurrencyAmount: amount,
          baseCurrencyCode: 'USD',
          redirectURL: window.location.origin
        });
        url = `https://buy.moonpay.com?${moonpayParams.toString()}`;
        break;
        
      case 'ramp':
        const rampParams = new URLSearchParams({
          hostApiKey: 'your_ramp_api_key', // Replace with actual API key
          userAddress: currentAccount.address,
          swapAsset: `${currentChainConfig?.symbol}_${currentChainConfig?.symbol}`,
          fiatCurrency: 'USD',
          fiatValue: amount
        });
        url = `https://app.ramp.network?${rampParams.toString()}`;
        break;
        
      case 'transak':
        const transakParams = new URLSearchParams({
          apiKey: 'your_transak_api_key', // Replace with actual API key
          walletAddress: currentAccount.address,
          defaultCryptoCurrency: currentChainConfig?.symbol || 'ETH',
          defaultFiatAmount: amount,
          defaultFiatCurrency: 'USD',
          redirectURL: window.location.origin
        });
        url = `https://global.transak.com?${transakParams.toString()}`;
        break;
    }
    
    if (url) {
      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Please configure API keys for on-ramp providers');
    }
  };

  const supportedAssets = [
    { symbol: 'ETH', name: 'Ethereum', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'] },
    { symbol: 'BTC', name: 'Bitcoin', chains: ['bitcoin'] },
    { symbol: 'SOL', name: 'Solana', chains: ['solana'] },
    { symbol: 'MATIC', name: 'Polygon', chains: ['polygon'] },
    { symbol: 'BNB', name: 'BNB', chains: ['bsc'] },
    { symbol: 'AVAX', name: 'Avalanche', chains: ['avalanche'] },
    { symbol: 'FTM', name: 'Fantom', chains: ['fantom'] }
  ];

  const currentAsset = supportedAssets.find(asset => 
    asset.chains.includes(currentChain)
  );

  return (
    <div className="buy-screen">
      <div className="header">
        <button 
          onClick={() => setCurrentScreen('home')}
          className="back-button"
        >
          ← Back
        </button>
        <h1>Buy Crypto</h1>
      </div>

      <div className="buy-card">
        {/* Current Chain Info */}
        <div className="chain-info">
          <div className="chain-icon">
            {currentChainConfig?.symbol === 'ETH' ? '⟠' : 
             currentChainConfig?.symbol === 'BTC' ? '₿' :
             currentChainConfig?.symbol === 'SOL' ? '◎' : '●'}
          </div>
          <div className="chain-details">
            <div className="chain-name">{currentChainConfig?.name}</div>
            <div className="asset-name">
              Buy {currentAsset?.name || currentChainConfig?.symbol}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="amount-section">
          <label>Amount (USD)</label>
          <div className="amount-input-group">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="amount-input"
              min="10"
              max="10000"
            />
          </div>
          <div className="amount-presets">
            {['50', '100', '250', '500'].map(preset => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`preset-button ${amount === preset ? 'active' : ''}`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Selection */}
        <div className="provider-section">
          <label>Choose Provider</label>
          <div className="provider-list">
            {providers.map(provider => (
              <div
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`provider-card ${selectedProvider === provider.id ? 'selected' : ''}`}
              >
                <div className="provider-header">
                  <div className="provider-logo">{provider.logo}</div>
                  <div className="provider-info">
                    <div className="provider-name">{provider.name}</div>
                    <div className="provider-fees">Fees: {provider.fees}</div>
                  </div>
                  <div className="selection-indicator">
                    {selectedProvider === provider.id ? '●' : '○'}
                  </div>
                </div>
                <div className="provider-description">
                  {provider.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Address */}
        {currentAccount && (
          <div className="destination-section">
            <label>Destination Address</label>
            <div className="address-display">
              <span className="address-text">
                {currentAccount.address.slice(0, 10)}...{currentAccount.address.slice(-8)}
              </span>
              <span className="address-network">
                {currentChainConfig?.name}
              </span>
            </div>
          </div>
        )}

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={!currentAccount || !amount || parseFloat(amount) < 10}
          className="buy-button"
        >
          Buy ${amount} of {currentAsset?.symbol || currentChainConfig?.symbol}
        </button>

        {/* Disclaimer */}
        <div className="disclaimer">
          <div className="disclaimer-icon">ℹ️</div>
          <div className="disclaimer-text">
            <p><strong>Important:</strong></p>
            <ul>
              <li>You'll be redirected to {providers.find(p => p.id === selectedProvider)?.name} to complete your purchase</li>
              <li>Lola Wallet doesn't store your payment information</li>
              <li>Processing times vary by provider and payment method</li>
              <li>Additional verification may be required for larger amounts</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .buy-screen {
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

        .buy-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .chain-info {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .chain-icon {
          font-size: 32px;
          margin-right: 16px;
        }

        .chain-details {
          flex: 1;
        }

        .chain-name {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .asset-name {
          font-size: 14px;
          color: #64748b;
        }

        .amount-section {
          margin-bottom: 24px;
        }

        .amount-section label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .amount-input-group {
          position: relative;
          margin-bottom: 12px;
        }

        .currency-symbol {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          font-weight: 600;
          color: #64748b;
        }

        .amount-input {
          width: 100%;
          padding: 16px 16px 16px 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .amount-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .amount-presets {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .preset-button {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .preset-button:hover {
          border-color: #3b82f6;
        }

        .preset-button.active {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #3b82f6;
        }

        .provider-section {
          margin-bottom: 24px;
        }

        .provider-section label {
          display: block;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .provider-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .provider-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .provider-card:hover {
          border-color: #3b82f6;
        }

        .provider-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .provider-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .provider-logo {
          font-size: 24px;
          margin-right: 12px;
        }

        .provider-info {
          flex: 1;
        }

        .provider-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 2px;
        }

        .provider-fees {
          font-size: 12px;
          color: #64748b;
        }

        .selection-indicator {
          font-size: 18px;
          color: #3b82f6;
        }

        .provider-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
        }

        .destination-section {
          margin-bottom: 24px;
        }

        .destination-section label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .address-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .address-text {
          font-family: monospace;
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
        }

        .address-network {
          font-size: 12px;
          color: #64748b;
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .buy-button {
          width: 100%;
          background: #059669;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 20px;
        }

        .buy-button:hover:not(:disabled) {
          background: #047857;
        }

        .buy-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .disclaimer {
          display: flex;
          align-items: flex-start;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 16px;
        }

        .disclaimer-icon {
          font-size: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .disclaimer-text {
          font-size: 14px;
          color: #0c4a6e;
          line-height: 1.4;
        }

        .disclaimer-text p {
          margin: 0 0 8px 0;
          font-weight: 600;
        }

        .disclaimer-text ul {
          margin: 0;
          padding-left: 16px;
        }

        .disclaimer-text li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};