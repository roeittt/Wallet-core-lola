import {
  tinySecp256k1Interface,
  BIP32Interface,
  fromSeed,
  fromBase58,
  fromPublicKey,
  fromPrivateKey,
  fromSeedV2,
} from '../src/bip32'

describe('BIP32 Module Tests', () => {
  describe('BIP32 Basic Tests', () => {
    test('fromSeed function test', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const result = fromSeed(seed)
      expect(result).toBeDefined()
      expect(result.chainCode).toBeInstanceOf(Buffer)
      expect(result.publicKey).toBeInstanceOf(Buffer)
      expect(result.privateKey).toBeInstanceOf(Buffer)
    })

    test('fromSeed with custom network', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const customNetwork = {
        wif: 0x80,
        bip32: {
          public: 0x0488b21e,
          private: 0x0488ade4,
        },
      }
      const result = fromSeed(seed, customNetwork)
      expect(result).toBeDefined()
      expect(result.network).toEqual(customNetwork)
    })

    test('fromBase58 function test', () => {
      // This is a valid BIP32 extended private key
      const xpriv = 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
      const result = fromBase58(xpriv)
      expect(result).toBeDefined()
      expect(result.chainCode).toBeInstanceOf(Buffer)
      expect(result.publicKey).toBeInstanceOf(Buffer)
      expect(result.privateKey).toBeInstanceOf(Buffer)
    })

    test('fromPublicKey function test', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const chainCode = Buffer.from('873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508', 'hex')
      const result = fromPublicKey(publicKey, chainCode)
      expect(result).toBeDefined()
      expect(result.publicKey).toBeInstanceOf(Buffer)
      expect(result.privateKey).toBeUndefined() // Should be neutered
    })

    test('fromPrivateKey function test', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const chainCode = Buffer.from('873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508', 'hex')
      const result = fromPrivateKey(privateKey, chainCode)
      expect(result).toBeDefined()
      expect(result.privateKey).toBeInstanceOf(Buffer)
      expect(result.publicKey).toBeInstanceOf(Buffer)
    })

    test('fromSeedV2 function test', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const result = fromSeedV2(seed, "m/44'/0'/0'/0/0")
      expect(result).toBeDefined()
      expect(result.chainCode).toBeInstanceOf(Uint8Array)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.privateKey).toBeInstanceOf(Uint8Array)
    })
  })

  describe('BIP32 Interface Tests', () => {
    let bip32: BIP32Interface

    beforeEach(() => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      bip32 = fromSeed(seed)
    })

    test('BIP32 properties test', () => {
      expect(bip32.chainCode).toBeInstanceOf(Buffer)
      expect(bip32.chainCode.length).toBe(32)
      expect(bip32.publicKey).toBeInstanceOf(Buffer)
      expect(bip32.privateKey).toBeInstanceOf(Buffer)
      expect(bip32.depth).toBe(0)
      expect(bip32.index).toBe(0)
      expect(bip32.identifier).toBeInstanceOf(Buffer)
      expect(bip32.fingerprint).toBeInstanceOf(Buffer)
      expect(bip32.lowR).toBeDefined()
      expect(bip32.network).toBeDefined()
    })

    test('isNeutered function test', () => {
      expect(bip32.isNeutered()).toBe(false)
      
      const neutered = bip32.neutered()
      expect(neutered.isNeutered()).toBe(true)
    })

    test('neutered function test', () => {
      const neutered = bip32.neutered()
      expect(neutered).toBeDefined()
      expect(neutered.publicKey).toBeInstanceOf(Buffer)
      expect(neutered.privateKey).toBeUndefined()
      expect(neutered.chainCode).toBeInstanceOf(Buffer)
    })

    test('toBase58 function test', () => {
      const base58 = bip32.toBase58()
      expect(typeof base58).toBe('string')
      expect(base58.length).toBeGreaterThan(0)
      expect(base58).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/) // Base58 characters
    })

    test('toWIF function test', () => {
      const wif = bip32.toWIF()
      expect(typeof wif).toBe('string')
      expect(wif.length).toBeGreaterThan(0)
      expect(wif).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/) // Base58 characters
    })

    test('derive function test', () => {
      const derived = bip32.derive(0)
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(1)
      expect(derived.index).toBe(0)
      expect(derived.chainCode).toBeInstanceOf(Buffer)
      expect(derived.publicKey).toBeInstanceOf(Buffer)
      expect(derived.privateKey).toBeInstanceOf(Buffer)
    })

    test('deriveHardened function test', () => {
      const derived = bip32.deriveHardened(0)
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(1)
      expect(derived.index).toBe(0x80000000) // Hardened index
      expect(derived.chainCode).toBeInstanceOf(Buffer)
      expect(derived.publicKey).toBeInstanceOf(Buffer)
      expect(derived.privateKey).toBeInstanceOf(Buffer)
    })

    test('derivePath function test', () => {
      const derived = bip32.derivePath("m/0'/1/2'")
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(3)
      expect(derived.index).toBe(0x80000002) // Last index in path
    })

    test('derivePath with absolute path', () => {
      const derived = bip32.derivePath("0'/1/2'")
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(3)
    })

    test('sign function test', () => {
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const signature = bip32.sign(hash)
      expect(Array.isArray(signature) || Buffer.isBuffer(signature)).toBe(true)
      expect(signature.length).toBeGreaterThan(0)
    })

    test('verify function test', () => {
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const signature = bip32.sign(hash)
      // Convert signature to Buffer if it's an Array
      const signatureBuffer = Array.isArray(signature) ? Buffer.from(signature) : signature
      const isValid = bip32.verify(hash, signatureBuffer)
      expect(isValid).toBe(true)
    })

    test('verify with invalid signature', () => {
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const invalidSignature = Buffer.from('0'.repeat(128), 'hex')
      const isValid = bip32.verify(hash, invalidSignature)
      expect(isValid).toBe(3) // 3 indicates invalid signature (s out of range or r/s zero)
    })
  })

  describe('BIP32 Error Handling Tests', () => {
    test('fromSeed with invalid seed length', () => {
      const shortSeed = Buffer.from('1234567890', 'hex')
      expect(() => fromSeed(shortSeed)).toThrow()
    })

    test('fromBase58 with invalid key', () => {
      expect(() => fromBase58('invalid')).toThrow()
    })

    test('derive with invalid index', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      expect(() => bip32.derive(-1)).toThrow()
    })

    test('derivePath with invalid path', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      expect(() => bip32.derivePath('invalid')).toThrow()
    })

    test('sign with neutered key', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      const neutered = bip32.neutered()
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      expect(() => neutered.sign(hash)).toThrow()
    })
  })

  describe('BIP32 Edge Cases Tests', () => {
    test('derive with maximum index', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      const derived = bip32.derive(0x7fffffff) // Maximum non-hardened index
      expect(derived).toBeDefined()
      expect(derived.index).toBe(0x7fffffff)
    })

    test('deriveHardened with maximum index', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      const derived = bip32.deriveHardened(0x7fffffff) // Maximum hardened index
      expect(derived).toBeDefined()
      expect(derived.index).toBe(0xffffffff)
    })

    test('derivePath with empty path', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      expect(() => bip32.derivePath('')).toThrow()
    })

    test('derivePath with single level', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      const derived = bip32.derivePath('m/0')
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(1)
      expect(derived.index).toBe(0)
    })

    test('derivePath with hardened single level', () => {
      const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
      const bip32 = fromSeed(seed)
      const derived = bip32.derivePath("m/0'")
      expect(derived).toBeDefined()
      expect(derived.depth).toBe(1)
      expect(derived.index).toBe(0x80000000)
    })
  })

  describe('TinySecp256k1Interface Tests', () => {
    test('isPoint function test', () => {
      const validPoint = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex')
      expect(tinySecp256k1Interface.isPoint(validPoint)).toBe(true)
      
      const invalidPoint = Buffer.from('1234567890', 'hex')
      expect(tinySecp256k1Interface.isPoint(invalidPoint)).toBe(null)
    })

    test('pointCompress function test', () => {
      const point = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const compressed = tinySecp256k1Interface.pointCompress(point, true)
      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBe(33)
      
      const uncompressed = tinySecp256k1Interface.pointCompress(point, false)
      expect(uncompressed).toBeInstanceOf(Uint8Array)
      expect(uncompressed.length).toBe(65)
    })

    test('isPrivate function test', () => {
      const validPrivate = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      expect(tinySecp256k1Interface.isPrivate(validPrivate)).toBe(true)
      
      const invalidPrivate = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
      expect(tinySecp256k1Interface.isPrivate(invalidPrivate)).toBe(false)
    })

    test('pointFromScalar function test', () => {
      const scalar = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const point = tinySecp256k1Interface.pointFromScalar(scalar, true)
      expect(point).toBeInstanceOf(Uint8Array)
      expect(point!.length).toBe(33)
    })

    test('sign function test', () => {
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const signature = tinySecp256k1Interface.sign(hash, privateKey)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBeGreaterThan(0)
    })

    test('verify function test', () => {
      const message = Buffer.from('Hello, World!')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const publicKey = tinySecp256k1Interface.pointFromScalar(privateKey, true)!
      const signature = tinySecp256k1Interface.sign(hash, privateKey)
      const isValid = tinySecp256k1Interface.verify(hash, publicKey, signature)
      expect(isValid).toBe(true)
    })
  })
}) 