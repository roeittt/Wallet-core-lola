import {
    BcsReader,
    BcsWriter,
    BCS,
    TypeInterface,
    StructTypeDefinition,
    EnumTypeDefinition,
    TypeName,
    Encoding,
    getSuiMoveConfig,
    getRustConfig,
    toB58,
    fromB58,
    toB64,
    fromB64,
    toHEX,
    fromHEX,
    encodeStr,
    decodeStr
} from '../src/bcs/index';
import { describe, expect, test, beforeEach } from '@jest/globals';

describe('BCS Comprehensive Tests', () => {
    let bcs: BCS;

    beforeEach(() => {
        bcs = new BCS(getSuiMoveConfig());
    });

    describe('BcsReader Tests', () => {
        test('BcsReader constructor and basic operations', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const reader = new BcsReader(data);

            expect(reader.read8()).toBe(1);
            expect(reader.read16()).toBe(0x0302); // little endian
            expect(reader.read32()).toBe(0x07060504); // little endian
        });

        test('BcsReader read64 method', () => {
            const data = new Uint8Array([
                0x01, 0x02, 0x03, 0x04, // lower 32 bits
                0x05, 0x06, 0x07, 0x08  // upper 32 bits
            ]);
            const reader = new BcsReader(data);
            const result = reader.read64();
            
            // Should read as little endian and return as string
            expect(typeof result).toBe('string');
            expect(BigInt(result)).toBe(BigInt('0x0807060504030201'));
        });

        test('BcsReader read128 method', () => {
            const data = new Uint8Array(16);
            data[0] = 1; // First byte
            data[8] = 2; // Ninth byte 
            const reader = new BcsReader(data);
            const result = reader.read128();
            
            expect(typeof result).toBe('string');
            expect(BigInt(result) > 0).toBe(true);
        });

        test('BcsReader read256 method', () => {
            const data = new Uint8Array(32);
            data[0] = 1; // First byte
            data[16] = 2; // 17th byte
            const reader = new BcsReader(data);
            const result = reader.read256();
            
            expect(typeof result).toBe('string');
            expect(BigInt(result) > 0).toBe(true);
        });

        test('BcsReader readBytes method', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const reader = new BcsReader(data);
            
            const firstTwo = reader.readBytes(2);
            expect(Array.from(firstTwo)).toEqual([1, 2]);
            
            const nextThree = reader.readBytes(3);
            expect(Array.from(nextThree)).toEqual([3, 4, 5]);
        });

        test('BcsReader readULEB method', () => {
            // ULEB encoding of number 127 (0x7F) - single byte
            const data = new Uint8Array([0x7F]);
            const reader = new BcsReader(data);
            expect(reader.readULEB()).toBe(127);
        });

        test('BcsReader readULEB multi-byte', () => {
            // ULEB encoding of number 128 (0x80, 0x01)
            const data = new Uint8Array([0x80, 0x01]);
            const reader = new BcsReader(data);
            expect(reader.readULEB()).toBe(128);
        });

        test('BcsReader readVec method', () => {
            // Vector with length 3, containing bytes [1, 2, 3]
            const data = new Uint8Array([3, 1, 2, 3]);
            const reader = new BcsReader(data);
            
            const vec = reader.readVec((r) => r.read8());
            expect(vec).toEqual([1, 2, 3]);
        });

        test('BcsReader shift method chaining', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const reader = new BcsReader(data);
            
            const firstByte = reader.read8();
            expect(firstByte).toBe(1);
            
            reader.shift(2); // Skip 2 bytes
            const afterShift = reader.read8();
            expect(afterShift).toBe(4);
        });
    });

    describe('BcsWriter Tests', () => {
        test('BcsWriter constructor with default options', () => {
            const writer = new BcsWriter();
            expect(writer).toBeInstanceOf(BcsWriter);
        });

        test('BcsWriter constructor with custom options', () => {
            const writer = new BcsWriter({
                size: 512,
                maxSize: 1024,
                allocateSize: 256
            });
            expect(writer).toBeInstanceOf(BcsWriter);
        });

        test('BcsWriter write operations', () => {
            const writer = new BcsWriter();
            
            writer.write8(255);
            writer.write16(65535);
            writer.write32(4294967295);
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(7); // 1 + 2 + 4 bytes
            expect(bytes[0]).toBe(255);
        });

        test('BcsWriter write64 with bigint', () => {
            const writer = new BcsWriter();
            writer.write64(BigInt('0x123456789ABCDEF0'));
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(8);
        });

        test('BcsWriter write128 with bigint', () => {
            const writer = new BcsWriter();
            writer.write128(BigInt('0x123456789ABCDEF0123456789ABCDEF0'));
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(16);
        });

        test('BcsWriter write256 with bigint', () => {
            const writer = new BcsWriter();
            writer.write256(BigInt('0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0'));
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(32);
        });

        test('BcsWriter writeULEB method', () => {
            const writer = new BcsWriter();
            
            // Write small number (single byte)
            writer.writeULEB(127);
            expect(writer.toBytes()).toEqual(new Uint8Array([0x7F]));
            
            // Reset and write larger number (multi-byte)
            const writer2 = new BcsWriter();
            writer2.writeULEB(128);
            expect(writer2.toBytes()).toEqual(new Uint8Array([0x80, 0x01]));
        });

        test('BcsWriter writeVec method', () => {
            const writer = new BcsWriter();
            const data = [1, 2, 3];
            
            writer.writeVec(data, (w, el) => w.write8(el));
            
            const bytes = writer.toBytes();
            expect(bytes[0]).toBe(3); // Length
            expect(Array.from(bytes.slice(1))).toEqual([1, 2, 3]);
        });

        test('BcsWriter buffer growth', () => {
            const writer = new BcsWriter({ size: 2, maxSize: 10, allocateSize: 5 });
            
            // Write more data than initial size
            writer.write32(0x12345678);
            writer.write32(0x9ABCDEF0);
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(8);
        });

        test('BcsWriter buffer overflow error', () => {
            const writer = new BcsWriter({ size: 2, maxSize: 4, allocateSize: 2 });
            
            expect(() => {
                writer.write64(BigInt(0)); // Requires 8 bytes, but max is 4
            }).toThrow(/buffer does not have enough size/);
        });

        test('BcsWriter iterator functionality', () => {
            const writer = new BcsWriter();
            writer.write8(1);
            writer.write8(2);
            writer.write8(3);
            
            const iterated = Array.from(writer);
            expect(iterated).toEqual([1, 2, 3]);
        });

        test('BcsWriter toString with different encodings', () => {
            const writer = new BcsWriter();
            writer.write8(1);
            writer.write8(2);
            writer.write8(3);
            
            const hex = writer.toString('hex');
            expect(hex).toBe('010203');
            
            const base64 = writer.toString('base64');
            expect(typeof base64).toBe('string');
            
            const base58 = writer.toString('base58');
            expect(typeof base58).toBe('string');
        });

        test('BcsWriter shift method', () => {
            const writer = new BcsWriter();
            writer.write8(1);
            writer.shift(2); // Should move cursor forward
            writer.write8(2);
            
            const bytes = writer.toBytes();
            expect(bytes.length).toBe(4);
            expect(bytes[0]).toBe(1);
            expect(bytes[3]).toBe(2);
        });
    });

    describe('BCS Main Class Tests', () => {
        test('BCS constructor with config', () => {
            const customConfig = {
                vectorType: 'Array',
                addressLength: 20,
                addressEncoding: 'hex' as const,
                genericSeparators: ['<', '>'] as [string, string]
            };
            
            const customBcs = new BCS(customConfig);
            expect(customBcs.hasType('u8')).toBe(true);
        });

        test('BCS copy constructor', () => {
            const bcs1 = new BCS(getSuiMoveConfig());
            bcs1.registerAlias('MyU8', 'u8');
            
            const bcs2 = new BCS(bcs1);
            expect(bcs2.hasType('MyU8')).toBe(true);
        });

        test('BCS hasType method', () => {
            expect(bcs.hasType('u8')).toBe(true);
            expect(bcs.hasType('nonexistent')).toBe(false);
        });

        test('BCS registerAlias method', () => {
            bcs.registerAlias('MyU8', 'u8');
            expect(bcs.hasType('MyU8')).toBe(true);
            
            // Test serialization works with alias
            const serialized = bcs.ser('MyU8', 42);
            expect(serialized.toBytes()).toEqual(new Uint8Array([42]));
        });

        test('BCS registerType with validation', () => {
            bcs.registerType(
                'even_number',
                (writer, data) => writer.write8(data),
                (reader) => reader.read8(),
                (data) => data % 2 === 0
            );
            
            // Valid data
            const validSer = bcs.ser('even_number', 42);
            expect(validSer.toBytes()).toEqual(new Uint8Array([42]));
            
            // Invalid data should throw
            expect(() => bcs.ser('even_number', 43)).toThrow(/Validation failed/);
        });

        test('BCS registerType with generics', () => {
            bcs.registerType(
                'Container<T>',
                function(this: BCS, writer, data, typeParams, typeMap) {
                    const typeName = typeof typeParams[0] === 'string' ? typeParams[0] : typeParams[0][0];
                    return this.getTypeInterface(typeName)._encodeRaw.call(
                        this, writer, data.value, [], typeMap
                    );
                },
                function(this: BCS, reader, typeParams, typeMap) {
                    const typeName = typeof typeParams[0] === 'string' ? typeParams[0] : typeParams[0][0];
                    return {
                        value: this.getTypeInterface(typeName)._decodeRaw.call(
                            this, reader, [], typeMap
                        )
                    };
                }
            );
            
            const data = { value: 42 };
            const serialized = bcs.ser('Container<u8>', data);
            const deserialized = bcs.de('Container<u8>', serialized.toBytes());
            expect(deserialized).toEqual(data);
        });

        test('BCS registerAddressType with hex encoding', () => {
            bcs.registerAddressType('custom_address', 20, 'hex');
            
            const address = '1234567890123456789012345678901234567890'; // Without 0x prefix
            const serialized = bcs.ser('custom_address', address);
            const deserialized = bcs.de('custom_address', serialized.toBytes());
            expect(deserialized).toBe(address);
        });

        test('BCS registerAddressType with base64 encoding', () => {
            bcs.registerAddressType('b64_address', 20, 'base64');
            
            // Create a base64 encoded 20-byte address
            const bytes = new Uint8Array(20);
            bytes.fill(0x42);
            const address = toB64(bytes);
            
            const serialized = bcs.ser('b64_address', address);
            const deserialized = bcs.de('b64_address', serialized.toBytes());
            expect(deserialized).toBe(address);
        });

        test('BCS registerAddressType with unsupported encoding', () => {
            expect(() => {
                bcs.registerAddressType('bad_address', 20, 'unsupported' as any);
            }).toThrow(/Unsupported encoding/);
        });

        test('BCS registerStructType basic', () => {
            const personStruct: StructTypeDefinition = {
                name: 'string',
                age: 'u8'
            };
            
            bcs.registerStructType('Person', personStruct);
            
            const person = { name: 'Alice', age: 30 };
            const serialized = bcs.ser('Person', person);
            const deserialized = bcs.de('Person', serialized.toBytes());
            expect(deserialized).toEqual(person);
        });

        test('BCS registerStructType with generics', () => {
            const pairStruct: StructTypeDefinition = {
                first: 'T',
                second: 'U'
            };
            
            bcs.registerStructType('Pair<T, U>', pairStruct);
            
            const pair = { first: 42, second: 'hello' };
            const serialized = bcs.ser('Pair<u8, string>', pair);
            const deserialized = bcs.de('Pair<u8, string>', serialized.toBytes());
            expect(deserialized).toEqual(pair);
        });

        test('BCS registerEnumType basic', () => {
            const optionEnum: EnumTypeDefinition = {
                none: null,
                some: 'T'
            };
            
            bcs.registerEnumType('Option<T>', optionEnum);
            
            // Test none variant - BCS enum none variant is typically encoded as true
            const noneValue = { none: true };
            const noneSer = bcs.ser('Option<u8>', noneValue);
            const noneDeser = bcs.de('Option<u8>', noneSer.toBytes());
            expect(noneDeser).toEqual(noneValue);
            
            // Test some variant
            const someValue = { some: 42 };
            const someSer = bcs.ser('Option<u8>', someValue);
            const someDeser = bcs.de('Option<u8>', someSer.toBytes());
            expect(someDeser).toEqual(someValue);
        });

        test('BCS ser method with different input types', () => {
            // Test with encoding parameter
            const writer = bcs.ser('u8', 42, { size: 10 });
            expect(writer.toBytes()).toEqual(new Uint8Array([42]));
            
            // Test with undefined options
            const writer2 = bcs.ser('u8', 42, undefined);
            expect(writer2.toBytes()).toEqual(new Uint8Array([42]));
        });

        test('BCS de method with string input', () => {
            const data = new Uint8Array([42]);
            const hex = toHEX(data);
            
            const result = bcs.de('u8', hex, 'hex');
            expect(result).toBe(42);
        });

        test('BCS de method with temporary struct type', () => {
            const tempStruct = { value: 'u8' };
            const data = { value: 42 };
            
            // First serialize with temporary registration
            const serialized = bcs.ser(tempStruct, data);
            
            // Then deserialize with same temporary registration
            const deserialized = bcs.de(tempStruct, serialized.toBytes());
            expect(deserialized).toEqual(data);
        });

        test('BCS de method error cases', () => {
            expect(() => {
                bcs.de(123 as any, new Uint8Array([42]));
            }).toThrow(/Incorrect type passed/);
        });

        test('BCS parseTypeName method', () => {
            const parsed1 = bcs.parseTypeName('vector<u8>');
            expect(parsed1.name).toBe('vector');
            expect(parsed1.params).toEqual(['u8']);
            
            const parsed2 = bcs.parseTypeName(['vector', 'u8']);
            expect(parsed2.name).toBe('vector');
            expect(parsed2.params).toEqual(['u8']);
            
            const parsed3 = bcs.parseTypeName('u8');
            expect(parsed3.name).toBe('u8');
            expect(parsed3.params).toEqual([]);
        });

        test('BCS getTypeInterface method', () => {
            const u8Interface = bcs.getTypeInterface('u8');
            expect(u8Interface).toHaveProperty('encode');
            expect(u8Interface).toHaveProperty('decode');
            expect(u8Interface).toHaveProperty('_encodeRaw');
            expect(u8Interface).toHaveProperty('_decodeRaw');
        });

        test('BCS error handling for unknown types', () => {
            expect(() => {
                bcs.ser('unknown_type', 42);
            }).toThrow(/Type unknown_type is not registered/);
            
            expect(() => {
                bcs.de('unknown_type', new Uint8Array([42]));
            }).toThrow(/Type unknown_type is not registered/);
        });
    });

    describe('ULEB Encoding/Decoding Tests', () => {
        test('ULEB encode/decode edge cases', () => {
            // Test encoding 0
            const writer = new BcsWriter();
            writer.writeULEB(0);
            expect(writer.toBytes()).toEqual(new Uint8Array([0]));
            
            // Test large numbers
            const writer2 = new BcsWriter();
            writer2.writeULEB(16383); // 0x3FFF
            const bytes = writer2.toBytes();
            
            const reader = new BcsReader(bytes);
            expect(reader.readULEB()).toBe(16383);
        });

        test('ULEB multi-byte encoding', () => {
            const testCases = [
                { value: 127, expected: [0x7F] },
                { value: 128, expected: [0x80, 0x01] },
                { value: 16383, expected: [0xFF, 0x7F] },
                { value: 16384, expected: [0x80, 0x80, 0x01] }
            ];
            
            testCases.forEach(({ value, expected }) => {
                const writer = new BcsWriter();
                writer.writeULEB(value);
                expect(Array.from(writer.toBytes())).toEqual(expected);
                
                const reader = new BcsReader(new Uint8Array(expected));
                expect(reader.readULEB()).toBe(value);
            });
        });
    });

    describe('Complex Type Registration Tests', () => {
        test('Nested struct types', () => {
            bcs.registerStructType('Inner', { value: 'u8' });
            bcs.registerStructType('Outer', { inner: 'Inner', count: 'u32' });
            
            const data = {
                inner: { value: 42 },
                count: 100
            };
            
            const serialized = bcs.ser('Outer', data);
            const deserialized = bcs.de('Outer', serialized.toBytes());
            expect(deserialized).toEqual(data);
        });

        test('Enum with struct variants', () => {
            bcs.registerStructType('Point', { x: 'u32', y: 'u32' });
            bcs.registerEnumType('Shape', {
                circle: { radius: 'u32' },
                rectangle: { width: 'u32', height: 'u32' },
                point: 'Point'
            });
            
            const shapes = [
                { circle: { radius: 10 } },
                { rectangle: { width: 20, height: 30 } },
                { point: { x: 5, y: 15 } }
            ];
            
            shapes.forEach(shape => {
                const serialized = bcs.ser('Shape', shape);
                const deserialized = bcs.de('Shape', serialized.toBytes());
                expect(deserialized).toEqual(shape);
            });
        });

        test('Generic struct with type parameter validation', () => {
            bcs.registerStructType('GenericContainer<T, U>', {
                first: 'T',
                second: 'U',
                metadata: 'string'
            });
            
            const data = {
                first: 42,
                second: true,
                metadata: 'test'
            };
            
            const serialized = bcs.ser('GenericContainer<u8, bool>', data);
            const deserialized = bcs.de('GenericContainer<u8, bool>', serialized.toBytes());
            expect(deserialized).toEqual(data);
        });

        test('Error cases for struct registration', () => {
            // Generic parameter mismatch
            bcs.registerStructType('TestStruct<T>', { value: 'T' });
            
            expect(() => {
                bcs.ser('TestStruct', { value: 42 }); // Missing type parameter
            }).toThrow();
            
            expect(() => {
                bcs.ser('TestStruct<u8, u16>', { value: 42 }); // Too many type parameters
            }).toThrow();
        });

        test('Vector type registration errors', () => {
            expect(() => {
                (bcs as any).registerVectorType('vector<T, U>'); // Too many parameters
            }).toThrow(/Vector can have only one type parameter/);
        });
    });

    describe('Encoding/Decoding Utility Functions', () => {
        test('encodeStr function', () => {
            const data = new Uint8Array([1, 2, 3]);
            
            const hex = encodeStr(data, 'hex');
            expect(hex).toBe('010203');
            
            const base64 = encodeStr(data, 'base64');
            expect(typeof base64).toBe('string');
            
            const base58 = encodeStr(data, 'base58');
            expect(typeof base58).toBe('string');
        });

        test('decodeStr function', () => {
            const original = new Uint8Array([1, 2, 3]);
            
            const hex = encodeStr(original, 'hex');
            const decodedHex = decodeStr(hex, 'hex');
            expect(decodedHex).toEqual(original);
            
            const base64 = encodeStr(original, 'base64');
            const decodedBase64 = decodeStr(base64, 'base64');
            expect(decodedBase64).toEqual(original);
            
            const base58 = encodeStr(original, 'base58');
            const decodedBase58 = decodeStr(base58, 'base58');
            expect(decodedBase58).toEqual(original);
        });

        test('encoding functions from imports', () => {
            const data = new Uint8Array([1, 2, 3]);
            
            // Test hex encoding/decoding
            const hex = toHEX(data);
            const decodedHex = fromHEX(hex);
            expect(decodedHex).toEqual(data);
            
            // Test base64 encoding/decoding
            const base64 = toB64(data);
            const decodedBase64 = fromB64(base64);
            expect(decodedBase64).toEqual(data);
            
            // Test base58 encoding/decoding
            const base58 = toB58(data);
            const decodedBase58 = fromB58(base58);
            expect(decodedBase58).toEqual(data);
        });
    });

    describe('Configuration Tests', () => {
        test('getSuiMoveConfig returns correct config', () => {
            const config = getSuiMoveConfig();
            expect(config.vectorType).toBe('vector');
            expect(config.addressLength).toBe(32);
            expect(config.addressEncoding).toBe('hex');
            expect(config.genericSeparators).toEqual(['<', '>']);
        });

        test('getRustConfig returns correct config', () => {
            const config = getRustConfig();
            expect(config.vectorType).toBe('Vec');
            expect(config.addressLength).toBe(32);
            expect(config.addressEncoding).toBe('hex');
            expect(config.genericSeparators).toEqual(['<', '>']);
        });

        test('BCS with custom separators', () => {
            const customConfig = {
                vectorType: 'Vec',
                addressLength: 32,
                addressEncoding: 'hex' as const,
                genericSeparators: ['[', ']'] as [string, string]
            };
            
            const customBcs = new BCS(customConfig);
            // Should still work with basic types
            expect(customBcs.hasType('u8')).toBe(true);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('BcsReader with empty buffer', () => {
            const reader = new BcsReader(new Uint8Array(0));
            expect(() => reader.read8()).toThrow();
        });

        test('BcsWriter with zero size', () => {
            const writer = new BcsWriter({ size: 0, maxSize: 10, allocateSize: 5 });
            // Should be able to write after growth
            writer.write8(42);
            expect(writer.toBytes()).toEqual(new Uint8Array([42]));
        });

        test('Complex nested generic resolution', () => {
            bcs.registerStructType('Deep<T>', { value: 'T' });
            
            const data = { value: { value: { value: 42 } } };
            const serialized = bcs.ser('Deep<Deep<Deep<u8>>>', data);
            const deserialized = bcs.de('Deep<Deep<Deep<u8>>>', serialized.toBytes());
            expect(deserialized).toEqual(data);
        });

        test('Type parameter not found error', () => {
            bcs.registerStructType('ErrorStruct<T>', { value: 'T' });
            
            expect(() => {
                bcs.ser('ErrorStruct<UnknownType>', { value: 42 });
            }).toThrow(/Unable to find a matching type definition for UnknownType/);
        });

        test('Circular type reference handling', () => {
            // This should work for basic cases
            bcs.registerAlias('RecursiveU8', 'u8');
            const result = bcs.ser('RecursiveU8', 42);
            expect(result.toBytes()).toEqual(new Uint8Array([42]));
        });

        test('Large ULEB values', () => {
            const largeValue = 268435455; // Large but valid ULEB value
            const writer = new BcsWriter();
            writer.writeULEB(largeValue);
            
            const reader = new BcsReader(writer.toBytes());
            expect(reader.readULEB()).toBe(largeValue);
        });

        test('Vector with empty elements', () => {
            const writer = new BcsWriter();
            writer.writeVec([], (w, el) => w.write8(el));
            
            const reader = new BcsReader(writer.toBytes());
            const result = reader.readVec((r) => r.read8());
            expect(result).toEqual([]);
        });

        test('String encoding with basic characters', () => {
            // BCS string implementation only handles basic ASCII characters
            const testString = 'Hello, World!';
            const serialized = bcs.ser('string', testString);
            const deserialized = bcs.de('string', serialized.toBytes());
            expect(deserialized).toBe(testString);
        });

        test('Boolean encoding edge cases', () => {
            const trueSer = bcs.ser('bool', true);
            const falseSer = bcs.ser('bool', false);
            
            expect(bcs.de('bool', trueSer.toBytes())).toBe(true);
            expect(bcs.de('bool', falseSer.toBytes())).toBe(false);
        });

        test('Address type with different lengths', () => {
            bcs.registerAddressType('short_addr', 4, 'hex');
            bcs.registerAddressType('long_addr', 64, 'hex');
            
            const shortAddr = '12345678'; // Without 0x prefix
            const longAddr = '1234567890abcdef'.repeat(8); // Without 0x prefix
            
            const shortSer = bcs.ser('short_addr', shortAddr);
            const longSer = bcs.ser('long_addr', longAddr);
            
            expect(bcs.de('short_addr', shortSer.toBytes())).toBe(shortAddr);
            expect(bcs.de('long_addr', longSer.toBytes())).toBe(longAddr);
        });
    });

    describe('Performance and Memory Tests', () => {
        test('Large data serialization', () => {
            const largeArray = Array.from({ length: 1000 }, (_, i) => i % 256);
            const writer = new BcsWriter({ size: 2048 });
            writer.writeVec(largeArray, (w, el) => w.write8(el));
            
            const reader = new BcsReader(writer.toBytes());
            const result = reader.readVec((r) => r.read8());
            expect(result).toEqual(largeArray);
        });

        test('Memory efficient buffer management', () => {
            const writer = new BcsWriter({ size: 10, maxSize: 100, allocateSize: 20 });
            
            // Write data that will require multiple allocations
            for (let i = 0; i < 30; i++) {
                writer.write8(i);
            }
            
            expect(writer.toBytes().length).toBe(30);
        });

        test('Iterator performance', () => {
            const writer = new BcsWriter();
            const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            
            testData.forEach(val => writer.write8(val));
            
            let count = 0;
            for (const byte of writer) {
                expect(byte).toBe(testData[count]);
                count++;
            }
            expect(count).toBe(testData.length);
        });
    });
}); 