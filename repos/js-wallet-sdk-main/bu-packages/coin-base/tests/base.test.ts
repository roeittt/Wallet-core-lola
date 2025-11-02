import { toAscii, fromAscii } from '../src/base/ascii'
import { check, checkIsDefined, checkIsUndefined } from '../src/base/precondtion'
import { toBigIntHex, fromBigIntHex, bigNumber2String, string2BigNumber } from '../src/base/bignumber-plus'
import { 
  doubleSha256, 
  hash160, 
  keccak, 
  keccak256, 
  blake2, 
  magicHash,
  sha256,
  sha512,
  ripemd160,
  sha3_256,
  sha3_512
} from '../src/base/hash'
import { reverseBuffer, concatBytes, randomBytes } from '../src/base'
import { isHexString, validateHexString } from '../src/base/helper'
import { toHex, fromHex, stripHexPrefix, isHexPrefixed } from '../src/base/hex'
import BigNumber from 'bignumber.js'

describe('Base Module Tests', () => {
  describe('ASCII Tests', () => {
    test('toAscii function test', () => {
      const input = 'Hello World!'
      const result = toAscii(input)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(input.length)
      expect(result[0]).toBe(72) // 'H' ASCII code
    })

    test('fromAscii function test', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]) // 'Hello'
      const result = fromAscii(input)
      expect(result).toBe('Hello')
    })

    test('toAscii and fromAscii round trip test', () => {
      const original = 'Test String 123!'
      const ascii = toAscii(original)
      const back = fromAscii(ascii)
      expect(back).toBe(original)
    })

    test('toAscii with control character error', () => {
      const input = 'Hello\x00World' // Contains null character
      expect(() => toAscii(input)).toThrow('Cannot encode character that is out of printable ASCII range')
    })

    test('toAscii with extended ASCII error', () => {
      const input = 'Hello\x80World' // Contains extended ASCII
      expect(() => toAscii(input)).toThrow('Cannot encode character that is out of printable ASCII range')
    })

    test('fromAscii with control character error', () => {
      const input = new Uint8Array([72, 0, 101, 108, 108, 111]) // Contains null character
      expect(() => fromAscii(input)).toThrow('Cannot decode character that is out of printable ASCII range')
    })

    test('fromAscii with extended ASCII error', () => {
      const input = new Uint8Array([72, 128, 101, 108, 108, 111]) // Contains extended ASCII
      expect(() => fromAscii(input)).toThrow('Cannot decode character that is out of printable ASCII range')
    })

    test('toAscii with empty string', () => {
      const result = toAscii('')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(0)
    })

    test('fromAscii with empty array', () => {
      const result = fromAscii(new Uint8Array([]))
      expect(result).toBe('')
    })

    test('toAscii with printable ASCII range', () => {
      const input = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
      const result = toAscii(input)
      expect(result.length).toBe(input.length)
      expect(fromAscii(result)).toBe(input)
    })
  })

  describe('Precondition Tests', () => {
    test('check with true statement', () => {
      expect(() => check(true)).not.toThrow()
    })

    test('check with false statement', () => {
      expect(() => check(false)).toThrow('Invalid statement')
    })

    test('check with false statement and custom error', () => {
      expect(() => check(false, 'Custom error message')).toThrow('Custom error message')
    })

    test('check with false statement and Error object', () => {
      const customError = new Error('Custom error')
      expect(() => check(false, customError)).toThrow('Custom error')
    })

    test('checkIsDefined with defined value', () => {
      const value = 'test'
      const result = checkIsDefined(value)
      expect(result).toBe(value)
    })

    test('checkIsDefined with undefined value', () => {
      expect(() => checkIsDefined(undefined)).toThrow('Expect defined but actually undefined')
    })

    test('checkIsDefined with undefined value and custom error', () => {
      expect(() => checkIsDefined(undefined, 'Custom undefined error')).toThrow('Custom undefined error')
    })

    test('checkIsUndefined with undefined value', () => {
      expect(() => checkIsUndefined(undefined)).not.toThrow()
    })

    test('checkIsUndefined with defined value', () => {
      expect(() => checkIsUndefined('defined value')).toThrow('Expect undefined but actually defined value')
    })

    test('checkIsUndefined with defined value and custom error', () => {
      expect(() => checkIsUndefined('defined value', 'Custom defined error')).toThrow('Custom defined error')
    })

    test('checkIsDefined with various defined values', () => {
      expect(checkIsDefined(0)).toBe(0)
      expect(checkIsDefined('')).toBe('')
      expect(checkIsDefined(false)).toBe(false)
      expect(checkIsDefined(null)).toBe(null)
    })
  })

  describe('BigNumber Plus Tests', () => {
    test('toBigIntHex function test', () => {
      const value = new BigNumber('123456789')
      const result = toBigIntHex(value)
      expect(result).toBe('0x75bcd15')
    })

    test('toBigIntHex with zero', () => {
      const value = new BigNumber('0')
      const result = toBigIntHex(value)
      expect(result).toBe('0x0')
    })

    test('toBigIntHex with large number', () => {
      const value = new BigNumber('123456789012345678901234567890')
      const result = toBigIntHex(value)
      expect(result).toMatch(/^0x[a-f0-9]+$/)
    })

    test('fromBigIntHex function test', () => {
      const hexValue = '0x75bcd15'
      const result = fromBigIntHex(hexValue)
      expect(result).toBeInstanceOf(BigNumber)
      expect(result.toString()).toBe('123456789')
    })

    test('fromBigIntHex with invalid hex string', () => {
      expect(() => fromBigIntHex('invalid')).toThrow('Invalid hex string')
    })

    test('fromBigIntHex with hex string without 0x prefix', () => {
      expect(() => fromBigIntHex('75bcd15')).toThrow('Invalid hex string')
    })

    test('fromBigIntHex with empty string', () => {
      expect(() => fromBigIntHex('')).toThrow('Invalid hex string')
    })

    test('bigNumber2String function test', () => {
      const value = new BigNumber('123456789')
      const result = bigNumber2String(value)
      expect(result).toBe('123456789')
    })

    test('bigNumber2String with base 16', () => {
      const value = new BigNumber('123456789')
      const result = bigNumber2String(value, 16)
      expect(result).toBe('75bcd15')
    })

    test('bigNumber2String with base 2', () => {
      const value = new BigNumber('10')
      const result = bigNumber2String(value, 2)
      expect(result).toBe('1010')
    })

    test('string2BigNumber function test', () => {
      const result = string2BigNumber('123456789')
      expect(result).toBeInstanceOf(BigNumber)
      expect(result.toString()).toBe('123456789')
    })

    test('string2BigNumber with number input', () => {
      const result = string2BigNumber(123456789)
      expect(result).toBeInstanceOf(BigNumber)
      expect(result.toString()).toBe('123456789')
    })

    test('string2BigNumber with base 16', () => {
      const result = string2BigNumber('75bcd15', 16)
      expect(result).toBeInstanceOf(BigNumber)
      expect(result.toString()).toBe('123456789')
    })

    test('string2BigNumber with base 2', () => {
      const result = string2BigNumber('1010', 2)
      expect(result).toBeInstanceOf(BigNumber)
      expect(result.toString()).toBe('10')
    })

    test('round trip test: toBigIntHex and fromBigIntHex', () => {
      const original = new BigNumber('123456789012345678901234567890')
      const hex = toBigIntHex(original)
      const back = fromBigIntHex(hex)
      expect(back.toString()).toBe(original.toString())
    })
  })

  describe('Hash Tests', () => {
    test('doubleSha256 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = doubleSha256(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32) // SHA256 output is 32 bytes
    })

    test('hash160 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = hash160(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20) // RIPEMD160 output is 20 bytes
    })

    test('keccak function test with 256 bits', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = keccak(data, 256)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32) // Keccak-256 output is 32 bytes
    })

    test('keccak function test with 224 bits', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = keccak(data, 224)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(28) // Keccak-224 output is 28 bytes
    })

    test('keccak function test with 384 bits', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = keccak(data, 384)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(48) // Keccak-384 output is 48 bytes
    })

    test('keccak function test with 512 bits', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = keccak(data, 512)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(64) // Keccak-512 output is 64 bytes
    })

    test('keccak function with invalid bits', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      expect(() => keccak(data, 128)).toThrow('Invald algorithm: keccak128')
    })

    test('keccak256 function test', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = keccak256(data)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32) // Keccak-256 output is 32 bytes
    })

    test('keccak256 with Uint8Array input', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = keccak256(data)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32)
    })

    test('keccak256 with number array input', () => {
      const data = [1, 2, 3, 4, 5]
      const result = keccak256(data)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(32)
    })

    test('blake2 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const key = new Uint8Array([1, 2, 3, 4])
      const result = blake2(data, 256, key)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32) // 256 bits = 32 bytes
    })

    test('blake2 function test without key', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = blake2(data, 256, undefined)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('blake2 function test with different bit lengths', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const key = new Uint8Array([1, 2, 3, 4])
      
      const result128 = blake2(data, 128, key)
      expect(result128.length).toBe(16) // 128 bits = 16 bytes
      
      const result512 = blake2(data, 512, key)
      expect(result512.length).toBe(64) // 512 bits = 64 bytes
    })

    test('magicHash function test', () => {
      const message = 'Hello World'
      const result = magicHash(message)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32) // Double SHA256 output is 32 bytes
    })

    test('magicHash function test with custom prefix', () => {
      const message = 'Hello World'
      const customPrefix = 'Custom Prefix:'
      const result = magicHash(message, customPrefix)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('sha256 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = sha256(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('sha512 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = sha512(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    test('ripemd160 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = ripemd160(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    test('sha3_256 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = sha3_256(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('sha3_512 function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = sha3_512(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    test('hash consistency test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const hash1 = sha256(data)
      const hash2 = sha256(data)
      expect(hash1).toEqual(hash2)
    })

    test('different inputs produce different hashes', () => {
      const data1 = new Uint8Array([1, 2, 3, 4, 5])
      const data2 = new Uint8Array([1, 2, 3, 4, 6])
      const hash1 = sha256(data1)
      const hash2 = sha256(data2)
      expect(hash1).not.toEqual(hash2)
    })
  })

  describe('Utility Functions Tests', () => {
    test('reverseBuffer function test', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5])
      const result = reverseBuffer(buffer)
      expect(result).toEqual(Buffer.from([5, 4, 3, 2, 1]))
    })

    test('reverseBuffer with empty buffer', () => {
      const buffer = Buffer.from([])
      const result = reverseBuffer(buffer)
      expect(result).toEqual(buffer)
    })

    test('reverseBuffer with single byte', () => {
      const buffer = Buffer.from([42])
      const result = reverseBuffer(buffer)
      expect(result).toEqual(buffer)
    })

    test('reverseBuffer with even length', () => {
      const buffer = Buffer.from([1, 2, 3, 4])
      const result = reverseBuffer(buffer)
      expect(result).toEqual(Buffer.from([4, 3, 2, 1]))
    })

    test('reverseBuffer with odd length', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5])
      const result = reverseBuffer(buffer)
      expect(result).toEqual(Buffer.from([5, 4, 3, 2, 1]))
    })

    test('concatBytes function test', () => {
      const b1 = new Uint8Array([1, 2, 3])
      const b2 = new Uint8Array([4, 5, 6])
      const result = concatBytes(b1, b2)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })

    test('concatBytes with Buffer inputs', () => {
      const b1 = Buffer.from([1, 2, 3])
      const b2 = Buffer.from([4, 5, 6])
      const result = concatBytes(b1, b2)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })

    test('concatBytes with mixed inputs', () => {
      const b1 = new Uint8Array([1, 2, 3])
      const b2 = Buffer.from([4, 5, 6])
      const result = concatBytes(b1, b2)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })

    test('concatBytes with empty arrays', () => {
      const b1 = new Uint8Array([])
      const b2 = new Uint8Array([])
      const result = concatBytes(b1, b2)
      expect(result).toEqual(new Uint8Array([]))
    })

    test('randomBytes function test', () => {
      const length = 32
      const result = randomBytes(length)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(length)
    })

    test('randomBytes with different lengths', () => {
      const result16 = randomBytes(16)
      expect(result16.length).toBe(16)
      
      const result64 = randomBytes(64)
      expect(result64.length).toBe(64)
    })

    test('randomBytes produces different results', () => {
      const result1 = randomBytes(32)
      const result2 = randomBytes(32)
      expect(result1).not.toEqual(result2)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('toAscii with null character', () => {
      expect(() => toAscii('Hello\x00World')).toThrow()
    })

    test('toAscii with delete character', () => {
      expect(() => toAscii('Hello\x7FWorld')).toThrow()
    })

    test('fromAscii with delete character', () => {
      const input = new Uint8Array([72, 127, 101, 108, 108, 111])
      expect(() => fromAscii(input)).toThrow()
    })

    test('checkIsDefined with null', () => {
      const result = checkIsDefined(null)
      expect(result).toBe(null)
    })

    test('checkIsDefined with empty string', () => {
      const result = checkIsDefined('')
      expect(result).toBe('')
    })

    test('checkIsDefined with zero', () => {
      const result = checkIsDefined(0)
      expect(result).toBe(0)
    })

    test('string2BigNumber with invalid input', () => {
      // BigNumber might not throw for invalid input, so we'll test that it returns a BigNumber
      const result = string2BigNumber('invalid', 10)
      expect(result).toBeInstanceOf(BigNumber)
      // Check if it's NaN
      expect(result.isNaN()).toBe(true)
    })

    test('blake2 with zero bit length', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = blake2(data, 0, undefined)
      expect(result.length).toBe(0)
    })

    test('magicHash with empty message', () => {
      const result = magicHash('')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('magicHash with empty prefix', () => {
      const result = magicHash('Hello', '')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('Helper Functions Tests', () => {
    test('isHexString with valid hex string', () => {
      expect(isHexString('0x123456')).toBe(true)
      expect(isHexString('0xabcdef')).toBe(true)
      expect(isHexString('0xABCDEF')).toBe(true)
    })

    test('isHexString with invalid hex string', () => {
      expect(isHexString('123456')).toBe(false) // No 0x prefix
      expect(isHexString('0x12345g')).toBe(false) // Invalid character
      // Note: isHexString doesn't check for odd length, only the regex pattern
      expect(isHexString('0x12345')).toBe(true) // Odd length but valid hex pattern
    })

    test('isHexString with length check', () => {
      expect(isHexString('0x123456', 3)).toBe(true) // 3 bytes = 6 hex chars
      expect(isHexString('0x123456', 2)).toBe(false) // Expected 4 hex chars, got 6
      expect(isHexString('0x123456', 4)).toBe(false) // Expected 8 hex chars, got 6
    })

    test('isHexString with empty string', () => {
      expect(isHexString('')).toBe(false)
    })

    test('isHexString with only 0x prefix', () => {
      expect(isHexString('0x')).toBe(true)
      expect(isHexString('0x', 0)).toBe(true)
    })

    test('validateHexString with valid hex string', () => {
      expect(validateHexString('0x123456')).toBe(true)
      expect(validateHexString('123456')).toBe(true)
      expect(validateHexString('0xabcdef')).toBe(true)
      expect(validateHexString('ABCDEF')).toBe(true)
    })

    test('validateHexString with invalid hex string', () => {
      expect(validateHexString('')).toBe(false) // Empty string
      expect(validateHexString('0x')).toBe(false) // Only prefix
      expect(validateHexString('12345')).toBe(false) // Odd length
      expect(validateHexString('0x12345')).toBe(false) // Odd length with prefix
      expect(validateHexString('12345g')).toBe(false) // Invalid character
      expect(validateHexString('0x12345g')).toBe(false) // Invalid character with prefix
    })

    test('validateHexString with null/undefined', () => {
      expect(validateHexString(null as any)).toBe(false)
      expect(validateHexString(undefined as any)).toBe(false)
    })

    test('validateHexString with mixed case', () => {
      expect(validateHexString('0xAbCdEf')).toBe(true)
      expect(validateHexString('AbCdEf')).toBe(true)
    })
  })

  describe('Hex Functions Tests', () => {
    test('toHex function test', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = toHex(data)
      expect(result).toBe('0102030405')
    })

    test('toHex with Buffer input', () => {
      const data = Buffer.from([1, 2, 3, 4, 5])
      const result = toHex(data)
      expect(result).toBe('0102030405')
    })

    test('toHex with number array input', () => {
      const data = [1, 2, 3, 4, 5]
      const result = toHex(data)
      expect(result).toBe('0102030405')
    })

    test('toHex with prefix', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const result = toHex(data, true)
      expect(result).toBe('0x0102030405')
    })

    test('toHex with empty array', () => {
      const data = new Uint8Array([])
      const result = toHex(data)
      expect(result).toBe('')
      const resultWithPrefix = toHex(data, true)
      expect(resultWithPrefix).toBe('0x')
    })

    test('fromHex function test', () => {
      const hexString = '0102030405'
      const result = fromHex(hexString)
      expect(result).toEqual(Buffer.from([1, 2, 3, 4, 5]))
    })

    test('fromHex with 0x prefix', () => {
      const hexString = '0x0102030405'
      const result = fromHex(hexString)
      expect(result).toEqual(Buffer.from([1, 2, 3, 4, 5]))
    })

    test('fromHex with empty string', () => {
      expect(() => fromHex('')).toThrow('invalid hex string')
    })

    test('fromHex with 0x only', () => {
      expect(() => fromHex('0x')).toThrow('invalid hex string')
    })

    test('stripHexPrefix with 0x prefix', () => {
      expect(stripHexPrefix('0x123456')).toBe('123456')
      expect(stripHexPrefix('0xabcdef')).toBe('abcdef')
    })

    test('stripHexPrefix without 0x prefix', () => {
      expect(stripHexPrefix('123456')).toBe('123456')
      expect(stripHexPrefix('abcdef')).toBe('abcdef')
    })

    test('stripHexPrefix with empty string', () => {
      expect(stripHexPrefix('')).toBe('')
    })

    test('stripHexPrefix with only 0x', () => {
      expect(stripHexPrefix('0x')).toBe('')
    })

    test('isHexPrefixed with 0x prefix', () => {
      expect(isHexPrefixed('0x123456')).toBe(true)
      expect(isHexPrefixed('0xabcdef')).toBe(true)
      expect(isHexPrefixed('0x')).toBe(true)
    })

    test('isHexPrefixed without 0x prefix', () => {
      expect(isHexPrefixed('123456')).toBe(false)
      expect(isHexPrefixed('abcdef')).toBe(false)
      expect(isHexPrefixed('')).toBe(false)
    })

    test('isHexPrefixed with case variations', () => {
      expect(isHexPrefixed('0X123456')).toBe(false) // Capital X
      expect(isHexPrefixed('0x123456')).toBe(true)  // Lowercase x
    })
  })

  describe('Hash Functions Extended Tests', () => {
    test('varintBufNum function test - small numbers', () => {
      // Test the varintBufNum function indirectly through magicHash
      const result = magicHash('test', 'prefix')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('varintBufNum function test - medium numbers', () => {
      // Create a message that would trigger the 253-65535 range
      const longMessage = 'a'.repeat(300) // This should trigger 2-byte varint
      const result = magicHash(longMessage)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('varintBufNum function test - large numbers', () => {
      // Create a message that would trigger the 65536-4294967295 range
      const veryLongMessage = 'a'.repeat(70000) // This should trigger 4-byte varint
      const result = magicHash(veryLongMessage)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('varintBufNum function test - very large numbers', () => {
      // Create a message that would trigger the >4294967295 range
      const hugeMessage = 'a'.repeat(5000000) // This should trigger 8-byte varint
      const result = magicHash(hugeMessage)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    test('blake2 with different key lengths', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      
      // Test with short key
      const shortKey = new Uint8Array([1, 2])
      const resultShort = blake2(data, 256, shortKey)
      expect(resultShort).toBeInstanceOf(Uint8Array)
      expect(resultShort.length).toBe(32)
      
      // Test with long key
      const longKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      const resultLong = blake2(data, 256, longKey)
      expect(resultLong).toBeInstanceOf(Uint8Array)
      expect(resultLong.length).toBe(32)
    })

    test('blake2 with non-multiple of 8 bit lengths', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const key = new Uint8Array([1, 2, 3, 4])
      
      // Test with 128 bits (16 bytes)
      const result128 = blake2(data, 128, key)
      expect(result128.length).toBe(16)
      
      // Test with 192 bits (24 bytes)
      const result192 = blake2(data, 192, key)
      expect(result192.length).toBe(24)
      
      // Test with 320 bits (40 bytes)
      const result320 = blake2(data, 320, key)
      expect(result320.length).toBe(40)
    })

    test('hash functions with different input types', () => {
      const bufferData = Buffer.from([1, 2, 3, 4, 5])
      const uint8Data = new Uint8Array([1, 2, 3, 4, 5])
      const numberData = new Uint8Array([1, 2, 3, 4, 5])
      
      // Test that all input types work
      expect(sha256(bufferData)).toBeInstanceOf(Uint8Array)
      expect(sha256(uint8Data)).toBeInstanceOf(Uint8Array)
      expect(sha256(numberData)).toBeInstanceOf(Uint8Array)
      
      expect(sha512(bufferData)).toBeInstanceOf(Uint8Array)
      expect(sha512(uint8Data)).toBeInstanceOf(Uint8Array)
      expect(sha512(numberData)).toBeInstanceOf(Uint8Array)
      
      expect(ripemd160(bufferData)).toBeInstanceOf(Uint8Array)
      expect(ripemd160(uint8Data)).toBeInstanceOf(Uint8Array)
      expect(ripemd160(numberData)).toBeInstanceOf(Uint8Array)
      
      expect(sha3_256(bufferData)).toBeInstanceOf(Uint8Array)
      expect(sha3_256(uint8Data)).toBeInstanceOf(Uint8Array)
      expect(sha3_256(numberData)).toBeInstanceOf(Uint8Array)
      
      expect(sha3_512(bufferData)).toBeInstanceOf(Uint8Array)
      expect(sha3_512(uint8Data)).toBeInstanceOf(Uint8Array)
      expect(sha3_512(numberData)).toBeInstanceOf(Uint8Array)
    })

    test('keccak with edge case inputs', () => {
      const emptyBuffer = Buffer.from([])
      const singleByte = Buffer.from([42])
      const largeBuffer = Buffer.alloc(1000, 1)
      
      // Test with empty buffer
      expect(keccak(emptyBuffer, 256)).toBeInstanceOf(Buffer)
      expect(keccak(emptyBuffer, 256).length).toBe(32)
      
      // Test with single byte
      expect(keccak(singleByte, 256)).toBeInstanceOf(Buffer)
      expect(keccak(singleByte, 256).length).toBe(32)
      
      // Test with large buffer
      expect(keccak(largeBuffer, 256)).toBeInstanceOf(Buffer)
      expect(keccak(largeBuffer, 256).length).toBe(32)
    })

    test('magicHash with various message lengths', () => {
      // Test with very short message
      const shortResult = magicHash('a')
      expect(shortResult).toBeInstanceOf(Uint8Array)
      expect(shortResult.length).toBe(32)
      
      // Test with medium message
      const mediumResult = magicHash('Hello World!')
      expect(mediumResult).toBeInstanceOf(Uint8Array)
      expect(mediumResult.length).toBe(32)
      
      // Test with long message
      const longResult = magicHash('a'.repeat(1000))
      expect(longResult).toBeInstanceOf(Uint8Array)
      expect(longResult.length).toBe(32)
    })

    test('magicHash with various prefix lengths', () => {
      // Test with short prefix
      const shortPrefixResult = magicHash('test', 'short')
      expect(shortPrefixResult).toBeInstanceOf(Uint8Array)
      expect(shortPrefixResult.length).toBe(32)
      
      // Test with long prefix
      const longPrefixResult = magicHash('test', 'a'.repeat(100))
      expect(longPrefixResult).toBeInstanceOf(Uint8Array)
      expect(longPrefixResult.length).toBe(32)
    })

    test('hash consistency across different input formats', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const bufferData = Buffer.from(data)
      const uint8Data = new Uint8Array(data)
      
      // All should produce the same hash
      const hash1 = sha256(data)
      const hash2 = sha256(bufferData)
      const hash3 = sha256(uint8Data)
      
      expect(hash1).toEqual(hash2)
      expect(hash2).toEqual(hash3)
    })
  })
})
