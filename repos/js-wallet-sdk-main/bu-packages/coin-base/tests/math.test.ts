import { Decimal, Int53, Uint32, Uint53, Uint64 } from '../src/math';

describe('math module', () => {
  describe('Decimal class', () => {
    describe('fromUserInput', () => {
      it('should create decimal from integer input', () => {
        const decimal = Decimal.fromUserInput('123', 2);
        expect(decimal.toString()).toBe('123');
        expect(decimal.fractionalDigits).toBe(2);
      });

      it('should create decimal from decimal input', () => {
        const decimal = Decimal.fromUserInput('123.45', 2);
        expect(decimal.toString()).toBe('123.45');
        expect(decimal.fractionalDigits).toBe(2);
      });

      it('should handle trailing zeros in fractional part', () => {
        const decimal = Decimal.fromUserInput('123.4500', 2);
        expect(decimal.toString()).toBe('123.45');
      });

      it('should handle zero fractional part', () => {
        const decimal = Decimal.fromUserInput('123.0', 2);
        expect(decimal.toString()).toBe('123');
      });

      it('should throw error for invalid characters', () => {
        expect(() => Decimal.fromUserInput('123a', 2)).toThrow(
          'Invalid character at position 4'
        );
        expect(() => Decimal.fromUserInput('123-', 2)).toThrow(
          'Invalid character at position 4'
        );
      });

      it('should throw error for multiple decimal separators', () => {
        expect(() => Decimal.fromUserInput('123.45.67', 2)).toThrow(
          'More than one separator found'
        );
      });

      it('should throw error for missing fractional part', () => {
        expect(() => Decimal.fromUserInput('123.', 2)).toThrow(
          'Fractional part missing'
        );
      });

      it('should throw error for too many fractional digits', () => {
        expect(() => Decimal.fromUserInput('123.456', 2)).toThrow(
          'Got more fractional digits than supported'
        );
      });

      it('should throw error for invalid fractional digits', () => {
        expect(() => Decimal.fromUserInput('123.45', -1)).toThrow(
          'Fractional digits must not be negative'
        );
        expect(() => Decimal.fromUserInput('123.45', 1.5)).toThrow(
          'Fractional digits is not an integer'
        );
        expect(() => Decimal.fromUserInput('123.45', 101)).toThrow(
          'Fractional digits must not exceed 100'
        );
      });
    });

    describe('fromAtomics', () => {
      it('should create decimal from atomics string', () => {
        const decimal = Decimal.fromAtomics('12345', 2);
        expect(decimal.toString()).toBe('123.45');
        expect(decimal.atomics).toBe('12345');
      });

      it('should handle zero atomics', () => {
        const decimal = Decimal.fromAtomics('0', 2);
        expect(decimal.toString()).toBe('0');
      });
    });

    describe('zero and one', () => {
      it('should create zero decimal', () => {
        const zero = Decimal.zero(2);
        expect(zero.toString()).toBe('0');
        expect(zero.fractionalDigits).toBe(2);
      });

      it('should create one decimal', () => {
        const one = Decimal.one(2);
        expect(one.toString()).toBe('1');
        expect(one.fractionalDigits).toBe(2);
      });
    });

    describe('arithmetic operations', () => {
      it('should add two decimals', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('67.89', 2);
        const result = a.plus(b);
        expect(result.toString()).toBe('191.34');
      });

      it('should subtract two decimals', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('67.89', 2);
        const result = a.minus(b);
        expect(result.toString()).toBe('55.56');
      });

      it('should throw error when subtracting larger number', () => {
        const a = Decimal.fromUserInput('67.89', 2);
        const b = Decimal.fromUserInput('123.45', 2);
        expect(() => a.minus(b)).toThrow('Difference must not be negative');
      });

      it('should throw error for mismatched fractional digits in addition', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('67.8', 1);
        expect(() => a.plus(b)).toThrow('Fractional digits do not match');
      });

      it('should throw error for mismatched fractional digits in subtraction', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('67.8', 1);
        expect(() => a.minus(b)).toThrow('Fractional digits do not match');
      });

      it('should multiply by integer', () => {
        const decimal = Decimal.fromUserInput('123.45', 2);
        const multiplier = new Uint32(3);
        const result = decimal.multiply(multiplier);
        expect(result.toString()).toBe('370.35');
      });
    });

    describe('comparison operations', () => {
      it('should compare equal decimals', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('123.45', 2);
        expect(a.equals(b)).toBe(true);
        expect(Decimal.compare(a, b)).toBe(0);
      });

      it('should compare less than', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('123.46', 2);
        expect(a.isLessThan(b)).toBe(true);
        expect(Decimal.compare(a, b)).toBeLessThan(0);
      });

      it('should compare greater than', () => {
        const a = Decimal.fromUserInput('123.46', 2);
        const b = Decimal.fromUserInput('123.45', 2);
        expect(a.isGreaterThan(b)).toBe(true);
        expect(Decimal.compare(a, b)).toBeGreaterThan(0);
      });

      it('should compare less than or equal', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('123.45', 2);
        const c = Decimal.fromUserInput('123.46', 2);
        expect(a.isLessThanOrEqual(b)).toBe(true);
        expect(a.isLessThanOrEqual(c)).toBe(true);
      });

      it('should compare greater than or equal', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('123.45', 2);
        const c = Decimal.fromUserInput('123.44', 2);
        expect(a.isGreaterThanOrEqual(b)).toBe(true);
        expect(a.isGreaterThanOrEqual(c)).toBe(true);
      });

      it('should throw error for comparison with different fractional digits', () => {
        const a = Decimal.fromUserInput('123.45', 2);
        const b = Decimal.fromUserInput('123.4', 1);
        expect(() => Decimal.compare(a, b)).toThrow(
          'Fractional digits do not match'
        );
      });
    });

    describe('conversion methods', () => {
      it('should convert to float approximation', () => {
        const decimal = Decimal.fromUserInput('123.45', 2);
        expect(decimal.toFloatApproximation()).toBe(123.45);
      });

      it('should handle large numbers in toString', () => {
        const decimal = Decimal.fromAtomics('12345678901234567890', 2);
        expect(decimal.toString()).toBe('123456789012345678.9');
      });
    });
  });

  describe('Uint32 class', () => {
    describe('constructor', () => {
      it('should create Uint32 from valid number', () => {
        const uint32 = new Uint32(12345);
        expect(uint32.toNumber()).toBe(12345);
        expect(uint32.toString()).toBe('12345');
      });

      it('should throw error for negative number', () => {
        expect(() => new Uint32(-1)).toThrow('Input not in uint32 range: -1');
      });

      it('should throw error for number exceeding uint32 range', () => {
        expect(() => new Uint32(4294967296)).toThrow(
          'Input not in uint32 range: 4294967296'
        );
      });

      it('should throw error for non-integer', () => {
        expect(() => new Uint32(123.45)).toThrow('Input is not an integer');
      });

      it('should throw error for NaN', () => {
        expect(() => new Uint32(NaN)).toThrow('Input is not a number');
      });
    });

    describe('fromString', () => {
      it('should create Uint32 from valid string', () => {
        const uint32 = Uint32.fromString('12345');
        expect(uint32.toNumber()).toBe(12345);
      });

      it('should throw error for invalid string format', () => {
        expect(() => Uint32.fromString('123a')).toThrow(
          'Invalid string format'
        );
        expect(() => Uint32.fromString('-123')).toThrow(
          'Invalid string format'
        );
      });
    });

    describe('fromBytes', () => {
      it('should create Uint32 from big endian bytes', () => {
        const bytes = [0, 0, 48, 57]; // 12345 in big endian
        const uint32 = Uint32.fromBytes(bytes, 'be');
        expect(uint32.toNumber()).toBe(12345);
      });

      it('should create Uint32 from little endian bytes', () => {
        const bytes = [57, 48, 0, 0]; // 12345 in little endian
        const uint32 = Uint32.fromBytes(bytes, 'le');
        expect(uint32.toNumber()).toBe(12345);
      });

      it('should throw error for wrong byte length', () => {
        expect(() => Uint32.fromBytes([1, 2, 3])).toThrow(
          'Invalid input length. Expected 4 bytes.'
        );
      });

      it('should throw error for invalid byte values', () => {
        expect(() => Uint32.fromBytes([1, 2, 3, 256])).toThrow(
          'Invalid value in byte. Found: 256'
        );
        expect(() => Uint32.fromBytes([1, 2, 3, -1])).toThrow(
          'Invalid value in byte. Found: -1'
        );
      });
    });

    describe('toBytes', () => {
      it('should convert to big endian bytes', () => {
        const uint32 = new Uint32(12345);
        const bytes = uint32.toBytesBigEndian();
        expect(Array.from(bytes)).toEqual([0, 0, 48, 57]);
      });

      it('should convert to little endian bytes', () => {
        const uint32 = new Uint32(12345);
        const bytes = uint32.toBytesLittleEndian();
        expect(Array.from(bytes)).toEqual([57, 48, 0, 0]);
      });
    });
  });

  describe('Int53 class', () => {
    describe('constructor', () => {
      it('should create Int53 from valid number', () => {
        const int53 = new Int53(12345);
        expect(int53.toNumber()).toBe(12345);
        expect(int53.toString()).toBe('12345');
      });

      it('should create Int53 from negative number', () => {
        const int53 = new Int53(-12345);
        expect(int53.toNumber()).toBe(-12345);
      });

      it('should throw error for number exceeding safe integer range', () => {
        expect(() => new Int53(Number.MAX_SAFE_INTEGER + 1)).toThrow(
          'Input not in int53 range'
        );
        expect(() => new Int53(Number.MIN_SAFE_INTEGER - 1)).toThrow(
          'Input not in int53 range'
        );
      });

      it('should throw error for non-integer', () => {
        expect(() => new Int53(123.45)).toThrow('Input is not an integer');
      });

      it('should throw error for NaN', () => {
        expect(() => new Int53(NaN)).toThrow('Input is not a number');
      });
    });

    describe('fromString', () => {
      it('should create Int53 from valid string', () => {
        const int53 = Int53.fromString('12345');
        expect(int53.toNumber()).toBe(12345);
      });

      it('should create Int53 from negative string', () => {
        const int53 = Int53.fromString('-12345');
        expect(int53.toNumber()).toBe(-12345);
      });

      it('should throw error for invalid string format', () => {
        expect(() => Int53.fromString('123a')).toThrow('Invalid string format');
        expect(() => Int53.fromString('12.34')).toThrow(
          'Invalid string format'
        );
      });
    });
  });

  describe('Uint53 class', () => {
    describe('constructor', () => {
      it('should create Uint53 from valid number', () => {
        const uint53 = new Uint53(12345);
        expect(uint53.toNumber()).toBe(12345);
        expect(uint53.toString()).toBe('12345');
      });

      it('should throw error for negative number', () => {
        expect(() => new Uint53(-12345)).toThrow('Input is negative');
      });

      it('should throw error for number exceeding safe integer range', () => {
        expect(() => new Uint53(Number.MAX_SAFE_INTEGER + 1)).toThrow(
          'Input not in int53 range'
        );
      });
    });

    describe('fromString', () => {
      it('should create Uint53 from valid string', () => {
        const uint53 = Uint53.fromString('12345');
        expect(uint53.toNumber()).toBe(12345);
      });

      it('should throw error for negative string', () => {
        expect(() => Uint53.fromString('-12345')).toThrow('Input is negative');
      });
    });
  });

  describe('Uint64 class', () => {
    describe('constructor', () => {
      it('should create Uint64 from valid string', () => {
        const uint64 = Uint64.fromString('12345');
        expect(uint64.toString()).toBe('12345');
        expect(uint64.toNumber()).toBe(12345);
      });

      it('should throw error for negative string', () => {
        expect(() => Uint64.fromString('-12345')).toThrow(
          'Invalid string format'
        );
      });

      it('should handle large numbers', () => {
        const uint64 = Uint64.fromString('18446744073709551615');
        expect(uint64.toString()).toBe('18446744073709551615');
      });

      it('should throw error for BN exceeding uint64 range', () => {
        expect(() => Uint64.fromString('18446744073709551616')).toThrow(
          'Input exceeds uint64 range'
        );
      });
    });

    describe('fromNumber', () => {
      it('should create Uint64 from valid number', () => {
        const uint64 = Uint64.fromNumber(12345);
        expect(uint64.toNumber()).toBe(12345);
      });

      it('should throw error for negative number', () => {
        expect(() => Uint64.fromNumber(-12345)).toThrow('Input is negative');
      });

      it('should throw error for non-integer', () => {
        expect(() => Uint64.fromNumber(123.45)).toThrow(
          'Input is not an integer'
        );
      });

      it('should throw error for NaN', () => {
        expect(() => Uint64.fromNumber(NaN)).toThrow('Input is not a number');
      });

      it('should throw error for unsafe integer', () => {
        expect(() => Uint64.fromNumber(Number.MAX_SAFE_INTEGER + 1)).toThrow(
          'Input is not a safe integer'
        );
      });
    });

    describe('fromBytes', () => {
      it('should create Uint64 from big endian bytes', () => {
        const bytes = [0, 0, 0, 0, 0, 0, 48, 57]; // 12345 in big endian
        const uint64 = Uint64.fromBytes(bytes, 'be');
        expect(uint64.toNumber()).toBe(12345);
      });

      it('should create Uint64 from little endian bytes', () => {
        const bytes = [57, 48, 0, 0, 0, 0, 0, 0]; // 12345 in little endian
        const uint64 = Uint64.fromBytes(bytes, 'le');
        expect(uint64.toNumber()).toBe(12345);
      });

      it('should throw error for wrong byte length', () => {
        expect(() => Uint64.fromBytes([1, 2, 3, 4, 5, 6, 7])).toThrow(
          'Invalid input length. Expected 8 bytes.'
        );
      });

      it('should throw error for invalid byte values', () => {
        expect(() => Uint64.fromBytes([1, 2, 3, 4, 5, 6, 7, 256])).toThrow(
          'Invalid value in byte. Found: 256'
        );
      });
    });

    describe('toBytes', () => {
      it('should convert to big endian bytes', () => {
        const uint64 = Uint64.fromNumber(12345);
        const bytes = uint64.toBytesBigEndian();
        expect(bytes.length).toBe(8);
        expect(Array.from(bytes)).toEqual([0, 0, 0, 0, 0, 0, 48, 57]);
      });

      it('should convert to little endian bytes', () => {
        const uint64 = Uint64.fromNumber(12345);
        const bytes = uint64.toBytesLittleEndian();
        expect(bytes.length).toBe(8);
        expect(Array.from(bytes)).toEqual([57, 48, 0, 0, 0, 0, 0, 0]);
      });
    });

    describe('deprecated methods', () => {
      it('should support deprecated fromBytesBigEndian', () => {
        const bytes = [0, 0, 0, 0, 0, 0, 48, 57];
        const uint64 = Uint64.fromBytesBigEndian(bytes);
        expect(uint64.toNumber()).toBe(12345);
      });
    });
  });

  describe('Integration tests', () => {
    it('should work with Decimal multiplication using different integer types', () => {
      const decimal = Decimal.fromUserInput('123.45', 2);

      const uint32 = new Uint32(3);
      const result1 = decimal.multiply(uint32);
      expect(result1.toString()).toBe('370.35');

      const uint53 = new Uint53(4);
      const result2 = decimal.multiply(uint53);
      expect(result2.toString()).toBe('493.8');

      const uint64 = Uint64.fromNumber(5);
      const result3 = decimal.multiply(uint64);
      expect(result3.toString()).toBe('617.25');
    });

    it('should handle edge cases in Decimal operations', () => {
      const zero = Decimal.zero(2);
      const one = Decimal.one(2);

      expect(zero.plus(one).toString()).toBe('1');
      expect(one.minus(zero).toString()).toBe('1');
      expect(zero.multiply(new Uint32(5)).toString()).toBe('0');
    });
  });
});
