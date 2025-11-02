import {
  getPureSerializationType,
  isTxContext,
} from '../src/builder/serializer';
import { SuiMoveNormalizedType } from '../src/types';

describe('Serializer Tests', () => {
  describe('isTxContext', () => {
    it('should return true for valid TxContext struct', () => {
      const txContextParam: SuiMoveNormalizedType = {
        Struct: {
          address: '0x2',
          module: 'tx_context',
          name: 'TxContext',
          typeArguments: [],
        },
      };

      expect(isTxContext(txContextParam)).toBe(true);
    });

    it('should return false for non-TxContext struct with same address', () => {
      const nonTxContextParam: SuiMoveNormalizedType = {
        Struct: {
          address: '0x2',
          module: 'coin',
          name: 'Coin',
          typeArguments: [],
        },
      };

      expect(isTxContext(nonTxContextParam)).toBe(false);
    });

    it('should return false for TxContext with different address', () => {
      const wrongAddressParam: SuiMoveNormalizedType = {
        Struct: {
          address: '0x1',
          module: 'tx_context',
          name: 'TxContext',
          typeArguments: [],
        },
      };

      expect(isTxContext(wrongAddressParam)).toBe(false);
    });

    it('should return false for TxContext with different module', () => {
      const wrongModuleParam: SuiMoveNormalizedType = {
        Struct: {
          address: '0x2',
          module: 'other_module',
          name: 'TxContext',
          typeArguments: [],
        },
      };

      expect(isTxContext(wrongModuleParam)).toBe(false);
    });

    it('should return false for TxContext with different name', () => {
      const wrongNameParam: SuiMoveNormalizedType = {
        Struct: {
          address: '0x2',
          module: 'tx_context',
          name: 'OtherStruct',
          typeArguments: [],
        },
      };

      expect(isTxContext(wrongNameParam)).toBe(false);
    });

    it('should return false for primitive types', () => {
      expect(isTxContext('U64')).toBe(false);
      expect(isTxContext('Bool')).toBe(false);
      expect(isTxContext('Address')).toBe(false);
    });

    it('should return false for vector types', () => {
      const vectorParam: SuiMoveNormalizedType = {
        Vector: 'U8',
      };

      expect(isTxContext(vectorParam)).toBe(false);
    });

    it('should return false for reference types', () => {
      const referenceParam: SuiMoveNormalizedType = {
        Reference: 'U64',
      };

      expect(isTxContext(referenceParam)).toBe(false);
    });

    it('should return false for mutable reference types', () => {
      const mutableRefParam: SuiMoveNormalizedType = {
        MutableReference: 'U64',
      };

      expect(isTxContext(mutableRefParam)).toBe(false);
    });

    it('should handle struct without proper extractStructTag result', () => {
      const invalidStruct: any = {
        InvalidStruct: {
          address: '0x2',
          module: 'tx_context',
          name: 'TxContext',
        },
      };

      expect(isTxContext(invalidStruct)).toBe(false);
    });
  });

  describe('getPureSerializationType', () => {
    describe('primitive types', () => {
      it('should handle Address type', () => {
        expect(
          getPureSerializationType(
            'Address',
            '0x0000000000000000000000000000000000000000000000000000000000000001'
          )
        ).toBe('address');
      });

      it('should handle Bool type', () => {
        expect(getPureSerializationType('Bool', true)).toBe('bool');
        expect(getPureSerializationType('Bool', false)).toBe('bool');
      });

      it('should handle all integer types', () => {
        expect(getPureSerializationType('U8', 42)).toBe('u8');
        expect(getPureSerializationType('U16', 1000)).toBe('u16');
        expect(getPureSerializationType('U32', 100000)).toBe('u32');
        expect(getPureSerializationType('U64', 1000000)).toBe('u64');
        expect(getPureSerializationType('U128', 10000000)).toBe('u128');
        expect(getPureSerializationType('U256', 100000000)).toBe('u256');
      });

      it('should handle undefined argVal for all types', () => {
        expect(getPureSerializationType('Address', undefined)).toBe('address');
        expect(getPureSerializationType('Bool', undefined)).toBe('bool');
        expect(getPureSerializationType('U64', undefined)).toBe('u64');
      });

      it('should throw error for invalid address', () => {
        expect(() =>
          getPureSerializationType('Address', 'invalid_address')
        ).toThrow('Invalid Sui Address');
      });

      it('should throw error for wrong type - number instead of boolean', () => {
        expect(() => getPureSerializationType('Bool', 42 as any)).toThrow(
          'Expect 42 to be boolean, received number'
        );
      });

      it('should not throw error for integer types with wrong values - type validation is conditional', () => {
        // The expectType is only called for certain conditions in the serializer
        expect(getPureSerializationType('U64', 'not_a_number' as any)).toBe(
          'u64'
        );
      });

      it('should throw error for unknown primitive type', () => {
        expect(() =>
          getPureSerializationType('UnknownType' as any, 42)
        ).toThrow('Unknown pure normalized type "UnknownType"');
      });
    });

    describe('vector types', () => {
      it('should handle Vector<U8> as string when argVal is string', () => {
        const vectorU8: SuiMoveNormalizedType = { Vector: 'U8' };
        expect(getPureSerializationType(vectorU8, 'hello')).toBe('string');
      });

      it('should handle Vector<U8> as string when argVal is undefined', () => {
        const vectorU8: SuiMoveNormalizedType = { Vector: 'U8' };
        expect(getPureSerializationType(vectorU8, undefined)).toBe('string');
      });

      it('should handle Vector<U64>', () => {
        const vectorU64: SuiMoveNormalizedType = { Vector: 'U64' };
        expect(getPureSerializationType(vectorU64, [1, 2, 3])).toBe(
          'vector<u64>'
        );
      });

      it('should handle Vector<Bool>', () => {
        const vectorBool: SuiMoveNormalizedType = { Vector: 'Bool' };
        expect(getPureSerializationType(vectorBool, [true, false])).toBe(
          'vector<bool>'
        );
      });

      it('should handle Vector<Address>', () => {
        const vectorAddress: SuiMoveNormalizedType = { Vector: 'Address' };
        expect(
          getPureSerializationType(vectorAddress, [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000002',
          ])
        ).toBe('vector<address>');
      });

      it('should handle nested vectors', () => {
        const nestedVector: SuiMoveNormalizedType = {
          Vector: { Vector: 'U8' },
        };
        expect(getPureSerializationType(nestedVector, [['hello']])).toBe(
          'vector<vector<u8>>'
        );
      });

      it('should handle empty vector', () => {
        const vectorU64: SuiMoveNormalizedType = { Vector: 'U64' };
        expect(getPureSerializationType(vectorU64, [])).toBe('vector<u64>');
      });

      it('should throw error when argVal is not array for non-U8 vector', () => {
        const vectorU64: SuiMoveNormalizedType = { Vector: 'U64' };
        expect(() =>
          getPureSerializationType(vectorU64, 'not_an_array' as any)
        ).toThrow('Expect not_an_array to be a array, received string');
      });

      it('should return undefined when inner type cannot be determined', () => {
        const vectorUnknown: SuiMoveNormalizedType = {
          Vector: {
            Struct: {
              address: '0x123',
              module: 'unknown',
              name: 'Unknown',
              typeArguments: [],
            },
          },
        };
        expect(
          getPureSerializationType(vectorUnknown, ['test'])
        ).toBeUndefined();
      });
    });

    describe('struct types', () => {
      it('should handle ASCII String struct', () => {
        const asciiString: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'ascii',
            name: 'String',
            typeArguments: [],
          },
        };
        expect(getPureSerializationType(asciiString, 'hello')).toBe('string');
      });

      it('should handle UTF8 String struct', () => {
        const utf8String: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'string',
            name: 'String',
            typeArguments: [],
          },
        };
        expect(getPureSerializationType(utf8String, 'hello')).toBe(
          'utf8string'
        );
      });

      it('should handle Sui ID struct', () => {
        const suiId: SuiMoveNormalizedType = {
          Struct: {
            address: '0x2',
            module: 'object',
            name: 'ID',
            typeArguments: [],
          },
        };
        expect(getPureSerializationType(suiId, '0x123')).toBe('address');
      });

      it('should handle Option struct', () => {
        const optionU64: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: ['U64'],
          },
        };
        expect(getPureSerializationType(optionU64, [42])).toBe('vector<u64>');
      });

      it('should handle Option<Address>', () => {
        const optionAddress: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: ['Address'],
          },
        };
        expect(
          getPureSerializationType(optionAddress, [
            '0x0000000000000000000000000000000000000000000000000000000000000123',
          ])
        ).toBe('vector<address>');
      });

      it('should handle Option<Bool>', () => {
        const optionBool: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: ['Bool'],
          },
        };
        expect(getPureSerializationType(optionBool, [true])).toBe(
          'vector<bool>'
        );
      });

      it('should handle nested Option<Vector<U8>>', () => {
        const optionVectorU8: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: [{ Vector: 'U8' }],
          },
        };
        expect(getPureSerializationType(optionVectorU8, ['hello'])).toBe(
          'vector<string>'
        );
      });

      it('should return undefined for unknown struct', () => {
        const unknownStruct: SuiMoveNormalizedType = {
          Struct: {
            address: '0x123',
            module: 'unknown',
            name: 'Unknown',
            typeArguments: [],
          },
        };
        expect(getPureSerializationType(unknownStruct, 'test')).toBeUndefined();
      });

      it('should return undefined for Option with undefined inner type', () => {
        const optionUnknown: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: [
              {
                Struct: {
                  address: '0x123',
                  module: 'unknown',
                  name: 'Unknown',
                  typeArguments: [],
                },
              },
            ],
          },
        };
        expect(
          getPureSerializationType(optionUnknown, ['test'])
        ).toBeUndefined();
      });
    });

    describe('complex nested types', () => {
      it('should handle Vector<Option<U64>>', () => {
        const vectorOptionU64: SuiMoveNormalizedType = {
          Vector: {
            Struct: {
              address: '0x1',
              module: 'option',
              name: 'Option',
              typeArguments: ['U64'],
            },
          },
        };
        expect(getPureSerializationType(vectorOptionU64, [[42]])).toBe(
          'vector<vector<u64>>'
        );
      });

      it('should handle Option<Vector<Address>>', () => {
        const optionVectorAddress: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'option',
            name: 'Option',
            typeArguments: [{ Vector: 'Address' }],
          },
        };
        expect(
          getPureSerializationType(optionVectorAddress, [
            [
              '0x0000000000000000000000000000000000000000000000000000000000000001',
              '0x0000000000000000000000000000000000000000000000000000000000000002',
            ],
          ])
        ).toBe('vector<vector<address>>');
      });

      it('should handle Vector<Vector<U8>>', () => {
        const vectorVectorU8: SuiMoveNormalizedType = {
          Vector: { Vector: 'U8' },
        };
        expect(
          getPureSerializationType(vectorVectorU8, [['hello', 'world']])
        ).toBe('vector<vector<u8>>');
      });

      it('should handle deeply nested structures', () => {
        const complexType: SuiMoveNormalizedType = {
          Vector: {
            Struct: {
              address: '0x1',
              module: 'option',
              name: 'Option',
              typeArguments: [{ Vector: 'Bool' }],
            },
          },
        };
        expect(getPureSerializationType(complexType, [[[true, false]]])).toBe(
          'vector<vector<vector<bool>>>'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle null and undefined arguments gracefully', () => {
        expect(getPureSerializationType('U64', null as any)).toBe('u64');
        expect(getPureSerializationType('Bool', undefined)).toBe('bool');
      });

      it('should handle empty string gracefully', () => {
        // Empty string doesn't throw, it returns the type
        expect(getPureSerializationType('Address', '')).toBe('address');
      });

      it('should handle malformed struct types', () => {
        const malformedStruct: any = {
          Struct: {
            // Missing required fields
            address: '0x1',
          },
        };
        expect(
          getPureSerializationType(malformedStruct, 'test')
        ).toBeUndefined();
      });

      it('should handle reference types', () => {
        const referenceType: SuiMoveNormalizedType = {
          Reference: 'U64',
        };
        expect(getPureSerializationType(referenceType, 42)).toBeUndefined();
      });

      it('should handle mutable reference types', () => {
        const mutableRefType: SuiMoveNormalizedType = {
          MutableReference: 'Bool',
        };
        expect(getPureSerializationType(mutableRefType, true)).toBeUndefined();
      });

      it('should handle type parameters', () => {
        const typeParam: SuiMoveNormalizedType = {
          TypeParameter: 0,
        };
        expect(getPureSerializationType(typeParam, 'any')).toBeUndefined();
      });
    });

    describe('type validation', () => {
      it('should handle all integer types with wrong type gracefully', () => {
        const integerTypes = ['U8', 'U16', 'U32', 'U64', 'U128', 'U256'];

        integerTypes.forEach((type) => {
          // Type validation doesn't throw for these cases
          expect(
            getPureSerializationType(type as any, 'not_a_number' as any)
          ).toBe(type.toLowerCase());
        });
      });

      it('should validate boolean type with wrong type', () => {
        expect(() =>
          getPureSerializationType('Bool', 'not_a_boolean' as any)
        ).toThrow('Expect not_a_boolean to be boolean, received string');
      });

      it('should validate address type with wrong type', () => {
        expect(() => getPureSerializationType('Address', 42 as any)).toThrow(
          'Expect 42 to be string, received number'
        );
      });

      it('should handle various invalid address formats', () => {
        const invalidAddresses = [
          'invalid',
          '0x',
          '0xgg',
          'not_hex',
          '0x123', // Too short
        ];

        invalidAddresses.forEach((addr) => {
          expect(() => getPureSerializationType('Address', addr)).toThrow(
            'Invalid Sui Address'
          );
        });
      });
    });

    describe('struct identification', () => {
      it('should correctly identify structs with same address, module, and name', () => {
        // Testing the internal isSameStruct logic through public API
        const asciiString1: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'ascii',
            name: 'String',
            typeArguments: [],
          },
        };

        const asciiString2: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'ascii',
            name: 'String',
            typeArguments: ['U8'], // Different type args should still match
          },
        };

        expect(getPureSerializationType(asciiString1, 'test')).toBe('string');
        expect(getPureSerializationType(asciiString2, 'test')).toBe('string');
      });

      it('should distinguish structs with different addresses', () => {
        const customString: SuiMoveNormalizedType = {
          Struct: {
            address: '0x999', // Different address
            module: 'ascii',
            name: 'String',
            typeArguments: [],
          },
        };

        expect(getPureSerializationType(customString, 'test')).toBeUndefined();
      });

      it('should distinguish structs with different modules', () => {
        const customString: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'custom_ascii', // Different module
            name: 'String',
            typeArguments: [],
          },
        };

        expect(getPureSerializationType(customString, 'test')).toBeUndefined();
      });

      it('should distinguish structs with different names', () => {
        const customString: SuiMoveNormalizedType = {
          Struct: {
            address: '0x1',
            module: 'ascii',
            name: 'CustomString', // Different name
            typeArguments: [],
          },
        };

        expect(getPureSerializationType(customString, 'test')).toBeUndefined();
      });
    });
  });
});
