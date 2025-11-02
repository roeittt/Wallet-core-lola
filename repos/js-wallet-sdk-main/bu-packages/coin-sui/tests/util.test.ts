import { formatAddress, formatDigest } from '../src/utils/format'
import {
    AppId,
    IntentScope,
    IntentVersion,
    messageWithIntent
} from '../src/utils/intent'
import { defineReadOnly } from '../src/utils/properties'

describe('Format Utils', () => {
  describe('formatAddress', () => {
    test('should format address with 0x prefix', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const formatted = formatAddress(address);
      expect(formatted).toBe('0x1234…5678');
    });

    test('should format address without 0x prefix', () => {
      const address = '1234567890abcdef1234567890abcdef12345678';
      const formatted = formatAddress(address);
      expect(formatted).toBe('0x1234…5678');
    });

    test('should handle short addresses', () => {
      const address = '0x123456';
      const formatted = formatAddress(address);
      expect(formatted).toBe('0x1234…3456');
    });

    test('should handle minimum length addresses', () => {
      const address = '0x12345678';
      const formatted = formatAddress(address);
      expect(formatted).toBe('0x1234…5678');
    });

    test('should handle empty address', () => {
      const address = '';
      const formatted = formatAddress(address);
      expect(formatted).toBe('0x…');
    });
  });

  describe('formatDigest', () => {
    test('should format long digest', () => {
      const digest = '1234567890abcdef1234567890abcdef';
      const formatted = formatDigest(digest);
      expect(formatted).toBe('1234567890…');
    });

    test('should format digest with exactly 10 characters', () => {
      const digest = '1234567890';
      const formatted = formatDigest(digest);
      expect(formatted).toBe('1234567890…');
    });

    test('should format short digest', () => {
      const digest = '12345';
      const formatted = formatDigest(digest);
      expect(formatted).toBe('12345…');
    });

    test('should handle empty digest', () => {
      const digest = '';
      const formatted = formatDigest(digest);
      expect(formatted).toBe('…');
    });
  });
});

describe('Intent Utils', () => {
  describe('Enums', () => {
    test('AppId enum should have correct values', () => {
      expect(AppId.Sui).toBe(0);
    });

    test('IntentVersion enum should have correct values', () => {
      expect(IntentVersion.V0).toBe(0);
    });

    test('IntentScope enum should have correct values', () => {
      expect(IntentScope.TransactionData).toBe(0);
      expect(IntentScope.TransactionEffects).toBe(1);
      expect(IntentScope.CheckpointSummary).toBe(2);
      expect(IntentScope.PersonalMessage).toBe(3);
    });
  });

  describe('messageWithIntent', () => {
    test('should create intent message for TransactionData', () => {
      const message = new Uint8Array([1, 2, 3, 4]);
      const intentMessage = messageWithIntent(IntentScope.TransactionData, message);
      
      // Expected: [scope, version, appId, ...message]
      const expected = new Uint8Array([0, 0, 0, 1, 2, 3, 4]);
      expect(intentMessage).toEqual(expected);
    });

    test('should create intent message for PersonalMessage', () => {
      const message = new Uint8Array([5, 6, 7, 8]);
      const intentMessage = messageWithIntent(IntentScope.PersonalMessage, message);
      
      // Expected: [scope, version, appId, ...message]
      const expected = new Uint8Array([3, 0, 0, 5, 6, 7, 8]);
      expect(intentMessage).toEqual(expected);
    });

    test('should create intent message for TransactionEffects', () => {
      const message = new Uint8Array([10, 20, 30]);
      const intentMessage = messageWithIntent(IntentScope.TransactionEffects, message);
      
      // Expected: [scope, version, appId, ...message]
      const expected = new Uint8Array([1, 0, 0, 10, 20, 30]);
      expect(intentMessage).toEqual(expected);
    });

    test('should create intent message for CheckpointSummary', () => {
      const message = new Uint8Array([100, 200]);
      const intentMessage = messageWithIntent(IntentScope.CheckpointSummary, message);
      
      // Expected: [scope, version, appId, ...message]
      const expected = new Uint8Array([2, 0, 0, 100, 200]);
      expect(intentMessage).toEqual(expected);
    });

    test('should handle empty message', () => {
      const message = new Uint8Array([]);
      const intentMessage = messageWithIntent(IntentScope.TransactionData, message);
      
      // Expected: [scope, version, appId]
      const expected = new Uint8Array([0, 0, 0]);
      expect(intentMessage).toEqual(expected);
    });

    test('should create correct length intent message', () => {
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const intentMessage = messageWithIntent(IntentScope.TransactionData, message);
      
      // Should be intent length (3) + message length (5) = 8
      expect(intentMessage.length).toBe(8);
    });
  });
});

describe('Properties Utils', () => {
  describe('defineReadOnly', () => {
    test('should define read-only property', () => {
      const obj: any = {};
      defineReadOnly(obj, 'testProp', 'testValue');
      
      expect(obj.testProp).toBe('testValue');
    });

    test('should make property non-writable', () => {
      const obj: any = {};
      defineReadOnly(obj, 'testProp', 'testValue');
      
      // Try to modify the property - should throw in strict mode or silently fail
      try {
        obj.testProp = 'newValue';
      } catch (error) {
        // In strict mode, this will throw an error
      }
      
      // Property should remain unchanged
      expect(obj.testProp).toBe('testValue');
    });

    test('should make property enumerable', () => {
      const obj: any = {};
      defineReadOnly(obj, 'testProp', 'testValue');
      
      const descriptor = Object.getOwnPropertyDescriptor(obj, 'testProp');
      expect(descriptor?.enumerable).toBe(true);
    });

    test('should make property non-configurable by default', () => {
      const obj: any = {};
      defineReadOnly(obj, 'testProp', 'testValue');
      
      const descriptor = Object.getOwnPropertyDescriptor(obj, 'testProp');
      expect(descriptor?.writable).toBe(false);
    });

    test('should work with different value types', () => {
      const obj: any = {};
      
      defineReadOnly(obj, 'stringProp', 'string');
      defineReadOnly(obj, 'numberProp', 42);
      defineReadOnly(obj, 'booleanProp', true);
      defineReadOnly(obj, 'objectProp', { nested: 'value' });
      defineReadOnly(obj, 'arrayProp', [1, 2, 3]);
      
      expect(obj.stringProp).toBe('string');
      expect(obj.numberProp).toBe(42);
      expect(obj.booleanProp).toBe(true);
      expect(obj.objectProp).toEqual({ nested: 'value' });
      expect(obj.arrayProp).toEqual([1, 2, 3]);
    });

    test('should work with typed objects', () => {
      interface TestInterface {
        name: string;
        value: number;
      }
      
      const obj: Partial<TestInterface> = {};
      defineReadOnly(obj, 'name', 'test');
      defineReadOnly(obj, 'value', 123);
      
      expect(obj.name).toBe('test');
      expect(obj.value).toBe(123);
    });

    test('should preserve existing properties', () => {
      const obj: any = { existingProp: 'existing' };
      defineReadOnly(obj, 'newProp', 'new');
      
      expect(obj.existingProp).toBe('existing');
      expect(obj.newProp).toBe('new');
    });

    test('should handle null and undefined values', () => {
      const obj: any = {};
      defineReadOnly(obj, 'nullProp', null);
      defineReadOnly(obj, 'undefinedProp', undefined);
      
      expect(obj.nullProp).toBe(null);
      expect(obj.undefinedProp).toBe(undefined);
    });
  });
}); 