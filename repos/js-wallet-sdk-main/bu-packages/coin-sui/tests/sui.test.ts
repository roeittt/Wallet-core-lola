import {
  CalcTxHashParams,
  DerivePriKeyParams,
  GetDerivedPathParam,
  NewAddressParams,
  SignCommonMsgParams,
  SignTxParams,
  base,
} from '@okxweb3/coin-base';
import {
  Ed25519Keypair,
  PaySuiTransaction,
  SuiObjectRef,
  SuiSignData,
  SuiWallet,
  encodeSuiPrivateKey,
  getAddressFromPrivate,
  getAddressFromPublic,
  tryDecodeSuiPrivateKey,
} from '../src';

describe('SuiWallet comprehensive tests', () => {
  let wallet: SuiWallet;
  const validPrivateKey =
    '31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a';
  const validSuiPrivateKey =
    'suiprivkey1qqcngtcyr3d4gdvqwj690y33ez3sp0n9u6ralupqh3mhjkvtg2yh5ky0e6g';
  const validMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeEach(() => {
    wallet = new SuiWallet();
  });

  describe('getDerivedPath', () => {
    it('should return correct derived path for index 0', async () => {
      const param: GetDerivedPathParam = { index: 0 };
      const path = await wallet.getDerivedPath(param);
      expect(path).toBe("m/44'/784'/0'/0'/0'");
    });

    it('should return correct derived path for different indices', async () => {
      const testCases = [
        { index: 1, expected: "m/44'/784'/1'/0'/0'" },
        { index: 5, expected: "m/44'/784'/5'/0'/0'" },
        { index: 10, expected: "m/44'/784'/10'/0'/0'" },
        { index: 100, expected: "m/44'/784'/100'/0'/0'" },
      ];

      for (const testCase of testCases) {
        const path = await wallet.getDerivedPath({ index: testCase.index });
        expect(path).toBe(testCase.expected);
      }
    });

    it('should handle large index values', async () => {
      const param: GetDerivedPathParam = { index: 2147483647 }; // Max 32-bit signed integer
      const path = await wallet.getDerivedPath(param);
      expect(path).toBe("m/44'/784'/2147483647'/0'/0'");
    });
  });

  describe('getRandomPrivateKey', () => {
    it('should generate a valid private key', async () => {
      const privateKey = await wallet.getRandomPrivateKey();
      expect(typeof privateKey).toBe('string');
      expect(privateKey).toMatch(/^suiprivkey1[a-z0-9]+$/);
    });

    it('should generate different private keys on multiple calls', async () => {
      const key1 = await wallet.getRandomPrivateKey();
      const key2 = await wallet.getRandomPrivateKey();
      const key3 = await wallet.getRandomPrivateKey();

      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
    });

    it('should generate valid private keys that can create addresses', async () => {
      const privateKey = await wallet.getRandomPrivateKey();
      const address = await wallet.getNewAddress({ privateKey });

      expect(address.address).toMatch(/^0x[a-f0-9]{64}$/);
      expect(address.publicKey).toBeDefined();
      expect(typeof address.publicKey).toBe('string');
    });

    it('should generate valid private keys that pass validation', async () => {
      const privateKey = await wallet.getRandomPrivateKey();
      const validation = await wallet.validPrivateKey({ privateKey });

      expect(validation.isValid).toBe(true);
      expect(validation.privateKey).toBe(privateKey);
    });
  });

  describe('getDerivedPrivateKey', () => {
    it('should derive private key from mnemonic successfully', async () => {
      const hdPath = await wallet.getDerivedPath({ index: 0 });
      const param: DerivePriKeyParams = {
        mnemonic: validMnemonic,
        hdPath: hdPath,
      };

      const privateKey = await wallet.getDerivedPrivateKey(param);
      expect(typeof privateKey).toBe('string');
      expect(privateKey).toMatch(/^suiprivkey1[a-z0-9]+$/);
    });

    it('should derive consistent private keys from same mnemonic and path', async () => {
      const hdPath = await wallet.getDerivedPath({ index: 0 });
      const param: DerivePriKeyParams = {
        mnemonic: validMnemonic,
        hdPath: hdPath,
      };

      const privateKey1 = await wallet.getDerivedPrivateKey(param);
      const privateKey2 = await wallet.getDerivedPrivateKey(param);

      expect(privateKey1).toBe(privateKey2);
    });

    it('should derive different private keys for different indices', async () => {
      const hdPath0 = await wallet.getDerivedPath({ index: 0 });
      const hdPath1 = await wallet.getDerivedPath({ index: 1 });

      const privateKey0 = await wallet.getDerivedPrivateKey({
        mnemonic: validMnemonic,
        hdPath: hdPath0,
      });

      const privateKey1 = await wallet.getDerivedPrivateKey({
        mnemonic: validMnemonic,
        hdPath: hdPath1,
      });

      expect(privateKey0).not.toBe(privateKey1);
    });

    it('should generate valid derived private keys', async () => {
      const hdPath = await wallet.getDerivedPath({ index: 0 });
      const privateKey = await wallet.getDerivedPrivateKey({
        mnemonic: validMnemonic,
        hdPath: hdPath,
      });

      const validation = await wallet.validPrivateKey({ privateKey });
      expect(validation.isValid).toBe(true);

      const address = await wallet.getNewAddress({ privateKey });
      expect(address.address).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should reject invalid mnemonic', async () => {
      const hdPath = await wallet.getDerivedPath({ index: 0 });
      const param: DerivePriKeyParams = {
        mnemonic: 'invalid mnemonic phrase',
        hdPath: hdPath,
      };

      await expect(wallet.getDerivedPrivateKey(param)).rejects.toBeTruthy();
    });
  });

  describe('getNewAddress', () => {
    it('should generate address from hex private key', async () => {
      const param: NewAddressParams = {
        privateKey: validPrivateKey,
      };

      const result = await wallet.getNewAddress(param);
      expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.publicKey).toBeDefined();
      expect(typeof result.publicKey).toBe('string');
    });

    it('should generate address from Sui-encoded private key', async () => {
      const param: NewAddressParams = {
        privateKey: validSuiPrivateKey,
      };

      const result = await wallet.getNewAddress(param);
      expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.publicKey).toBeDefined();
    });

    it('should generate same address from equivalent private key formats', async () => {
      const hexResult = await wallet.getNewAddress({
        privateKey: validPrivateKey,
      });
      const suiResult = await wallet.getNewAddress({
        privateKey: validSuiPrivateKey,
      });

      expect(hexResult.address).toBe(suiResult.address);
      expect(hexResult.publicKey).toBe(suiResult.publicKey);
    });

    it('should handle uppercase hex private keys', async () => {
      const uppercaseKey = validPrivateKey.toUpperCase();
      const result = await wallet.getNewAddress({ privateKey: uppercaseKey });

      expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.publicKey).toBeDefined();
    });

    it('should handle private keys with 0x prefix', async () => {
      const prefixedKey = '0x' + validPrivateKey;
      const result = await wallet.getNewAddress({ privateKey: prefixedKey });

      expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.publicKey).toBeDefined();
    });

    it('should reject invalid private keys', async () => {
      const invalidKeys = [
        '',
        'invalid',
        '123',
        'not_a_private_key',
        '0x123',
        validPrivateKey.slice(0, -2), // Too short
      ];

      for (const invalidKey of invalidKeys) {
        await expect(
          wallet.getNewAddress({ privateKey: invalidKey })
        ).rejects.toBeTruthy();
      }
    });
  });

  describe('validPrivateKey', () => {
    it('should validate correct hex private key', async () => {
      const result = await wallet.validPrivateKey({
        privateKey: validPrivateKey,
      });
      expect(result.isValid).toBe(true);
      expect(result.privateKey).toBe(validPrivateKey);
    });

    it('should validate correct Sui-encoded private key', async () => {
      const result = await wallet.validPrivateKey({
        privateKey: validSuiPrivateKey,
      });
      expect(result.isValid).toBe(true);
      expect(result.privateKey).toBe(validSuiPrivateKey);
    });

    it('should validate private keys with different formats', async () => {
      const testKeys = [
        validPrivateKey,
        validPrivateKey.toUpperCase(),
        '0x' + validPrivateKey,
        '0X' + validPrivateKey.toUpperCase(),
        validSuiPrivateKey,
      ];

      for (const key of testKeys) {
        const result = await wallet.validPrivateKey({ privateKey: key });
        expect(result.isValid).toBe(true);
      }
    });

    it('should invalidate incorrect private keys', async () => {
      const invalidKeys = [
        '',
        'invalid',
        '123',
        '0x',
        'suiprivkey1invalid',
        validPrivateKey.slice(0, -2), // Too short
        validPrivateKey + 'extra', // Too long
        '0000000000000000000000000000000000000000000000000000000000000000', // All zeros
      ];

      for (const key of invalidKeys) {
        const result = await wallet.validPrivateKey({ privateKey: key });
        expect(result.isValid).toBe(false);
        expect(result.privateKey).toBe(key);
      }
    });
  });

  describe('validAddress', () => {
    it('should validate correct Sui address', async () => {
      const validAddress =
        '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40';
      const result = await wallet.validAddress({ address: validAddress });

      expect(result.isValid).toBe(true);
      expect(result.address).toBe(validAddress);
    });

    it('should validate address without 0x prefix', async () => {
      const addressWithoutPrefix =
        '1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40';
      const result = await wallet.validAddress({
        address: addressWithoutPrefix,
      });

      expect(result.isValid).toBe(true);
      expect(result.address).toBe(addressWithoutPrefix);
    });

    it('should validate uppercase addresses', async () => {
      const uppercaseAddress =
        '0x1F1BFBF2D571D4F15BF7803F81E43F10BCF78EF9473BA69FF3E4664477B54C40';
      const result = await wallet.validAddress({ address: uppercaseAddress });

      expect(result.isValid).toBe(true);
      expect(result.address).toBe(uppercaseAddress);
    });

    it('should invalidate incorrect addresses', async () => {
      // Test each address individually to ensure they're actually invalid
      const testCases = [
        { address: '', shouldBeValid: false },
        { address: 'invalid', shouldBeValid: false },
        { address: 'not_hex_at_all', shouldBeValid: false },
        {
          address:
            '0xgg1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          shouldBeValid: false,
        },
      ];

      for (const testCase of testCases) {
        const result = await wallet.validAddress({ address: testCase.address });
        expect(result.isValid).toBe(testCase.shouldBeValid);
        expect(result.address).toBe(testCase.address);
      }
    });
  });

  describe('signMessage', () => {
    it('should sign message with Uint8Array data', async () => {
      const message = base.toUtf8('hello world');
      const param: SignTxParams = {
        privateKey: validPrivateKey,
        data: message,
      };

      const signature = await wallet.signMessage(param);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should sign message with different private key formats', async () => {
      const message = base.toUtf8('test message');

      const signature1 = await wallet.signMessage({
        privateKey: validPrivateKey,
        data: message,
      });

      const signature2 = await wallet.signMessage({
        privateKey: validSuiPrivateKey,
        data: message,
      });

      expect(signature1).toBe(signature2);
    });

    it('should produce different signatures for different messages', async () => {
      const message1 = base.toUtf8('message 1');
      const message2 = base.toUtf8('message 2');

      const signature1 = await wallet.signMessage({
        privateKey: validPrivateKey,
        data: message1,
      });

      const signature2 = await wallet.signMessage({
        privateKey: validPrivateKey,
        data: message2,
      });

      expect(signature1).not.toBe(signature2);
    });

    it('should reject non-Uint8Array data', async () => {
      const param: SignTxParams = {
        privateKey: validPrivateKey,
        data: 'invalid data type' as any,
      };

      await expect(wallet.signMessage(param)).rejects.toBeTruthy();
    });
  });

  describe('signTransaction', () => {
    describe('raw transaction type', () => {
      it('should sign raw transaction successfully', async () => {
        const rawTransactionData = base.toBase64(
          new Uint8Array([1, 2, 3, 4, 5])
        ); // Mock transaction data
        const signData: SuiSignData = {
          type: 'raw',
          data: rawTransactionData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });

      it('should handle different raw transaction formats', async () => {
        const testData = [
          base.toBase64(new Uint8Array([0, 1, 2, 3])),
          base.toBase64(new Uint8Array(64).fill(0xff)),
          base.toBase64(new Uint8Array(1).fill(0x42)),
        ];

        for (const data of testData) {
          const signData: SuiSignData = {
            type: 'raw',
            data: data,
          };

          const result = await wallet.signTransaction({
            privateKey: validPrivateKey,
            data: signData,
          });

          expect(result).toBeDefined();
        }
      });
    });

    describe('paySUI transaction type', () => {
      const mockSuiObjectRef: SuiObjectRef = {
        objectId: '0x1234567890abcdef1234567890abcdef12345678',
        version: '1',
        digest: 'mockdigest123',
      };

      it('should sign paySUI transaction successfully', async () => {
        const payTransaction: PaySuiTransaction = {
          inputCoins: [mockSuiObjectRef],
          recipient:
            '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          amount: '1000000000', // 1 SUI
          gasBudget: '10000000',
          gasPrice: '1000',
        };

        const signData: SuiSignData = {
          type: 'paySUI',
          data: payTransaction,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });

      it('should handle paySUI transaction with epoch', async () => {
        const payTransaction: PaySuiTransaction = {
          inputCoins: [mockSuiObjectRef],
          recipient:
            '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          amount: '2000000000',
          gasBudget: '20000000',
          gasPrice: '1500',
          epoch: 100,
        };

        const signData: SuiSignData = {
          type: 'paySUI',
          data: payTransaction,
        };

        const result = await wallet.signTransaction({
          privateKey: validPrivateKey,
          data: signData,
        });

        expect(result).toBeDefined();
      });

      it('should handle multiple input coins', async () => {
        const payTransaction: PaySuiTransaction = {
          inputCoins: [
            mockSuiObjectRef,
            {
              objectId: '0xabcdef1234567890abcdef1234567890abcdef12',
              version: '2',
              digest: 'anotherdigest456',
            },
          ],
          recipient:
            '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          amount: '5000000000',
          gasBudget: '25000000',
          gasPrice: '2000',
        };

        const signData: SuiSignData = {
          type: 'paySUI',
          data: payTransaction,
        };

        const result = await wallet.signTransaction({
          privateKey: validPrivateKey,
          data: signData,
        });

        expect(result).toBeDefined();
      });

      it('should reject paySUI transaction without input coins', async () => {
        const payTransaction: PaySuiTransaction = {
          inputCoins: [],
          recipient:
            '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          amount: '1000000000',
          gasBudget: '10000000',
          gasPrice: '1000',
        };

        const signData: SuiSignData = {
          type: 'paySUI',
          data: payTransaction,
        };

        await expect(
          wallet.signTransaction({
            privateKey: validPrivateKey,
            data: signData,
          })
        ).rejects.toBeTruthy();
      });

      it('should reject paySUI transaction with undefined input coins', async () => {
        const payTransaction: any = {
          inputCoins: undefined,
          recipient:
            '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
          amount: '1000000000',
          gasBudget: '10000000',
          gasPrice: '1000',
        };

        const signData: SuiSignData = {
          type: 'paySUI',
          data: payTransaction,
        };

        await expect(
          wallet.signTransaction({
            privateKey: validPrivateKey,
            data: signData,
          })
        ).rejects.toBeTruthy();
      });
    });

    it('should reject unknown transaction type', async () => {
      const signData: any = {
        type: 'unknown',
        data: 'some data',
      };

      await expect(
        wallet.signTransaction({
          privateKey: validPrivateKey,
          data: signData,
        })
      ).rejects.toBeTruthy();
    });

    it('should reject invalid private key', async () => {
      const signData: SuiSignData = {
        type: 'raw',
        data: base.toBase64(new Uint8Array([1, 2, 3])),
      };

      await expect(
        wallet.signTransaction({
          privateKey: 'invalid_private_key',
          data: signData,
        })
      ).rejects.toBeTruthy();
    });
  });

  describe('calcTxHash', () => {
    it('should calculate transaction hash successfully', async () => {
      const transactionData = base.toBase64(
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      );
      const param: CalcTxHashParams = {
        data: transactionData,
      };

      const hash = await wallet.calcTxHash(param);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different data', async () => {
      const data1 = base.toBase64(new Uint8Array([1, 2, 3, 4]));
      const data2 = base.toBase64(new Uint8Array([5, 6, 7, 8]));

      const hash1 = await wallet.calcTxHash({ data: data1 });
      const hash2 = await wallet.calcTxHash({ data: data2 });

      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hashes for same data', async () => {
      const data = base.toBase64(new Uint8Array([1, 2, 3, 4, 5]));

      const hash1 = await wallet.calcTxHash({ data });
      const hash2 = await wallet.calcTxHash({ data });

      expect(hash1).toBe(hash2);
    });

    it('should handle empty transaction data', async () => {
      const emptyData = base.toBase64(new Uint8Array(0));
      const hash = await wallet.calcTxHash({ data: emptyData });

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should reject invalid base64 data', async () => {
      const invalidData = 'not_valid_base64!@#$';

      await expect(
        wallet.calcTxHash({ data: invalidData })
      ).rejects.toBeTruthy();
    });
  });

  describe('signCommonMsg', () => {
    it('should sign common message with wallet ID', async () => {
      const param: SignCommonMsgParams = {
        privateKey: validPrivateKey,
        message: { walletId: '123456789' },
      };

      const signature = await wallet.signCommonMsg(param);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should sign common message with text', async () => {
      const param: SignCommonMsgParams = {
        privateKey: validPrivateKey,
        message: { text: 'Hello World' },
      };

      const signature = await wallet.signCommonMsg(param);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should produce different signatures for different messages', async () => {
      const sig1 = await wallet.signCommonMsg({
        privateKey: validPrivateKey,
        message: { walletId: 'id1' },
      });

      const sig2 = await wallet.signCommonMsg({
        privateKey: validPrivateKey,
        message: { walletId: 'id2' },
      });

      expect(sig1).not.toBe(sig2);
    });

    it('should work with Sui-encoded private keys', async () => {
      const signature = await wallet.signCommonMsg({
        privateKey: validSuiPrivateKey,
        message: { walletId: '123456789' },
      });

      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });
  });

  describe('Utility functions', () => {
    describe('encodeSuiPrivateKey', () => {
      it('should encode hex private key to Sui format', () => {
        const encoded = encodeSuiPrivateKey(validPrivateKey);
        expect(encoded).toMatch(/^suiprivkey1[a-z0-9]+$/);
      });

      it('should return same key if already encoded', () => {
        const encoded = encodeSuiPrivateKey(validSuiPrivateKey);
        expect(encoded).toBe(validSuiPrivateKey);
      });

      it('should handle uppercase hex keys', () => {
        const encoded = encodeSuiPrivateKey(validPrivateKey.toUpperCase());
        expect(encoded).toMatch(/^suiprivkey1[a-z0-9]+$/);
      });

      it('should throw error for invalid input', () => {
        expect(() => encodeSuiPrivateKey('')).toThrow();
        expect(() => encodeSuiPrivateKey('invalid')).toThrow();
        expect(() => encodeSuiPrivateKey('123')).toThrow();
      });
    });

    describe('tryDecodeSuiPrivateKey', () => {
      it('should decode Sui private key to hex format', () => {
        const decoded = tryDecodeSuiPrivateKey(validSuiPrivateKey);
        expect(decoded).toMatch(/^(0x)?[0-9a-f]{64}$/i);
      });

      it('should return same key if already hex format', () => {
        const decoded = tryDecodeSuiPrivateKey(validPrivateKey);
        expect(decoded).toBe(validPrivateKey);
      });

      it('should handle uppercase hex keys', () => {
        const upperKey = validPrivateKey.toUpperCase();
        const decoded = tryDecodeSuiPrivateKey(upperKey);
        expect(decoded).toBe(upperKey);
      });

      it('should throw error for invalid input', () => {
        expect(() => tryDecodeSuiPrivateKey('')).toThrow();
        expect(() => tryDecodeSuiPrivateKey('invalid')).toThrow();
        expect(() => tryDecodeSuiPrivateKey('suiprivkey1invalid')).toThrow();
      });
    });

    describe('getAddressFromPrivate', () => {
      it('should get address from hex private key', () => {
        const result = getAddressFromPrivate(validPrivateKey);
        expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
        expect(result.publicKey).toBeDefined();
      });

      it('should handle uppercase private keys', () => {
        const result = getAddressFromPrivate(validPrivateKey.toUpperCase());
        expect(result.address).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should throw error for invalid private key', () => {
        expect(() => getAddressFromPrivate('invalid')).toThrow();
        expect(() => getAddressFromPrivate('')).toThrow();
      });
    });

    describe('getAddressFromPublic', () => {
      it('should get address from public key', () => {
        // First get a public key from a private key
        const keyPair = Ed25519Keypair.fromSeed(base.fromHex(validPrivateKey));
        const publicKeyBase64 = keyPair.getPublicKey().toBase64();

        const address = getAddressFromPublic(publicKeyBase64);
        expect(address).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should throw error for invalid public key', () => {
        expect(() => getAddressFromPublic('invalid')).toThrow();
        expect(() => getAddressFromPublic('')).toThrow();
      });
    });
  });

  describe('Integration tests', () => {
    it('should complete full workflow: generate key -> create address -> sign message', async () => {
      // Generate random private key
      const privateKey = await wallet.getRandomPrivateKey();

      // Create address
      const address = await wallet.getNewAddress({ privateKey });
      expect(address.address).toMatch(/^0x[a-f0-9]{64}$/);

      // Sign message
      const message = base.toUtf8('integration test message');
      const signature = await wallet.signMessage({ privateKey, data: message });
      expect(typeof signature).toBe('string');

      // Sign common message
      const commonSig = await wallet.signCommonMsg({
        privateKey,
        message: { walletId: 'integration-test' },
      });
      expect(typeof commonSig).toBe('string');
    });

    it('should work with derived private key workflow', async () => {
      // Get derived path and private key
      const hdPath = await wallet.getDerivedPath({ index: 5 });
      const privateKey = await wallet.getDerivedPrivateKey({
        mnemonic: validMnemonic,
        hdPath,
      });

      // Validate private key
      const validation = await wallet.validPrivateKey({ privateKey });
      expect(validation.isValid).toBe(true);

      // Create address
      const address = await wallet.getNewAddress({ privateKey });
      expect(address.address).toMatch(/^0x[a-f0-9]{64}$/);

      // Validate address
      const addressValidation = await wallet.validAddress({
        address: address.address,
      });
      expect(addressValidation.isValid).toBe(true);
    });

    it('should handle private key format conversions consistently', async () => {
      // Start with hex private key
      const hexKey = validPrivateKey;

      // Convert to Sui format
      const suiKey = encodeSuiPrivateKey(hexKey);

      // Both should generate the same address
      const address1 = await wallet.getNewAddress({ privateKey: hexKey });
      const address2 = await wallet.getNewAddress({ privateKey: suiKey });
      expect(address1.address).toBe(address2.address);
      expect(address1.publicKey).toBe(address2.publicKey);

      // Both should be valid
      const valid1 = await wallet.validPrivateKey({ privateKey: hexKey });
      const valid2 = await wallet.validPrivateKey({ privateKey: suiKey });
      expect(valid1.isValid).toBe(true);
      expect(valid2.isValid).toBe(true);

      // Both should produce the same signatures
      const message = base.toUtf8('consistency test');
      const sig1 = await wallet.signMessage({
        privateKey: hexKey,
        data: message,
      });
      const sig2 = await wallet.signMessage({
        privateKey: suiKey,
        data: message,
      });
      expect(sig1).toBe(sig2);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed transaction data gracefully', async () => {
      const malformedData: any = {
        type: 'paySUI',
        data: {
          // Missing required fields
          recipient: 'invalid_address',
        },
      };

      await expect(
        wallet.signTransaction({
          privateKey: validPrivateKey,
          data: malformedData,
        })
      ).rejects.toBeTruthy();
    });

    it('should reject transactions with invalid amounts', async () => {
      const invalidTransaction: PaySuiTransaction = {
        inputCoins: [
          {
            objectId: '0x1234567890abcdef1234567890abcdef12345678',
            version: '1',
            digest: 'mockdigest',
          },
        ],
        recipient:
          '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
        amount: 'invalid_amount',
        gasBudget: '10000000',
        gasPrice: '1000',
      };

      const signData: SuiSignData = {
        type: 'paySUI',
        data: invalidTransaction,
      };

      await expect(
        wallet.signTransaction({
          privateKey: validPrivateKey,
          data: signData,
        })
      ).rejects.toBeTruthy();
    });

    it('should handle very large numbers in transaction amounts', async () => {
      const largeAmountTransaction: PaySuiTransaction = {
        inputCoins: [
          {
            objectId: '0x1234567890abcdef1234567890abcdef12345678',
            version: '1',
            digest: 'mockdigest',
          },
        ],
        recipient:
          '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40',
        amount: '999999999999999999999999999999',
        gasBudget: '10000000',
        gasPrice: '1000',
      };

      const signData: SuiSignData = {
        type: 'paySUI',
        data: largeAmountTransaction,
      };

      // Should not throw error for large valid numbers
      const result = await wallet.signTransaction({
        privateKey: validPrivateKey,
        data: signData,
      });
      expect(result).toBeDefined();
    });

    it('should handle concurrent operations safely', async () => {
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const privateKey = await wallet.getRandomPrivateKey();
        const address = await wallet.getNewAddress({ privateKey });
        const validation = await wallet.validPrivateKey({ privateKey });

        return { privateKey, address, validation, index: i };
      });

      const results = await Promise.all(promises);

      // All operations should succeed
      results.forEach((result) => {
        expect(result.address.address).toMatch(/^0x[a-f0-9]{64}$/);
        expect(result.validation.isValid).toBe(true);
      });

      // All private keys should be unique
      const privateKeys = results.map((r) => r.privateKey);
      const uniqueKeys = new Set(privateKeys);
      expect(uniqueKeys.size).toBe(privateKeys.length);
    });
  });
});
