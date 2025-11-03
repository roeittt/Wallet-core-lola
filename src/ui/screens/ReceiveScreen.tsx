import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../store/wallet-store';
import QRCode from 'qrcode';

export const ReceiveScreen: React.FC = () => {
  const { 
    accounts, 
    currentChain, 
    supportedChains, 
    setCurrentScreen 
  } = useWalletStore();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const currentAccount = accounts.find(acc => acc.chainId === currentChain);
  const currentChainConfig = supportedChains.find(chain => chain.id === currentChain);

  useEffect(() => {
    if (currentAccount?.address) {
      generateQRCode(currentAccount.address);
    }
  }, [currentAccount]);

  const generateQRCode = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1a202c',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const copyAddress = async () => {
    if (currentAccount?.address) {
      try {
        await navigator.clipboard.writeText(currentAccount.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (!currentAccount) {
    return (
      <div className="receive-screen">
        <div className="header">
          <button 
            onClick={() => setCurrentScreen('home')}
            className="back-button"
          >
            ← Back
          </button>
          <h1>Receive</h1>
        </div>
        
        <div className="error-card">
          <p>No account found for {currentChainConfig?.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="receive-screen">
      <div className="header">
        <button 
          onClick={() => setCurrentScreen('home')}
          className="back-button"
        >
          ← Back
        </button>
        <h1>Receive {currentChainConfig?.symbol}</h1>
      </div>

      <div className="receive-card">
        <div className="chain-info">
          <div className="chain-icon">
            {currentChainConfig?.symbol === 'ETH' ? '⟠' : 
             currentChainConfig?.symbol === 'BTC' ? '₿' :
             currentChainConfig?.symbol === 'SOL' ? '◎' : '●'}
          </div>
          <div className="chain-details">
            <div className="chain-name">{currentChainConfig?.name}</div>
            <div className="chain-network">
              {currentChainConfig?.isTestnet ? 'Testnet' : 'Mainnet'}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="qr-section">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Address QR Code" className="qr-code" />
          ) : (
            <div className="qr-placeholder">
              <div className="loading-spinner"></div>
              <p>Generating QR Code...</p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="address-section">
          <div className="address-label">Your {currentChainConfig?.name} Address</div>
          <div className="address-display">
            <div className="address-text">
              {formatAddress(currentAccount.address)}
            </div>
            <button 
              onClick={copyAddress}
              className="copy-button"
              title="Copy full address"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          
          <div className="full-address">
            {currentAccount.address}
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h3>How to receive {currentChainConfig?.symbol}</h3>
          <ul>
            <li>Share your address or QR code with the sender</li>
            <li>Make sure they're sending on the {currentChainConfig?.name} network</li>
            <li>Transactions may take a few minutes to appear</li>
            <li>Only send {currentChainConfig?.symbol} and compatible tokens to this address</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <strong>Important:</strong> Only send {currentChainConfig?.name} assets to this address. 
            Sending assets from other networks may result in permanent loss.
          </div>
        </div>
      </div>

      <style jsx>{`
        .receive-screen {
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

        .receive-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .error-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
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

        .chain-network {
          font-size: 14px;
          color: #64748b;
        }

        .qr-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .qr-code {
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .qr-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: #f8fafc;
          border-radius: 12px;
          color: #64748b;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .address-section {
          margin-bottom: 24px;
        }

        .address-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .address-display {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 8px;
        }

        .address-text {
          flex: 1;
          font-family: monospace;
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
        }

        .copy-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          margin-left: 12px;
          transition: background-color 0.2s;
        }

        .copy-button:hover {
          background: #2563eb;
        }

        .full-address {
          font-family: monospace;
          font-size: 12px;
          color: #64748b;
          word-break: break-all;
          line-height: 1.4;
        }

        .instructions {
          margin-bottom: 20px;
        }

        .instructions h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 12px 0;
        }

        .instructions ul {
          margin: 0;
          padding-left: 20px;
          color: #64748b;
        }

        .instructions li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
        }

        .warning {
          display: flex;
          align-items: flex-start;
          background: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
        }

        .warning-icon {
          font-size: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .warning-text {
          font-size: 14px;
          color: #92400e;
          line-height: 1.4;
        }

        .warning-text strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};