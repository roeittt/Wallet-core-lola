import {
  buildCommonSignMsg,
  convert2Number,
  convert2BigNumber,
  assertBufferLength,
  cloneObject,
  jsonStringifyUniform,
} from '../src/basic/typeUtils';
import { BigNumber } from '../src/index';

describe('basic/typeUtils', () => {
  describe('buildCommonSignMsg', () => {
    it('should correctly build signature message', () => {
      const publicKey = 'testPublicKey123';
      const walletId = 'testWalletId456';

      const result = buildCommonSignMsg(publicKey, walletId);

      expect(result).toBe(
        'OKX Wallet Sign In\n\npublicKey: testPublicKey123\nwalletId: testWalletId456\nhost: api.wallet.okx\nOKX Wallet Sign In'
      );
    });

    it('should handle empty string parameters', () => {
      const result = buildCommonSignMsg('', '');

      expect(result).toBe(
        'OKX Wallet Sign In\n\npublicKey: \nwalletId: \nhost: api.wallet.okx\nOKX Wallet Sign In'
      );
    });

    it('should handle special characters', () => {
      const publicKey = 'test@#$%^&*()';
      const walletId = 'wallet-123_456';

      const result = buildCommonSignMsg(publicKey, walletId);

      expect(result).toBe(
        'OKX Wallet Sign In\n\npublicKey: test@#$%^&*()\nwalletId: wallet-123_456\nhost: api.wallet.okx\nOKX Wallet Sign In'
      );
    });
  });

  describe('convert2Number', () => {
    it('should convert string numbers to numbers', () => {
      expect(convert2Number('123')).toBe(123);
      expect(convert2Number('0')).toBe(0);
      expect(convert2Number('-456')).toBe(-456);
    });

    it('should keep number types unchanged', () => {
      expect(convert2Number(123)).toBe(123);
      expect(convert2Number(0)).toBe(0);
      expect(convert2Number(-456)).toBe(-456);
    });

    it('should return undefined when input is undefined', () => {
      expect(convert2Number(undefined)).toBeUndefined();
    });

    it('should return undefined when input is null', () => {
      expect(convert2Number(null)).toBeUndefined();
    });

    it('should handle other data types', () => {
      expect(convert2Number({})).toEqual({});
      expect(convert2Number([])).toEqual([]);
      expect(convert2Number(true)).toBe(true);
    });
  });

  describe('convert2BigNumber', () => {
    it('should convert strings to BigNumber', () => {
      const result1 = convert2BigNumber('123');
      expect(result1).toBeInstanceOf(BigNumber);
      expect(result1!).toBeInstanceOf(BigNumber);
      expect(result1!.toString()).toBe('123');

      const result2 = convert2BigNumber('0');
      expect(result2).toBeInstanceOf(BigNumber);
      expect(result2!).toBeInstanceOf(BigNumber);
      expect(result2!.toString()).toBe('0');
    });

    it('should convert numbers to BigNumber', () => {
      const result1 = convert2BigNumber(123);
      expect(result1).toBeInstanceOf(BigNumber);
      expect(result1!).toBeInstanceOf(BigNumber);
      expect(result1!.toString()).toBe('123');

      const result2 = convert2BigNumber(0);
      expect(result2).toBeInstanceOf(BigNumber);
      expect(result2!).toBeInstanceOf(BigNumber);
      expect(result2!.toString()).toBe('0');
    });

    it('should keep BigNumber types unchanged', () => {
      const original = new BigNumber('123');
      const result = convert2BigNumber(original);
      expect(result).toBe(original);
    });

    it('should return undefined when input is undefined', () => {
      expect(convert2BigNumber(undefined)).toBeUndefined();
    });

    it('should return undefined when input is null', () => {
      expect(convert2BigNumber(null)).toBeUndefined();
    });

    it('should handle large number strings', () => {
      const largeNumber = '123456789012345678901234567890';
      const result = convert2BigNumber(largeNumber);
      expect(result).toBeInstanceOf(BigNumber);
      expect(result!.toFixed()).toBe(largeNumber);
    });
  });

  describe('assertBufferLength', () => {
    it('should not throw error when buffer length is correct', () => {
      const buffer = Buffer.from([1, 2, 3, 4]);
      expect(() => assertBufferLength(buffer, 4)).not.toThrow();
    });

    it('should throw error when buffer length is incorrect', () => {
      const buffer = Buffer.from([1, 2, 3, 4]);
      expect(() => assertBufferLength(buffer, 5)).toThrow(
        'buffer length is illegal'
      );
    });

    it('should handle Uint8Array', () => {
      const uint8Array = new Uint8Array([1, 2, 3, 4]);
      expect(() => assertBufferLength(uint8Array, 4)).not.toThrow();
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.from([]);
      expect(() => assertBufferLength(buffer, 0)).not.toThrow();
    });
  });

  describe('cloneObject', () => {
    it('should deep clone objects', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4] },
        e: 'test',
      };

      const cloned = cloneObject(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });

    it('should clone arrays', () => {
      const original = [1, { a: 2 }, [3, 4]];

      const cloned = cloneObject(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should handle primitive types', () => {
      expect(cloneObject(123)).toBe(123);
      expect(cloneObject('test')).toBe('test');
      expect(cloneObject(true)).toBe(true);
      expect(cloneObject(null)).toBe(null);
      // Note: undefined cannot be cloned via JSON.parse(JSON.stringify())
      // so we skip testing it
    });

    it('should handle nested objects', () => {
      const original = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const cloned = cloneObject(original);

      expect(cloned).toEqual(original);
      expect(cloned.level1).not.toBe(original.level1);
      expect(cloned.level1.level2).not.toBe(original.level1.level2);
      expect(cloned.level1.level2.level3).not.toBe(
        original.level1.level2.level3
      );
    });
  });

  describe('jsonStringifyUniform', () => {
    it('should correctly handle Buffer types', () => {
      const data = {
        buffer: Buffer.from([1, 2, 3, 4]),
        string: 'test',
        number: 123,
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.buffer).toBe('01020304');
      expect(parsed.string).toBe('test');
      expect(parsed.number).toBe(123);
    });

    it('should correctly handle Uint8Array types', () => {
      const data = {
        uint8Array: new Uint8Array([1, 2, 3, 4]),
        string: 'test',
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.uint8Array).toBe('01020304');
      expect(parsed.string).toBe('test');
    });

    it('should correctly handle bigint types', () => {
      const data = {
        bigint: BigInt('12345678901234567890'),
        string: 'test',
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.bigint).toBe('12345678901234567890');
      expect(parsed.string).toBe('test');
    });

    it('should correctly handle Buffer type objects', () => {
      const buffer = Buffer.from([1, 2, 3, 4]);
      const bufferLike = {
        type: 'Buffer',
        data: [1, 2, 3, 4],
      };

      const data = {
        buffer,
        bufferLike,
        string: 'test',
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.buffer).toBe('01020304');
      expect(parsed.bufferLike).toBe('01020304');
      expect(parsed.string).toBe('test');
    });

    it('should keep other types unchanged', () => {
      const data = {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { a: 1, b: 2 },
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
    });

    it('should handle falsy values', () => {
      const data = {
        emptyString: '',
        zero: 0,
        false: false,
        null: null,
        // Note: undefined is not supported by JSON.stringify
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.emptyString).toBe('');
      expect(parsed.zero).toBe(0);
      expect(parsed.false).toBe(false);
      expect(parsed.null).toBe(null);
    });

    it('should handle nested objects with special types', () => {
      const data = {
        level1: {
          level2: {
            buffer: Buffer.from([1, 2, 3]),
            uint8Array: new Uint8Array([4, 5, 6]),
            bigint: BigInt('123456789'),
            normal: 'test',
          },
        },
      };

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed.level1.level2.buffer).toBe('010203');
      expect(parsed.level1.level2.uint8Array).toBe('040506');
      expect(parsed.level1.level2.bigint).toBe('123456789');
      expect(parsed.level1.level2.normal).toBe('test');
    });

    it('should handle arrays with special types', () => {
      const data = [
        Buffer.from([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        BigInt('123456789'),
        'normal string',
        123,
      ];

      const result = jsonStringifyUniform(data);
      const parsed = JSON.parse(result);

      expect(parsed[0]).toBe('010203');
      expect(parsed[1]).toBe('040506');
      expect(parsed[2]).toBe('123456789');
      expect(parsed[3]).toBe('normal string');
      expect(parsed[4]).toBe(123);
    });
  });
});
