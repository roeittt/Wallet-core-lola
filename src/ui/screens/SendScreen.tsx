import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../store/wallet-store';
import { messaging } from '../utils/messaging';

export const SendScreen: React.FC = () => {
  const { 
    accounts, 
    currentChain, 
    supportedChains, 
    setCurrentScreen,
    isLoading,
    setLoading,
    setError 
  } = useWalletStore();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [estimatedFee, setEstimatedFee] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [isSending, setIsSending] = useState(false);

  const currentAccount = accounts.find(acc => acc.chainId === currentChain);
  const currentChainConfig = supportedChains.find(chain => chain.id === currentChain);

  useEffect(() => {
    if (recipient && amount && currentAccount) {
      estimateFee();
    }
  }, [recipient, amount, currentAccount]);

  const estimateFee = async () => {
    if (!recipient || !amount || !currentAccount) return;

    setIsEstimating(true);
    try {
      const result = await messaging.estimateFee(currentChain, recipient, amount);
      setEstimatedFee(result.fee);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      setEstimatedFee('');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSend = async () => {
    if (!recipient || !amount || !currentAccount) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await messaging.sendTransaction(currentChain, recipient, amount);
      setTxHash(result.txHash);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(6);
  };

  const isValidAmount = () => {
    if (!amount || !currentAccount) return false;
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(currentAccount.balance);
    return amountNum > 0 && amountNum <= balanceNum;
  };

  const setMaxAmount = () => {
    if (currentAccount) {
      const balance = parseFloat(currentAccount.balance);
      const fee = parseFloat(estimatedFee) || 0;
      const maxAmount = Math.max(0, balance - fee);
      setAmount(maxAmount.toString());
    }
  };

  if (txHash) {
    return (
      <div className="send-screen">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Transaction Sent</h2>
          <p>Your transaction has been broadcast to the network</p>
          
          <div className="tx-details">
            <div className="detail-row">
              <span>Transaction Hash:</span>
              <span className="tx-hash">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>{amount} {currentChainConfig?.symbol}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span className="address">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
            </div>
          </div>

          <div className="button-group">
            <button 
              onClick={() => {
                setTxHash('');
                setRecipient('');
                setAmount('');
                setEstimatedFee('');
              }}
              className="secondary-button"
            >
              Send Another
            </button>
            <button 
              onClick={() => setCurrentScreen('home')}
              className="primary-button"
            >
              Done
            </button>
          </div>
        </div>

        <style jsx>{`
          .success-card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .success-card h2 {
            margin: 0 0 8px 0;
            color: #059669;
            font-size: 24px;
          }

          .success-card p {
            color: #64748b;
            margin: 0 0 24px 0;
          }

          .tx-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }

          .detail-row:last-child {
            margin-bottom: 0;
          }

          .tx-hash, .address {
            font-family: monospace;
            color: #3b82f6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="send-screen">
      <div className="header">
        <button 
          onClick={() => setCurrentScreen('home')}
          className="back-button"
        >
          ← Back
        </button>
        <h1>Send {currentChainConfig?.symbol}</h1>
      </div>

      <div className="send-form">
        {/* Balance Display */}
        {currentAccount && (
          <div className="balance-info">
            <div className="balance-label">Available Balance</div>
            <div className="balance-amount">
              {formatBalance(currentAccount.balance)} {currentChainConfig?.symbol}
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={`Enter ${currentChainConfig?.name} address`}
            className="form-input"
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label>
            Amount
            <button 
              onClick={setMaxAmount}
              className="max-button"
              type="button"
            >
              MAX
            </button>
          </label>
          <div className="amount-input-group">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="form-input"
              step="any"
            />
            <span className="currency-label">{currentChainConfig?.symbol}</span>
          </div>
        </div>

        {/* Fee Estimation */}
        {estimatedFee && (
          <div className="fee-info">
            <div className="fee-row">
              <span>Estimated Fee:</span>
              <span>
                {isEstimating ? 'Calculating...' : `${estimatedFee} ${currentChainConfig?.symbol}`}
              </span>
            </div>
            <div className="fee-row total">
              <span>Total:</span>
              <span>
                {(parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(6)} {currentChainConfig?.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!recipient || !amount || !isValidAmount() || isSending}
          className="send-button"
        >
          {isSending ? 'Sending...' : 'Send Transaction'}
        </button>

        {/* Validation Messages */}
        {amount && !isValidAmount() && (
          <div className="error-message">
            {parseFloat(amount) > parseFloat(currentAccount?.balance || '0') 
              ? 'Insufficient balance' 
              : 'Invalid amount'}
          </div>
        )}
      </div>

      <style jsx>{`
        .send-screen {
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

        .send-form {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .balance-info {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: center;
        }

        .balance-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .balance-amount {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .max-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .amount-input-group {
          position: relative;
        }

        .currency-label {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #64748b;
          font-weight: 500;
        }

        .fee-info {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .fee-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .fee-row:last-child {
          margin-bottom: 0;
        }

        .fee-row.total {
          font-weight: 600;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 8px;
        }

        .send-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-top: 16px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
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

        .primary-button:hover {
          background: #2563eb;
        }

        .secondary-button {
          flex: 1;
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