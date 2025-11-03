# 🔍 Address Generation Debug Guide

## 🚨 **Issue**: No addresses showing in wallet

## 🛠️ **Debug Steps**

### **1. Refresh Extension**
- Go to `chrome://extensions/`
- Click refresh on Lola Wallet
- Open the extension

### **2. Check Browser Console**
- Right-click Lola Wallet extension icon
- Select "Inspect popup"
- Open Console tab
- Look for these messages:
  ```
  Generating accounts for chains: [...]
  ethereum address: 0x...
  solana address: Sol...
  bitcoin address: bc1q...
  Final accounts array: [...]
  ```

### **3. Test Address Generation**
1. **Create/Import Wallet**
2. **Unlock with password**
3. **Check console logs** - should see address generation
4. **Look at home screen** - should show debug info

### **4. Expected Behavior**
- **Loading accounts...** → **Real addresses appear**
- **Debug info shows**: "Accounts loaded: 9" (for 9 chains)
- **Each chain shows**: Real address (0x... for Ethereum, etc.)

### **5. If Still No Addresses**

#### **Check Session Storage**
In console, run:
```javascript
console.log('Session password:', sessionStorage.getItem('temp_password'));
console.log('Wallet data:', localStorage.getItem('lola_wallet_encrypted'));
```

#### **Manual Address Test**
In console, run:
```javascript
// Test address generation
import('../utils/crypto-utils').then(({ CryptoUtils }) => {
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const ethAddress = CryptoUtils.deriveEthereumAddress(testMnemonic);
  console.log('Test Ethereum address:', ethAddress);
});
```

## 🔧 **Common Issues & Fixes**

### **Issue**: "No session password found"
**Fix**: 
1. Lock wallet (Settings → Lock Wallet)
2. Unlock again with password
3. This refreshes the session password

### **Issue**: "Error loading address"
**Fix**: 
1. Check console for specific error
2. Usually crypto library import issue
3. Try refreshing extension

### **Issue**: Accounts array is empty
**Fix**:
1. Check if `supportedChains` is populated
2. Verify mnemonic decryption works
3. Check crypto utilities import

## 🎯 **Expected Console Output**
```
Generating accounts for chains: ["ethereum", "polygon", "solana", "bitcoin", ...]
ethereum address: 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87
polygon address: 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87
solana address: Sol1234567890abcdef...
bitcoin address: bc1q1234567890abcdef...
Added account for ethereum: {address: "0x...", chainId: "ethereum", balance: "0"}
Final accounts array: [{...}, {...}, ...]
```

## 🚀 **Quick Fix**
If addresses still don't show:
1. **Refresh extension**
2. **Create new wallet** (test with fresh state)
3. **Check console immediately** after unlock
4. **Look for error messages**

The addresses should generate automatically when you unlock the wallet. If they don't appear, the console logs will show exactly what's failing.

---

**Try refreshing the extension and check the console - you should see the address generation process!** 🦋