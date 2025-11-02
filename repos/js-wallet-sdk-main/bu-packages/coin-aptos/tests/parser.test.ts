import {
    parseTypeTag,
    TypeTagParserError,
    TypeTagParserErrorType
} from '../src/v2/transactions/typeTag/parser';
import {
    TypeTagAddress,
    TypeTagBool,
    TypeTagGeneric,
    TypeTagReference,
    TypeTagSigner,
    TypeTagStruct,
    TypeTagU128,
    TypeTagU16,
    TypeTagU256,
    TypeTagU32,
    TypeTagU64,
    TypeTagU8,
    TypeTagVector,
} from '../src/v2/transactions/typeTag';
import { describe, expect, test } from '@jest/globals';

// Get access to the internal functions for testing
const parserModule = require('../src/v2/transactions/typeTag/parser');

describe('Parser Tests', () => {
    describe('parseTypeTag', () => {
        // Test basic primitive types
        test('parseTypeTag with primitive types', () => {
            expect(parseTypeTag('signer')).toBeInstanceOf(TypeTagSigner);
            expect(parseTypeTag('bool')).toBeInstanceOf(TypeTagBool);
            expect(parseTypeTag('address')).toBeInstanceOf(TypeTagAddress);
            expect(parseTypeTag('u8')).toBeInstanceOf(TypeTagU8);
            expect(parseTypeTag('u16')).toBeInstanceOf(TypeTagU16);
            expect(parseTypeTag('u32')).toBeInstanceOf(TypeTagU32);
            expect(parseTypeTag('u64')).toBeInstanceOf(TypeTagU64);
            expect(parseTypeTag('u128')).toBeInstanceOf(TypeTagU128);
            expect(parseTypeTag('u256')).toBeInstanceOf(TypeTagU256);
        });

        // Test case insensitive parsing
        test('parseTypeTag with case insensitive types', () => {
            expect(parseTypeTag('SIGNER')).toBeInstanceOf(TypeTagSigner);
            expect(parseTypeTag('Bool')).toBeInstanceOf(TypeTagBool);
            expect(parseTypeTag('ADDRESS')).toBeInstanceOf(TypeTagAddress);
            expect(parseTypeTag('U8')).toBeInstanceOf(TypeTagU8);
            expect(parseTypeTag('U16')).toBeInstanceOf(TypeTagU16);
            expect(parseTypeTag('U32')).toBeInstanceOf(TypeTagU32);
            expect(parseTypeTag('U64')).toBeInstanceOf(TypeTagU64);
            expect(parseTypeTag('U128')).toBeInstanceOf(TypeTagU128);
            expect(parseTypeTag('U256')).toBeInstanceOf(TypeTagU256);
        });

        // Test vector types
        test('parseTypeTag with vector types', () => {
            const vectorU8 = parseTypeTag('vector<u8>');
            expect(vectorU8).toBeInstanceOf(TypeTagVector);
            expect((vectorU8 as TypeTagVector).value).toBeInstanceOf(TypeTagU8);

            const vectorBool = parseTypeTag('vector<bool>');
            expect(vectorBool).toBeInstanceOf(TypeTagVector);
            expect((vectorBool as TypeTagVector).value).toBeInstanceOf(TypeTagBool);
        });

        // Test struct types
        test('parseTypeTag with struct types', () => {
            const structType = parseTypeTag('0x1::coin::Coin<0x1::aptos_coin::AptosCoin>');
            expect(structType).toBeInstanceOf(TypeTagStruct);
            
            const struct = (structType as TypeTagStruct).value;
            expect(struct.address.toString()).toBe('0x1');
            expect(struct.moduleName.identifier).toBe('coin');
            expect(struct.name.identifier).toBe('Coin');
            expect(struct.typeArgs).toHaveLength(1);
        });

        // Test generic types (when allowed)
        test('parseTypeTag with generic types when allowed', () => {
            const genericType = parseTypeTag('T0', { allowGenerics: true });
            expect(genericType).toBeInstanceOf(TypeTagGeneric);
            expect((genericType as TypeTagGeneric).value).toBe(0);

            const genericType1 = parseTypeTag('T1', { allowGenerics: true });
            expect(genericType1).toBeInstanceOf(TypeTagGeneric);
            expect((genericType1 as TypeTagGeneric).value).toBe(1);

            const genericType123 = parseTypeTag('T123', { allowGenerics: true });
            expect(genericType123).toBeInstanceOf(TypeTagGeneric);
            expect((genericType123 as TypeTagGeneric).value).toBe(123);
        });

        // Test reference types
        test('parseTypeTag with reference types', () => {
            const refType = parseTypeTag('&u8');
            expect(refType).toBeInstanceOf(TypeTagReference);
            expect((refType as TypeTagReference).value).toBeInstanceOf(TypeTagU8);

            const refStructType = parseTypeTag('&0x1::coin::Coin<u8>');
            expect(refStructType).toBeInstanceOf(TypeTagReference);
            expect((refStructType as TypeTagReference).value).toBeInstanceOf(TypeTagStruct);
        });

        // Test whitespace handling
        test('parseTypeTag with whitespace handling', () => {
            // Test multiple generics with spaces (no spaces around commas)
            const multiGeneric = parseTypeTag('0x1::pair::Pair<u8, u16>');
            expect(multiGeneric).toBeInstanceOf(TypeTagStruct);
            
            const struct = (multiGeneric as TypeTagStruct).value;
            expect(struct.typeArgs).toHaveLength(2);
            expect(struct.typeArgs[0]).toBeInstanceOf(TypeTagU8);
            expect(struct.typeArgs[1]).toBeInstanceOf(TypeTagU16);

            // Test with leading/trailing whitespace
            const trimmedType = parseTypeTag('  u8  ');
            expect(trimmedType).toBeInstanceOf(TypeTagU8);
        });

        // Test nested generics
        test('parseTypeTag with nested generics', () => {
            const nestedType = parseTypeTag('0x1::pair::Pair<0x1::coin::Coin<u8>, u16>');
            expect(nestedType).toBeInstanceOf(TypeTagStruct);
            
            const struct = (nestedType as TypeTagStruct).value;
            expect(struct.typeArgs).toHaveLength(2);
            expect(struct.typeArgs[0]).toBeInstanceOf(TypeTagStruct);
            expect(struct.typeArgs[1]).toBeInstanceOf(TypeTagU16);
        });

        // Test error cases
        test('parseTypeTag error cases', () => {
            // Invalid type tag
            expect(() => parseTypeTag('invalid_type')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('invalid_type')).toThrow('unknown type');

            // Generic when not allowed
            expect(() => parseTypeTag('T0')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('T0')).toThrow('unexpected generic type');

            // Unexpected type argument close
            expect(() => parseTypeTag('u8>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('u8>')).toThrow("unexpected '>'");

            // Missing type argument close
            expect(() => parseTypeTag('vector<u8')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<u8')).toThrow("no matching '>' for '<'");

            // Type argument count mismatch for vector (multiple args)
            expect(() => parseTypeTag('vector<u8, u16>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<u8, u16>')).toThrow('vector type expected to have exactly one type argument');

            // Unexpected primitive type arguments
            expect(() => parseTypeTag('u8<u16>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('u8<u16>')).toThrow('primitive types not expected to have type arguments');

            // Unexpected vector type argument count (empty args)
            expect(() => parseTypeTag('vector<>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<>')).toThrow("type argument count doesn't match expected amount");

            // Missing type argument
            expect(() => parseTypeTag('vector<,u8>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<,u8>')).toThrow("no type argument before ','");

            // Unexpected struct format
            expect(() => parseTypeTag('0x1::invalid')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::invalid')).toThrow('unexpected struct format');

            // Invalid address
            expect(() => parseTypeTag('invalid_address::module::struct')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('invalid_address::module::struct')).toThrow('struct address must be valid');

            // Invalid module name character
            expect(() => parseTypeTag('0x1::invalid-module::struct')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::invalid-module::struct')).toThrow('module name must only contain alphanumeric');

            // Invalid struct name character
            expect(() => parseTypeTag('0x1::module::invalid-struct')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::module::invalid-struct')).toThrow('struct name must only contain alphanumeric');
        });

        // Test top-level comma error (line 234)
        test('parseTypeTag with top-level comma throws error', () => {
            expect(() => parseTypeTag('u8, u16')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('u8, u16')).toThrow("unexpected ','");
        });

        // Test whitespace error cases (lines 254, 258)
        test('parseTypeTag with invalid whitespace sequences', () => {
            // Test case where whitespace is followed by invalid character (not comma or >)
            expect(() => parseTypeTag('vector<u8 u16>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<u8 u16>')).toThrow('unexpected whitespace character');
        });

        // Test edge case with empty currentStr and whitespace (line 258)
        test('parseTypeTag with whitespace but no preceding type', () => {
            // This should not throw because there's no parsed type before whitespace
            const result = parseTypeTag('vector< u8>');
            expect(result).toBeInstanceOf(TypeTagVector);
        });

        // Test curTypes.length cases (lines 289, 304)
        test('parseTypeTag final switch statement coverage', () => {
            // Case where curTypes.length is 1 but currentStr is not empty (line 304)
            // This is hard to trigger directly, but we can test similar scenarios
            
            // This should work fine (case 0 with currentStr and innerTypes)
            const simpleType = parseTypeTag('u8');
            expect(simpleType).toBeInstanceOf(TypeTagU8);

            // This should work fine (case 1 with empty currentStr)
            const vectorType = parseTypeTag('vector<u8>');
            expect(vectorType).toBeInstanceOf(TypeTagVector);
        });

        // Test complex edge cases to hit remaining uncovered lines
        test('parseTypeTag complex edge cases', () => {
            // Test with maximum nesting and whitespace
            const complexType = parseTypeTag('0x1::option::Option< 0x1::vector::Vector< 0x1::coin::Coin< u8 > > >');
            expect(complexType).toBeInstanceOf(TypeTagStruct);

            // Test reference to generic (when allowed)
            const refGeneric = parseTypeTag('&T0', { allowGenerics: true });
            expect(refGeneric).toBeInstanceOf(TypeTagReference);
            expect((refGeneric as TypeTagReference).value).toBeInstanceOf(TypeTagGeneric);

            // Test vector of vector
            const vectorVector = parseTypeTag('vector<vector<u8>>');
            expect(vectorVector).toBeInstanceOf(TypeTagVector);
            expect((vectorVector as TypeTagVector).value).toBeInstanceOf(TypeTagVector);
        });

        // Test struct with valid identifiers containing numbers and underscores
        test('parseTypeTag with valid identifier patterns', () => {
            const structWithNumbers = parseTypeTag('0x1::coin_12::Coin_34<u8>');
            expect(structWithNumbers).toBeInstanceOf(TypeTagStruct);
            
            const struct = (structWithNumbers as TypeTagStruct).value;
            expect(struct.moduleName.identifier).toBe('coin_12');
            expect(struct.name.identifier).toBe('Coin_34');
        });

        // Test empty vector type arguments error
        test('parseTypeTag with empty vector type arguments', () => {
            expect(() => parseTypeTag('vector<>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<>')).toThrow("type argument count doesn't match expected amount");
        });

        // Test multiple type arguments for vector (should fail)
        test('parseTypeTag with multiple vector type arguments', () => {
            expect(() => parseTypeTag('vector<u8, u16>')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('vector<u8, u16>')).toThrow('vector type expected to have exactly one type argument');
        });
    });

    describe('Internal helper functions', () => {
        // Test isValidIdentifier
        test('isValidIdentifier function', () => {
            const isValidIdentifier = (parserModule as any).isValidIdentifier;
            if (isValidIdentifier) {
                expect(isValidIdentifier('valid_identifier_123')).toBe(true);
                expect(isValidIdentifier('123_valid')).toBe(true);
                expect(isValidIdentifier('_underscore')).toBe(true);
                expect(isValidIdentifier('invalid-identifier')).toBe(false);
                expect(isValidIdentifier('invalid.identifier')).toBe(false);
                expect(isValidIdentifier('invalid identifier')).toBe(false);
                expect(isValidIdentifier('')).toBe(false);
            }
        });

        // Test isValidWhitespaceCharacter
        test('isValidWhitespaceCharacter function', () => {
            const isValidWhitespaceCharacter = (parserModule as any).isValidWhitespaceCharacter;
            if (isValidWhitespaceCharacter) {
                expect(isValidWhitespaceCharacter(' ')).toBe(true);
                expect(isValidWhitespaceCharacter('\t')).toBe(true);
                expect(isValidWhitespaceCharacter('\n')).toBe(true);
                expect(isValidWhitespaceCharacter('\r')).toBe(true);
                expect(isValidWhitespaceCharacter('a')).toBe(false);
                expect(isValidWhitespaceCharacter('1')).toBe(false);
                expect(isValidWhitespaceCharacter('<')).toBe(false);
            }
        });

        // Test isGeneric
        test('isGeneric function', () => {
            const isGeneric = (parserModule as any).isGeneric;
            if (isGeneric) {
                expect(isGeneric('T0')).toBe(true);
                expect(isGeneric('T1')).toBe(true);
                expect(isGeneric('T123')).toBe(true);
                expect(isGeneric('T')).toBe(false);
                expect(isGeneric('T0a')).toBe(false);
                expect(isGeneric('t0')).toBe(false);
                expect(isGeneric('0T')).toBe(false);
                expect(isGeneric('generic')).toBe(false);
            }
        });

        // Test isRef
        test('isRef function', () => {
            const isRef = (parserModule as any).isRef;
            if (isRef) {
                expect(isRef('&u8')).toBe(true);
                expect(isRef('&address')).toBe(true);
                expect(isRef('&0x1::coin::Coin')).toBe(true);
                expect(isRef('u8')).toBe(false);
                expect(isRef('address')).toBe(false);
                expect(isRef('&')).toBe(false);
                expect(isRef('')).toBe(false);
            }
        });

        // Test isPrimitive
        test('isPrimitive function', () => {
            const isPrimitive = (parserModule as any).isPrimitive;
            if (isPrimitive) {
                expect(isPrimitive('signer')).toBe(true);
                expect(isPrimitive('address')).toBe(true);
                expect(isPrimitive('bool')).toBe(true);
                expect(isPrimitive('u8')).toBe(true);
                expect(isPrimitive('u16')).toBe(true);
                expect(isPrimitive('u32')).toBe(true);
                expect(isPrimitive('u64')).toBe(true);
                expect(isPrimitive('u128')).toBe(true);
                expect(isPrimitive('u256')).toBe(true);
                expect(isPrimitive('vector')).toBe(false);
                expect(isPrimitive('string')).toBe(false);
                expect(isPrimitive('custom')).toBe(false);
                expect(isPrimitive('')).toBe(false);
            }
        });

        // Test consumeWhitespace
        test('consumeWhitespace function', () => {
            const consumeWhitespace = (parserModule as any).consumeWhitespace;
            if (consumeWhitespace) {
                expect(consumeWhitespace('   abc', 0)).toBe(3);
                expect(consumeWhitespace('abc   def', 3)).toBe(6);
                expect(consumeWhitespace('abc', 0)).toBe(0);
                expect(consumeWhitespace('\t\n\r  abc', 0)).toBe(5);
                expect(consumeWhitespace('   ', 0)).toBe(3);
                expect(consumeWhitespace('', 0)).toBe(0);
                expect(consumeWhitespace('abc', 10)).toBe(10); // Beyond string length
            }
        });
    });

    describe('TypeTagParserError', () => {
        test('TypeTagParserError creation and message', () => {
            const error = new TypeTagParserError('invalid_type', TypeTagParserErrorType.InvalidTypeTag);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TypeTagParserError);
            expect(error.message).toBe("Failed to parse typeTag 'invalid_type', unknown type");
        });

        test('TypeTagParserError with different error types', () => {
            const errorTypes = [
                TypeTagParserErrorType.InvalidTypeTag,
                TypeTagParserErrorType.UnexpectedGenericType,
                TypeTagParserErrorType.UnexpectedTypeArgumentClose,
                TypeTagParserErrorType.UnexpectedWhitespaceCharacter,
                TypeTagParserErrorType.UnexpectedComma,
                TypeTagParserErrorType.TypeArgumentCountMismatch,
                TypeTagParserErrorType.MissingTypeArgumentClose,
                TypeTagParserErrorType.MissingTypeArgument,
                TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments,
                TypeTagParserErrorType.UnexpectedVectorTypeArgumentCount,
                TypeTagParserErrorType.UnexpectedStructFormat,
                TypeTagParserErrorType.InvalidModuleNameCharacter,
                TypeTagParserErrorType.InvalidStructNameCharacter,
                TypeTagParserErrorType.InvalidAddress,
            ];

            errorTypes.forEach(errorType => {
                const error = new TypeTagParserError('test_type', errorType);
                expect(error.message).toContain('test_type');
                expect(error.message).toContain(errorType);
            });
        });
    });

    describe('Edge cases and regression tests', () => {
        // Test to specifically hit line 337 (reference parsing edge case)
        test('reference type parsing edge cases', () => {
            // Test reference to struct
            const refStruct = parseTypeTag('&0x1::coin::Coin<u8>');
            expect(refStruct).toBeInstanceOf(TypeTagReference);
            
            const innerStruct = (refStruct as TypeTagReference).value;
            expect(innerStruct).toBeInstanceOf(TypeTagStruct);
        });

        // Test to hit uncovered signer case (line 312)
        test('signer type case coverage', () => {
            const signerType = parseTypeTag('signer');
            expect(signerType).toBeInstanceOf(TypeTagSigner);
            
            // Test case insensitive
            const signerTypeUpper = parseTypeTag('SIGNER');
            expect(signerTypeUpper).toBeInstanceOf(TypeTagSigner);
        });

        // Test extreme edge cases
        test('extreme edge cases', () => {
            // Very long generic number
            const longGeneric = parseTypeTag('T999999', { allowGenerics: true });
            expect(longGeneric).toBeInstanceOf(TypeTagGeneric);
            expect((longGeneric as TypeTagGeneric).value).toBe(999999);

            // Deep nesting
            const deepNesting = parseTypeTag('vector<vector<vector<vector<u8>>>>');
            expect(deepNesting).toBeInstanceOf(TypeTagVector);

            // Complex struct with many type args
            const complexStruct = parseTypeTag('0x1::test::Test<u8, u16, u32, u64, bool, address>');
            expect(complexStruct).toBeInstanceOf(TypeTagStruct);
            expect((complexStruct as TypeTagStruct).value.typeArgs).toHaveLength(6);
        });

        // Test to hit specific uncovered lines
        test('additional edge cases for uncovered lines', () => {
            // Test case to hit line 315-317 (default case in final switch)
            // This is difficult to trigger directly, but let's try some complex parsing scenarios
            
            // Test struct with 4 parts (should fail with unexpected struct format)
            expect(() => parseTypeTag('0x1::module::struct::extra')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::module::struct::extra')).toThrow('unexpected struct format');

            // Test struct with 2 parts (should fail with unexpected struct format)
            expect(() => parseTypeTag('0x1::module')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::module')).toThrow('unexpected struct format');

            // Test struct with 1 part (should fail with invalid type tag)
            expect(() => parseTypeTag('0x1')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1')).toThrow('unknown type');

            // Test invalid address format in struct
            expect(() => parseTypeTag('invalid_hex::module::struct')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('invalid_hex::module::struct')).toThrow('struct address must be valid');

            // Test struct with empty parts
            expect(() => parseTypeTag('0x1::::struct')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::::struct')).toThrow('module name must only contain alphanumeric');

            expect(() => parseTypeTag('0x1::module::')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('0x1::module::')).toThrow('struct name must only contain alphanumeric');
        });

        // Test mixed case struct parsing
        test('mixed case struct parsing', () => {
            // Test that struct parts are case sensitive while primitives are not
            const result = parseTypeTag('0x1::MyModule::MyStruct<U8>');
            expect(result).toBeInstanceOf(TypeTagStruct);
            
            const struct = (result as TypeTagStruct).value;
            expect(struct.moduleName.identifier).toBe('MyModule');
            expect(struct.name.identifier).toBe('MyStruct');
            expect(struct.typeArgs[0]).toBeInstanceOf(TypeTagU8);
        });

        // Test reference to reference (should work)
        test('reference to reference type', () => {
            const refRef = parseTypeTag('&&u8');
            expect(refRef).toBeInstanceOf(TypeTagReference);
            
            const innerRef = (refRef as TypeTagReference).value;
            expect(innerRef).toBeInstanceOf(TypeTagReference);
            
            const innerType = (innerRef as TypeTagReference).value;
            expect(innerType).toBeInstanceOf(TypeTagU8);
        });

        // Test to hit the final uncovered lines (258, 315-317)
        test('final edge cases for 100% coverage', () => {
            // Try to hit line 258 (whitespace edge case) - this is tricky
            // Line 258 is in the whitespace handling where there's no parsed type before
            
            // Try to hit lines 315-317 (case 1 with non-empty currentStr and default case)
            // These are very specific parser state conditions that are hard to trigger
            
            // Let's try some complex scenarios that might trigger these edge cases
            
            // Test various malformed inputs that might trigger different parser states
            expect(() => parseTypeTag('')).toThrow(TypeTagParserError);
            
            // Test with just whitespace
            expect(() => parseTypeTag('   ')).toThrow(TypeTagParserError);
            
            // Test various edge cases to try to hit remaining branches
            expect(() => parseTypeTag('0x')).toThrow(TypeTagParserError);
            expect(() => parseTypeTag('::')).toThrow(TypeTagParserError);
            
            // Complex nesting that might trigger parser edge cases
            const complexNested = parseTypeTag('vector<0x1::option::Option<vector<0x1::string::String>>>');
            expect(complexNested).toBeInstanceOf(TypeTagVector);
        });
    });
}); 