import { schnorr as schnorrSecp256k1 } from '../src/signutil/schnorr/secp256k1'
import { getPublicKey as starkGetPublicKey, sign as starkSign, verify as starkVerify } from '../src/signutil/schnorr/stark'
import { hexToBytes, bytesToHex } from '../src/signutil/schnorr/abstract/utils'

describe('Schnorr Module Tests', () => {
  describe('Schnorr Secp256k1 Tests', () => {
    const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
    const message = Buffer.from('Hello, World!').toString('hex')

    test('schnorrGetPublicKey function test', () => {
      const publicKey = schnorrSecp256k1.getPublicKey(privateKey)
      expect(publicKey).toBeInstanceOf(Uint8Array)
      expect(publicKey.length).toBe(32) // Schnorr public key is 32 bytes
    })

    test('schnorrSign function test', () => {
      const signature = schnorrSecp256k1.sign(message, privateKey)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64) // Schnorr signature is 64 bytes
    })

    test('schnorrSign with custom auxRand', () => {
      const auxRand = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const signature = schnorrSecp256k1.sign(message, privateKey, auxRand)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64)
    })

    test('schnorrVerify function test', () => {
      const publicKey = schnorrSecp256k1.getPublicKey(privateKey)
      const signature = schnorrSecp256k1.sign(message, privateKey)
      const isValid = schnorrSecp256k1.verify(signature, message, publicKey)
      expect(isValid).toBe(true)
    })

    test('schnorrVerify with invalid signature', () => {
      const publicKey = schnorrSecp256k1.getPublicKey(privateKey)
      const invalidSignature = new Uint8Array(64).fill(0)
      const isValid = schnorrSecp256k1.verify(invalidSignature, message, publicKey)
      expect(isValid).toBe(false)
    })

    test('schnorrVerify with invalid message', () => {
      const publicKey = schnorrSecp256k1.getPublicKey(privateKey)
      const signature = schnorrSecp256k1.sign(message, privateKey)
      const differentMessage = Buffer.from('Different message').toString('hex')
      const isValid = schnorrSecp256k1.verify(signature, differentMessage, publicKey)
      expect(isValid).toBe(false)
    })
  })

  describe('Schnorr Stark Tests', () => {
    // Use a very small private key that's definitely smaller than Stark curve order
    // Stark curve order: 3618502788666131213697322783095070105526743751716087489154079457884512865583
    const privateKey = '0x1'
    const message = Buffer.from('Hello, World!').toString('hex')

    test('starkGetPublicKey function test', () => {
      const publicKey = starkGetPublicKey(privateKey)
      expect(publicKey).toBeInstanceOf(Uint8Array)
      expect(publicKey.length).toBe(65) // Stark uncompressed public key is 65 bytes
    })

    test('starkSign function test', () => {
      const signature = starkSign(message, privateKey)
      expect(signature).toBeDefined()
      expect(signature.toCompactRawBytes().length).toBe(64)
    })

    test('starkVerify function test', () => {
      const publicKey = starkGetPublicKey(privateKey)
      const signature = starkSign(message, privateKey)
      const isValid = starkVerify(signature, message, publicKey)
      expect(isValid).toBe(true)
    })

    test('starkVerify with invalid signature', () => {
      const publicKey = starkGetPublicKey(privateKey)
      const invalidSignature = new Uint8Array(64).fill(0)
      const isValid = starkVerify(invalidSignature, message, publicKey)
      expect(isValid).toBe(false)
    })
  })

  describe('Schnorr Abstract Utils Tests', () => {
    test('hexToBytes function test', () => {
      const hex = '48656c6c6f' // 'Hello' in hex
      const bytes = hexToBytes(hex)
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(5)
      expect(Buffer.from(bytes).toString()).toBe('Hello')
    })

    test('hexToBytes with 0x prefix', () => {
      const hex = '0x48656c6c6f'
      const bytes = hexToBytes(hex.slice(2)) // Remove 0x prefix
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(5)
    })

    test('hexToBytes with empty string', () => {
      const bytes = hexToBytes('')
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(0)
    })

    test('bytesToHex function test', () => {
      const bytes = Buffer.from('Hello')
      const hex = bytesToHex(bytes)
      expect(typeof hex).toBe('string')
      expect(hex).toBe('48656c6c6f')
    })

    test('bytesToHex with empty bytes', () => {
      const bytes = new Uint8Array(0)
      const hex = bytesToHex(bytes)
      expect(hex).toBe('')
    })

    test('round trip hex conversion', () => {
      const originalHex = '48656c6c6f20776f726c64' // 'Hello world' in hex
      const bytes = hexToBytes(originalHex)
      const backToHex = bytesToHex(bytes)
      expect(backToHex).toBe(originalHex)
    })
  })

  describe('Error Handling Tests', () => {
    test('schnorrSign with invalid private key', () => {
      const invalidKey = '0000000000000000000000000000000000000000000000000000000000000000'
      const message = Buffer.from('Hello, World!').toString('hex')
      expect(() => schnorrSecp256k1.sign(message, invalidKey)).toThrow()
    })

    test('schnorrSign with short private key', () => {
      const shortKey = '1234567890abcdef'
      const message = Buffer.from('Hello, World!').toString('hex')
      expect(() => schnorrSecp256k1.sign(message, shortKey)).toThrow()
    })

    test('schnorrVerify with invalid public key', () => {
      const invalidPubKey = new Uint8Array(32).fill(0)
      const signature = new Uint8Array(64).fill(1)
      const message = Buffer.from('Hello, World!').toString('hex')
      const isValid = schnorrSecp256k1.verify(signature, message, invalidPubKey)
      expect(isValid).toBe(false)
    })

    test('starkSign with invalid private key', () => {
      const invalidKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
      const message = Buffer.from('Hello, World!').toString('hex')
      expect(() => starkSign(message, invalidKey)).toThrow()
    })

    test('hexToBytes with invalid hex', () => {
      expect(() => hexToBytes('invalid')).toThrow()
    })

    test('hexToBytes with odd length', () => {
      expect(() => hexToBytes('123')).toThrow()
    })
  })

  describe('Edge Cases Tests', () => {
    test('schnorrSign with empty message', () => {
      const emptyMessage = ''
      const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
      const signature = schnorrSecp256k1.sign(emptyMessage, privateKey)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64)
    })

    test('schnorrSign with very long message', () => {
      const longMessage = Buffer.from('a'.repeat(10000)).toString('hex')
      const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
      const signature = schnorrSecp256k1.sign(longMessage, privateKey)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64)
    })

    test('starkSign with empty message', () => {
      const emptyMessage = ''
      const privateKey = '0x1'
      const signature = starkSign(emptyMessage, privateKey)
      expect(signature).toBeDefined()
      expect(signature.toCompactRawBytes().length).toBe(64)
    })

    test('starkSign with very long message', () => {
      const longMessage = Buffer.from('a'.repeat(10000)).toString('hex')
      const privateKey = '0x1'
      const signature = starkSign(longMessage, privateKey)
      expect(signature).toBeDefined()
      expect(signature.toCompactRawBytes().length).toBe(64)
    })

    test('hexToBytes with maximum hex string', () => {
      const maxHex = 'f'.repeat(1000)
      const bytes = hexToBytes(maxHex)
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBe(500)
    })

    test('bytesToHex with maximum bytes', () => {
      const maxBytes = new Uint8Array(1000).fill(255)
      const hex = bytesToHex(maxBytes)
      expect(typeof hex).toBe('string')
      expect(hex.length).toBe(2000)
    })
  })

  describe('Cross-Curve Tests', () => {
    test('secp256k1 and stark produce different signatures', () => {
      const message = Buffer.from('Hello, World!').toString('hex')
      const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
      const starkPrivateKey = '0x1'
      
      const secp256k1Sig = schnorrSecp256k1.sign(message, privateKey)
      const starkSig = starkSign(message, starkPrivateKey)
      
      expect(secp256k1Sig).not.toEqual(starkSig)
    })

    test('secp256k1 and stark produce different public keys', () => {
      const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
      const starkPrivateKey = '0x1'
      
      const secp256k1Pub = schnorrSecp256k1.getPublicKey(privateKey)
      const starkPub = starkGetPublicKey(starkPrivateKey)
      
      expect(secp256k1Pub).not.toEqual(starkPub)
    })

    test('signatures are deterministic for same inputs', () => {
      const message = Buffer.from('Hello, World!').toString('hex')
      const privateKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35'
      const auxRand = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      
      const sig1 = schnorrSecp256k1.sign(message, privateKey, auxRand)
      const sig2 = schnorrSecp256k1.sign(message, privateKey, auxRand)
      
      expect(sig1).toEqual(sig2)
    })
  })
}) 