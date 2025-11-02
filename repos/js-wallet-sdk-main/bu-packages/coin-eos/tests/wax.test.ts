import {
  KeyType,
  WaxWallet,
  getNewAddress,
  createAccount,
  toAssetString,
  transfer,
  stringToPrivateKey,
  privateKeyToLegacyString,
  stringToPublicKey,
  publicKeyToString,
  publicKeyToLegacyString,
  signMessage,
  verifySignature,
  signSerializedTransaction,
  checkName,
} from '../src';
import { signUtil } from '@okxweb3/crypto-lib';
import { base } from '@okxweb3/coin-base';

describe('wax', () => {
  test('private key', async () => {
    let wallet = new WaxWallet();
    let key = await wallet.getRandomPrivateKey();
    console.log(key);
  });

  test('address', async () => {
    const privateKey = stringToPrivateKey(
      '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'
    );
    console.info(privateKey);

    const result = privateKeyToLegacyString(privateKey);
    console.info(result);

    const publicKey = stringToPublicKey(
      'EOS6sWWrSmaagPSxyvrqBKNd4Ta91PGbNVhG9oMK9kNwwzxpDuusu'
    );
    console.info(publicKey);

    const result2 = publicKeyToLegacyString(publicKey);
    console.info(result2);
  });

  test('getAmountString WAX', async () => {
    let wallet = new WaxWallet();

    let amount = await wallet.getAmountString('12345678');
    expect(amount).toBe('0.12345678 WAX');

    amount = await wallet.getAmountString('12345678', undefined, undefined);
    expect(amount).toBe('0.12345678 WAX');

    amount = await wallet.getAmountString('12345678', 6, 'WAXTOKEN');
    expect(amount).toBe('12.345678 WAXTOKEN');
  });

  // Test getTokenAmountString method (uncovered line 39)
  test('getTokenAmountString WAX', async () => {
    let wallet = new WaxWallet();

    let amount = wallet.getTokenAmountString('12345678', 8, 'WAX');
    expect(amount).toBe('0.12345678 WAX');

    amount = wallet.getTokenAmountString('12345678', 6, 'USDC');
    expect(amount).toBe('12.345678 USDC');

    amount = wallet.getTokenAmountString(12345678, 4, 'EOS');
    expect(amount).toBe('1234.5678 EOS');
  });

  // Test getDerivedPrivateKey method (uncovered lines 50-57)
  test('getDerivedPrivateKey', async () => {
    let wallet = new WaxWallet();

    const derivedKey = await wallet.getDerivedPrivateKey({
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      hdPath: "m/44'/14001'/0'/0/0",
    });

    expect(typeof derivedKey).toBe('string');
    expect(derivedKey.length).toBeGreaterThan(0);
  });

  // Test getDerivedPath method for WaxWallet (uncovered line 182)
  test('getDerivedPath WAX', async () => {
    let wallet = new WaxWallet();

    const path = await wallet.getDerivedPath({ index: 0 });
    expect(path).toBe("m/44'/14001'/0'/0/0");

    const path2 = await wallet.getDerivedPath({ index: 5 });
    expect(path2).toBe("m/44'/14001'/0'/0/5");
  });

  // Test validAddress method (uncovered line 94) - it should throw error
  test('validAddress throws error', async () => {
    let wallet = new WaxWallet();

    // The method throws synchronously, not as a Promise rejection
    expect(() => wallet.validAddress({ address: 'test' })).toThrow(
      'Method not implemented.'
    );
  });

  // Test signCommonMsg method (uncovered lines 110-128)
  test('signCommonMsg', async () => {
    let wallet = new WaxWallet();

    const sig = await wallet.signCommonMsg({
      privateKey: '5JUsJvGbjH1HQ9XhwPP2NuxPZrFNb95miDsfL1BjVrjJXu8qWmK',
      message: { walletId: '123456789' },
    });

    expect(typeof sig).toBe('string');
    expect(sig).toContain(',');

    const parts = sig.split(',');
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0); // signature
    expect(parts[1].length).toBeGreaterThan(0); // public key hex
  });

  // Test calcTxHash method (uncovered lines 160-168)
  test('calcTxHash', async () => {
    let wallet = new WaxWallet();

    const testTx = {
      signatures: [
        'SIG_K1_K8vqJQTdrV6ohsdZTCVoE1NrrSrf9ivVV28DrQSTeraxuiGnCabLgJjKUgkQZWQrXtBR9Qv83css6EeiEd4BRpDJsPBAc6',
      ],
      compression: true,
      packed_context_free_data: '78DA030000000001',
      packed_trx:
        '78DA733BB22BE960B99BB8D11A0620606458D664C2FCCA2014C80ED7B5397B9631E084C0C14833DFDF20D9156F8D8C14E1022FA1F4C3AFAC20498E70C70806300000869F19C2',
    };

    const hash = await wallet.calcTxHash({ data: testTx });
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);

    // Test with string data
    const hash2 = await wallet.calcTxHash({ data: JSON.stringify(testTx) });
    expect(hash2).toBe(hash);
  });

  // Test calcTxHash error case
  test('calcTxHash error case', async () => {
    let wallet = new WaxWallet();

    await expect(
      wallet.calcTxHash({ data: 'invalid json' })
    ).rejects.toBeDefined();
  });

  // Test checkName function edge cases (for api.ts coverage)
  test('checkName function', () => {
    // Regex: /^[.1-5a-z]{0,12}[.1-5a-j]?$/
    // First part: 0-12 chars from [.1-5a-z] (. and 1-5 and a-z, NO 0,6-9)
    // Optional last: one char from [.1-5a-j] (. and 1-5 and a-j)

    // Valid names
    expect(checkName('account1')).toBe(true); // 8 chars, all valid
    expect(checkName('eosio.token')).toBe(true); // 11 chars, all valid in main part
    expect(checkName('12345abcde12')).toBe(true); // 12 chars, all valid
    expect(checkName('a')).toBe(true);
    expect(checkName('1')).toBe(true);
    expect(checkName('accountj')).toBe(true); // 8 chars, all valid
    expect(checkName('account.')).toBe(true); // 8 chars, all valid
    expect(checkName('')).toBe(true); // empty string is valid (0 chars)

    // Invalid names
    expect(checkName('account1234567890')).toBe(false); // too long (14+ chars)
    expect(checkName('Account1')).toBe(false); // uppercase not allowed
    expect(checkName('account-1')).toBe(false); // - not allowed
    expect(checkName('account_1')).toBe(false); // _ not allowed
    expect(checkName('account6')).toBe(false); // 6 not in valid char set
    expect(checkName('account0')).toBe(false); // 0 not in valid char set
    expect(checkName('account9')).toBe(false); // 9 not in valid char set
    expect(checkName('12345abcdefgz')).toBe(false); // 13 chars but 13th char (z) not in [.1-5a-j]
    expect(checkName('12345abcdefga')).toBe(true); // 13 chars, 13th char (a) valid
    expect(checkName('12345abcdefgk')).toBe(false); // 13 chars, 13th char (k) invalid
  });

  // Test getNewAddress error cases (lines 42, 46 in api.ts)
  test('getNewAddress error cases', () => {
    const common = {
      chainId:
        'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
      compression: true,
      refBlockNumber: 161086853,
      refBlockId:
        '0999fd853cc7e589c975e2555f4245de6bdf6ca5c9edba265ca2d599139b04c4',
      refBlockTimestamp: '2022-06-28T13:40:34.000',
      expireSeconds: 600,
    };

    // Invalid creator name
    expect(() => {
      getNewAddress(
        'INVALID_CREATOR',
        'account2',
        '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
        100000000,
        100000000,
        100000000,
        false,
        8,
        'WAX',
        common
      );
    }).toThrow('invalid creator name');

    // Invalid newAccount name
    expect(() => {
      getNewAddress(
        'account1',
        'INVALID_ACCOUNT',
        '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
        100000000,
        100000000,
        100000000,
        false,
        8,
        'WAX',
        common
      );
    }).toThrow('invalid newAccount name');
  });

  // Test transfer error cases (lines 104, 108, 117 in api.ts)
  test('transfer error cases', () => {
    const common = {
      chainId:
        'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
      compression: true,
      refBlockNumber: 161052609,
      refBlockId:
        '099977c1eecfd285461732ac745468341af6db935638dba8927dc525af6b0ad0',
      refBlockTimestamp: '2022-06-28T08:55:09.500',
      expireSeconds: 600,
    };

    // Invalid from name
    expect(() => {
      transfer({
        from: 'INVALID_FROM',
        to: 'account2',
        amount: toAssetString(100000000, 8, 'WAX'),
        memo: 'test',
        common: common,
      });
    }).toThrow('invalid from name');

    // Invalid to name
    expect(() => {
      transfer({
        from: 'account1',
        to: 'INVALID_TO',
        amount: toAssetString(100000000, 8, 'WAX'),
        memo: 'test',
        common: common,
      });
    }).toThrow('invalid to name');

    // Test with custom contract
    const transferWithContract = transfer({
      from: 'account1',
      to: 'account2',
      amount: toAssetString(100000000, 8, 'WAX'),
      memo: 'test',
      contract: 'custom.token',
      common: common,
    });
    expect(typeof transferWithContract).toBe('string');
  });

  // Test signTransaction with type 2 (serialized transaction with requiredKeys)
  test('signTransaction type 2 with requiredKeys', async () => {
    let wallet = new WaxWallet();

    const txParams = {
      privateKey: '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      data: {
        type: 2,
        abis: [
          {
            abi: [],
            accountName: 'atomicmarket',
          },
        ],
        chainId:
          '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        requiredKeys: ['PUB_K1_key1', 'PUB_K1_key2'],
        serializedTransaction:
          '3d1e0d667dd828f0ae1600000000029015bc46222769360000f5fa4485a6410130c4a42e239de8ad00000000a8ed323208d6082b00000000009015bc4622276936000000dcdcd4b2e30130c4a42e239de8ad00000000a8ed32321830c4a42e239de8ad8096980000000000085741580000000000',
      },
    };

    const res = await wallet.signTransaction(txParams);
    expect(res.signatures).toBeDefined();
    expect(Array.isArray(res.signatures)).toBe(true);
    expect(res.signatures.length).toBe(2); // should match requiredKeys length
    expect(res.serializedTransaction).toBe(txParams.data.serializedTransaction);
  });

  // Test signTransaction with type 2 without requiredKeys (line 133)
  test('signTransaction type 2 without requiredKeys', async () => {
    let wallet = new WaxWallet();

    const txParams = {
      privateKey: '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      data: {
        type: 2,
        abis: [
          {
            abi: [],
            accountName: 'atomicmarket',
          },
        ],
        chainId:
          '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        serializedTransaction:
          '3d1e0d667dd828f0ae1600000000029015bc46222769360000f5fa4485a6410130c4a42e239de8ad00000000a8ed323208d6082b00000000009015bc4622276936000000dcdcd4b2e30130c4a42e239de8ad00000000a8ed32321830c4a42e239de8ad8096980000000000085741580000000000',
      },
    };

    const res = await wallet.signTransaction(txParams);
    expect(res.signatures).toBeDefined();
    expect(Array.isArray(res.signatures)).toBe(true);
    expect(res.signatures.length).toBe(1); // should default to 1
  });

  // Test signTransaction with transfer type (lines 145-168)
  test('signTransaction transfer type', async () => {
    let wallet = new WaxWallet();

    const txParams = {
      privateKey: '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      data: {
        type: 3, // not 1 or 2, should be transfer
        from: 'account1',
        to: 'account2',
        amount: '100000000',
        precision: 8,
        symbol: 'WAX',
        memo: 'test transfer',
        contract: 'eosio.token',
        common: {
          chainId:
            'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
          compression: true,
          refBlockNumber: 161052609,
          refBlockId:
            '099977c1eecfd285461732ac745468341af6db935638dba8927dc525af6b0ad0',
          refBlockTimestamp: '2022-06-28T08:55:09.500',
          expireSeconds: 600,
        },
      },
    };

    const res = await wallet.signTransaction(txParams);
    expect(typeof res).toBe('string');
    const parsedRes = JSON.parse(res);
    expect(parsedRes.signatures).toBeDefined();
    expect(Array.isArray(parsedRes.signatures)).toBe(true);
  });

  // Test signTransaction error case
  test('signTransaction error case', async () => {
    let wallet = new WaxWallet();

    const txParams = {
      privateKey: 'invalid_private_key',
      data: {
        type: 1,
        creator: 'account1',
        newAccount: 'account2',
      },
    };

    await expect(wallet.signTransaction(txParams)).rejects.toBeDefined();
  });

  test('transferToken2', async () => {
    const t = transfer({
      from: 'account1',
      to: 'account2',
      amount: toAssetString(100000000, 8, 'WAX'),
      memo: 'test',
      common: {
        chainId:
          'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
        compression: true,
        refBlockNumber: 161052609,
        refBlockId:
          '099977c1eecfd285461732ac745468341af6db935638dba8927dc525af6b0ad0',
        refBlockTimestamp: '2022-06-28T08:55:09.500',
        expireSeconds: 600,
      },
    });
    // {"signatures":["SIG_K1_K8vqJQTdrV6ohsdZTCVoE1NrrSrf9ivVV28DrQSTeraxuiGnCabLgJjKUgkQZWQrXtBR9Qv83css6EeiEd4BRpDJsPBAc6"],"compression":true,"packed_context_free_data":"78DA030000000001","packed_trx":"78DA733BB22BE960B99BB8D11A0620606458D664C2FCCA2014C80ED7B5397B9631E084C0C14833DFDF20D9156F8D8C14E1022FA1F4C3AFAC20498E70C70806300000869F19C2"}
    console.info(JSON.stringify(t));

    const t2 = transfer({
      from: 'account1',
      to: 'account2',
      amount: toAssetString(500000000, 8, 'WAX'),
      memo: 'test',
      common: {
        chainId:
          'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
        compression: true,
        refBlockNumber: 161087501,
        refBlockId:
          '099a000daf6df26a8ef6e3d34340b92d35bd939b34f4b000b69f91a091801abe',
        refBlockTimestamp: '2022-06-28T13:45:57.000',
        expireSeconds: 600,
      },
    });
    // {"signatures":["SIG_K1_JxPHx6GA3Ju5SfADJNMhFoZa6VUyseMmQWGD5b1fEZJRk7ZU8eW1WjT2LN9RDYnoN7dPqdNTk6sLTHqnWB5QHsER7uMpSw"],"compression":true,"packed_context_free_data":"78DA030000000001","packed_trx":"78DACBE5D89DC4CBD0F7EDF1650620606458D664C2FCCA2014C80ED7B5397B9631E084C0C14833DFDF20D9156F8D8C146102024E1C1089D4B3B220498E70C7080630000079C918D7"}
    console.info(JSON.stringify(t2));

    const t3 = transfer({
      from: 'account2',
      to: 'account1',
      memo: 'test',
      amount: toAssetString(100000000, 8, 'WAX'),
      common: {
        chainId:
          'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
        compression: true,
        refBlockNumber: 161087501,
        refBlockId:
          '099a000daf6df26a8ef6e3d34340b92d35bd939b34f4b000b69f91a091801abe',
        refBlockTimestamp: '2022-06-28T13:45:57.000',
        expireSeconds: 600,
      },
    });
    console.info(JSON.stringify(t3));
  });

  // creator: AccountName
  // newAccount: AccountName
  // pubKey: string
  // buyRam: BuyRAMParam
  // delegate: DelegateParam
  test('createAccount', async () => {
    const newPrivateKey = base.fromHex(
      '7f90612a7214632cfed0daee44cc9c8d2cfac8d6968976841d07b1b2596ab109'
    );
    const publicKey = signUtil.secp256k1.publicKeyCreate(newPrivateKey, true);

    const legacyKey = privateKeyToLegacyString({
      type: KeyType.k1,
      data: newPrivateKey,
    });
    console.info(legacyKey);

    const account1 = 'account1';
    const account2 = 'account2';
    const t = createAccount({
      creator: account1,
      newAccount: account2,
      pubKey: publicKeyToString({
        type: KeyType.k1,
        data: publicKey,
      }),
      buyRam: {
        payer: account1,
        receiver: account2,
        quantity: toAssetString(100000000, 8, 'WAX'),
      },
      delegate: {
        from: account1,
        receiver: account2,
        stakeNet: toAssetString(100000000, 8, 'WAX'),
        stakeCPU: toAssetString(100000000, 8, 'WAX'),
        transfer: false,
      },
      common: {
        chainId:
          'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
        compression: true,
        refBlockNumber: 161086853,
        refBlockId:
          '0999fd853cc7e589c975e2555f4245de6bdf6ca5c9edba265ca2d599139b04c4',
        refBlockTimestamp: '2022-06-28T13:40:34.000',
        expireSeconds: 600,
      },
    });
    // {"signatures":["SIG_K1_Keig1AyTVeNbGmLvS3N46goCakypBLyA6D9mioFmSkTD1QExiYdksGnZG4MRPCkKYTk8ffgkoCPjAfF6uwWUFWDPJXKffd"],"compression":true,"packed_context_free_data":"78DA030000000001","packed_trx":"78DAD362DF9DD4FAF764E9A35006206006110CAF0C42191CE6CD524AD9318B31E084C0C14833DFDF20F1156F8D8CD26002024E1C609A1128C1C8C0B43AE4AAC88B9063DBAF369DF99B681367B69669B9DD7EF67B1F9CD73B7C9CF2FAC4218832A295C2DDC160AF25BD6C9117863B0CD1DDC1F0F02B2B489223DC3102AC1B9D8F309281C1A378AF1D86910A048D0400549763BC"}
    console.info(JSON.stringify(t));
  });

  test('getNewAddress', async () => {
    const account1 = 'account1';
    const account2 = 'account2';
    const t = getNewAddress(
      account1,
      account2,
      '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      100000000,
      100000000,
      100000000,
      false,
      8,
      'WAX',
      {
        chainId:
          'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        privateKey: ['5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj'],
        compression: true,
        refBlockNumber: 161086853,
        refBlockId:
          '0999fd853cc7e589c975e2555f4245de6bdf6ca5c9edba265ca2d599139b04c4',
        refBlockTimestamp: '2022-06-28T13:40:34.000',
        expireSeconds: 600,
      }
    );
    console.info(JSON.stringify(t));
  });

  test('signMessage', async () => {
    const sig = signMessage(
      'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      '0x1234'
    );
    console.info(sig);

    const pub = verifySignature(
      'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      sig,
      '0x1234'
    );
    console.info(pub);
    expect(pub).toStrictEqual(
      'EOS5uHXgWKzQExL2Lhu9y8716B4dkYL4T6oUq8J9FrY6EDB79naYF'
    );
  });

  // Test verifySignature with serializedContextFreeData (lines 164, 171-177 in api.ts)
  test('verifySignature with context free data', async () => {
    const chainId =
      'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12';
    const serializedTx = '1234abcd';
    const contextFreeData = '5678ef12';

    const sig = signMessage(
      chainId,
      '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      serializedTx
    );

    const pub = verifySignature(chainId, sig, serializedTx, contextFreeData);
    expect(typeof pub).toBe('string');
    expect(pub.startsWith('EOS')).toBe(true);
  });

  test('signSerializedTransaction', async () => {
    const wallet = new WaxWallet();
    const txParams = {
      privateKey: '5KXHUFNZGMsNEFzzrCis1RJdtg5wjL941a1vAwAjmgHEektrZBj',
      data: {
        type: 2,
        abis: [
          {
            abi: [],
            accountName: 'atomicmarket',
          },
        ],
        chainId:
          '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        requiredKeys: [],
        serializedTransaction:
          '3d1e0d667dd828f0ae1600000000029015bc46222769360000f5fa4485a6410130c4a42e239de8ad00000000a8ed323208d6082b00000000009015bc4622276936000000dcdcd4b2e30130c4a42e239de8ad00000000a8ed32321830c4a42e239de8ad8096980000000000085741580000000000',
      },
    };
    const res = await wallet.signTransaction(txParams);
    console.log(res);
    expect(res.signatures.toString()).toBe(
      'SIG_K1_KemtyEN4bW5JFa3zq9aHUsuy9PXBMmBdgoAJ1XJq2j3p6mHzmyNb5y5kC3G1zPMVrw5zT4DqNh2cUpuad4M4g4kpHuyW3A'
    );
  });
});
