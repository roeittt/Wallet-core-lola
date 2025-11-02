import {fromHex, isHexString, toHex, validateHexString} from "../src/base";

describe('fromHex', () => {
    describe('normal', () => {
        it('0x normal', () => {
            const result = fromHex("0x1234");
            expect(result).toEqual(Buffer.from([0x12, 0x34]));
        });

        it('no 0x normal', () => {
            const result = fromHex("1234");
            expect(result).toEqual(Buffer.from([0x12, 0x34]));
        });

        it('normal Upper', () => {
            const result = fromHex("0xABCD");
            expect(result).toEqual(Buffer.from([0xAB, 0xCD]));
        });

        it('normal lower', () => {
            const result = fromHex("0xabcd");
            expect(result).toEqual(Buffer.from([0xAB, 0xCD]));
        });

        it('normal', () => {
            const result = fromHex("0xAbCd");
            expect(result).toEqual(Buffer.from([0xAB, 0xCD]));
        });

        it('normal long', () => {
            const hex = "0x1234567890abcdef";
            const result = fromHex(hex);
            expect(result).toEqual(Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xAB, 0xCD, 0xEF]));
        });

        it('normal byte', () => {
            const result = fromHex("0xff");
            expect(result).toEqual(Buffer.from([0xFF]));
        });

        it('normal 0', () => {
            const result = fromHex("0x00");
            expect(result).toEqual(Buffer.from([0x00]));
        });

        it('toHex', () => {
            const original = "0x1234abcd";
            const buffer = fromHex(original);
            const converted = toHex(buffer, true);
            expect(converted.toLowerCase()).toBe(original.toLowerCase());
        });
    });

    describe('boundary testing', () => {
        it('null string', () => {
            expect(() => fromHex("")).toThrow("invalid hex string");
        });

        it('0x string', () => {
            expect(() => fromHex("0x")).toThrow("invalid hex string");
        });

        it('odd length', () => {
            const result = fromHex("0x123");
            expect(result).toEqual(Buffer.from([0x01, 0x23]));
        });

        it('length string', () => {
            const longHex = "0x" + "ab".repeat(100);
            const result = fromHex(longHex);
            expect(result.length).toBe(100);
            expect(result.every(byte => byte === 0xAB)).toBe(true);
        });

        it('000', () => {
            const result = fromHex("0x0000000000000000");
            expect(result).toEqual(Buffer.alloc(8, 0));
        });

        it('fff', () => {
            const result = fromHex("0xffffffffffffffff");
            expect(result).toEqual(Buffer.alloc(8, 0xFF));
        });
    });

    describe('exception test', () => {
        it('invalid char', () => {
            expect(() => fromHex("0x12g4")).toThrow("invalid hex string");
        });

        it('chinese', () => {
            expect(() => fromHex("0x12中文")).toThrow("invalid hex string");
        });

        it('null', () => {
            expect(() => fromHex("0x12 34")).toThrow("invalid hex string");
        });

        it('invalid char ', () => {
            expect(() => fromHex("0x12@#")).toThrow("invalid hex string");
        });

        it('-', () => {
            expect(() => fromHex("-0x1234")).toThrow("invalid hex string");
        });

        it('.', () => {
            expect(() => fromHex("0x12.34")).toThrow("invalid hex string");
        });

        it('G-Z', () => {
            expect(() => fromHex("0x12GH")).toThrow("invalid hex string");
        });

        it('g-z', () => {
            expect(() => fromHex("0x12gh")).toThrow("invalid hex string");
        });
    });
});

