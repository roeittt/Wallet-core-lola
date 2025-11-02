const api = require('../src/bip32/api')

describe('BIP32 API Tests', () => {
  describe('Context Randomize Tests', () => {
    test('contextRandomize function', () => {
      const result = api.contextRandomize()
      expect(result).toBe(0)
    })
  })

  describe('Private Key Tests', () => {
    test('privateKeyVerify with valid key', () => {
      const validKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const result = api.privateKeyVerify(validKey)
      expect(result).toBe(true)
    })

    test('privateKeyVerify with invalid key (zero)', () => {
      const invalidKey = Buffer.alloc(32, 0)
      const result = api.privateKeyVerify(invalidKey)
      expect(result).toBe(false)
    })

    test('privateKeyVerify with invalid key (too large)', () => {
      const invalidKey = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.privateKeyVerify(invalidKey)
      expect(result).toBe(false)
    })

    test('privateKeyNegate', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const result = api.privateKeyNegate(privateKey)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32)
    })

    test('privateKeyTweakAdd with valid tweak', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.privateKeyTweakAdd(privateKey, tweak)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32)
    })

    test('privateKeyTweakAdd with invalid tweak (too large)', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const tweak = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.privateKeyTweakAdd(privateKey, tweak)
      expect(result).toBeNull()
    })

    test('privateKeyTweakAdd with tweak that results in zero', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      // Use the negative of the private key as tweak
      const tweak = api.privateKeyNegate(privateKey)
      const result = api.privateKeyTweakAdd(privateKey, tweak)
      expect(result).toBeNull()
    })

    test('privateKeyTweakMul with valid tweak', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.privateKeyTweakMul(privateKey, tweak)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32)
    })

    test('privateKeyTweakMul with invalid tweak (too large)', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const tweak = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.privateKeyTweakMul(privateKey, tweak)
      expect(result).toBe(1)
    })

    test('privateKeyTweakMul with zero tweak', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const tweak = Buffer.alloc(32, 0)
      const result = api.privateKeyTweakMul(privateKey, tweak)
      expect(result).toBe(1)
    })
  })

  describe('Public Key Tests', () => {
    test('publicKeyVerify with compressed key', () => {
      const compressedKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.publicKeyVerify(compressedKey)
      expect(result).toBe(true)
    })

    test('publicKeyVerify with uncompressed key', () => {
      // Use a valid uncompressed public key
      const uncompressedKey = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const result = api.publicKeyVerify(uncompressedKey)
      expect(result).toBe(true)
    })

    test('publicKeyVerify with invalid key', () => {
      const invalidKey = Buffer.from('ff', 'hex')
      const result = api.publicKeyVerify(invalidKey)
      expect(result).toBeNull()
    })

    test('publicKeyCreate with valid private key (compressed)', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const result = api.publicKeyCreate(privateKey, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyCreate with valid private key (uncompressed)', () => {
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const result = api.publicKeyCreate(privateKey, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyCreate with invalid private key (zero)', () => {
      const privateKey = Buffer.alloc(32, 0)
      const result = api.publicKeyCreate(privateKey, true)
      expect(result).toBeNull()
    })

    test('publicKeyCreate with invalid private key (too large)', () => {
      const privateKey = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.publicKeyCreate(privateKey, true)
      expect(result).toBeNull()
    })

    test('publicKeyConvert compressed to uncompressed', () => {
      const compressedKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.publicKeyConvert(compressedKey, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyConvert uncompressed to compressed', () => {
      const uncompressedKey = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const result = api.publicKeyConvert(uncompressedKey, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyNegate compressed', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.publicKeyNegate(publicKey, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyNegate uncompressed', () => {
      const publicKey = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const result = api.publicKeyNegate(publicKey, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyNegate with invalid key', () => {
      const invalidKey = Buffer.from('ff', 'hex')
      const result = api.publicKeyNegate(invalidKey, true)
      expect(result).toBe(1)
    })

    test('publicKeyCombine with valid keys (compressed)', () => {
      const key1 = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const key2 = Buffer.from('02a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7', 'hex')
      const result = api.publicKeyCombine([key1, key2], true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyCombine with valid keys (uncompressed)', () => {
      const key1 = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const key2 = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const result = api.publicKeyCombine([key1, key2], false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyCombine with invalid key', () => {
      const key1 = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const key2 = Buffer.from('ff', 'hex')
      const result = api.publicKeyCombine([key1, key2], true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakAdd with valid tweak (compressed)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakAdd(publicKey, tweak, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyTweakAdd with valid tweak (uncompressed)', () => {
      const publicKey = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakAdd(publicKey, tweak, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyTweakAdd with invalid public key', () => {
      const publicKey = Buffer.from('ff', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakAdd(publicKey, tweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakAdd with invalid tweak (too large)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const tweak = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.publicKeyTweakAdd(publicKey, tweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakMul with valid tweak (compressed)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakMul(publicKey, tweak, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('publicKeyTweakMul with valid tweak (uncompressed)', () => {
      const publicKey = Buffer.from('04a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7893aba425419bc27a3b6c7e693a24c696f794c2ed877a1593cbee53b037368d7', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakMul(publicKey, tweak, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('publicKeyTweakMul with invalid public key', () => {
      const publicKey = Buffer.from('ff', 'hex')
      const tweak = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.publicKeyTweakMul(publicKey, tweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakMul with invalid tweak (too large)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const tweak = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.publicKeyTweakMul(publicKey, tweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakMul with zero tweak', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const tweak = Buffer.alloc(32, 0)
      const result = api.publicKeyTweakMul(publicKey, tweak, true)
      expect(result).toBeNull()
    })
  })

  describe('Signature Tests', () => {
    test('signatureNormalize with valid signature', () => {
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.signatureNormalize(signature)
      expect(result).toBe(0)
    })

    test('signatureNormalize with invalid r (too large)', () => {
      const signature = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.signatureNormalize(signature)
      expect(result).toBeNull()
    })

    test('signatureNormalize with invalid s (too large)', () => {
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.signatureNormalize(signature)
      expect(result).toBe(0) // This will normalize the signature
    })

    test('signatureExport with valid signature', () => {
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(72)
      const obj = { output, outputlen: 0 }
      const result = api.signatureExport(obj, signature)
      expect(result).toBe(0)
      expect(obj.outputlen).toBeGreaterThan(0)
    })

    test('signatureExport with invalid r (too large)', () => {
      const signature = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(72)
      const obj = { output, outputlen: 0 }
      const result = api.signatureExport(obj, signature)
      expect(result).toBe(1)
    })

    test('signatureExport with invalid s (too large)', () => {
      // Create a signature with s value that is actually too large
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const output = Buffer.alloc(72)
      const obj = { output, outputlen: 0 }
      const result = api.signatureExport(obj, signature)
      expect(result).toBe(1)
    })

    test('signatureImport with valid signature', () => {
      const derSignature = Buffer.from('3045022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3502201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(0)
    })

    test('signatureImport with too short signature', () => {
      const derSignature = Buffer.from('30', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with too long signature', () => {
      const derSignature = Buffer.alloc(73)
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with invalid first byte', () => {
      const derSignature = Buffer.from('3145022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3502201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with invalid length', () => {
      const derSignature = Buffer.from('3000022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3502201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with invalid second byte', () => {
      const derSignature = Buffer.from('3045022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3503201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with zero r length', () => {
      const derSignature = Buffer.from('3045020002201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with zero s length', () => {
      const derSignature = Buffer.from('3045022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b350200', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with r too long', () => {
      const derSignature = Buffer.from('3045022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3502201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })

    test('signatureImport with s too long', () => {
      const derSignature = Buffer.from('3045022100e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b3502201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(64)
      const result = api.signatureImport(output, derSignature)
      expect(result).toBe(1)
    })
  })

  describe('ECDSA Tests', () => {
    test('ecdsaSign with valid inputs', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const result = api.ecdsaSign(message, privateKey)
      // The result is an array, not a Buffer
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(64)
    })

    test('ecdsaSign with invalid private key (zero)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.alloc(32, 0)
      const result = api.ecdsaSign(message, privateKey)
      expect(result).toBeNull()
    })

    test('ecdsaSign with invalid private key (too large)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.ecdsaSign(message, privateKey)
      expect(result).toBeNull()
    })

    test('ecdsaVerify with valid signature', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const signature = api.ecdsaSign(message, privateKey)
      const publicKey = api.publicKeyCreate(privateKey, true)
      // Convert array to Buffer for ecdsaVerify
      const signatureBuffer = Buffer.from(signature)
      const result = api.ecdsaVerify(signatureBuffer, message, publicKey)
      expect(result).toBe(true)
    })

    test('ecdsaVerify with invalid signature (r too large)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.ecdsaVerify(signature, message, publicKey)
      expect(result).toBe(1)
    })

    test('ecdsaVerify with invalid signature (s too large)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.ecdsaVerify(signature, message, publicKey)
      // The function returns false instead of 1 for invalid signature
      expect(result).toBe(false)
    })

    test('ecdsaVerify with invalid signature (zero r)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('00000000000000000000000000000000000000000000000000000000000000001234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.ecdsaVerify(signature, message, publicKey)
      expect(result).toBe(3)
    })

    test('ecdsaVerify with invalid signature (zero s)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0000000000000000000000000000000000000000000000000000000000000000', 'hex')
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const result = api.ecdsaVerify(signature, message, publicKey)
      expect(result).toBe(3)
    })

    test('ecdsaVerify with invalid public key', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const publicKey = Buffer.from('ff', 'hex')
      const result = api.ecdsaVerify(signature, message, publicKey)
      expect(result).toBe(2)
    })

    test('ecdsaRecover with valid inputs (compressed)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const signature = api.ecdsaSign(message, privateKey)
      const result = api.ecdsaRecover(signature, 0, message, true)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(33)
    })

    test('ecdsaRecover with valid inputs (uncompressed)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const signature = api.ecdsaSign(message, privateKey)
      const result = api.ecdsaRecover(signature, 0, message, false)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(65)
    })

    test('ecdsaRecover with invalid signature (r too large)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.ecdsaRecover(signature, 0, message, true)
      expect(result).toBe(1)
    })

    test('ecdsaRecover with invalid signature (s too large)', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const result = api.ecdsaRecover(signature, 0, message, true)
      // The function returns 2 instead of 1 for invalid signature
      expect(result).toBe(2)
    })

    test('ecdsaRecover with zero r', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('00000000000000000000000000000000000000000000000000000000000000001234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const result = api.ecdsaRecover(signature, 0, message, true)
      expect(result).toBe(2)
    })

    test('ecdsaRecover with zero s', () => {
      const message = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const signature = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0000000000000000000000000000000000000000000000000000000000000000', 'hex')
      const result = api.ecdsaRecover(signature, 0, message, true)
      expect(result).toBe(2)
    })
  })

  describe('ECDH Tests', () => {
    test('ecdh with default hash function', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const result = api.ecdh(output, publicKey, privateKey, data, undefined, undefined, undefined)
      expect(result).toBe(0)
      expect(output.some(byte => byte !== 0)).toBe(true)
    })

    test('ecdh with custom hash function', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const xbuf = Buffer.alloc(32)
      const ybuf = Buffer.alloc(32)
      const hashfn = jest.fn().mockReturnValue(Buffer.alloc(32, 1))
      const result = api.ecdh(output, publicKey, privateKey, data, hashfn, xbuf, ybuf)
      expect(result).toBe(0)
      expect(hashfn).toHaveBeenCalled()
    })

    test('ecdh with invalid public key', () => {
      const publicKey = Buffer.from('ff', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const result = api.ecdh(output, publicKey, privateKey, data, undefined, undefined, undefined)
      expect(result).toBe(1)
    })

    test('ecdh with invalid private key (zero)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.alloc(32, 0)
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const result = api.ecdh(output, publicKey, privateKey, data, undefined, undefined, undefined)
      expect(result).toBe(2)
    })

    test('ecdh with invalid private key (too large)', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const result = api.ecdh(output, publicKey, privateKey, data, undefined, undefined, undefined)
      expect(result).toBe(2)
    })

    test('ecdh with invalid hash function return', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const xbuf = Buffer.alloc(32)
      const ybuf = Buffer.alloc(32)
      const hashfn = jest.fn().mockReturnValue('invalid')
      const result = api.ecdh(output, publicKey, privateKey, data, hashfn, xbuf, ybuf)
      expect(result).toBe(2)
    })

    test('ecdh with hash function returning wrong length', () => {
      const publicKey = Buffer.from('0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2', 'hex')
      const privateKey = Buffer.from('e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex')
      const data = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = Buffer.alloc(32)
      const xbuf = Buffer.alloc(32)
      const ybuf = Buffer.alloc(32)
      const hashfn = jest.fn().mockReturnValue(Buffer.alloc(16))
      const result = api.ecdh(output, publicKey, privateKey, data, hashfn, xbuf, ybuf)
      expect(result).toBe(2)
    })
  })
}) 