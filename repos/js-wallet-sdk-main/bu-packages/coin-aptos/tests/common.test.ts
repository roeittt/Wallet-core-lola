import { parseInputScriptDataParam, InputScriptDataParam } from '../src/common';
import {
    ScriptTransactionArgumentVariants,
    U8,
    U64,
    U128,
    U16,
    U32,
    U256,
    Bool,
    AccountAddress,
    MoveVector,
    Serialized,
    Serializer
} from '../src/v2';
import { describe, expect, test } from '@jest/globals';

describe('Common Tests', () => {
    describe('parseInputScriptDataParam', () => {
        // Helper function to create serialized argument data
        function createSerializedArg(variant: ScriptTransactionArgumentVariants, value?: any): string {
            const serializer = new Serializer();
            serializer.serializeU32AsUleb128(variant);

            switch (variant) {
                case ScriptTransactionArgumentVariants.U8:
                    serializer.serializeU8(value || 123);
                    break;
                case ScriptTransactionArgumentVariants.U16:
                    serializer.serializeU16(value || 12345);
                    break;
                case ScriptTransactionArgumentVariants.U32:
                    serializer.serializeU32(value || 1234567890);
                    break;
                case ScriptTransactionArgumentVariants.U64:
                    serializer.serializeU64(BigInt(value || 12345678901234567890n));
                    break;
                case ScriptTransactionArgumentVariants.U128:
                    serializer.serializeU128(BigInt(value || 123456789012345678901234567890n));
                    break;
                case ScriptTransactionArgumentVariants.U256:
                    serializer.serializeU256(BigInt(value || 123456789012345678901234567890n));
                    break;
                case ScriptTransactionArgumentVariants.Bool:
                    serializer.serializeBool(value !== undefined ? value : true);
                    break;
                case ScriptTransactionArgumentVariants.Address:
                    const addr = AccountAddress.fromString(value || "0x1");
                    addr.serialize(serializer);
                    break;
                case ScriptTransactionArgumentVariants.U8Vector:
                    const vector = MoveVector.U8(value || new Uint8Array([1, 2, 3, 4, 5]));
                    vector.serialize(serializer);
                    break;
                case ScriptTransactionArgumentVariants.Serialized:
                    const serializedData = new Serialized(value || new Uint8Array([0x01, 0x02, 0x03]));
                    serializedData.serialize(serializer);
                    break;
                default:
                    throw new Error(`Unsupported variant: ${variant}`);
            }

            return serializer.toUint8Array().reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
        }

        test('parseInputScriptDataParam with U8 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u8"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U8, 42)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0x1234");
            expect(result.typeArguments).toHaveLength(1);
            expect(result.functionArguments).toHaveLength(1);
            expect(result.functionArguments[0]).toBeInstanceOf(U8);
            expect((result.functionArguments[0] as U8).value).toBe(42);
        });

        test('parseInputScriptDataParam with U16 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u16"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U16, 1000)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(U16);
            expect((result.functionArguments[0] as U16).value).toBe(1000);
        });

        test('parseInputScriptDataParam with U32 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u32"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U32, 50000)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(U32);
            expect((result.functionArguments[0] as U32).value).toBe(50000);
        });

        test('parseInputScriptDataParam with U64 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u64"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U64, 9876543210n)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(U64);
            expect((result.functionArguments[0] as U64).value).toBe(9876543210n);
        });

        test('parseInputScriptDataParam with U128 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u128"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U128, 98765432109876543210n)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(U128);
            expect((result.functionArguments[0] as U128).value).toBe(98765432109876543210n);
        });

        test('parseInputScriptDataParam with U256 argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u256"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U256, 98765432109876543210987654321098765n)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(U256);
            expect((result.functionArguments[0] as U256).value).toBe(98765432109876543210987654321098765n);
        });

        test('parseInputScriptDataParam with Bool argument (true)', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["bool"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.Bool, true)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(Bool);
            expect((result.functionArguments[0] as Bool).value).toBe(true);
        });

        test('parseInputScriptDataParam with Bool argument (false)', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["bool"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.Bool, false)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(Bool);
            expect((result.functionArguments[0] as Bool).value).toBe(false);
        });

        test('parseInputScriptDataParam with Address argument', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["address"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.Address, "0x42")]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(AccountAddress);
            expect((result.functionArguments[0] as AccountAddress).toString()).toBe("0x0000000000000000000000000000000000000000000000000000000000000042");
        });

        test('parseInputScriptDataParam with U8Vector argument', () => {
            const testData = new Uint8Array([10, 20, 30, 40, 50]);
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["vector<u8>"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U8Vector, testData)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(MoveVector);
            const vector = result.functionArguments[0] as MoveVector<U8>;
            expect(vector.values).toHaveLength(5);
            expect(vector.values.map(v => v.value)).toEqual([10, 20, 30, 40, 50]);
        });

        test('parseInputScriptDataParam with Serialized argument', () => {
            const testData = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                // No typeArguments for Serialized since it's not a valid type tag
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.Serialized, testData)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments[0]).toBeInstanceOf(Serialized);
            const serialized = result.functionArguments[0] as Serialized;
            expect(Array.from(serialized.value)).toEqual([0xAA, 0xBB, 0xCC, 0xDD]);
        });

        test('parseInputScriptDataParam without typeArguments', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x5678",
                functionArguments: [
                    createSerializedArg(ScriptTransactionArgumentVariants.U8, 99),
                    createSerializedArg(ScriptTransactionArgumentVariants.Bool, true)
                ]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0x5678");
            expect(result.typeArguments).toBeUndefined();
            expect(result.functionArguments).toHaveLength(2);
            expect(result.functionArguments[0]).toBeInstanceOf(U8);
            expect(result.functionArguments[1]).toBeInstanceOf(Bool);
        });

        test('parseInputScriptDataParam with multiple arguments of different types', () => {
            const param: InputScriptDataParam = {
                bytecode: "0xABCD",
                typeArguments: ["u8", "bool", "address"],
                functionArguments: [
                    createSerializedArg(ScriptTransactionArgumentVariants.U8, 255),
                    createSerializedArg(ScriptTransactionArgumentVariants.Bool, false),
                    createSerializedArg(ScriptTransactionArgumentVariants.Address, "0x123"),
                    createSerializedArg(ScriptTransactionArgumentVariants.U64, 999999n)
                ]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0xABCD");
            expect(result.typeArguments).toHaveLength(3);
            expect(result.functionArguments).toHaveLength(4);
            
            expect(result.functionArguments[0]).toBeInstanceOf(U8);
            expect((result.functionArguments[0] as U8).value).toBe(255);
            
            expect(result.functionArguments[1]).toBeInstanceOf(Bool);
            expect((result.functionArguments[1] as Bool).value).toBe(false);
            
            expect(result.functionArguments[2]).toBeInstanceOf(AccountAddress);
            expect((result.functionArguments[2] as AccountAddress).toString()).toBe("0x0000000000000000000000000000000000000000000000000000000000000123");
            
            expect(result.functionArguments[3]).toBeInstanceOf(U64);
            expect((result.functionArguments[3] as U64).value).toBe(999999n);
        });

        test('parseInputScriptDataParam with invalid variant throws error', () => {
            // Create serialized data with invalid variant (999)
            const serializer = new Serializer();
            serializer.serializeU32AsUleb128(999); // Invalid variant
            serializer.serializeU8(42); // Some dummy data
            const invalidArg = serializer.toUint8Array().reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');

            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                functionArguments: [invalidArg]
            };

            expect(() => parseInputScriptDataParam(param)).toThrow("Invalid Param");
        });

        test('parseInputScriptDataParam with empty function arguments', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["u8"],
                functionArguments: []
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0x1234");
            expect(result.typeArguments).toHaveLength(1);
            expect(result.functionArguments).toHaveLength(0);
        });

        test('parseInputScriptDataParam with empty type arguments array', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: [],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U8, 42)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0x1234");
            expect(result.typeArguments).toHaveLength(0);
            expect(result.functionArguments).toHaveLength(1);
        });

        test('parseInputScriptDataParam with complex type arguments', () => {
            const param: InputScriptDataParam = {
                bytecode: "0x1234",
                typeArguments: ["vector<u8>", "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"],
                functionArguments: [createSerializedArg(ScriptTransactionArgumentVariants.U8, 42)]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.bytecode).toBe("0x1234");
            expect(result.typeArguments).toHaveLength(2);
            expect(result.functionArguments).toHaveLength(1);
        });

        test('parseInputScriptDataParam edge case - all variant types in one call', () => {
            const param: InputScriptDataParam = {
                bytecode: "0xFFFF",
                typeArguments: ["u8", "u16", "u32", "u64", "u128", "u256", "bool", "address", "vector<u8>"],
                functionArguments: [
                    createSerializedArg(ScriptTransactionArgumentVariants.U8, 1),
                    createSerializedArg(ScriptTransactionArgumentVariants.U16, 2),
                    createSerializedArg(ScriptTransactionArgumentVariants.U32, 3),
                    createSerializedArg(ScriptTransactionArgumentVariants.U64, 4n),
                    createSerializedArg(ScriptTransactionArgumentVariants.U128, 5n),
                    createSerializedArg(ScriptTransactionArgumentVariants.U256, 6n),
                    createSerializedArg(ScriptTransactionArgumentVariants.Bool, true),
                    createSerializedArg(ScriptTransactionArgumentVariants.Address, "0x7"),
                    createSerializedArg(ScriptTransactionArgumentVariants.U8Vector, new Uint8Array([8])),
                    createSerializedArg(ScriptTransactionArgumentVariants.Serialized, new Uint8Array([9]))
                ]
            };

            const result = parseInputScriptDataParam(param);

            expect(result.functionArguments).toHaveLength(10);
            expect(result.functionArguments[0]).toBeInstanceOf(U8);
            expect(result.functionArguments[1]).toBeInstanceOf(U16);
            expect(result.functionArguments[2]).toBeInstanceOf(U32);
            expect(result.functionArguments[3]).toBeInstanceOf(U64);
            expect(result.functionArguments[4]).toBeInstanceOf(U128);
            expect(result.functionArguments[5]).toBeInstanceOf(U256);
            expect(result.functionArguments[6]).toBeInstanceOf(Bool);
            expect(result.functionArguments[7]).toBeInstanceOf(AccountAddress);
            // Address "0x7" gets padded to full 64-character format
            expect(result.functionArguments[8]).toBeInstanceOf(MoveVector);
            expect(result.functionArguments[9]).toBeInstanceOf(Serialized);
        });
    });
}); 