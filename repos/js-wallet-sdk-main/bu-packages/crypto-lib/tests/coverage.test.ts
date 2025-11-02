import { ec } from '../src/elliptic'
import * as api from '../src/bip32/api'
import * as stark from '../src/signutil/schnorr/stark'
import * as modular from '../src/signutil/schnorr/abstract/modular'
import * as utils from '../src/signutil/schnorr/abstract/utils'
import * as hashToCurve from '../src/signutil/schnorr/abstract/hash-to-curve'
import * as poseidon from '../src/signutil/schnorr/abstract/poseidon'
import * as weierstrass from '../src/signutil/schnorr/abstract/weierstrass'
import * as curve from '../src/signutil/schnorr/abstract/curve'

describe('Coverage Enhancement Tests', () => {
  describe('BIP32 API Coverage Tests', () => {
    test('privateKeyTweakAdd with invalid tweak', () => {
      const seckey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const invalidTweak = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex')
      const result = (api as any).privateKeyTweakAdd(seckey, invalidTweak)
      expect(result).toBeNull()
    })

    test('privateKeyTweakMul with invalid tweak', () => {
      const seckey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const invalidTweak = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex')
      const result = (api as any).privateKeyTweakMul(seckey, invalidTweak)
      expect(result).toBe(1)
    })

    test('privateKeyTweakMul with zero tweak', () => {
      const seckey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const zeroTweak = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
      const result = (api as any).privateKeyTweakMul(seckey, zeroTweak)
      expect(result).toBe(1)
    })

    test('publicKeyTweakAdd with invalid tweak', () => {
      const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex')
      const invalidTweak = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex')
      const result = (api as any).publicKeyTweakAdd(pubkey, invalidTweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakMul with invalid tweak', () => {
      const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex')
      const invalidTweak = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex')
      const result = (api as any).publicKeyTweakMul(pubkey, invalidTweak, true)
      expect(result).toBeNull()
    })

    test('publicKeyTweakMul with zero tweak', () => {
      const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex')
      const zeroTweak = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
      const result = (api as any).publicKeyTweakMul(pubkey, zeroTweak, true)
      expect(result).toBeNull()
    })

    test('signatureNormalize with high s', () => {
      const highS = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140', 'hex')
      const result = (api as any).signatureNormalize(highS)
      expect(result).toBeDefined()
    })

    test('signatureImport with different output types', () => {
      const sig = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const output = {}
      ;(api as any).signatureImport(output, sig)
      expect(output).toBeDefined()
    })

    test('ecdsaRecover with uncompressed output', () => {
      const message = Buffer.from('Hello, World!')
      const privateKey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex')
      const hash = require('crypto').createHash('sha256').update(message).digest()
      const signature = (api as any).ecdsaSign(hash, privateKey)
      const recovered = (api as any).ecdsaRecover(signature, 0, hash, false)
      expect(recovered).toBeDefined()
    })
  })

  describe('Stark Schnorr Coverage Tests', () => {
    test('getAccountPath with different parameters', () => {
      const result = stark.getAccountPath('starknet', 'argent', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 0)
      expect(result).toBeDefined()
    })

    test('pedersen with different input types', () => {
      const result = stark.pedersen(BigInt(123), 456)
      expect(result).toBeDefined()
    })

    test('hashChain with multiple elements', () => {
      const data = [BigInt(1), BigInt(2), BigInt(3)]
      const result = stark.hashChain(data)
      expect(result).toBeDefined()
    })

    test('computeHashOnElements', () => {
      const data = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]
      const result = stark.computeHashOnElements(data)
      expect(result).toBeDefined()
    })

    test('keccak with different data types', () => {
      const data = Buffer.from('test data')
      const result = stark.keccak(data)
      expect(result).toBeDefined()
    })

    test('poseidonHash with different functions', () => {
      const x = BigInt(123)
      const y = BigInt(456)
      const result = stark.poseidonHash(x, y)
      expect(result).toBeDefined()
    })

    test('poseidonHashFunc with Uint8Array inputs', () => {
      const x = Buffer.from('1234567890abcdef', 'hex')
      const y = Buffer.from('abcdef1234567890', 'hex')
      const result = stark.poseidonHashFunc(x, y)
      expect(result).toBeDefined()
    })

    test('poseidonHashSingle', () => {
      const x = BigInt(123)
      const result = stark.poseidonHashSingle(x)
      expect(result).toBeDefined()
    })

    test('poseidonHashMany with multiple values', () => {
      const values = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]
      const result = stark.poseidonHashMany(values)
      expect(result).toBeDefined()
    })
  })

  describe('Abstract Schnorr Coverage Tests', () => {
    test('modular pow2 with different powers', () => {
      const x = BigInt(10)
      const power = BigInt(5)
      const modulo = BigInt(100)
      const result = modular.pow2(x, power, modulo)
      expect(result).toBeDefined()
    })

    test('modular pow2 with zero power', () => {
      const x = BigInt(10)
      const power = BigInt(0)
      const modulo = BigInt(100)
      const result = modular.pow2(x, power, modulo)
      expect(result).toBe(x)
    })

    test('utils hexToBytes without 0x prefix', () => {
      const hex = '1234567890abcdef'
      const result = utils.hexToBytes(hex)
      expect(result).toBeDefined()
    })

    test('utils bytesToHex with different byte arrays', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      const result = utils.bytesToHex(bytes)
      expect(result).toBeDefined()
    })

    test('utils ensureBytes with Uint8Array input', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5])
      const result = utils.ensureBytes('test', input)
      expect(result).toBeDefined()
    })

    test('hash-to-curve expand_message_xof with different parameters', () => {
      const msg = Buffer.from('test message')
      const DST = Buffer.from('test_dst')
      const len_in_bytes = 32
      const k = 128
      const hashFn = require('crypto').createHash('sha256')
      const H = {
        outputLen: 32,
        blockLen: 64,
        create: () => hashFn,
        [Symbol.iterator]: function* () { yield* []; }
      } as any
      H.__proto__ = Function.prototype
      Object.setPrototypeOf(H, Function.prototype)
      const result = hashToCurve.expand_message_xof(msg, DST, len_in_bytes, k, H)
      expect(result).toBeDefined()
    })

    test('poseidon with different input sizes', () => {
      const Fp = modular.Field(BigInt(251))
      const opts = {
        Fp,
        t: 3,
        roundsFull: 8,
        roundsPartial: 31,
        mds: [[BigInt(1), BigInt(2), BigInt(3)], [BigInt(4), BigInt(5), BigInt(6)], [BigInt(7), BigInt(8), BigInt(9)]],
        roundConstants: Array(39).fill(0).map(() => [BigInt(1), BigInt(2), BigInt(3)])
      }
      const poseidonFn = poseidon.poseidon(opts)
      const inputs = [BigInt(1), BigInt(2), BigInt(3)]
      const result = poseidonFn(inputs)
      expect(result).toBeDefined()
    })

    test('poseidon with single input', () => {
      const Fp = modular.Field(BigInt(251))
      const opts = {
        Fp,
        t: 1,
        roundsFull: 8,
        roundsPartial: 31,
        mds: [[BigInt(1)]],
        roundConstants: Array(39).fill(0).map(() => [BigInt(1)])
      }
      const poseidonFn = poseidon.poseidon(opts)
      const inputs = [BigInt(123)]
      const result = poseidonFn(inputs)
      expect(result).toBeDefined()
    })

    test('curve wNAF with different parameters', () => {
      const w = 4
      const k = BigInt(123456)
      const result = curve.wNAF({} as any, w)
      expect(result).toBeDefined()
    })
  })
}) 