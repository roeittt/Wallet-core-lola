import { base } from '@okxweb3/coin-base'
import { signUtil } from '@okxweb3/crypto-lib'
import * as sui from '../src'
import { encodeSuiPrivateKey, SuiWallet, tryDecodeSuiPrivateKey } from '../src'

declare const TextEncoder: any;
const suiWallet = new sui.SuiWallet();

describe('cryptography', () => {
  test("test getDerivedPrivateKey", async () => {
    let mnemonic = "firm reflect fade very snap bind vintage luggage peace extra boost believe";
    let wallet = new SuiWallet();
    let p = await wallet.getDerivedPath({index:0});
    let pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0xc3aea2e9e0216a21527ce9dea42b4b0c09973720042220ab1dfde85f5c277953")
    p = await wallet.getDerivedPath({index:1});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0xdaef02c4508480c020bde62be4520de33eeb57f5c3a8f19d2f1877027b91c82e")
    p = await wallet.getDerivedPath({index:2});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x0e103f2957391fab20351b7cc50240b05fe4480d7a88522ba361a78f408b4900")
    p = await wallet.getDerivedPath({index:3});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0xfaacd3baa119b65d90a6b971e3ef4df7d105d17db9871dea461b2259d0f4cd21")
    p = await wallet.getDerivedPath({index:4});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0xc4468c076dddcff4777d60ea9b48193e8768aa5c502aa63c4a4f39e626d691e8")
    p = await wallet.getDerivedPath({index:5});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x89afb35134bb3e518c68e0e1b2c1426d9a67f9c166242164e4d0d6f02929dab7")
    p = await wallet.getDerivedPath({index:6});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0xc64c33c1db7ca12a0c577dcfc1b20eaa3c36df7581024cab910b3bea26c62e0b")
    p = await wallet.getDerivedPath({index:7});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x2ece1e49991b517f493febed80bbc7b7b092bfb267181aba1a628914dcffeb27")
    p = await wallet.getDerivedPath({index:8});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x5c7761d852420785b3cb5a64f1e205b6cb6d7cd5011adf7bc71b39b0b22883e2")
    p = await wallet.getDerivedPath({index:9});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x63790f2e0c670ccd4ea83a228f316cfaa5f9d619c943630bcc1793ab5a3e3ccc")
    p = await wallet.getDerivedPath({index:10});
    pri = await wallet.getDerivedPrivateKey({mnemonic:mnemonic, hdPath:p});
    expect((await wallet.getNewAddress({privateKey:pri})).address).toEqual("0x559f2882e18007401713c26814d3457114f1b3d91ab88ce97bf9ab6ea751c136")
  });

  test('signCommonMsg', async () => {
    let wallet = new SuiWallet();
    // console.log(await wallet.getNewAddress({privateKey:"e92c7a591d70cab02100a3e7dc2d681bc39646b827a1da7e597a5f339e6f5c1e"}))

    let sig = await wallet.signCommonMsg({
      privateKey:
        'e92c7a591d70cab02100a3e7dc2d681bc39646b827a1da7e597a5f339e6f5c1e',
      message: { walletId: '123456789' },
    });
    expect(sig).toEqual(
      'bce483bb42c53e4a21c7c905c5ef1fb90b221764242b8cba6eb20ffbc61d6bbe3dbe3d7ac71e6dae73d7b1e05cddffbf076e6f266bb1790562c3566742dbad06'
    );

    sig = await wallet.signCommonMsg({
      privateKey:
        '31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a',
      message: { walletId: '123456789' },
    });
    expect(sig).toEqual(
      'c08a2f98a1aa88a301b6cb96a52567daf5af440735c00e2c5c7d1c303edab15b6fcc364fcde9e875ab029909036c6b02030ee81b53c7625ecf8f236d38ca6f08'
    );

    sig = await wallet.signCommonMsg({
      privateKey:
        '31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a',
      message: { text: '123456789' },
    });
    expect(sig).toEqual(
      'dbd5c3595938a31d0507e20e823e317a52d8e750edd3eb0d4b0068a91b48f37cd5b84c1ed897e1c969ed3c99b34de854bb66ab4129a9a2d6f2f7ce1b1cca160a'
    );

    // console.log(await wallet.getNewAddress({privateKey:"suiprivkey1qqvegc25e2rx3de999cfs3ftvu55e572cxwwsen06qg752y3gdvlq4gzdkt"}))
    // console.log(await wallet.signCommonMsg({privateKey:"suiprivkey1qqvegc25e2rx3de999cfs3ftvu55e572cxwwsen06qg752y3gdvlq4gzdkt", message:{walletId:"5E0D82CE-F00B-43AD-8576-2ADF6B51A67C"}}))
  });

  test('tryDecodeSuiPrivateKey', async () => {
    const k =
      '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a';
    const r1 = tryDecodeSuiPrivateKey(k);
    expect(r1).toEqual(k);
    const b = encodeSuiPrivateKey(k);
    const r2 = tryDecodeSuiPrivateKey(b);
    expect(r2).toEqual(k);
    let addr1 = await suiWallet.getNewAddress({ privateKey: k });
    let addr2 = await suiWallet.getNewAddress({ privateKey: b });
    expect(addr1.address).toEqual(addr2.address);
  });

  const ps: any[] = [];
  ps.push('');
  ps.push('0x');
  ps.push('124699');
  ps.push('1dfi付');
  ps.push('9000 12');
  ps.push('548yT115QRHH7Mpchg9JJ8YPX9RTKuan=548yT115QRHH7Mpchg9JJ8YPX9RTKuan ');
  ps.push(
    'L1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYAr'
  );
  ps.push('L1v');
  ps.push(
    '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b428 97a'
  );
  ps.push(
    '0x31342f041c5b54358074b457。、。9231c8a300be65e687dff020bc7779598b428 97a'
  );
  ps.push('0000000000000000000000000000000000000000000000000000000000000000');
  test('edge test', async () => {
    const wallet = new SuiWallet();
    let j = 1;
    for (let i = 0; i < ps.length; i++) {
      try {
        await wallet.getNewAddress({ privateKey: ps[i] });
      } catch (e) {
        j = j + 1;
        expect(
          (await wallet.validPrivateKey({ privateKey: ps[i] })).isValid
        ).toEqual(false);
      }
    }
    expect(j).toEqual(ps.length + 1);
  });

  test('validPrivateKey', async () => {
    const wallet = new SuiWallet();
    const privateKey = await wallet.getRandomPrivateKey();
    let res = await wallet.validPrivateKey({ privateKey: privateKey });
    expect(res.isValid).toEqual(true);
    res = await wallet.validPrivateKey({ privateKey: '' });
    expect(res.isValid).toEqual(false);
    res = await wallet.validPrivateKey({ privateKey: 'AABBXX' });
    expect(res.isValid).toEqual(false);
  });

  test('decoder or encoder SuiPrivateKey exception', async () => {
    let k =
      'suiprivkey1qqcngtcyr3d4gdvqwj690y33ez3sp0n9u6ralupqh3mhjkvtg2yh5ky0e6gbbbb';
    expect(() => encodeSuiPrivateKey(k)).toThrow('Unknown letter: "b"');
    k = '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897axx';
    expect(() => encodeSuiPrivateKey(k)).toThrow('invalid key');
    k =
      '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897affee';
    expect(() => encodeSuiPrivateKey(k)).toThrow('invalid key');
    k =
      'suiprivkey1qqcngtcyr3d4gdvqwj690y33ez3sp0n9u6ralupqh3mhjkvtg2yh4llwnhvjm3';
    expect(() => encodeSuiPrivateKey(k)).toThrow('invalid key');
    k = '0X31342F041C5B54358074B4579231C8A300BE65E687DFF020BC7779598B42897A';
    expect(tryDecodeSuiPrivateKey(k)).toEqual(k);
    k =
      '0X31342F041C5B54358074B4579231C8A300BE65E687DFF020BC7779598B42897A31342F041C5B54358074B4579231C8A300BE65E687DFF020BC7779598B42897A';
    expect(() => tryDecodeSuiPrivateKey(k)).toThrow('invalid key');
    k =
      '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a31342f041c5b5435807';
    expect(() => tryDecodeSuiPrivateKey(k)).toThrow('invalid key');
    k =
      'suiprivkey1qqcngtcyr3d4gdvqwj690y33ez3sp0n9u6ralupqh3mhjkvtg2yh5ky0e6g22222';
    expect(() => tryDecodeSuiPrivateKey(k)).toThrow('Invalid checksum in');
    k = '';
    expect(() => tryDecodeSuiPrivateKey(k)).toThrow(
      'invalid private key prefix'
    );
    k = '';
    expect(() => encodeSuiPrivateKey(k)).toThrow('Invalid bytes length');
  });

  test('signMessage', async () => {
    const message = base.toUtf8('ok');
    let sign1 = await suiWallet.signMessage({
      privateKey:
        '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b42897a',
      data: message,
    });
    let sign2 = await suiWallet.signMessage({
      privateKey:
        'suiprivkey1qqcngtcyr3d4gdvqwj690y33ez3sp0n9u6ralupqh3mhjkvtg2yh5ky0e6g',
      data: message,
    });
    console.log(sign2);
    expect(sign1).toEqual(sign2);
    expect(
      'AGkeJ/OA1foA5BUWpJwa3dxopk/34qC0b3MwVAm38nngneS9mtHs8wSTzCN0ZFukHJ5V8VkGEeEIHuKGIi8DnAi8xcPyFlpe4w6DaHjUIF/RAjIloXaXfRqE1qQi6eJ9LQ=='
    ).toEqual(sign2);
  });

  test('getDerivedPrivateKey', async () => {
    let mnemonic =
      'tumble hood curious hidden harvest palace elevator crisp manual anxiety recipe occur';
    let param = {
      mnemonic: mnemonic,
      hdPath: await suiWallet.getDerivedPath({ index: 0 }),
    };
    let privateKey = await suiWallet.getDerivedPrivateKey(param);
    console.info(privateKey);
    expect(privateKey).toEqual(
      'suiprivkey1qrjadfrsrmcrz2gt8qm7lv37h5jm6pre3was8aajvx4dvy6faytw7ff90jc'
    );
    let addr = await suiWallet.getNewAddress({ privateKey: privateKey });
    console.info(addr);
    expect(addr.address).toEqual(
      '0x215d3a67d951ebd5b453b440497917b5fac2890fc7f18358322d372e2f13045d'
    );
  });

  test('ed25519', async () => {
    const b64Key = 'vdgPRCGWgUKzpKbCeh2Eo2IzhNCFoEqJXxCf2NSc7wo=';
    const kp = sui.Ed25519Keypair.fromSeed(base.fromBase64(b64Key));
    expect(kp.getPublicKey().toBase64()).toEqual(
      'Mqwo/EgdY+Yox/Kf0G3Yy7/Wyj13NCshwrBUxWbDITc='
    );
    const address3 = sui.getAddressFromPublic(
      'aFstb5h4TddjJJryHJL1iMob6AxAqYxVv3yRt05aweI='
    );
    expect(address3).toEqual(
      '0x936accb491f0facaac668baaedcf4d0cfc6da1120b66f77fa6a43af718669973'
    );

    const signData = new TextEncoder().encode('hello world');
    const signature = kp.signData(signData);
    const isValid = signUtil.ed25519.verify(
      signData,
      signature,
      kp.getPublicKey().toBytes()
    );
    expect(isValid).toBeTruthy();

    const randomBytes = base.randomBytes(32);
    const kp2 = sui.Ed25519Keypair.fromSeed(randomBytes);
    console.info(base.toBase64(randomBytes));
    console.info(kp2.getPublicKey().toSuiAddress());
  });

  test('sign', async () => {
    const b64Key = 'vdgPRCGWgUKzpKbCeh2Eo2IzhNCFoEqJXxCf2NSc7wo=';
    const kp = sui.Ed25519Keypair.fromSeed(base.fromBase64(b64Key));
    expect(kp.getPublicKey().toSuiAddress()).toEqual(
      '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40'
    );

    // 0x2::coin::Coin<0x2::sui::SUI>
    const signer = new sui.RawSigner(kp);
    const signedTransaction = await signer.signTransactionBlock({
      transactionBlock: base.fromBase64(
        'AAACAAighgEAAAAAAAAgIV06Z9lR69W0U7RASXkXtfrCiQ/H8YNYMi03Li8TBF0CAgABAQAAAQECAAABAQAR4MaBQEZz3bFskpqFKzUrk4anRFX5Y41MafTFfX9fGgHN4+fOaLYvXARGuBlG7rRD9iIoqxIQYa/vv6w/wjG/7gQAAAAAAAAAICG5uOsw6cY6in+2K/hch8ArgZKhBGB2iSfCszfYYDC1EeDGgUBGc92xbJKahSs1K5OGp0RV+WONTGn0xX1/XxoBAAAAAAAAAG4AAAAAAAAAAWQAAAAAAAAA'
      ),
    });
    console.log('signedTransaction', signedTransaction);
    expect(signedTransaction.signature).toEqual(
      'APx82P4ipiA95G3ee8QIb1qU49y8ae2dhwXceHgBYb6XTDiw8hhHPXjF7gg/XTpvpRxivQEczl5oqL8Bmzdekg4yrCj8SB1j5ijH8p/QbdjLv9bKPXc0KyHCsFTFZsMhNw=='
    );
    expect(signedTransaction.hash).toEqual(
      '2tcKwnWBHb2LTK32p1HWHdb5WYPvjC3K9TZFFUhtBfBg'
    );
  });

  test('signmsg', async () => {
    const b64Key = 'vdgPRCGWgUKzpKbCeh2Eo2IzhNCFoEqJXxCf2NSc7wo=';
    const kp = sui.Ed25519Keypair.fromSeed(base.fromBase64(b64Key));
    console.log(
      'kp.getPublicKey().toSuiAddress()',
      kp.getPublicKey().toSuiAddress()
    );
    expect(kp.getPublicKey().toSuiAddress()).toEqual(
      '0x1f1bfbf2d571d4f15bf7803f81e43f10bcf78ef9473ba69ff3e4664477b54c40'
    );
    // 0x2::coin::Coin<0x2::sui::SUI>
    const signer = new sui.RawSigner(kp);
    const sign = await signer.signMessage({
      message: Buffer.from('ok', 'utf-8'),
    });
    console.log('sign', sign);
    expect(
      'AKjEhbXaV0LysntwUXPm4AeB+0ncPg+4kf4y0qXpHCQi0ppkdSMFpS7tDWMF6TafOeixO0utkLAqVyHcfJoqSg0yrCj8SB1j5ijH8p/QbdjLv9bKPXc0KyHCsFTFZsMhNw=='
    ).toEqual(sign);
  });

  test('Ed25519Keypair.fromSecretKey - valid 64-byte secret key', () => {
    // Create a valid 64-byte secret key (32-byte seed + 32-byte public key)
    const seed = base.randomBytes(32);
    const kp1 = sui.Ed25519Keypair.fromSeed(seed);

    // Generate 64-byte secret key format
    const secretKey = new Uint8Array(64);
    secretKey.set(seed, 0);
    secretKey.set(kp1.getPublicKey().toBytes(), 32);

    const kp2 = sui.Ed25519Keypair.fromSecretKey(secretKey);

    // Both keypairs should have the same public key
    expect(kp1.getPublicKey().toBase64()).toEqual(
      kp2.getPublicKey().toBase64()
    );
    expect(kp2.getKeyScheme()).toEqual('ED25519');
  });

  test('Ed25519Keypair.fromSecretKey - with skipValidation option', () => {
    // Create a valid 64-byte secret key
    const seed = base.randomBytes(32);
    const kp1 = sui.Ed25519Keypair.fromSeed(seed);

    const secretKey = new Uint8Array(64);
    secretKey.set(seed, 0);
    secretKey.set(kp1.getPublicKey().toBytes(), 32);

    // Should work with skipValidation: true
    const kp2 = sui.Ed25519Keypair.fromSecretKey(secretKey, {
      skipValidation: true,
    });
    expect(kp1.getPublicKey().toBase64()).toEqual(
      kp2.getPublicKey().toBase64()
    );

    // Should work with skipValidation: false (explicit)
    const kp3 = sui.Ed25519Keypair.fromSecretKey(secretKey, {
      skipValidation: false,
    });
    expect(kp1.getPublicKey().toBase64()).toEqual(
      kp3.getPublicKey().toBase64()
    );
  });

  test('Ed25519Keypair.fromSecretKey - 32-byte input error', () => {
    const seed = base.randomBytes(32);

    expect(() => {
      sui.Ed25519Keypair.fromSecretKey(seed);
    }).toThrow(
      'Wrong secretKey size. Expected 64 bytes, got 32. Similar function exists: fromSeed(seed: Uint8Array)'
    );
  });

  test('Ed25519Keypair.fromSecretKey - invalid length errors', () => {
    // Test various invalid lengths
    const invalidLengths = [16, 48, 96, 128];

    invalidLengths.forEach((length) => {
      const invalidSecretKey = base.randomBytes(length);
      expect(() => {
        sui.Ed25519Keypair.fromSecretKey(invalidSecretKey);
      }).toThrow(`Wrong secretKey size. Expected 64 bytes, got ${length}.`);
    });
  });

  test('Ed25519Keypair.fromSeed - invalid seed length', () => {
    // Test various invalid seed lengths
    const invalidLengths = [16, 24, 48, 64];

    invalidLengths.forEach((length) => {
      const invalidSeed = base.randomBytes(length);
      expect(() => {
        sui.Ed25519Keypair.fromSeed(invalidSeed);
      }).toThrow(`Wrong seed size. Expected 32 bytes, got ${length}.`);
    });
  });

  test('Ed25519Keypair.signData method', () => {
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);

    // Test signing data directly
    const testData = new TextEncoder().encode('test message');
    const signature = kp.signData(testData);

    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64); // Ed25519 signatures are 64 bytes

    // Verify the signature using the crypto library
    const isValid = signUtil.ed25519.verify(
      testData,
      signature,
      kp.getPublicKey().toBytes()
    );
    expect(isValid).toBe(true);
  });

  test('Ed25519Keypair comprehensive functionality', () => {
    // Test constructor and basic functionality
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);

    // Test getKeyScheme
    expect(kp.getKeyScheme()).toBe('ED25519');

    // Test getPublicKey
    const publicKey = kp.getPublicKey();
    expect(publicKey).toBeInstanceOf(sui.Ed25519PublicKey);

    // Test signData with different data types
    const data1 = new TextEncoder().encode('hello');
    const data2 = new TextEncoder().encode('world');

    const sig1 = kp.signData(data1);
    const sig2 = kp.signData(data2);

    // Different data should produce different signatures
    expect(sig1).not.toEqual(sig2);

    // Both signatures should be valid
    expect(signUtil.ed25519.verify(data1, sig1, publicKey.toBytes())).toBe(
      true
    );
    expect(signUtil.ed25519.verify(data2, sig2, publicKey.toBytes())).toBe(
      true
    );

    // Cross-verification should fail
    expect(signUtil.ed25519.verify(data1, sig2, publicKey.toBytes())).toBe(
      false
    );
    expect(signUtil.ed25519.verify(data2, sig1, publicKey.toBytes())).toBe(
      false
    );
  });

  test('bytesEqual function', () => {
    // Test equal arrays
    const bytes1 = new Uint8Array([1, 2, 3, 4]);
    const bytes2 = new Uint8Array([1, 2, 3, 4]);
    expect(sui.bytesEqual(bytes1, bytes2)).toBe(true);

    // Test same reference
    expect(sui.bytesEqual(bytes1, bytes1)).toBe(true);

    // Test different lengths
    const bytes3 = new Uint8Array([1, 2, 3]);
    expect(sui.bytesEqual(bytes1, bytes3)).toBe(false);

    // Test different values
    const bytes4 = new Uint8Array([1, 2, 3, 5]);
    expect(sui.bytesEqual(bytes1, bytes4)).toBe(false);

    // Test empty arrays
    const empty1 = new Uint8Array([]);
    const empty2 = new Uint8Array([]);
    expect(sui.bytesEqual(empty1, empty2)).toBe(true);

    // Test different at first position
    const bytes5 = new Uint8Array([2, 2, 3, 4]);
    expect(sui.bytesEqual(bytes1, bytes5)).toBe(false);

    // Test different at last position
    const bytes6 = new Uint8Array([1, 2, 3, 0]);
    expect(sui.bytesEqual(bytes1, bytes6)).toBe(false);
  });

  test('Ed25519PublicKey constructor and methods', () => {
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);
    const publicKey = kp.getPublicKey();

    // Test constructor with base64 string
    const base64PubKey = publicKey.toBase64();
    const pubKeyFromB64 = new sui.Ed25519PublicKey(base64PubKey);
    expect(pubKeyFromB64.equals(publicKey)).toBe(true);

    // Test constructor with Uint8Array
    const bytes = publicKey.toBytes();
    const pubKeyFromBytes = new sui.Ed25519PublicKey(bytes);
    expect(pubKeyFromBytes.equals(publicKey)).toBe(true);

    // Test constructor with iterable
    const pubKeyFromIterable = new sui.Ed25519PublicKey(Array.from(bytes));
    expect(pubKeyFromIterable.equals(publicKey)).toBe(true);

    // Test toBase64 and toString
    expect(publicKey.toBase64()).toBe(publicKey.toString());
    expect(typeof publicKey.toBase64()).toBe('string');

    // Test toBytes
    expect(publicKey.toBytes()).toBeInstanceOf(Uint8Array);
    expect(publicKey.toBytes().length).toBe(32);

    // Test toSuiAddress
    const address = publicKey.toSuiAddress();
    expect(typeof address).toBe('string');
    expect(address.startsWith('0x')).toBe(true);
    expect(address.length).toBe(66); // 0x + 64 hex chars

    // Test equals with different keys
    const anotherSeed = base.randomBytes(32);
    const anotherKp = sui.Ed25519Keypair.fromSeed(anotherSeed);
    const anotherPublicKey = anotherKp.getPublicKey();
    expect(publicKey.equals(anotherPublicKey)).toBe(false);
  });

  test('Ed25519PublicKey constructor error cases', () => {
    // Test invalid length - too short
    const shortBytes = base.randomBytes(16);
    expect(() => {
      new sui.Ed25519PublicKey(shortBytes);
    }).toThrow('Invalid public key input. Expected 32 bytes, got 16');

    // Test invalid length - too long
    const longBytes = base.randomBytes(64);
    expect(() => {
      new sui.Ed25519PublicKey(longBytes);
    }).toThrow('Invalid public key input. Expected 32 bytes, got 64');

    // Test empty array
    expect(() => {
      new sui.Ed25519PublicKey(new Uint8Array(0));
    }).toThrow('Invalid public key input. Expected 32 bytes, got 0');

    // Test invalid base64 string (will fail in fromB64)
    expect(() => {
      new sui.Ed25519PublicKey('invalid_base64!@#$');
    }).toThrow();
  });

  test('publicKeyFromSerialized function', () => {
    // Test valid ED25519 scheme
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);
    const publicKey = kp.getPublicKey();
    const base64PubKey = publicKey.toBase64();

    const deserializedPubKey = sui.publicKeyFromSerialized(
      'ED25519',
      base64PubKey
    );
    expect(deserializedPubKey).toBeInstanceOf(sui.Ed25519PublicKey);
    expect(deserializedPubKey.equals(publicKey)).toBe(true);

    // Test unknown scheme
    expect(() => {
      sui.publicKeyFromSerialized('UNKNOWN_SCHEME' as any, base64PubKey);
    }).toThrow('Unknown public key schema');

    // Test invalid scheme
    expect(() => {
      sui.publicKeyFromSerialized('Secp256k1' as any, base64PubKey);
    }).toThrow('Unknown public key schema');
  });

  test('Signature serialization and deserialization', () => {
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);
    const publicKey = kp.getPublicKey();

    // Create a signature
    const testData = new TextEncoder().encode('test message');
    const signature = kp.signData(testData);

    // Test toSerializedSignature
    const signaturePair = {
      signatureScheme: 'ED25519' as const,
      signature: signature,
      pubKey: publicKey,
    };

    const serialized = sui.toSerializedSignature(signaturePair);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);

    // Test fromSerializedSignature
    const deserialized = sui.fromSerializedSignature(serialized);
    expect(deserialized.signatureScheme).toBe('ED25519');
    expect(deserialized.signature).toEqual(signature);
    expect(deserialized.pubKey.equals(publicKey)).toBe(true);

    // Test round-trip
    const reserializedPair = {
      signatureScheme: deserialized.signatureScheme,
      signature: deserialized.signature,
      pubKey: deserialized.pubKey,
    };
    const reserialized = sui.toSerializedSignature(reserializedPair);
    expect(reserialized).toBe(serialized);
  });

  test('Signature scheme constants', () => {
    // Test SIGNATURE_SCHEME_TO_FLAG
    expect(sui.SIGNATURE_SCHEME_TO_FLAG.ED25519).toBe(0x00);
    expect(sui.SIGNATURE_SCHEME_TO_FLAG.Secp256k1).toBe(0x01);

    // Test SIGNATURE_FLAG_TO_SCHEME
    expect(sui.SIGNATURE_FLAG_TO_SCHEME[0x00]).toBe('ED25519');
    expect(sui.SIGNATURE_FLAG_TO_SCHEME[0x01]).toBe('Secp256k1');
  });

  test('fromSerializedSignature error cases', () => {
    // Test with invalid base64
    expect(() => {
      sui.fromSerializedSignature('invalid_base64!@#$');
    }).toThrow();

    // Test with empty string
    expect(() => {
      sui.fromSerializedSignature('');
    }).toThrow();

    // Test with too short data
    const shortData = base.toBase64(new Uint8Array([0x00])); // Only flag, no signature or pubkey
    expect(() => {
      sui.fromSerializedSignature(shortData);
    }).toThrow();
  });

  test('Signature integration with different data', () => {
    const seed = base.randomBytes(32);
    const kp = sui.Ed25519Keypair.fromSeed(seed);
    const publicKey = kp.getPublicKey();

    // Test with different message types
    const messages = [
      new TextEncoder().encode('hello world'),
      new Uint8Array([1, 2, 3, 4, 5]),
      new TextEncoder().encode(''),
      base.randomBytes(100),
    ];

    messages.forEach((message) => {
      const signature = kp.signData(message);

      const signaturePair = {
        signatureScheme: 'ED25519' as const,
        signature: signature,
        pubKey: publicKey,
      };

      const serialized = sui.toSerializedSignature(signaturePair);
      const deserialized = sui.fromSerializedSignature(serialized);

      // Verify signature is still valid after serialization round-trip
      expect(
        signUtil.ed25519.verify(
          message,
          deserialized.signature,
          deserialized.pubKey.toBytes()
        )
      ).toBe(true);
    });
  });
});