describe('validateHexString', () => {
    it("fromHex",()=> {

        let h = fromHex("0x1234");
        expect("0x1234").toEqual(toHex(h,true));
        expect(() => fromHex("0x123")).not.toThrow();
        expect(fromHex("0x0000000000000000")).toEqual(Buffer.alloc(8, 0));
        expect(fromHex("0xffffffffffffffff")).toEqual(Buffer.alloc(8, 0xFF));


        //  length is 3
        expect(() => fromHex("0x123")).not.toThrow();
        expect(fromHex("0x123")).toEqual(Buffer.from([0x01, 0x23]));
        expect(() => fromHex("123")).not.toThrow();
        expect(fromHex("123")).toEqual(Buffer.from([0x01, 0x23]));

        //  length is  5
        expect(() => fromHex("0x12345")).not.toThrow();
        expect(fromHex("0x12345")).toEqual(Buffer.from([0x01, 0x23, 0x45]));
        expect(() => fromHex("12345")).not.toThrow();
        expect(fromHex("12345")).toEqual(Buffer.from([0x01, 0x23, 0x45]));
        
        // length is 7
        expect(() => fromHex("0x1234567")).not.toThrow();
        expect(fromHex("0x1234567")).toEqual(Buffer.from([0x01, 0x23, 0x45, 0x67]));
        
        // uppercase
        expect(() => fromHex("0xABC")).not.toThrow();
        expect(fromHex("0xABC")).toEqual(Buffer.from([0x0A, 0xBC]));
        // lowercase
        expect(() => fromHex("0xabc")).not.toThrow();
        expect(fromHex("0xabc")).toEqual(Buffer.from([0x0A, 0xBC]));

        expect(() => fromHex("0xAbC")).not.toThrow();
        expect(fromHex("0xAbC")).toEqual(Buffer.from([0x0A, 0xBC]));

        expect(() => fromHex("0xf")).not.toThrow();
        expect(fromHex("0xf")).toEqual(Buffer.from([0x0F]));
        expect(() => fromHex("0x0")).not.toThrow();
        expect(fromHex("0x0")).toEqual(Buffer.from([0x00]));

        const longOddHex = "0x" + "a".repeat(99); // the length is 99
        expect(() => fromHex(longOddHex)).not.toThrow();
        const longOddResult = fromHex(longOddHex);
        expect(longOddResult.length).toBe(50); // (1 + 99) / 2 = 50 byte
        expect(longOddResult[0]).toBe(0x0A);

        const oddHexCases = ["0x123", "0x12345", "0xabcde", "0xFEDCB"];
        oddHexCases.forEach(oddHex => {
            const buffer = fromHex(oddHex);
            const converted = toHex(buffer, true);
            expect(() => fromHex(converted)).not.toThrow();
        });

        for (let i = 0; i < 1000; i++) {
            const hex = `0x${i.toString(16).padStart(4, '0')}`;
            expect(() => fromHex(hex)).not.toThrow();
        }
        // expect(() => fromHex("0x123")).toThrow("invalid hex string");
        expect(() => fromHex("0x12g4")).toThrow("invalid hex string");
        expect(() => fromHex("0x12中文")).toThrow("invalid hex string");
        expect(() => fromHex("0x12 34")).toThrow("invalid hex string");
        expect(() => fromHex(`72f798f8b709902453d4bb55c65
61e9e04154a506765f2333dfb7e7834056d2`)).toThrow("invalid hex string");
        expect(() => fromHex(`72f798f8b709902453d4bb55c65\n61e9e04154a506765f2333dfb7e7834056d2`)).toThrow("invalid hex string");
    })

    it('returns true for valid hex string with 0x prefix', () => {
        expect(validateHexString('0x1a2b3c')).toBe(true);
    });

    it('returns true for valid hex string without 0x prefix', () => {
        expect(validateHexString('1a2b3c')).toBe(true);
    });
    it('returns true for valid hex string with 0X prefix', () => {
        expect(validateHexString('0X1A2B3C')).toBe(true);
    });

    it('returns false for invalid hex string', () => {
        expect(validateHexString('0x1g2h3i')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(validateHexString('')).toBe(false);
    });
    it('returns false for 0x string', () => {
        expect(validateHexString('0x')).toBe(false);
    });
    it('returns false for 0X string', () => {
        expect(validateHexString('0X')).toBe(false);
    });
    it('returns true for valid hex string with chinese', () => {
        expect(validateHexString('0x1a2b3c中文')).toBe(false);
    });
    it('returns true for valid hex string with space', () => {
        expect(validateHexString('0x1a2b3c abcdef')).toBe(false);
    });
    it('returns true for valid hex string with chinese and space ', () => {
        expect(validateHexString('0x1a2b3c 中文')).toBe(false);
    });

    it('returns false for valid hex string with odd length', () => {
        expect(validateHexString('0x1a2b3cf')).toBe(false);
    });

    it('returns false for valid hex string without odd length', () => {
        expect(validateHexString('1a2b3cf')).toBe(false);
    });

});