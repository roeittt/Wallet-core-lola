# 🔑 API Setup Guide - Lola Wallet

## Required API Keys for Full Functionality

### 🌐 **Blockchain RPC Endpoints**

#### Alchemy (Recommended)
1. Go to [alchemy.com](https://alchemy.com)
2. Create free account
3. Create apps for:
   - Ethereum Mainnet
   - Polygon Mainnet  
   - Arbitrum One
   - Optimism Mainnet
4. Copy API keys and update `src/ui/utils/api-config.ts`

#### Alternative: Infura
1. Go to [infura.io](https://infura.io)
2. Create project
3. Get endpoint URLs

### 💳 **On-Ramp Providers**

#### MoonPay
1. Go to [moonpay.com/developers](https://www.moonpay.com/developers)
2. Create account and get API key
3. Update `ONRAMP_KEYS.moonpay` in api-config.ts

#### Ramp Network
1. Go to [ramp.network](https://ramp.network)
2. Apply for API access
3. Get Host API Key
4. Update `ONRAMP_KEYS.ramp` in api-config.ts

#### Transak
1. Go to [transak.com](https://transak.com)
2. Create developer account
3. Get API key
4. Update `ONRAMP_KEYS.transak` in api-config.ts

### 📊 **Price Data (Optional)**

#### CoinGecko
1. Go to [coingecko.com/api](https://www.coingecko.com/en/api)
2. Get free API key for higher rate limits
3. Update `PRICE_API.apiKey` in api-config.ts

## 🛠️ **Configuration Steps**

### 1. Update API Configuration
Edit `src/ui/utils/api-config.ts`:

```typescript
export const API_CONFIG = {
  RPC_ENDPOINTS: {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_KEY',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_KEY',
    // ... other endpoints
  },
  
  ONRAMP_KEYS: {
    moonpay: 'pk_live_YOUR_ACTUAL_MOONPAY_KEY',
    ramp: 'YOUR_ACTUAL_RAMP_KEY',
    transak: 'YOUR_ACTUAL_TRANSAK_KEY'
  }
};
```

### 2. Update Blockchain Service
The `BlockchainService` will automatically use your configured endpoints.

### 3. Update Buy Screen
The buy screen will use your on-ramp API keys for proper integration.

### 4. Rebuild Extension
```bash
cd src
npm run build
cp manifest.json ../dist/
```

### 5. Refresh Extension
- Go to `chrome://extensions/`
- Click refresh on Lola Wallet

## 🆓 **Free Tier Limits**

### Alchemy Free Tier
- 300M compute units/month
- Sufficient for personal use

### MoonPay
- Sandbox mode for testing
- Production requires KYC

### Ramp Network
- Test mode available
- Production requires approval

### CoinGecko
- 50 calls/minute without API key
- 500 calls/minute with free API key

## 🧪 **Testing Without API Keys**

The wallet will work with:
- ✅ **Wallet creation/import** (works offline)
- ✅ **Address generation** (works offline)  
- ✅ **UI navigation** (works offline)
- ⚠️ **Balance fetching** (will show 0 or errors)
- ⚠️ **Transaction broadcasting** (will fail)
- ⚠️ **Buy integration** (will show error)

## 🔒 **Security Notes**

- Never commit API keys to version control
- Use environment variables in production
- Rotate keys regularly
- Use testnet keys for development

## 📞 **Support**

If you need help getting API keys:
1. Check provider documentation
2. Most offer free tiers for development
3. Some require business verification for production

---

**The wallet is fully functional once API keys are configured!** 🦋