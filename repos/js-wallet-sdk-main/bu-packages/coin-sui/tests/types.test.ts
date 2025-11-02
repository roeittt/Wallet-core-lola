import {
  // Normalized utilities
  extractMutableReference,
  extractReference,
  extractStructTag,
  getMoveObject,
  getMoveObjectType,
  getMovePackageContent,
  getObjectFields,
  getObjectId,
  getObjectOwner,
  getObjectPreviousTransactionDigest,
  getObjectType,
  getObjectVersion,
  getSharedObjectInitialVersion,
  // Object utilities
  getSuiObjectData,
  hasPublicTransfer,
  isImmutableObject,
  isSharedObject,
  isValidSuiAddress,
  isValidSuiObjectId,
  // Common utilities
  isValidTransactionDigest,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  ObjectOwner,
  SUI_ADDRESS_LENGTH,
  SuiMoveNormalizedType,
  SuiMoveObject,
  SuiMovePackage,
  SuiObjectData,
  SuiObjectRef,
  // Types
  SuiObjectResponse,
} from '../src/types';

describe('Types Module Tests', () => {
  describe('Common Utilities', () => {
    describe('isValidTransactionDigest', () => {
      it('should validate valid transaction digest', () => {
        // Valid base58 digest with 32 bytes
        const validDigest = 'BqbNZnBxuwFvF9gj4NQpZygLLq8k4z9LNFVfhTd2qd9Q';
        expect(isValidTransactionDigest(validDigest)).toBe(true);
      });

      it('should reject invalid transaction digest - wrong length', () => {
        const shortDigest = 'BqbNZnBxuwFvF9gj';
        expect(isValidTransactionDigest(shortDigest)).toBe(false);
      });

      it('should reject invalid transaction digest - invalid base58', () => {
        const invalidDigest = 'invalid-base58-characters!@#$';
        expect(isValidTransactionDigest(invalidDigest)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isValidTransactionDigest('')).toBe(false);
      });

      it('should reject non-string values', () => {
        expect(isValidTransactionDigest(null as any)).toBe(false);
        expect(isValidTransactionDigest(undefined as any)).toBe(false);
        expect(isValidTransactionDigest(123 as any)).toBe(false);
      });
    });

    describe('isValidSuiAddress', () => {
      it('should validate valid Sui address with 0x prefix', () => {
        const validAddress =
          '0x0000000000000000000000000000000000000000000000000000000000000001';
        expect(isValidSuiAddress(validAddress)).toBe(true);
      });

      it('should validate valid Sui address without 0x prefix', () => {
        const validAddress =
          '0000000000000000000000000000000000000000000000000000000000000001';
        expect(isValidSuiAddress(validAddress)).toBe(true);
      });

      it('should validate uppercase hex address', () => {
        const validAddress =
          '0x000000000000000000000000000000000000000000000000000000000000000A';
        expect(isValidSuiAddress(validAddress)).toBe(true);
      });

      it('should reject address that is too short', () => {
        const shortAddress = '0x123';
        expect(isValidSuiAddress(shortAddress)).toBe(false);
      });

      it('should reject address that is too long', () => {
        const longAddress =
          '0x00000000000000000000000000000000000000000000000000000000000000001';
        expect(isValidSuiAddress(longAddress)).toBe(false);
      });

      it('should reject non-hex characters', () => {
        const invalidAddress =
          '0x00000000000000000000000000000000000000000000000000000000000000g1';
        expect(isValidSuiAddress(invalidAddress)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isValidSuiAddress('')).toBe(false);
      });

      it('should reject odd length hex', () => {
        const oddLengthAddress = '0x123';
        expect(isValidSuiAddress(oddLengthAddress)).toBe(false);
      });
    });

    describe('isValidSuiObjectId', () => {
      it('should validate valid object ID (same as address)', () => {
        const validObjectId =
          '0x0000000000000000000000000000000000000000000000000000000000000001';
        expect(isValidSuiObjectId(validObjectId)).toBe(true);
      });

      it('should reject invalid object ID', () => {
        const invalidObjectId = '0x123';
        expect(isValidSuiObjectId(invalidObjectId)).toBe(false);
      });
    });

    describe('normalizeSuiAddress', () => {
      it('should normalize short address by padding with zeros', () => {
        const shortAddress = '0x1';
        const normalized = normalizeSuiAddress(shortAddress);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );
        expect(normalized.length).toBe(SUI_ADDRESS_LENGTH * 2 + 2); // 2 for '0x'
      });

      it('should normalize address without 0x prefix', () => {
        const address = '1';
        const normalized = normalizeSuiAddress(address);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );
      });

      it('should convert uppercase to lowercase', () => {
        const uppercaseAddress = '0xABCDEF';
        const normalized = normalizeSuiAddress(uppercaseAddress);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000abcdef'
        );
      });

      it('should handle already normalized address', () => {
        const alreadyNormalized =
          '0x0000000000000000000000000000000000000000000000000000000000000001';
        const normalized = normalizeSuiAddress(alreadyNormalized);
        expect(normalized).toBe(alreadyNormalized);
      });

      it('should handle forceAdd0x parameter for double 0x prefix', () => {
        const doublePrefix = '0x0x123';
        const normalized = normalizeSuiAddress(doublePrefix, true);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000x0x123'
        );
      });

      it('should handle forceAdd0x parameter normally', () => {
        const address = '123';
        const normalized = normalizeSuiAddress(address, true);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000000123'
        );
      });

      it('should handle empty string', () => {
        const normalized = normalizeSuiAddress('');
        expect(normalized).toBe('0x' + '0'.repeat(SUI_ADDRESS_LENGTH * 2));
      });

      it('should handle very long address', () => {
        const longAddress = '1'.repeat(100);
        const normalized = normalizeSuiAddress(longAddress);
        expect(normalized).toContain('0x');
        expect(normalized.length).toBeGreaterThan(SUI_ADDRESS_LENGTH * 2 + 2);
      });
    });

    describe('normalizeSuiObjectId', () => {
      it('should normalize object ID same as address', () => {
        const objectId = '0x1';
        const normalized = normalizeSuiObjectId(objectId);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );
      });

      it('should handle forceAdd0x parameter', () => {
        const objectId = '123';
        const normalized = normalizeSuiObjectId(objectId, true);
        expect(normalized).toBe(
          '0x0000000000000000000000000000000000000000000000000000000000000123'
        );
      });
    });
  });

  describe('Object Utilities', () => {
    // Mock data for testing
    const mockSuiObjectData: SuiObjectData = {
      objectId: '0x123',
      version: 1,
      digest: 'mockdigest',
      type: '0x2::coin::Coin<0x2::sui::SUI>',
      owner: { AddressOwner: '0x456' },
      previousTransaction: 'previoustxdigest',
      storageRebate: 100,
      content: {
        dataType: 'moveObject',
        type: '0x2::coin::Coin<0x2::sui::SUI>',
        fields: { balance: '1000', id: { id: '0x123' } },
        hasPublicTransfer: true,
      },
    };

    const mockSuiObjectResponse: SuiObjectResponse = {
      data: mockSuiObjectData,
    };

    const mockPackageData: SuiObjectData = {
      objectId: '0x789',
      version: 1,
      digest: 'packagedigest',
      type: 'package',
      owner: 'Immutable',
      previousTransaction: 'previoustxdigest',
      storageRebate: 0,
      content: {
        dataType: 'package',
        disassembled: {
          module1: 'bytecode1',
          module2: 'bytecode2',
        },
      },
    };

    const mockSharedObjectData: SuiObjectData = {
      objectId: '0xabc',
      version: 5,
      digest: 'shareddigest',
      type: '0x2::shared::Object',
      owner: { Shared: { initial_shared_version: 3 } },
      previousTransaction: 'previoustxdigest',
      storageRebate: 50,
    };

    describe('getSuiObjectData', () => {
      it('should extract data from SuiObjectResponse', () => {
        const data = getSuiObjectData(mockSuiObjectResponse);
        expect(data).toBe(mockSuiObjectData);
      });

      it('should return undefined for response without data', () => {
        const emptyResponse: SuiObjectResponse = {};
        const data = getSuiObjectData(emptyResponse);
        expect(data).toBeUndefined();
      });

      it('should return undefined for response with error', () => {
        const errorResponse: SuiObjectResponse = {
          error: { tag: 'NotExists', object_id: '0x123' },
        };
        const data = getSuiObjectData(errorResponse);
        expect(data).toBeUndefined();
      });
    });

    describe('getObjectId', () => {
      it('should extract object ID from SuiObjectResponse', () => {
        const id = getObjectId(mockSuiObjectResponse);
        expect(id).toBe('0x123');
      });

      it('should extract object ID from SuiObjectData', () => {
        const id = getObjectId(mockSuiObjectData);
        expect(id).toBe('0x123');
      });

      it('should extract object ID from SuiObjectRef', () => {
        const ref: SuiObjectRef = {
          objectId: '0x456',
          version: '2',
          digest: 'refdigest',
        };
        const id = getObjectId(ref);
        expect(id).toBe('0x456');
      });

      it('should handle invalid response', () => {
        const id = getObjectId({} as SuiObjectResponse);
        expect(id).toBeUndefined();
      });
    });

    describe('getObjectVersion', () => {
      it('should extract version from object data', () => {
        const version = getObjectVersion(mockSuiObjectResponse);
        expect(version).toBe(1);
      });

      it('should handle string version', () => {
        const ref: SuiObjectRef = {
          objectId: '0x123',
          version: '5',
          digest: 'digest',
        };
        const version = getObjectVersion(ref);
        expect(version).toBe('5');
      });

      it('should return undefined for invalid object', () => {
        const version = getObjectVersion({} as SuiObjectResponse);
        expect(version).toBeUndefined();
      });
    });

    describe('getObjectPreviousTransactionDigest', () => {
      it('should extract previous transaction digest', () => {
        const digest = getObjectPreviousTransactionDigest(
          mockSuiObjectResponse
        );
        expect(digest).toBe('previoustxdigest');
      });

      it('should return undefined for invalid object', () => {
        const digest = getObjectPreviousTransactionDigest(
          {} as SuiObjectResponse
        );
        expect(digest).toBeUndefined();
      });
    });

    describe('getObjectType', () => {
      it('should extract type from object data', () => {
        const type = getObjectType(mockSuiObjectResponse);
        expect(type).toBe('0x2::coin::Coin<0x2::sui::SUI>');
      });

      it('should handle package type', () => {
        const type = getObjectType(mockPackageData);
        expect(type).toBe('package');
      });

      it('should return undefined for invalid object', () => {
        const type = getObjectType({} as SuiObjectResponse);
        expect(type).toBeUndefined();
      });
    });

    describe('getObjectOwner', () => {
      it('should extract owner from object data', () => {
        const owner = getObjectOwner(mockSuiObjectResponse);
        expect(owner).toEqual({ AddressOwner: '0x456' });
      });

      it('should handle shared object owner', () => {
        const sharedResponse: SuiObjectResponse = {
          data: mockSharedObjectData,
        };
        const owner = getObjectOwner(sharedResponse);
        expect(owner).toEqual({ Shared: { initial_shared_version: 3 } });
      });

      it('should handle immutable object owner', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const owner = getObjectOwner(packageResponse);
        expect(owner).toBe('Immutable');
      });

      it('should handle ObjectOwner directly', () => {
        const directOwner: ObjectOwner = { AddressOwner: '0x999' };
        const owner = getObjectOwner(directOwner);
        expect(owner).toEqual({ AddressOwner: '0x999' });
      });

      it('should return undefined for invalid object', () => {
        const owner = getObjectOwner({} as SuiObjectResponse);
        expect(owner).toBeUndefined();
      });
    });

    describe('getSharedObjectInitialVersion', () => {
      it('should extract initial shared version', () => {
        const sharedResponse: SuiObjectResponse = {
          data: mockSharedObjectData,
        };
        const version = getSharedObjectInitialVersion(sharedResponse);
        expect(version).toBe(3);
      });

      it('should return undefined for non-shared object', () => {
        const version = getSharedObjectInitialVersion(mockSuiObjectResponse);
        expect(version).toBeUndefined();
      });

      it('should handle ObjectOwner directly', () => {
        const sharedOwner: ObjectOwner = {
          Shared: { initial_shared_version: 7 },
        };
        const version = getSharedObjectInitialVersion(sharedOwner);
        expect(version).toBe(7);
      });

      it('should return undefined for invalid object', () => {
        const version = getSharedObjectInitialVersion({} as SuiObjectResponse);
        expect(version).toBeUndefined();
      });
    });

    describe('isSharedObject', () => {
      it('should identify shared object', () => {
        const sharedResponse: SuiObjectResponse = {
          data: mockSharedObjectData,
        };
        expect(isSharedObject(sharedResponse)).toBe(true);
      });

      it('should return false for non-shared object', () => {
        expect(isSharedObject(mockSuiObjectResponse)).toBe(false);
      });

      it('should return false for immutable object', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        expect(isSharedObject(packageResponse)).toBe(false);
      });

      it('should handle ObjectOwner directly', () => {
        const sharedOwner: ObjectOwner = {
          Shared: { initial_shared_version: 5 },
        };
        expect(isSharedObject(sharedOwner)).toBe(true);
      });
    });

    describe('isImmutableObject', () => {
      it('should identify immutable object', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        expect(isImmutableObject(packageResponse)).toBe(true);
      });

      it('should return false for owned object', () => {
        expect(isImmutableObject(mockSuiObjectResponse)).toBe(false);
      });

      it('should return false for shared object', () => {
        const sharedResponse: SuiObjectResponse = {
          data: mockSharedObjectData,
        };
        expect(isImmutableObject(sharedResponse)).toBe(false);
      });

      it('should handle ObjectOwner directly', () => {
        expect(isImmutableObject('Immutable')).toBe(true);
      });
    });

    describe('getMoveObjectType', () => {
      it('should extract Move object type', () => {
        const type = getMoveObjectType(mockSuiObjectResponse);
        expect(type).toBe('0x2::coin::Coin<0x2::sui::SUI>');
      });

      it('should return undefined for package', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const type = getMoveObjectType(packageResponse);
        expect(type).toBeUndefined();
      });

      it('should return undefined for invalid object', () => {
        const type = getMoveObjectType({} as SuiObjectResponse);
        expect(type).toBeUndefined();
      });
    });

    describe('getObjectFields', () => {
      it('should extract fields from Move object', () => {
        const fields = getObjectFields(mockSuiObjectResponse);
        expect(fields).toEqual({ balance: '1000', id: { id: '0x123' } });
      });

      it('should extract fields from SuiMoveObject directly', () => {
        const moveObject: SuiMoveObject = {
          type: '0x2::coin::Coin<0x2::sui::SUI>',
          fields: { balance: '500' },
          hasPublicTransfer: true,
        };
        const fields = getObjectFields(moveObject);
        expect(fields).toEqual({ balance: '500' });
      });

      it('should return undefined for package', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const fields = getObjectFields(packageResponse);
        expect(fields).toBeUndefined();
      });
    });

    describe('getMoveObject', () => {
      it('should extract Move object from response', () => {
        const moveObject = getMoveObject(mockSuiObjectResponse);
        expect(moveObject).toEqual({
          dataType: 'moveObject',
          type: '0x2::coin::Coin<0x2::sui::SUI>',
          fields: { balance: '1000', id: { id: '0x123' } },
          hasPublicTransfer: true,
        });
      });

      it('should return undefined for package', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const moveObject = getMoveObject(packageResponse);
        expect(moveObject).toBeUndefined();
      });

      it('should return undefined for object without content', () => {
        const dataWithoutContent: SuiObjectData = {
          objectId: '0x123',
          version: 1,
          digest: 'digest',
          type: '0x2::coin::Coin<0x2::sui::SUI>',
          owner: { AddressOwner: '0x456' },
          previousTransaction: 'tx',
          storageRebate: 100,
        };
        const moveObject = getMoveObject(dataWithoutContent);
        expect(moveObject).toBeUndefined();
      });
    });

    describe('hasPublicTransfer', () => {
      it('should return true for object with public transfer', () => {
        const hasTransfer = hasPublicTransfer(mockSuiObjectResponse);
        expect(hasTransfer).toBe(true);
      });

      it('should return false for object without public transfer', () => {
        const dataWithoutTransfer: SuiObjectData = {
          ...mockSuiObjectData,
          content: {
            dataType: 'moveObject',
            type: '0x2::coin::Coin<0x2::sui::SUI>',
            fields: { balance: '1000', id: { id: '0x123' } },
            hasPublicTransfer: false,
          },
        };
        const hasTransfer = hasPublicTransfer(dataWithoutTransfer);
        expect(hasTransfer).toBe(false);
      });

      it('should return false for package', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const hasTransfer = hasPublicTransfer(packageResponse);
        expect(hasTransfer).toBe(false);
      });

      it('should return false for invalid object', () => {
        const hasTransfer = hasPublicTransfer({} as SuiObjectResponse);
        expect(hasTransfer).toBe(false);
      });
    });

    describe('getMovePackageContent', () => {
      it('should extract package content from response', () => {
        const packageResponse: SuiObjectResponse = { data: mockPackageData };
        const content = getMovePackageContent(packageResponse);
        expect(content).toEqual({
          module1: 'bytecode1',
          module2: 'bytecode2',
        });
      });

      it('should extract package content from SuiMovePackage directly', () => {
        const movePackage: SuiMovePackage = {
          disassembled: { module: 'bytecode' },
        };
        const content = getMovePackageContent(movePackage);
        expect(content).toEqual({ module: 'bytecode' });
      });

      it('should return undefined for Move object', () => {
        const content = getMovePackageContent(mockSuiObjectResponse);
        expect(content).toBeUndefined();
      });

      it('should return undefined for invalid object', () => {
        const content = getMovePackageContent({} as SuiObjectResponse);
        expect(content).toBeUndefined();
      });
    });
  });

  describe('Normalized Type Utilities', () => {
    describe('extractMutableReference', () => {
      it('should extract mutable reference type', () => {
        const mutableRefType: SuiMoveNormalizedType = {
          MutableReference: 'U64',
        };
        const extracted = extractMutableReference(mutableRefType);
        expect(extracted).toBe('U64');
      });

      it('should extract nested mutable reference type', () => {
        const nestedMutableRefType: SuiMoveNormalizedType = {
          MutableReference: {
            Struct: {
              address: '0x2',
              module: 'coin',
              name: 'Coin',
              typeArguments: ['0x2::sui::SUI'],
            },
          },
        };
        const extracted = extractMutableReference(nestedMutableRefType);
        expect(extracted).toEqual({
          Struct: {
            address: '0x2',
            module: 'coin',
            name: 'Coin',
            typeArguments: ['0x2::sui::SUI'],
          },
        });
      });

      it('should return undefined for non-mutable reference', () => {
        const normalType: SuiMoveNormalizedType = 'U64';
        const extracted = extractMutableReference(normalType);
        expect(extracted).toBeUndefined();
      });

      it('should return undefined for regular reference', () => {
        const refType: SuiMoveNormalizedType = {
          Reference: 'U64',
        };
        const extracted = extractMutableReference(refType);
        expect(extracted).toBeUndefined();
      });
    });

    describe('extractReference', () => {
      it('should extract reference type', () => {
        const refType: SuiMoveNormalizedType = {
          Reference: 'Bool',
        };
        const extracted = extractReference(refType);
        expect(extracted).toBe('Bool');
      });

      it('should extract nested reference type', () => {
        const nestedRefType: SuiMoveNormalizedType = {
          Reference: {
            Vector: 'U8',
          },
        };
        const extracted = extractReference(nestedRefType);
        expect(extracted).toEqual({ Vector: 'U8' });
      });

      it('should return undefined for non-reference', () => {
        const normalType: SuiMoveNormalizedType = 'Address';
        const extracted = extractReference(normalType);
        expect(extracted).toBeUndefined();
      });

      it('should return undefined for mutable reference', () => {
        const mutableRefType: SuiMoveNormalizedType = {
          MutableReference: 'U64',
        };
        const extracted = extractReference(mutableRefType);
        expect(extracted).toBeUndefined();
      });
    });

    describe('extractStructTag', () => {
      it('should extract struct tag from direct struct type', () => {
        const structType: SuiMoveNormalizedType = {
          Struct: {
            address: '0x2',
            module: 'coin',
            name: 'Coin',
            typeArguments: ['0x2::sui::SUI'],
          },
        };
        const extracted = extractStructTag(structType);
        expect(extracted).toEqual(structType);
      });

      it('should extract struct tag from reference to struct', () => {
        const refToStruct: SuiMoveNormalizedType = {
          Reference: {
            Struct: {
              address: '0x1',
              module: 'option',
              name: 'Option',
              typeArguments: ['U64'],
            },
          },
        };
        const extracted = extractStructTag(refToStruct);
        expect(extracted).toEqual({
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: ['U64'],
          },
        });
      });

      it('should extract struct tag from mutable reference to struct', () => {
        const mutableRefToStruct: SuiMoveNormalizedType = {
          MutableReference: {
            Struct: {
              address: '0x2',
              module: 'object',
              name: 'UID',
              typeArguments: [],
            },
          },
        };
        const extracted = extractStructTag(mutableRefToStruct);
        expect(extracted).toEqual({
          Struct: {
            address: '0x2',
            module: 'object',
            name: 'UID',
            typeArguments: [],
          },
        });
      });

      it('should return undefined for primitive type', () => {
        const primitiveType: SuiMoveNormalizedType = 'U128';
        const extracted = extractStructTag(primitiveType);
        expect(extracted).toBeUndefined();
      });

      it('should return undefined for vector type', () => {
        const vectorType: SuiMoveNormalizedType = {
          Vector: 'U8',
        };
        const extracted = extractStructTag(vectorType);
        expect(extracted).toBeUndefined();
      });

      it('should return undefined for reference to primitive', () => {
        const refToPrimitive: SuiMoveNormalizedType = {
          Reference: 'Bool',
        };
        const extracted = extractStructTag(refToPrimitive);
        expect(extracted).toBeUndefined();
      });

      it('should return undefined for mutable reference to primitive', () => {
        const mutableRefToPrimitive: SuiMoveNormalizedType = {
          MutableReference: 'Address',
        };
        const extracted = extractStructTag(mutableRefToPrimitive);
        expect(extracted).toBeUndefined();
      });

      it('should handle complex nested structure', () => {
        const complexType: SuiMoveNormalizedType = {
          Reference: {
            Struct: {
              address: '0x2',
              module: 'dynamic_field',
              name: 'Field',
              typeArguments: [
                {
                  Struct: {
                    address: '0x1',
                    module: 'string',
                    name: 'String',
                    typeArguments: [],
                  },
                },
                'U64',
              ],
            },
          },
        };
        const extracted = extractStructTag(complexType);
        expect(extracted).toEqual({
          Struct: {
            address: '0x2',
            module: 'dynamic_field',
            name: 'Field',
            typeArguments: [
              {
                Struct: {
                  address: '0x1',
                  module: 'string',
                  name: 'String',
                  typeArguments: [],
                },
              },
              'U64',
            ],
          },
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Address normalization edge cases', () => {
      it('should handle maximum length address', () => {
        const maxAddress = 'f'.repeat(SUI_ADDRESS_LENGTH * 2);
        const normalized = normalizeSuiAddress(maxAddress);
        expect(normalized).toBe('0x' + maxAddress);
      });

      it('should handle special characters in address gracefully', () => {
        // This should not crash, though the result may not be a valid address
        const weirdAddress = '0x123-456';
        const normalized = normalizeSuiAddress(weirdAddress);
        expect(normalized).toContain('0x');
      });

      it('should handle unicode characters', () => {
        const unicodeAddress = '0x你好';
        const normalized = normalizeSuiAddress(unicodeAddress);
        expect(normalized).toContain('0x');
      });
    });

    describe('Object utilities with malformed data', () => {
      it('should handle null data gracefully', () => {
        expect(() => getSuiObjectData(null as any)).toThrow();
        expect(() => getObjectId(null as any)).toThrow();
      });

      it('should handle partial object data', () => {
        const partialData = { objectId: '0x123' };
        expect(getObjectId(partialData as any)).toBe('0x123');
        expect(getObjectVersion(partialData as any)).toBeUndefined();
        expect(getObjectOwner(partialData as any)).toBeUndefined();
      });

      it('should handle object with missing content', () => {
        const dataWithoutContent: SuiObjectData = {
          objectId: '0x123',
          version: 1,
          digest: 'digest',
          type: '0x2::coin::Coin<0x2::sui::SUI>',
          owner: { AddressOwner: '0x456' },
          previousTransaction: 'tx',
          storageRebate: 100,
        };
        expect(getMoveObject(dataWithoutContent)).toBeUndefined();
        expect(hasPublicTransfer(dataWithoutContent)).toBe(false);
      });
    });

    describe('Type extraction with complex types', () => {
      it('should handle deeply nested reference types', () => {
        const deeplyNested: SuiMoveNormalizedType = {
          Reference: {
            MutableReference: {
              Struct: {
                address: '0x2',
                module: 'test',
                name: 'Deep',
                typeArguments: [],
              },
            },
          },
        };

        // extractStructTag should find the struct even in deeply nested references
        const extracted = extractStructTag(deeplyNested);
        expect(extracted).toBeUndefined(); // Because the inner type is MutableReference, not Struct

        // But extractReference should work
        const refExtracted = extractReference(deeplyNested);
        expect(refExtracted).toBeDefined();
      });

      it('should handle type parameters', () => {
        const typeParam: SuiMoveNormalizedType = {
          TypeParameter: 0,
        };

        expect(extractReference(typeParam)).toBeUndefined();
        expect(extractMutableReference(typeParam)).toBeUndefined();
        expect(extractStructTag(typeParam)).toBeUndefined();
      });
    });
  });
});
