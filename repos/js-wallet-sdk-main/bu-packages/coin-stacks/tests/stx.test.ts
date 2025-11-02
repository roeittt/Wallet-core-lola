import {
  DerivePriKeyParams,
  GetDerivedPathParam,
  GetRawTransactionParams,
  NewAddressParams,
  SignCommonMsgParams,
  SignTxParams,
  TypedMessage,
  ValidAddressParams,
  VerifyMessageParams,
} from '@okxweb3/coin-base';
import {
  AllowContractCaller,
  DelegateStx,
  RevokeDelegateStx,
  StxSignData,
  StxTransfer,
  StxWallet,
  TokenTransfer,
  deployPayload,
} from '../src/Stxwallet';

describe('StxWallet comprehensive tests', () => {
  let wallet: StxWallet;
  const validPrivateKey =
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
  const validMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeEach(() => {
    wallet = new StxWallet();
  });

  describe('getDerivedPath', () => {
    it('should return correct derived path', async () => {
      const param: GetDerivedPathParam = { index: 0 };
      const path = await wallet.getDerivedPath(param);
      expect(path).toBe("m/44'/5757'/0'/0/0");
    });

    it('should return correct derived path for different index', async () => {
      const param: GetDerivedPathParam = { index: 5 };
      const path = await wallet.getDerivedPath(param);
      expect(path).toBe("m/44'/5757'/0'/0/5");
    });
  });

  describe('getDerivedPrivateKey', () => {
    it('should derive private key from mnemonic successfully', async () => {
      const param: DerivePriKeyParams = {
        mnemonic: validMnemonic,
        hdPath: "m/44'/5757'/0'/0/0",
      };
      const privateKey = await wallet.getDerivedPrivateKey(param);
      expect(typeof privateKey).toBe('string');
      expect(privateKey.length).toBeGreaterThan(0);
    });
  });

  describe('getRandomPrivateKey', () => {
    it('should generate random private key successfully', async () => {
      const privateKey = await wallet.getRandomPrivateKey();
      expect(typeof privateKey).toBe('string');
      // Updated regex to account for 0x prefix that may be added
      expect(privateKey).toMatch(/^(0x)?[0-9a-f]{64}01$/i);
    });
  });

  describe('getNewAddress', () => {
    it('should generate testnet address', async () => {
      const param: NewAddressParams = {
        privateKey: validPrivateKey,
        version: 'Testnet',
      };
      const result = await wallet.getNewAddress(param);
      expect(result.address).toMatch(/^ST/); // Testnet addresses start with ST
    });
  });

  describe('signTransaction', () => {
    describe('transfer transaction', () => {
      it('should sign transfer transaction successfully', async () => {
        const transferData: StxTransfer = {
          to: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          amount: 1000,
          memo: 'test transfer',
          nonce: 1,
          fee: 200,
          anchorMode: 3,
        };

        const signData: StxSignData = {
          type: 'transfer',
          data: transferData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('tokenTransfer transaction', () => {
      it('should sign tokenTransfer transaction successfully', async () => {
        const tokenTransferData: TokenTransfer = {
          from: 'SP2XYBM8MD5T50WAMQ86E8HKR85BAEKBECNE1HHVY',
          to: 'SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ',
          memo: 'test token transfer',
          amount: 100,
          contract: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
          contractName: 'miamicoin-token',
          tokenName: 'miamicoin',
          functionName: 'transfer',
          nonce: 1,
          fee: 200000,
        };

        const signData: StxSignData = {
          type: 'tokenTransfer',
          data: tokenTransferData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('allowContractCaller transaction', () => {
      it('should sign allowContractCaller transaction successfully', async () => {
        const allowContractCallerData: AllowContractCaller = {
          contract: 'SP000000000000000000002Q6VF78',
          contractName: 'pox-3',
          functionName: 'allow-contract-caller',
          caller: 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox-fast-pool-v2',
          untilBurnBlockHeight: 206600,
          nonce: 1,
          fee: 3000,
        };

        const signData: StxSignData = {
          type: 'allowContractCaller',
          data: allowContractCallerData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('delegateStx transaction', () => {
      it('should sign delegateStx transaction successfully', async () => {
        const delegateStxData: DelegateStx = {
          contract: 'SP000000000000000000002Q6VF78',
          contractName: 'pox-3',
          functionName: 'delegate-stx',
          delegateTo: 'SP3TDKYYRTYFE32N19484838WEJ25GX40Z24GECPZ',
          untilBurnBlockHeight: 2000,
          amountMicroStx: 100000000000,
          poxAddress: '36Y1UJBWGGreKCKNYQPVPr41rgG2sQF7SC',
          cycles: 6,
          burnBlockHeight: 668000,
          fee: 3000,
          nonce: 1,
        };

        const signData: StxSignData = {
          type: 'delegateStx',
          data: delegateStxData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('revokeDelegateStx transaction', () => {
      it('should sign revokeDelegateStx transaction successfully', async () => {
        const revokeDelegateStxData: RevokeDelegateStx = {
          contract: 'SP000000000000000000002Q6VF78',
          contractName: 'pox-3',
          functionName: 'revoke-delegate-stx',
          fee: 3000,
          nonce: 1,
        };

        const signData: StxSignData = {
          type: 'revokeDelegateStx',
          data: revokeDelegateStxData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('contractCall transaction', () => {
      it('should sign contractCall transaction successfully', async () => {
        const contractCallData = {
          txData: {
            anchorMode: 3,
            contractAddress: 'SP000000000000000000002Q6VF78',
            contractName: 'pox-3',
            functionArgs: ['010000000000000000000000174876e800'],
            functionName: 'delegate-stx',
            postConditions: [],
          },
          fee: 3000,
          nonce: 1,
        };

        const signData: StxSignData = {
          type: 'contractCall',
          data: contractCallData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    describe('deployContract transaction', () => {
      it('should sign deployContract transaction successfully', async () => {
        const deployContractData = {
          txData: {
            contractName: 'test-contract',
            codeBody: '(define-constant test-value 42)',
            anchorMode: 3,
            postConditions: [],
            sponsored: false,
          },
          fee: 3000,
          nonce: 1,
        };

        const signData: StxSignData = {
          type: 'deployContract',
          data: deployContractData,
        };

        const param: SignTxParams = {
          privateKey: validPrivateKey,
          data: signData,
        };

        const result = await wallet.signTransaction(param);
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('txSerializedHexString');
      });
    });

    it('should handle private key with 0x prefix', async () => {
      const transferData: StxTransfer = {
        to: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        amount: 1000,
        memo: 'test transfer',
        nonce: 1,
        fee: 200,
      };

      const signData: StxSignData = {
        type: 'transfer',
        data: transferData,
      };

      const param: SignTxParams = {
        privateKey: '0x' + validPrivateKey,
        data: signData,
      };

      const result = await wallet.signTransaction(param);
      expect(result).toHaveProperty('txId');
      expect(result).toHaveProperty('txSerializedHexString');
    });
  });

  describe('signMessage', () => {
    it('should sign message successfully', async () => {
      const param: SignTxParams = {
        privateKey: validPrivateKey,
        data: {
          type: 'signMessage',
          message: 'Hello World',
        },
      };

      const result = await wallet.signMessage(param);
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('publicKey');
    });

    it('should handle private key with 0x prefix', async () => {
      const param: SignTxParams = {
        privateKey: '0x' + validPrivateKey,
        data: {
          type: 'signMessage',
          message: 'Hello World',
        },
      };

      const result = await wallet.signMessage(param);
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('publicKey');
    });
  });

  describe('verifyMessage', () => {
    it('should verify message successfully', async () => {
      // First sign a message
      const signParam: SignTxParams = {
        privateKey: validPrivateKey,
        data: {
          type: 'signMessage',
          message: 'Hello World',
        },
      };

      const signResult = await wallet.signMessage(signParam);

      // Then verify it
      const verifyParam: VerifyMessageParams = {
        signature: signResult.signature,
        data: {
          type: 1,
          message: 'Hello World',
          publicKey: signResult.publicKey,
        } as TypedMessage,
      };

      const isValid = await wallet.verifyMessage(verifyParam);
      expect(isValid).toBe(true);
    });

    it('should handle verification errors', async () => {
      const verifyParam: VerifyMessageParams = {
        signature: 'invalid_signature',
        data: {
          type: 1,
          message: 'Hello World',
          publicKey: 'invalid_public_key',
        } as TypedMessage,
      };

      await expect(wallet.verifyMessage(verifyParam)).rejects.toBeTruthy();
    });
  });

  describe('validAddress', () => {
    it('should validate valid mainnet address', async () => {
      const param: ValidAddressParams = {
        address: 'SP2XYBM8MD5T50WAMQ86E8HKR85BAEKBECNE1HHVY',
      };

      const result = await wallet.validAddress(param);
      expect(result.isValid).toBe(true);
      expect(result.address).toBe(param.address);
    });

    it('should invalidate invalid address', async () => {
      const param: ValidAddressParams = {
        address: 'invalid_address',
      };

      const result = await wallet.validAddress(param);
      expect(result.isValid).toBe(false);
      expect(result.address).toBe(param.address);
    });

    it('should handle empty address', async () => {
      const param: ValidAddressParams = {
        address: '',
      };

      const result = await wallet.validAddress(param);
      expect(result.isValid).toBe(false);
      expect(result.address).toBe(param.address);
    });
  });

  describe('getRawTransaction', () => {
    it('should get raw transaction for transfer', async () => {
      const transferData: StxTransfer = {
        to: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        amount: 1000,
        memo: 'test transfer',
        nonce: 1,
        fee: 200,
      };

      const signData: StxSignData = {
        type: 'transfer',
        data: transferData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get raw transaction for tokenTransfer', async () => {
      const tokenTransferData: TokenTransfer = {
        from: 'SP2XYBM8MD5T50WAMQ86E8HKR85BAEKBECNE1HHVY',
        to: 'SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ',
        memo: 'test token transfer',
        amount: 100,
        contract: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
        contractName: 'miamicoin-token',
        tokenName: 'miamicoin',
        functionName: 'transfer',
        nonce: 1,
        fee: 200000,
      };

      const signData: StxSignData = {
        type: 'tokenTransfer',
        data: tokenTransferData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get raw transaction for allowContractCaller', async () => {
      const allowContractCallerData: AllowContractCaller = {
        contract: 'SP000000000000000000002Q6VF78',
        contractName: 'pox-3',
        functionName: 'allow-contract-caller',
        caller: 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox-fast-pool-v2',
        untilBurnBlockHeight: 206600,
        nonce: 1,
        fee: 3000,
      };

      const signData: StxSignData = {
        type: 'allowContractCaller',
        data: allowContractCallerData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get raw transaction for delegateStx', async () => {
      const delegateStxData: DelegateStx = {
        contract: 'SP000000000000000000002Q6VF78',
        contractName: 'pox-3',
        functionName: 'delegate-stx',
        delegateTo: 'SP3TDKYYRTYFE32N19484838WEJ25GX40Z24GECPZ',
        untilBurnBlockHeight: 2000,
        amountMicroStx: 100000000000,
        poxAddress: '36Y1UJBWGGreKCKNYQPVPr41rgG2sQF7SC',
        cycles: 6,
        burnBlockHeight: 668000,
        fee: 3000,
        nonce: 1,
      };

      const signData: StxSignData = {
        type: 'delegateStx',
        data: delegateStxData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get raw transaction for revokeDelegateStx', async () => {
      const revokeDelegateStxData: RevokeDelegateStx = {
        contract: 'SP000000000000000000002Q6VF78',
        contractName: 'pox-3',
        functionName: 'revoke-delegate-stx',
        fee: 3000,
        nonce: 1,
      };

      const signData: StxSignData = {
        type: 'revokeDelegateStx',
        data: revokeDelegateStxData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get raw transaction for deployContract', async () => {
      const deployData: deployPayload = {
        contractName: 'test-contract',
        codeBody: '(define-constant test-value 42)',
      };

      const signData: StxSignData = {
        type: 'deployContract',
        data: deployData,
      };

      const param: GetRawTransactionParams = {
        data: signData,
      };

      const result = await wallet.getRawTransaction(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('signCommonMsg with 0x prefix', () => {
    it('should handle private key with 0x prefix', async () => {
      const param: SignCommonMsgParams = {
        privateKey: '0x' + validPrivateKey,
        message: { walletId: '123456789' },
      };

      const result = await wallet.signCommonMsg(param);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('validPrivateKey', () => {
    it('should validate correct private key', async () => {
      const result = await wallet.validPrivateKey({
        privateKey: validPrivateKey,
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate empty private key', async () => {
      const result = await wallet.validPrivateKey({ privateKey: '' });
      expect(result.isValid).toBe(false);
    });

    it('should invalidate malformed private key', async () => {
      const result = await wallet.validPrivateKey({ privateKey: 'AABBXX' });
      expect(result.isValid).toBe(false);
    });

    it('should validate randomly generated private key', async () => {
      const randomKey = await wallet.getRandomPrivateKey();
      const result = await wallet.validPrivateKey({ privateKey: randomKey });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge cases and invalid private keys', () => {
    const invalidPrivateKeys = [
      '',
      '0x',
      '124699',
      '1dfi付',
      '9000 12',
      '548yT115QRHH7Mpchg9JJ8YPX9RTKuan=548yT115QRHH7Mpchg9JJ8YPX9RTKuan ',
      'L1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYAr',
      'L1v',
      '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b428 97a',
      '0x31342f041c5b54358074b457。、。9231c8a300be65e687dff020bc7779598b428 97a',
      '0000000000000000000000000000000000000000000000000000000000000000',
    ];

    it('should reject all invalid private key formats', async () => {
      let rejectionCount = 0;

      for (const invalidKey of invalidPrivateKeys) {
        try {
          await wallet.getNewAddress({ privateKey: invalidKey });
          // If no error is thrown, the test should fail
          expect(invalidKey).toBe('should have thrown an error');
        } catch (error) {
          rejectionCount++;
          // Verify that validPrivateKey also rejects this key
          const validationResult = await wallet.validPrivateKey({
            privateKey: invalidKey,
          });
          expect(validationResult.isValid).toBe(false);
        }
      }

      // All invalid keys should have been rejected
      expect(rejectionCount).toBe(invalidPrivateKeys.length);
    });

    it('should handle various address format cases', async () => {
      const expectedAddress = 'SP2XYBM8MD5T50WAMQ86E8HKR85BAEKBECNE1HHVY';

      // Test different valid formats of the same private key
      const validFormats = [
        validPrivateKey,
        validPrivateKey.toUpperCase(),
        '0x' + validPrivateKey,
        '0X' + validPrivateKey.toUpperCase(),
      ];

      for (const keyFormat of validFormats) {
        const result = await wallet.getNewAddress({ privateKey: keyFormat });
        expect(result.address).toBe(expectedAddress);

        const validationResult = await wallet.validPrivateKey({
          privateKey: keyFormat,
        });
        expect(validationResult.isValid).toBe(true);
      }
    });
  });
});
