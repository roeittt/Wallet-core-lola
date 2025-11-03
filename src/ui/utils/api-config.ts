/**
 * API Configuration for blockchain services and on-ramp providers
 * Replace these with your actual API keys
 */

export const API_CONFIG = {
  // Blockchain RPC Endpoints (replace with your API keys)
  RPC_ENDPOINTS: {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    bsc: 'https://bsc-dataseed1.binance.org',
    arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    optimism: 'https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ftm.tools',
    solana: 'https://api.mainnet-beta.solana.com',
    bitcoin: 'https://blockstream.info/api'
  },

  // On-ramp Provider API Keys
  ONRAMP_KEYS: {
    moonpay: 'pk_test_YOUR_MOONPAY_KEY',
    ramp: 'YOUR_RAMP_HOST_API_KEY',
    transak: 'YOUR_TRANSAK_API_KEY'
  },

  // Price API
  PRICE_API: {
    coingecko: 'https://api.coingecko.com/api/v3',
    apiKey: 'YOUR_COINGECKO_API_KEY' // Optional for higher rate limits
  }
};

/**
 * Initialize API configuration
 * Call this to set up your API keys
 */
export function initializeAPIConfig(config: Partial<typeof API_CONFIG>) {
  Object.assign(API_CONFIG, config);
}

/**
 * Check if API keys are configured
 */
export function checkAPIConfiguration(): {
  hasRPCKeys: boolean;
  hasOnrampKeys: boolean;
  hasPriceAPI: boolean;
  missingKeys: string[];
} {
  const missingKeys: string[] = [];
  
  // Check RPC endpoints
  const hasRPCKeys = !Object.values(API_CONFIG.RPC_ENDPOINTS).some(url => 
    url.includes('YOUR_') || url.includes('demo')
  );
  
  if (!hasRPCKeys) {
    missingKeys.push('RPC endpoints (Alchemy, Infura, etc.)');
  }
  
  // Check on-ramp keys
  const hasOnrampKeys = !Object.values(API_CONFIG.ONRAMP_KEYS).some(key => 
    key.includes('YOUR_')
  );
  
  if (!hasOnrampKeys) {
    missingKeys.push('On-ramp provider keys (MoonPay, Ramp, Transak)');
  }
  
  // Check price API
  const hasPriceAPI = !API_CONFIG.PRICE_API.apiKey?.includes('YOUR_');
  
  if (!hasPriceAPI) {
    missingKeys.push('Price API key (CoinGecko)');
  }
  
  return {
    hasRPCKeys,
    hasOnrampKeys,
    hasPriceAPI,
    missingKeys
  };
}