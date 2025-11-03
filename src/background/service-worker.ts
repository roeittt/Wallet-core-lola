import { MessageHandler } from './messaging/message-handler';
import { BackgroundMessage } from '@shared/types';

/**
 * Background Service Worker (Manifest V3)
 * SECURITY: All cryptographic operations handled by keyring using Trust Wallet Core
 * Network operations handled by chain adapters
 */

let messageHandler: MessageHandler;

// Initialize message handler
function initializeMessageHandler() {
  if (!messageHandler) {
    messageHandler = new MessageHandler();
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Lola Wallet installed:', details.reason);
  initializeMessageHandler();
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Lola Wallet started');
  initializeMessageHandler();
});

// Handle messages from UI and content scripts
chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  // Handle simple ping for connectivity testing
  if (message.type === 'PING') {
    sendResponse({ success: true, data: { pong: true, timestamp: Date.now() } });
    return;
  }
  
  // Initialize handler if not already done
  initializeMessageHandler();
  
  // Handle message asynchronously
  messageHandler.handleMessage(message)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Message handling error:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error',
        requestId: message.requestId
      });
    });
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

// Handle external connections (for dApp integration)
chrome.runtime.onConnect.addListener((port) => {
  console.log('External connection established:', port.name);
  
  port.onMessage.addListener(async (message: BackgroundMessage) => {
    initializeMessageHandler();
    
    try {
      const response = await messageHandler.handleMessage(message);
      port.postMessage(response);
    } catch (error) {
      port.postMessage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId
      });
    }
  });
  
  port.onDisconnect.addListener(() => {
    console.log('External connection disconnected');
  });
});

// Handle alarm events (for periodic tasks)
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  switch (alarm.name) {
    case 'auto-lock':
      // Auto-lock wallet after inactivity
      initializeMessageHandler();
      messageHandler.handleMessage({
        type: 'LOCK_WALLET'
      });
      break;
    
    case 'balance-refresh':
      // Refresh balances periodically
      console.log('Refreshing balances...');
      break;
  }
});

// Set up periodic alarms
chrome.alarms.create('balance-refresh', {
  delayInMinutes: 1,
  periodInMinutes: 5 // Refresh every 5 minutes
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes, namespace);
  
  // Handle wallet state changes
  if (changes.wallet_state) {
    console.log('Wallet state changed:', changes.wallet_state.newValue);
  }
});

// Handle tab updates (for dApp detection)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script for dApp interaction
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script/injected.js']
      }).catch(error => {
        // Ignore errors for pages that don't allow script injection
        console.debug('Script injection failed:', error);
      });
    }
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { messageHandler };
}

console.log('Lola Wallet background service worker loaded');