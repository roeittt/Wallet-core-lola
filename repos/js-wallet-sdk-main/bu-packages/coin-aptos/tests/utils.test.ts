import { describe, expect, test, beforeEach } from '@jest/globals';

// Import HD Key functions
import {
  getMasterKeyFromSeed,
  CKDPriv,
  getPublicKey,
  isValidPath,
  derivePath,
  type Keys,
} from '../src/utils/hd_key';

// Import Memoize decorators
import {
  Memoize,
  MemoizeExpiring,
  clear,
} from '../src/utils/memoize_decorator';

// Import misc constants (already 100% covered)
import {
  DEFAULT_MAX_GAS_AMOUNT,
  DEFAULT_TXN_EXP_SEC_FROM_NOW,
  DEFAULT_TXN_TIMEOUT_SEC,
  APTOS_COIN,
} from '../src/utils/misc';

describe('Utils Tests', () => {
  describe('HD Key Tests', () => {
    const testSeed = '000102030405060708090a0b0c0d0e0f';
    const testPath = "m/44'/637'/0'/0'/0'";
    const invalidPaths = [
      '',
      'm',
      "44'/637'/0'/0'/0'", // missing m/
      'm/44/637/0/0/0', // missing hardened markers
      "m/44'/invalid'/0'/0'/0'", // non-numeric segment
      "m/44'/637'/0'/0'/0", // missing hardened marker at end
    ];

    test('getMasterKeyFromSeed generates valid master key', () => {
      const masterKey = getMasterKeyFromSeed(testSeed);

      expect(masterKey).toHaveProperty('key');
      expect(masterKey).toHaveProperty('chainCode');
      expect(masterKey.key).toBeInstanceOf(Uint8Array);
      expect(masterKey.chainCode).toBeInstanceOf(Uint8Array);
      expect(masterKey.key.length).toBe(32);
      expect(masterKey.chainCode.length).toBe(32);
    });

    test('getMasterKeyFromSeed is deterministic', () => {
      const masterKey1 = getMasterKeyFromSeed(testSeed);
      const masterKey2 = getMasterKeyFromSeed(testSeed);

      expect(masterKey1.key).toEqual(masterKey2.key);
      expect(masterKey1.chainCode).toEqual(masterKey2.chainCode);
    });

    test('getMasterKeyFromSeed with different seeds produces different keys', () => {
      const seed1 = '000102030405060708090a0b0c0d0e0f';
      const seed2 = '101112131415161718191a1b1c1d1e1f';

      const masterKey1 = getMasterKeyFromSeed(seed1);
      const masterKey2 = getMasterKeyFromSeed(seed2);

      expect(masterKey1.key).not.toEqual(masterKey2.key);
      expect(masterKey1.chainCode).not.toEqual(masterKey2.chainCode);
    });

    test('CKDPriv derives child keys correctly', () => {
      const parentKey: Keys = {
        key: new Uint8Array(32).fill(1),
        chainCode: new Uint8Array(32).fill(2),
      };
      const index = 0x80000000; // hardened key

      const childKey = CKDPriv(parentKey, index);

      expect(childKey).toHaveProperty('key');
      expect(childKey).toHaveProperty('chainCode');
      expect(childKey.key).toBeInstanceOf(Uint8Array);
      expect(childKey.chainCode).toBeInstanceOf(Uint8Array);
      expect(childKey.key.length).toBe(32);
      expect(childKey.chainCode.length).toBe(32);
      expect(childKey.key).not.toEqual(parentKey.key);
      expect(childKey.chainCode).not.toEqual(parentKey.chainCode);
    });

    test('CKDPriv is deterministic', () => {
      const parentKey: Keys = {
        key: new Uint8Array(32).fill(1),
        chainCode: new Uint8Array(32).fill(2),
      };
      const index = 0x80000000;

      const childKey1 = CKDPriv(parentKey, index);
      const childKey2 = CKDPriv(parentKey, index);

      expect(childKey1.key).toEqual(childKey2.key);
      expect(childKey1.chainCode).toEqual(childKey2.chainCode);
    });

    test('CKDPriv with different indices produces different keys', () => {
      const parentKey: Keys = {
        key: new Uint8Array(32).fill(1),
        chainCode: new Uint8Array(32).fill(2),
      };

      const childKey1 = CKDPriv(parentKey, 0x80000000);
      const childKey2 = CKDPriv(parentKey, 0x80000001);

      expect(childKey1.key).not.toEqual(childKey2.key);
      expect(childKey1.chainCode).not.toEqual(childKey2.chainCode);
    });

    test('getPublicKey generates public key from private key', () => {
      const privateKey = new Uint8Array(32).fill(1);

      const publicKey = getPublicKey(privateKey);

      expect(publicKey).toBeInstanceOf(Uint8Array);
      expect(publicKey.length).toBe(33); // 32 + 1 zero byte
      expect(publicKey[0]).toBe(0); // zero byte prefix
    });

    test('getPublicKey without zero byte', () => {
      const privateKey = new Uint8Array(32).fill(1);

      const publicKey = getPublicKey(privateKey, false);

      expect(publicKey).toBeInstanceOf(Uint8Array);
      expect(publicKey.length).toBe(32); // no zero byte prefix
    });

    test('getPublicKey is deterministic', () => {
      const privateKey = new Uint8Array(32).fill(1);

      const publicKey1 = getPublicKey(privateKey);
      const publicKey2 = getPublicKey(privateKey);

      expect(publicKey1).toEqual(publicKey2);
    });

    test('isValidPath validates correct paths', () => {
      const validPaths = [
        "m/44'",
        "m/44'/637'",
        "m/44'/637'/0'",
        "m/44'/637'/0'/0'",
        "m/44'/637'/0'/0'/0'",
        "m/0'/1'/2'/3'/4'/5'",
      ];

      validPaths.forEach((path) => {
        expect(isValidPath(path)).toBe(true);
      });
    });

    test('isValidPath rejects invalid paths', () => {
      invalidPaths.forEach((path) => {
        expect(isValidPath(path)).toBe(false);
      });
    });

    test('isValidPath rejects paths with non-numeric segments', () => {
      const pathsWithNaN = [
        "m/44'/invalid'",
        "m/44'/637'/abc'",
        "m/44'/637'/0'/xyz'/0'",
      ];

      pathsWithNaN.forEach((path) => {
        expect(isValidPath(path)).toBe(false);
      });
    });

    test('derivePath derives keys from valid path', () => {
      const derivedKey = derivePath(testPath, testSeed);

      expect(derivedKey).toHaveProperty('key');
      expect(derivedKey).toHaveProperty('chainCode');
      expect(derivedKey.key).toBeInstanceOf(Uint8Array);
      expect(derivedKey.chainCode).toBeInstanceOf(Uint8Array);
      expect(derivedKey.key.length).toBe(32);
      expect(derivedKey.chainCode.length).toBe(32);
    });

    test('derivePath is deterministic', () => {
      const derivedKey1 = derivePath(testPath, testSeed);
      const derivedKey2 = derivePath(testPath, testSeed);

      expect(derivedKey1.key).toEqual(derivedKey2.key);
      expect(derivedKey1.chainCode).toEqual(derivedKey2.chainCode);
    });

    test('derivePath throws error for invalid paths', () => {
      invalidPaths.forEach((path) => {
        expect(() => derivePath(path, testSeed)).toThrow(
          'Invalid derivation path'
        );
      });
    });

    test('derivePath with custom offset', () => {
      const customOffset = 0x90000000;
      const derivedKey1 = derivePath(testPath, testSeed);
      const derivedKey2 = derivePath(testPath, testSeed, customOffset);

      expect(derivedKey1.key).not.toEqual(derivedKey2.key);
      expect(derivedKey1.chainCode).not.toEqual(derivedKey2.chainCode);
    });

    test('derivePath with different seeds produces different keys', () => {
      const seed1 = '000102030405060708090a0b0c0d0e0f';
      const seed2 = '101112131415161718191a1b1c1d1e1f';

      const derivedKey1 = derivePath(testPath, seed1);
      const derivedKey2 = derivePath(testPath, seed2);

      expect(derivedKey1.key).not.toEqual(derivedKey2.key);
      expect(derivedKey1.chainCode).not.toEqual(derivedKey2.chainCode);
    });

    test('derivePath handles single segment path', () => {
      const simplePath = "m/44'";
      const derivedKey = derivePath(simplePath, testSeed);

      expect(derivedKey).toHaveProperty('key');
      expect(derivedKey).toHaveProperty('chainCode');
      expect(derivedKey.key.length).toBe(32);
      expect(derivedKey.chainCode.length).toBe(32);
    });

    test('derivePath handles long path', () => {
      const longPath = "m/44'/637'/0'/0'/0'/1'/2'/3'";
      const derivedKey = derivePath(longPath, testSeed);

      expect(derivedKey).toHaveProperty('key');
      expect(derivedKey).toHaveProperty('chainCode');
      expect(derivedKey.key.length).toBe(32);
      expect(derivedKey.chainCode.length).toBe(32);
    });
  });

  describe('Memoize Decorator Tests', () => {
    let testClass: any;
    let methodCallCount: number;
    let getterCallCount: number;

    beforeEach(() => {
      methodCallCount = 0;
      getterCallCount = 0;

      class TestClass {
        // @ts-ignore
        @Memoize()
        simpleMethod(value: number): number {
          methodCallCount++;
          return value * 2;
        }

        // @ts-ignore
        @Memoize(true) // Auto hash all arguments
        multiArgMethod(a: number, b: string): string {
          methodCallCount++;
          return `${a}-${b}`;
        }

        // @ts-ignore
        @Memoize((x: number) => `custom-${x}`) // Custom hash function
        customHashMethod(value: number): number {
          methodCallCount++;
          return value * 3;
        }

        // @ts-ignore
        @MemoizeExpiring(100) // 100ms TTL
        expiringMethod(value: number): number {
          methodCallCount++;
          return value * 4;
        }

        // @ts-ignore
        @Memoize({ ttlMs: 50, tags: ['test-tag'] })
        taggedMethod(value: number): number {
          methodCallCount++;
          return value * 5;
        }

        // @ts-ignore
        @Memoize()
        get computedValue(): number {
          getterCallCount++;
          return Math.random();
        }

        // Method that returns different values to test caching
        // @ts-ignore
        @Memoize()
        randomMethod(): number {
          methodCallCount++;
          return Math.random();
        }

        // Method with no arguments
        // @ts-ignore
        @Memoize()
        noArgsMethod(): string {
          methodCallCount++;
          return 'constant';
        }
      }

      testClass = new TestClass();
    });

    test('Memoize caches method results', () => {
      const result1 = testClass.simpleMethod(5);
      const result2 = testClass.simpleMethod(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(methodCallCount).toBe(1); // Method called only once
    });

    test('Memoize differentiates by arguments', () => {
      const result1 = testClass.simpleMethod(5);
      const result2 = testClass.simpleMethod(10);
      const result3 = testClass.simpleMethod(5); // Same as first call

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(result3).toBe(10);
      expect(methodCallCount).toBe(2); // Called twice for different arguments
    });

    test('Memoize with auto hash function', () => {
      const result1 = testClass.multiArgMethod(1, 'test');
      const result2 = testClass.multiArgMethod(1, 'test');
      const result3 = testClass.multiArgMethod(2, 'test');

      expect(result1).toBe('1-test');
      expect(result2).toBe('1-test');
      expect(result3).toBe('2-test');
      expect(methodCallCount).toBe(2); // Called twice for different argument combinations
    });

    test('Memoize with custom hash function', () => {
      const result1 = testClass.customHashMethod(5);
      const result2 = testClass.customHashMethod(5);

      expect(result1).toBe(15);
      expect(result2).toBe(15);
      expect(methodCallCount).toBe(1); // Method called only once
    });

    test('MemoizeExpiring respects TTL', async () => {
      const result1 = testClass.expiringMethod(5);
      expect(result1).toBe(20);
      expect(methodCallCount).toBe(1);

      // Call again before expiration
      const result2 = testClass.expiringMethod(5);
      expect(result2).toBe(20);
      expect(methodCallCount).toBe(1); // Still cached

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      const result3 = testClass.expiringMethod(5);
      expect(result3).toBe(20);
      expect(methodCallCount).toBe(2); // Called again after expiration
    });

    test('Memoize works with getters', () => {
      const value1 = testClass.computedValue;
      const value2 = testClass.computedValue;

      expect(value1).toBe(value2); // Same random value
      expect(getterCallCount).toBe(1); // Getter called only once
    });

    test('Memoize with tags and clear functionality', () => {
      const result1 = testClass.taggedMethod(5);
      expect(result1).toBe(25);
      expect(methodCallCount).toBe(1);

      // Call again, should be cached
      const result2 = testClass.taggedMethod(5);
      expect(result2).toBe(25);
      expect(methodCallCount).toBe(1);

      // Clear cache by tag
      const clearedCount = clear(['test-tag']);
      expect(clearedCount).toBeGreaterThan(0);

      // Call again after clearing, should call method again
      const result3 = testClass.taggedMethod(5);
      expect(result3).toBe(25);
      expect(methodCallCount).toBe(2);
    });

    test('clear function with non-existent tags', () => {
      const clearedCount = clear(['non-existent-tag']);
      expect(clearedCount).toBe(0);
    });

    test('clear function with multiple tags', () => {
      // Setup multiple tagged methods
      class MultiTagClass {
        // @ts-ignore
        @Memoize({ tags: ['tag1', 'tag2'] })
        method1(): number {
          return 1;
        }

        // @ts-ignore
        @Memoize({ tags: ['tag2', 'tag3'] })
        method2(): number {
          return 2;
        }
      }

      const instance = new MultiTagClass();
      instance.method1();
      instance.method2();

      const clearedCount = clear(['tag1', 'tag2', 'tag3']);
      expect(clearedCount).toBeGreaterThan(0);
    });

    test('Memoize with no arguments uses instance as key', () => {
      const result1 = testClass.noArgsMethod();
      const result2 = testClass.noArgsMethod();

      expect(result1).toBe('constant');
      expect(result2).toBe('constant');
      expect(methodCallCount).toBe(1); // Method called only once
    });

    test('Memoize preserves return values', () => {
      const result1 = testClass.randomMethod();
      const result2 = testClass.randomMethod();

      expect(result1).toBe(result2); // Same random value cached
      expect(methodCallCount).toBe(1);
    });

    test('Different instances have separate caches', () => {
      class AnotherTestClass {
        // @ts-ignore
        @Memoize()
        getValue(): number {
          return Math.random();
        }
      }

      const instance1 = new AnotherTestClass();
      const instance2 = new AnotherTestClass();

      const value1 = instance1.getValue();
      const value2 = instance2.getValue();
      const value3 = instance1.getValue(); // Should be cached
      const value4 = instance2.getValue(); // Should be cached

      expect(value1).toBe(value3); // Same instance, cached value
      expect(value2).toBe(value4); // Same instance, cached value
      expect(value1).not.toBe(value2); // Different instances, different values
    });

    test('Memoize error when applied to invalid descriptor', () => {
      // Test that invalid descriptor usage throws an error
      const mockDescriptor = {
        set: () => {},
        get: undefined,
        value: undefined,
      };

      expect(() => {
        // @ts-ignore - Intentionally testing invalid usage
        Memoize()({}, 'testProperty', mockDescriptor);
      }).toThrow('Only put a Memoize() decorator on a method or get accessor.');
    });

    test('MemoizeExpiring with custom hash function', () => {
      class ExpiringHashClass {
        private callCount = 0;

        // @ts-ignore
        @MemoizeExpiring(100, (x: number) => `exp-${x}`)
        method(value: number): number {
          this.callCount++;
          return value * this.callCount;
        }

        getCallCount(): number {
          return this.callCount;
        }
      }

      const instance = new ExpiringHashClass();

      const result1 = instance.method(5);
      const result2 = instance.method(5);

      expect(result1).toBe(5); // 5 * 1
      expect(result2).toBe(5); // Cached
      expect(instance.getCallCount()).toBe(1);
    });

    test('Complex memoization scenario with mixed options', () => {
      class ComplexClass {
        private counter = 0;

        // @ts-ignore
        @Memoize({
          ttlMs: 50,
          hashFunction: true,
          tags: ['complex'],
        })
        complexMethod(a: number, b: string, c: boolean): string {
          this.counter++;
          return `${a}-${b}-${c}-${this.counter}`;
        }

        getCounter(): number {
          return this.counter;
        }
      }

      const instance = new ComplexClass();

      // Test caching with multiple arguments
      const result1 = instance.complexMethod(1, 'test', true);
      const result2 = instance.complexMethod(1, 'test', true);
      expect(result1).toBe(result2);
      expect(instance.getCounter()).toBe(1);

      // Test different arguments
      const result3 = instance.complexMethod(1, 'test', false);
      expect(result3).not.toBe(result1);
      expect(instance.getCounter()).toBe(2);

      // Test cache clearing
      clear(['complex']);
      const result4 = instance.complexMethod(1, 'test', true);
      expect(result4).not.toBe(result1); // Different counter value
      expect(instance.getCounter()).toBe(3);
    });
  });

  describe('Misc Constants Tests', () => {
    test('Constants have expected values', () => {
      expect(DEFAULT_MAX_GAS_AMOUNT).toBe(200000);
      expect(DEFAULT_TXN_EXP_SEC_FROM_NOW).toBe(20);
      expect(DEFAULT_TXN_TIMEOUT_SEC).toBe(20);
      expect(APTOS_COIN).toBe('0x1::aptos_coin::AptosCoin');
    });

    test('Constants are immutable', () => {
      // These should be read-only, but TypeScript enforces this at compile time
      expect(typeof DEFAULT_MAX_GAS_AMOUNT).toBe('number');
      expect(typeof DEFAULT_TXN_EXP_SEC_FROM_NOW).toBe('number');
      expect(typeof DEFAULT_TXN_TIMEOUT_SEC).toBe('number');
      expect(typeof APTOS_COIN).toBe('string');
    });
  });
});
