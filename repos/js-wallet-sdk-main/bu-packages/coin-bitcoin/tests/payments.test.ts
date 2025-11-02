import * as bitcoin from '../src/bitcoinjs-lib'
import { networks } from '../src'
import * as bip341 from '../src/bitcoinjs-lib/payments/bip341'
import { base } from '@okxweb3/coin-base'

const { payments } = bitcoin;

describe('Bitcoin Payments Comprehensive Tests', () => {
  // Test data
  const validPubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
  const validPubkey2 = Buffer.from('03c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5', 'hex');
  const validSignature = Buffer.from('304402207fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a002202fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a001', 'hex');
  const validHash = Buffer.from('751e76c64647561e0b75f78e7e8f83c9d0a4b5c6', 'hex');
  const validHash32 = Buffer.from('751e76c64647561e0b75f78e7e8f83c9d0a4b5c6751e76c64647561e0b75f78e', 'hex');
  const internalPubkey = Buffer.from('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');

  describe('bip341 module comprehensive tests', () => {
    test('should handle rootHashFromPath with control block too small', () => {
      const controlBlock = Buffer.from('01', 'hex'); // Too small
      const leafHash = Buffer.alloc(32);
      expect(() => bip341.rootHashFromPath(controlBlock, leafHash)).toThrow('The control-block length is too small');
    });

    test('should handle rootHashFromPath with proper control block and multiple path elements', () => {
      const controlBlock = Buffer.alloc(33 + 32 * 3); // Min size + 3 path elements  
      controlBlock[0] = 0xc0; // Version
      // Fill with different values for each path element
      for (let i = 0; i < 3; i++) {
        controlBlock.fill(i + 1, 33 + i * 32, 33 + (i + 1) * 32);
      }
      const leafHash = Buffer.alloc(32, 1);
      const result = bip341.rootHashFromPath(controlBlock, leafHash);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(32);
    });

    test('should handle findScriptPath with nested hash branches', () => {
      const leaf1 = { hash: Buffer.alloc(32, 1) };
      const leaf2 = { hash: Buffer.alloc(32, 2) };
      const leaf3 = { hash: Buffer.alloc(32, 3) };
      const leaf4 = { hash: Buffer.alloc(32, 4) };
      
      // Create nested structure: ((leaf1, leaf2), (leaf3, leaf4))
      const leftBranch = { hash: Buffer.alloc(32, 5), left: leaf1, right: leaf2 };
      const rightBranch = { hash: Buffer.alloc(32, 6), left: leaf3, right: leaf4 };
      const root = { hash: Buffer.alloc(32, 7), left: leftBranch, right: rightBranch };
      
      // Test finding in deep left
      const deepLeftPath = bip341.findScriptPath(root, leaf1.hash);
      expect(deepLeftPath).toEqual([leaf2.hash, rightBranch.hash]);
      
      // Test finding in deep right
      const deepRightPath = bip341.findScriptPath(root, leaf4.hash);
      expect(deepRightPath).toEqual([leaf3.hash, leftBranch.hash]);
      
      // Test not found
      const notFound = bip341.findScriptPath(root, Buffer.alloc(32, 99));
      expect(notFound).toBeUndefined();
    });

    test('should handle findScriptPath with exact hash match', () => {
      const targetHash = Buffer.alloc(32, 5);
      const leaf = { hash: targetHash };
      const path = bip341.findScriptPath(leaf, targetHash);
      expect(path).toEqual([]);
    });

    test('should handle tapleafHash with different versions', () => {
      const script = Buffer.from('51', 'hex'); // OP_1
      const leafHash1 = bip341.tapleafHash({ output: script, version: 0xc0 });
      const leafHash2 = bip341.tapleafHash({ output: script, version: 0xc1 });
      expect(leafHash1).toBeInstanceOf(Buffer);
      expect(leafHash2).toBeInstanceOf(Buffer);
      expect(leafHash1.length).toBe(32);
      expect(leafHash2.length).toBe(32);
      expect(leafHash1).not.toEqual(leafHash2); // Different versions should produce different hashes
    });
  });

  describe('p2data (embed) payment tests', () => {
    test('should throw when no data and no output provided', () => {
      expect(() => payments.embed({})).toThrow('Not enough data');
    });

    test('should create payment with data', () => {
      const data = [Buffer.from('hello'), Buffer.from('world')];
      const payment = payments.embed({ data });
      
      expect(payment.name).toBe('embed');
      expect(payment.data).toEqual(data);
      expect(payment.output).toBeDefined();
    });

    test('should create payment with output', () => {
      const output = Buffer.from('6a0568656c6c6f', 'hex'); // OP_RETURN "hello"
      const payment = payments.embed({ output });
      
      expect(payment.name).toBe('embed');
      expect(payment.output).toEqual(output);
      expect(payment.data).toBeDefined();
    });

    test('should handle output validation with non-OP_RETURN start', () => {
      const invalidOutput = Buffer.from('51', 'hex'); // OP_1 instead of OP_RETURN
      expect(() => payments.embed({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should handle output validation with non-buffer chunks', () => {
      // This tests the specific validation in lines 39-43
      const outputWithOpCode = Buffer.from('6a51', 'hex'); // OP_RETURN OP_1 (not a buffer)
      expect(() => payments.embed({ output: outputWithOpCode })).toThrow('Output is invalid');
    });

    test('should handle stacksEqual validation with different data', () => {
      const data = [Buffer.from('hello')];
      const wrongOutput = Buffer.from('6a05776f726c64', 'hex'); // OP_RETURN "world"
      expect(() => payments.embed({ data, output: wrongOutput })).toThrow('Data mismatch');
    });

    test('should handle multiple data chunks', () => {
      const data = [Buffer.from('hello'), Buffer.from('world'), Buffer.from('test')];
      const payment = payments.embed({ data });
      expect(payment.data).toEqual(data);
      expect(payment.output).toBeDefined();
    });

    test('should handle empty data array', () => {
      const data: Buffer[] = [];
      const payment = payments.embed({ data });
      expect(payment.data).toEqual(data);
      expect(payment.output?.toString('hex')).toBe('6a'); // Just OP_RETURN
    });

    test('should skip validation when opts.validate is false', () => {
      const invalidOutput = Buffer.from('516a', 'hex');
      const payment = payments.embed({ output: invalidOutput }, { validate: false });
      expect(payment.output).toEqual(invalidOutput);
    });

    test('should test stacksEqual with different lengths', () => {
      const data2 = [Buffer.from('hello'), Buffer.from('world')];
      const output1 = Buffer.from('6a0568656c6c6f', 'hex'); // OP_RETURN "hello"
      
      expect(() => payments.embed({ data: data2, output: output1 })).toThrow('Data mismatch');
    });
  });

  describe('p2ms (multisig) payment tests', () => {
    const pubkey1 = validPubkey;
    const pubkey2 = validPubkey2;
    
    test('should throw when insufficient data provided', () => {
      expect(() => payments.p2ms({})).toThrow('Not enough data');
    });

    test('should handle 1-of-1 multisig', () => {
      const payment = payments.p2ms({ m: 1, pubkeys: [validPubkey] });
      expect(payment.m).toBe(1);
      expect(payment.n).toBe(1);
      expect(payment.name).toBe('p2ms(1 of 1)');
    });

    test('should handle 2-of-3 multisig', () => {
      const pubkey3 = Buffer.from('03d30199d74fb5a22d47b6e054e2f378cedacffcb89904a61d75d0dbd407143e65', 'hex');
      const payment = payments.p2ms({ m: 2, pubkeys: [validPubkey, validPubkey2, pubkey3] });
      expect(payment.m).toBe(2);
      expect(payment.n).toBe(3);
      expect(payment.name).toBe('p2ms(2 of 3)');
    });

    test('should create 2-of-2 multisig', () => {
      const payment = payments.p2ms({ m: 2, pubkeys: [pubkey1, pubkey2] });
      expect(payment.m).toBe(2);
      expect(payment.n).toBe(2);
      expect(payment.pubkeys).toEqual([pubkey1, pubkey2]);
    });

    test('should handle max valid multisig (15-of-15)', () => {
      const pubkeys = Array(15).fill(validPubkey);
      const payment = payments.p2ms({ m: 15, pubkeys });
      expect(payment.m).toBe(15);
      expect(payment.n).toBe(15);
    });

    test('should handle maximum valid n (16)', () => {
      const pubkeys = Array(16).fill(validPubkey);
      const payment = payments.p2ms({ m: 1, pubkeys });
      expect(payment.n).toBe(16);
    });

    test('should handle minimum valid m (1)', () => {
      const payment = payments.p2ms({ m: 1, pubkeys: [validPubkey] });
      expect(payment.m).toBe(1);
    });

    test('should throw when m <= 0', () => {
      const invalidOutput = Buffer.from('005121210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179852ae', 'hex'); // 0-of-2
      expect(() => payments.p2ms({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should handle large pubkey arrays without validation', () => {
      const pubkeys = Array(17).fill(pubkey1);
      // When validation is disabled, large arrays should work
      const payment = payments.p2ms({ m: 1, pubkeys }, { validate: false });
      expect(payment.pubkeys).toEqual(pubkeys);
    });

    test('should throw when m > n', () => {
      const invalidOutput = Buffer.from('535121210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179852ae', 'hex'); // 3-of-2
      expect(() => payments.p2ms({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should throw when output has invalid script format', () => {
      const invalidOutput = Buffer.from('ff', 'hex'); // Invalid script
      expect(() => payments.p2ms({ output: invalidOutput })).toThrow();
    });

    test('should throw when pubkey count mismatch with m and n', () => {
      expect(() => payments.p2ms({ m: 1, n: 3, pubkeys: [pubkey1, pubkey2] })).toThrow('Pubkey count mismatch');
    });

    test('should check that output validation throws on invalid m > n pattern', () => {
      // Test the validation logic that ensures proper multisig parameters
      const validOutput = Buffer.from('515121210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179852ae', 'hex'); // 1-of-2
      expect(() => payments.p2ms({ m: 3, output: validOutput })).toThrow('Output is invalid'); // m > n check
    });

    test('should handle insufficient signatures when pubkeys are not provided', () => {
      // Test signature count validation without full context
      const payment = payments.p2ms({ m: 2, signatures: [validSignature] }, { validate: false });
      expect(payment.signatures).toEqual([validSignature]);
    });

    test('should handle too many signatures when validation is disabled', () => {
      const payment = payments.p2ms({ m: 1, signatures: [validSignature, validSignature] }, { validate: false });
      expect(payment.signatures).toEqual([validSignature, validSignature]);
    });

    test('should throw when input is invalid (not starting with OP_0)', () => {
      const invalidInput = Buffer.from('51' + validSignature.toString('hex'), 'hex'); // OP_1 + signature
      expect(() => payments.p2ms({ input: invalidInput, m: 1 })).toThrow('Input is invalid');
    });

    test('should handle allowIncomplete with placeholder signatures', () => {
      const signatures = [validSignature, Buffer.from([0])]; // OP_0 placeholder
      const payment = payments.p2ms({ 
        m: 2, 
        signatures, 
        pubkeys: [validPubkey, validPubkey2] 
      }, { allowIncomplete: true });
      expect(payment.signatures).toEqual(signatures);
    });

    test('should handle allowIncomplete signatures', () => {
      const incompleteSignatures = [validSignature, Buffer.from([0])]; // OP_0 as placeholder
      const payment = payments.p2ms({ 
        m: 2, 
        signatures: incompleteSignatures,
        pubkeys: [pubkey1, pubkey2]
      }, { allowIncomplete: true });
      
      expect(payment.signatures).toEqual(incompleteSignatures);
    });

    test('should handle valid input with proper structure', () => {
      const validInput = Buffer.from('00' + validSignature.toString('hex'), 'hex'); // OP_0 + 1 signature
      const payment = payments.p2ms({ input: validInput, m: 1 }, { validate: false });
      expect(payment.input).toEqual(validInput);
    });

    test('should decode existing multisig output', () => {
      const output = Buffer.from('515121' + validPubkey.toString('hex') + '52ae', 'hex'); // 1-of-1
      const payment = payments.p2ms({ output }, { validate: false });
      expect(payment.m).toBeDefined();
      expect(payment.n).toBeDefined();
    });

    test('should handle input validation for invalid start', () => {
      const badInput = Buffer.from('51' + validSignature.toString('hex'), 'hex'); // OP_1 + sig
      expect(() => payments.p2ms({ input: badInput })).toThrow('Input is invalid');
    });

    test('should generate correct name', () => {
      const payment = payments.p2ms({ m: 2, pubkeys: [pubkey1, pubkey2] });
      expect(payment.name).toBe('p2ms(2 of 2)');
    });

    test('should handle decode caching', () => {
      const output = Buffer.from('515121210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179852ae', 'hex');
      const payment = payments.p2ms({ output }, { validate: false });
      
      // Call decode-dependent properties multiple times to test caching
      expect(payment.m).toBeDefined();
      expect(payment.m).toBeDefined(); // Second call should use cached result
    });

    // Additional tests to increase coverage for specific uncovered lines

    test('should throw when pubkey count mismatch with explicit n parameter (line 125-126)', () => {
      // This tests line 125-126: a.n !== undefined && a.n !== a.pubkeys.length
      expect(() => payments.p2ms({ 
        pubkeys: [validPubkey, validPubkey2], 
        n: 3, // n=3 but only 2 pubkeys provided
        m: 1 
      })).toThrow('Pubkey count mismatch');
    });

    test('should throw when pubkey count is less than m (line 129)', () => {
      // This tests line 129: o.n < o.m!
      expect(() => payments.p2ms({ 
        pubkeys: [validPubkey], // only 1 pubkey
        m: 2 // but m=2 required
      })).toThrow('Pubkey count cannot be less than m');
    });

    test('should throw when not enough signatures provided (line 144)', () => {
      // This tests line 144: a.signatures.length < o.m!
      expect(() => payments.p2ms({ 
        m: 2,
        pubkeys: [validPubkey, validPubkey2],
        signatures: [validSignature] // only 1 signature for m=2
      })).toThrow('Not enough signatures provided');
    });

    test('should throw when too many signatures provided (line 146)', () => {
      // This tests line 146: a.signatures.length > o.m!
      expect(() => payments.p2ms({ 
        m: 1,
        pubkeys: [validPubkey, validPubkey2],
        signatures: [validSignature, validSignature] // 2 signatures for m=1
      })).toThrow('Too many signatures provided');
    });

    test('should throw when input has invalid signatures (lines 151-160)', () => {
      const invalidSig = Buffer.from('ff', 'hex'); // Invalid signature
      const input = Buffer.from('00' + '01' + invalidSig.toString('hex'), 'hex'); // OP_0 + invalid sig
      expect(() => payments.p2ms({ 
        input,
        m: 1,
        pubkeys: [validPubkey]
      })).toThrow('Input has invalid signature(s)');
    });

    test('should throw when signature mismatch between input and signatures (line ~157)', () => {
      const sig1 = validSignature;
      const sig2 = Buffer.from('304402207fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a002202fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a002', 'hex');
      // Create proper script input: OP_0 + PUSHDATA(sig1)
      const input = Buffer.concat([
        Buffer.from([0x00]), // OP_0
        Buffer.from([sig1.length]), // Push sig1 length
        sig1 // sig1 data
      ]);
      
      expect(() => payments.p2ms({ 
        input,
        signatures: [sig2], // Different signature
        m: 1,
        pubkeys: [validPubkey]
      })).toThrow('Signature mismatch');
    });

    test('should throw when not enough signatures for required m', () => {
      // This actually tests line 144: a.signatures.length < o.m!
      const oneSignature = [validSignature]; // 1 signature provided
      
      expect(() => payments.p2ms({ 
        signatures: oneSignature, // 1 signature provided
        m: 2, // m=2 but only 1 signature provided
        pubkeys: [validPubkey, validPubkey2]
      })).toThrow('Not enough signatures provided');
    });

    test('should handle empty signatures in input validation', () => {
      const emptyInput = Buffer.from('00', 'hex'); // OP_0 only, no signatures
      expect(() => payments.p2ms({ 
        input: emptyInput,
        m: 1,
        pubkeys: [validPubkey]
      })).toThrow('Input has invalid signature(s)');
    });

    test('should handle n property lazy loading from pubkeys', () => {
      const payment = payments.p2ms({ m: 1, pubkeys: [validPubkey, validPubkey2] });
      expect(payment.n).toBe(2); // Should load n from pubkeys.length
    });

    test('should handle m and n mismatch validation', () => {
      // Create a valid 1-of-2 multisig output
      const output = Buffer.concat([
        Buffer.from([0x51]), // OP_1 (m=1)
        Buffer.from([validPubkey.length]), validPubkey, // First pubkey
        Buffer.from([validPubkey2.length]), validPubkey2, // Second pubkey  
        Buffer.from([0x52]), // OP_2 (n=2)
        Buffer.from([0xae]) // OP_CHECKMULTISIG
      ]);
      expect(() => payments.p2ms({ 
        output,
        m: 2 // m=2 but output shows m=1
      })).toThrow('m mismatch');
    });

    test('should handle n mismatch validation', () => {
      // Create a valid 1-of-2 multisig output
      const output = Buffer.concat([
        Buffer.from([0x51]), // OP_1 (m=1)
        Buffer.from([validPubkey.length]), validPubkey, // First pubkey
        Buffer.from([validPubkey2.length]), validPubkey2, // Second pubkey
        Buffer.from([0x52]), // OP_2 (n=2)
        Buffer.from([0xae]) // OP_CHECKMULTISIG
      ]);
      expect(() => payments.p2ms({ 
        output,
        n: 3 // n=3 but output shows n=2
      })).toThrow('n mismatch');
    });

    test('should handle pubkeys mismatch validation', () => {
      // Create a valid 1-of-1 multisig output with validPubkey
      const output = Buffer.concat([
        Buffer.from([0x51]), // OP_1 (m=1)
        Buffer.from([validPubkey.length]), validPubkey, // validPubkey
        Buffer.from([0x51]), // OP_1 (n=1)
        Buffer.from([0xae]) // OP_CHECKMULTISIG
      ]);
      expect(() => payments.p2ms({ 
        output,
        pubkeys: [validPubkey2] // Different pubkey
      })).toThrow('Pubkeys mismatch');
    });
  });

  describe('p2pk payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2pk({})).toThrow('Not enough data');
    });

    test('should create valid p2pk payment', () => {
      const payment = payments.p2pk({ pubkey: validPubkey });
      expect(payment.pubkey).toEqual(validPubkey);
      expect(payment.output).toBeDefined();
      expect(payment.name).toBe('p2pk');
    });

    test('should create payment with pubkey', () => {
      const payment = payments.p2pk({ pubkey: validPubkey });
      expect(payment.pubkey).toEqual(validPubkey);
      expect(payment.output).toBeDefined();
    });

    test('should handle output validation errors', () => {
      const badOutput = Buffer.from('21' + validPubkey.toString('hex') + '00', 'hex'); // pubkey + OP_0
      expect(() => payments.p2pk({ output: badOutput })).toThrow('Output is invalid');
    });

    test('should throw when output is invalid (missing OP_CHECKSIG)', () => {
      const invalidOutput = Buffer.from('21' + validPubkey.toString('hex') + '00', 'hex'); // pubkey + OP_0
      expect(() => payments.p2pk({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should handle invalid pubkey in output', () => {
      const badPubkeyOutput = Buffer.from('0100ac', 'hex'); // Invalid pubkey + OP_CHECKSIG
      expect(() => payments.p2pk({ output: badPubkeyOutput })).toThrow('Output pubkey is invalid');
    });

    test('should throw when output pubkey is invalid', () => {
      const invalidPubkey = Buffer.from('00', 'hex');
      const invalidOutput = Buffer.from('01' + invalidPubkey.toString('hex') + 'ac', 'hex');
      expect(() => payments.p2pk({ output: invalidOutput })).toThrow('Output pubkey is invalid');
    });

    test('should handle pubkey mismatch', () => {
      const output = Buffer.from('21' + validPubkey.toString('hex') + 'ac', 'hex');
      expect(() => payments.p2pk({ pubkey: validPubkey2, output })).toThrow('Pubkey mismatch');
    });

    test('should throw when pubkey mismatch', () => {
      const output = Buffer.from('21' + validPubkey.toString('hex') + 'ac', 'hex');
      expect(() => payments.p2pk({ pubkey: validPubkey2, output })).toThrow('Pubkey mismatch');
    });

    test('should create input from signature', () => {
      const payment = payments.p2pk({ pubkey: validPubkey, signature: validSignature });
      expect(payment.input).toBeDefined();
      expect(payment.signature).toEqual(validSignature);
    });

    test('should check signature validation with valid input', () => {
      const signature = validSignature;
      const input = Buffer.from('48' + signature.toString('hex'), 'hex');
      const payment = payments.p2pk({ signature, input }, { validate: false });
      expect(payment.signature).toEqual(signature);
    });

    test('should handle invalid signature in input', () => {
      const invalidSigInput = Buffer.from('01ff', 'hex');
      expect(() => payments.p2pk({ input: invalidSigInput })).toThrow('Input has invalid signature');
    });

    test('should throw when input has invalid signature', () => {
      const invalidSignature = Buffer.from('ff', 'hex');
      const input = Buffer.from('01' + invalidSignature.toString('hex'), 'hex');
      expect(() => payments.p2pk({ input })).toThrow('Input has invalid signature');
    });

    test('should handle witness property when input exists', () => {
      const payment = payments.p2pk({ pubkey: validPubkey });
      // Witness property returns empty array when input is defined
      if (payment.input !== undefined) {
        expect(payment.witness).toEqual([]);
      } else {
        expect(payment.witness).toBeUndefined();
      }
    });
  });

  describe('p2pkh payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2pkh({})).toThrow('Not enough data');
    });

    test('should create valid p2pkh payment from hash', () => {
      const payment = payments.p2pkh({ hash: validHash });
      expect(payment.hash).toEqual(validHash);
      expect(payment.output).toBeDefined();
      expect(payment.address).toBeDefined();
      expect(payment.name).toBe('p2pkh');
    });

    test('should create payment with hash', () => {
      const payment = payments.p2pkh({ hash: validHash });
      expect(payment.hash).toEqual(validHash);
      expect(payment.output).toBeDefined();
    });

    test('should create p2pkh from pubkey', () => {
      const payment = payments.p2pkh({ pubkey: validPubkey });
      expect(payment.pubkey).toEqual(validPubkey);
      expect(payment.hash).toBeDefined();
      expect(payment.output).toBeDefined();
    });

    test('should handle output format validation', () => {
      const badOutput = Buffer.from('76a914' + validHash.toString('hex') + '87ac', 'hex'); // Missing OP_EQUALVERIFY
      expect(() => payments.p2pkh({ output: badOutput })).toThrow('Output is invalid');
    });

    test('should throw when invalid output format', () => {
      const invalidOutput = Buffer.from('76a914' + validHash.toString('hex') + '87ac', 'hex'); // Missing OP_EQUALVERIFY
      expect(() => payments.p2pkh({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should handle hash mismatch', () => {
      const hash1 = Buffer.alloc(20, 1);
      expect(() => payments.p2pkh({ hash: hash1, pubkey: validPubkey })).toThrow('Hash mismatch');
    });

    test('should create complete p2pkh with signature and pubkey', () => {
      const payment = payments.p2pkh({ 
        pubkey: validPubkey, 
        signature: validSignature 
      });
      expect(payment.input).toBeDefined();
      expect(payment.witness).toEqual([]);
    });

    test('should handle invalid signature in input', () => {
      const badSigInput = Buffer.from('01ff21' + validPubkey.toString('hex'), 'hex');
      expect(() => payments.p2pkh({ input: badSigInput })).toThrow('Input has invalid signature');
    });

    test('should throw when input has invalid signature', () => {
      const invalidSig = Buffer.from('ff', 'hex');
      const input = Buffer.from('01' + invalidSig.toString('hex') + '21' + validPubkey.toString('hex'), 'hex');
      expect(() => payments.p2pkh({ input })).toThrow('Input has invalid signature');
    });

    test('should validate input format with valid signature but invalid pubkey', () => {
      const input = Buffer.from('48' + validSignature.toString('hex') + '01' + Buffer.from('00', 'hex').toString('hex'), 'hex');
      expect(() => payments.p2pkh({ input })).toThrow('Input has invalid signature'); // Will fail on signature first
    });

    test('should validate input with malformed script', () => {
      const input = Buffer.from('ff', 'hex'); // Malformed input
      expect(() => payments.p2pkh({ input })).toThrow(); // Will fail during decompile
    });
  });

  describe('p2wpkh payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2wpkh({})).toThrow('Not enough data');
    });

    test('should create valid p2wpkh payment', () => {
      const payment = payments.p2wpkh({ pubkey: validPubkey });
      expect(payment.pubkey).toEqual(validPubkey);
      expect(payment.address).toBeDefined();
      expect(payment.hash).toBeDefined();
      expect(payment.name).toBe('p2wpkh');
    });

    test('should create payment with pubkey', () => {
      const payment = payments.p2wpkh({ pubkey: validPubkey });
      expect(payment.pubkey).toEqual(validPubkey);
      expect(payment.address).toBeDefined();
    });

    test('should create p2wpkh from hash', () => {
      const payment = payments.p2wpkh({ hash: validHash });
      expect(payment.hash).toEqual(validHash);
      expect(payment.output).toBeDefined();
      expect(payment.address).toBeDefined();
    });

    test('should handle witness validation', () => {
      const witness = [validSignature, validPubkey];
      const payment = payments.p2wpkh({ witness });
      expect(payment.witness).toEqual(witness);
      expect(payment.signature).toEqual(validSignature);
      expect(payment.pubkey).toEqual(validPubkey);
    });

    test('should handle invalid witness length', () => {
      const shortWitness = [validSignature]; // Missing pubkey
      expect(() => payments.p2wpkh({ witness: shortWitness })).toThrow('Witness is invalid');
    });

    test('should throw when witness is invalid', () => {
      const witness = [validSignature]; // Missing pubkey
      expect(() => payments.p2wpkh({ witness })).toThrow('Witness is invalid');
    });

    test('should handle invalid signature in witness', () => {
      const invalidSig = Buffer.from('ff', 'hex');
      const badSigWitness = [invalidSig, validPubkey];
      expect(() => payments.p2wpkh({ witness: badSigWitness })).toThrow('Witness has invalid signature');
    });

    test('should throw when witness has invalid signature', () => {
      const invalidSig = Buffer.from('ff', 'hex');
      const witness = [invalidSig, validPubkey];
      expect(() => payments.p2wpkh({ witness })).toThrow('Witness has invalid signature');
    });

    test('should handle complete p2wpkh with signature', () => {
      const payment = payments.p2wpkh({ 
        pubkey: validPubkey, 
        signature: validSignature 
      });
      expect(payment.witness).toEqual([validSignature, validPubkey]);
    });

    test('should validate output buffer length', () => {
      const invalidOutput = Buffer.from('0014' + validHash.toString('hex') + 'aa', 'hex'); // Wrong length
      expect(() => payments.p2wpkh({ output: invalidOutput })).toThrow(); // TypeForce validation
    });

    test('should validate pubkey format', () => {
      const invalidPubkey = Buffer.from('02' + validPubkey.slice(1, -1).toString('hex'), 'hex'); // 32 bytes instead of 33
      expect(() => payments.p2wpkh({ pubkey: invalidPubkey })).toThrow(); // TypeForce validation
    });

    test('should throw when witness has invalid pubkey length', () => {
      const invalidPubkey = Buffer.from('02' + validPubkey.slice(1, -1).toString('hex'), 'hex');
      const witness = [validSignature, invalidPubkey];
      expect(() => payments.p2wpkh({ witness })).toThrow('Witness has invalid pubkey');
    });
  });

  describe('p2sh payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2sh({})).toThrow('Not enough data');
    });

    test('should create p2sh from redeem script', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      const redeem = { output: redeemScript };
      const payment = payments.p2sh({ redeem });
      expect(payment.redeem?.output).toEqual(redeemScript);
      expect(payment.hash).toBeDefined();
      expect(payment.address).toBeDefined();
      expect(payment.name).toBe('p2sh');
    });

    test('should create p2sh from hash', () => {
      const payment = payments.p2sh({ hash: validHash });
      expect(payment.hash).toEqual(validHash);
      expect(payment.output).toBeDefined();
      expect(payment.address).toBeDefined();
    });

    test('should handle output format validation', () => {
      const badOutput = Buffer.from('a914' + validHash.toString('hex') + '88', 'hex'); // Wrong ending
      expect(() => payments.p2sh({ output: badOutput })).toThrow('Output is invalid');
    });

    test('should throw when invalid output format', () => {
      const invalidOutput = Buffer.from('a914' + validHash.toString('hex') + '88', 'hex'); // Wrong ending
      expect(() => payments.p2sh({ output: invalidOutput })).toThrow('Output is invalid');
    });

    test('should handle empty redeem output', () => {
      const emptyRedeem = { output: Buffer.alloc(0) };
      expect(() => payments.p2sh({ redeem: emptyRedeem })).toThrow('Redeem.output too short');
    });

    test('should throw when redeem output is too short', () => {
      const redeem = { output: Buffer.from('', 'hex') }; // Empty script
      expect(() => payments.p2sh({ redeem })).toThrow('Redeem.output too short');
    });

    test('should handle empty input validation', () => {
      const emptyInputRedeem = {
        output: Buffer.from('51', 'hex'),
        input: Buffer.alloc(0),
        witness: []
      };
      expect(() => payments.p2sh({ redeem: emptyInputRedeem })).toThrow('Empty input');
    });

    test('should throw when empty input (no input and no witness)', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        input: Buffer.from('', 'hex'),
        witness: []
      };
      expect(() => payments.p2sh({ redeem })).toThrow('Empty input');
    });

    test('should handle both input and witness provided', () => {
      const bothInputRedeem = {
        output: Buffer.from('51', 'hex'),
        input: Buffer.from('0151', 'hex'), // Push OP_1
        witness: [Buffer.from('51', 'hex')]
      };
      expect(() => payments.p2sh({ redeem: bothInputRedeem })).toThrow('Input and witness provided');
    });

    test('should throw when both input and witness provided', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        input: Buffer.from('51', 'hex'),
        witness: [Buffer.from('51', 'hex')]
      };
      expect(() => payments.p2sh({ redeem })).toThrow('Input and witness provided');
    });

    test('should use redeem network when provided', () => {
      const redeemWithNetwork = {
        output: Buffer.from('51', 'hex'),
        network: networks.bitcoin
      };
      const payment = payments.p2sh({ redeem: redeemWithNetwork });
      expect(payment.network).toBe(networks.bitcoin);
    });

    test('should use redeem network when main network not provided', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        network: networks.bitcoin
      };
      const payment = payments.p2sh({ redeem });
      expect(payment.network).toBe(networks.bitcoin);
    });

    test('should validate redeem script with valid input', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      const pushOnlyInput = Buffer.from('0151', 'hex'); // Push OP_1
      const redeem = { 
        output: redeemScript,
        input: pushOnlyInput
      };
      const payment = payments.p2sh({ redeem }, { validate: false });
      expect(payment.redeem?.input).toEqual(pushOnlyInput);
    });

    // Additional tests for increasing coverage

    test('should handle address version validation error', () => {
      // Create address with wrong version for the network
      const wrongVersionPayload = Buffer.allocUnsafe(21);
      wrongVersionPayload.writeUInt8(0x99, 0); // Wrong version
      validHash.copy(wrongVersionPayload, 1);
      const wrongVersionAddress = base.toBase58Check(wrongVersionPayload);
      
      expect(() => payments.p2sh({ 
        address: wrongVersionAddress,
        network: networks.bitcoin 
      })).toThrow('Invalid version or Network mismatch');
    });

    test('should handle invalid address length', () => {
      // Create address with wrong hash length
      const shortHash = Buffer.alloc(10, 1); // Too short
      const wrongLengthPayload = Buffer.allocUnsafe(11);
      wrongLengthPayload.writeUInt8(networks.bitcoin.scriptHash, 0);
      shortHash.copy(wrongLengthPayload, 1);
      const wrongLengthAddress = base.toBase58Check(wrongLengthPayload);
      
      expect(() => payments.p2sh({ 
        address: wrongLengthAddress,
        network: networks.bitcoin 
      })).toThrow('Invalid address');
    });

    test('should handle hash mismatch between address and hash', () => {
      const hash1 = Buffer.alloc(20, 1);
      const hash2 = Buffer.alloc(20, 2);
      
      const payload = Buffer.allocUnsafe(21);
      payload.writeUInt8(networks.bitcoin.scriptHash, 0);
      hash1.copy(payload, 1);
      const address = base.toBase58Check(payload);
      
      expect(() => payments.p2sh({ 
        address,
        hash: hash2 
      })).toThrow('Hash mismatch');
    });

    test('should handle hash mismatch between output and hash', () => {
      const hash1 = Buffer.alloc(20, 1);
      const hash2 = Buffer.alloc(20, 2);
      
      const output = Buffer.concat([
        Buffer.from([0xa9, 0x14]), // OP_HASH160 + push 20 bytes
        hash1,
        Buffer.from([0x87]) // OP_EQUAL
      ]);
      
      expect(() => payments.p2sh({ 
        output,
        hash: hash2 
      })).toThrow('Hash mismatch');
    });

    test('should handle redeem output decompile that produces invalid output', () => {
      // Create input that when decompiled will have a non-Buffer as last chunk
      const invalidInput = Buffer.from('5151', 'hex'); // OP_1 OP_1 - last chunk is not a buffer
      
      expect(() => payments.p2sh({ input: invalidInput })).toThrow('Input is invalid');
    });

    test('should handle hash mismatch between redeem output and existing hash', () => {
      const hash1 = Buffer.alloc(20, 1);
      const redeemScript = Buffer.from('52', 'hex'); // OP_2
      const redeem = { output: redeemScript };
      
      expect(() => payments.p2sh({ 
        hash: hash1,
        redeem 
      })).toThrow('Hash mismatch');
    });

    test('should handle non push-only redeem input', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      const nonPushOnlyInput = Buffer.from('7651', 'hex'); // OP_DUP OP_1 (OP_DUP is not push-only)
      const redeem = { 
        output: redeemScript,
        input: nonPushOnlyInput
      };
      
      expect(() => payments.p2sh({ redeem })).toThrow('Non push-only scriptSig');
    });

    test('should handle input too short validation', () => {
      const emptyInput = Buffer.from('', 'hex');
      expect(() => payments.p2sh({ input: emptyInput })).toThrow('Input too short');
    });

    test('should handle invalid input buffer validation', () => {
      // Create invalid input that will fail when trying to get redeem output
      const invalidInput = Buffer.from('00', 'hex'); // Just OP_0, no redeem script
      expect(() => payments.p2sh({ input: invalidInput })).toThrow('Input is invalid');
    });

    test('should handle redeem network mismatch', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        network: networks.testnet
      };
      
      expect(() => payments.p2sh({ 
        redeem,
        network: networks.bitcoin 
      })).toThrow('Network mismatch');
          });
  
            test('should handle redeem output mismatch with input', () => {
        const redeemScript1 = Buffer.from('51', 'hex'); // OP_1
        const redeemScript2 = Buffer.from('52', 'hex'); // OP_2
        // Create input: OP_0 + push(redeemScript1) - so last chunk is redeemScript1
        const input = Buffer.concat([
          Buffer.from('00', 'hex'), // OP_0
          Buffer.from([redeemScript1.length]), // Push length
          redeemScript1 // Push redeemScript1
        ]);
        
        expect(() => payments.p2sh({ 
          input,
          redeem: { 
            output: redeemScript2,
            input: Buffer.from('00', 'hex') // OP_0 to satisfy empty input check
          }
        })).toThrow('Redeem.output mismatch');
      });
  
      test('should handle redeem input mismatch with input', () => {
        const redeemScript = Buffer.from('51', 'hex'); // OP_1
        // Create input: OP_0 + push(redeemScript) - so last chunk is redeemScript
        const input1 = Buffer.concat([
          Buffer.from('00', 'hex'), // OP_0
          Buffer.from([redeemScript.length]), // Push length
          redeemScript // Push redeemScript
        ]);
        const input2 = Buffer.from('51', 'hex'); // OP_1 script
        
        expect(() => payments.p2sh({ 
          input: input1,
          redeem: { 
            output: redeemScript,
            input: input2 
          }
        })).toThrow('Redeem.input mismatch');
      });

    test('should handle witness and redeem.witness mismatch', () => {
      const witness1 = [Buffer.from('01', 'hex')];
      const witness2 = [Buffer.from('02', 'hex')];
      const redeemScript = Buffer.from('51', 'hex');
      
      expect(() => payments.p2sh({ 
        witness: witness1,
        redeem: { 
          output: redeemScript,
          witness: witness2 
        }
      })).toThrow('Witness and redeem.witness mismatch');
    });

    test('should generate name with redeem.name', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        name: 'custom'
      };
      const payment = payments.p2sh({ redeem }, { validate: false });
      expect(payment.name).toBe('p2sh-custom');
    });

    test('should handle input property generation from redeem', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      const redeemInput = Buffer.from('00', 'hex'); // OP_0
      const redeem = { 
        output: redeemScript,
        input: redeemInput
      };
      const payment = payments.p2sh({ redeem }, { validate: false });
      
      expect(payment.input).toBeDefined();
      // According to p2sh.ts line 106-111, input is bscript.compile of decompiled redeem.input + redeem.output
      // Since redeemInput is [OP_0] and redeemScript is OP_1, the compiled result should be [OP_0, 0x01, OP_1] 
      const expectedInput = Buffer.from('00' + '01' + '51', 'hex'); // OP_0 + push(1) + OP_1
      expect(payment.input).toEqual(expectedInput);
    });

    test('should handle witness property from redeem', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const witness = [Buffer.from('signature', 'utf8')];
      const redeem = { 
        output: redeemScript,
        witness 
      };
      const payment = payments.p2sh({ redeem }, { validate: false });
      expect(payment.witness).toEqual(witness);
    });

    test('should handle witness property when input exists', () => {
      const input = Buffer.from('0151', 'hex'); // Push OP_1 script
      const payment = payments.p2sh({ input }, { validate: false });
      expect(payment.witness).toEqual([]);
    });

    test('should create from address and validate hash derivation', () => {
      // Create valid address
      const hash = validHash;
      const payload = Buffer.allocUnsafe(21);
      payload.writeUInt8(networks.bitcoin.scriptHash, 0);
      hash.copy(payload, 1);
      const address = base.toBase58Check(payload);
      
      const payment = payments.p2sh({ address });
      expect(payment.hash).toEqual(hash);
      expect(payment.address).toBe(address);
    });

    test('should handle redeem property generation from input', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      // Create input with proper format: [data] [redeemScript]
      // According to _redeem function in p2sh.ts, the last chunk is the redeem script
      const input = Buffer.from('00' + '01' + '51', 'hex'); // OP_0 + push(1) + OP_1(redeemScript)
      
      const payment = payments.p2sh({ input }, { validate: false });
      expect(payment.redeem).toBeDefined();
      expect(payment.redeem?.output).toEqual(redeemScript);
    });

    test('should skip validation when opts.validate is false', () => {
      // Use valid hash but invalid redeem that would normally fail validation
      const redeemScript = Buffer.from('51', 'hex');
      const wrongHash = Buffer.alloc(20, 2); // Valid length but wrong hash
      const redeem = { output: redeemScript };
      
      // This would normally fail with hash mismatch, but validation is disabled
      const payment = payments.p2sh({ hash: wrongHash, redeem }, { validate: false });
      expect(payment.hash).toEqual(wrongHash);
      expect(payment.redeem?.output).toEqual(redeemScript);
    });
  });

  describe('p2wsh payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2wsh({})).toThrow('Not enough data');
    });

    test('should create p2wsh from redeem script', () => {
      const redeemScript = Buffer.from('51', 'hex'); // OP_1
      const redeem = { output: redeemScript };
      const payment = payments.p2wsh({ redeem });
      expect(payment.redeem?.output).toEqual(redeemScript);
      expect(payment.hash).toBeDefined();
      expect(payment.address).toBeDefined();
      expect(payment.name).toBe('p2wsh');
    });

    test('should create p2wsh from hash', () => {
      const payment = payments.p2wsh({ hash: validHash32 });
      expect(payment.hash).toEqual(validHash32);
      expect(payment.output).toBeDefined();
      expect(payment.address).toBeDefined();
    });

    test('should handle redeem network mismatch', () => {
      const redeemWrongNetwork = {
        output: Buffer.from('51', 'hex'),
        network: networks.bitcoin
      };
      expect(() => payments.p2wsh({ 
        redeem: redeemWrongNetwork,
        network: networks.testnet 
      })).toThrow('Network mismatch');
    });

    test('should handle ambiguous witness source', () => {
      const ambiguousRedeem = {
        output: Buffer.from('51', 'hex'),
        input: Buffer.from('51', 'hex'),
        witness: [Buffer.from('51', 'hex')]
      };
      expect(() => payments.p2wsh({ redeem: ambiguousRedeem })).toThrow('Ambiguous witness source');
    });

    test('should handle invalid redeem output', () => {
      const invalidRedeemOutput = {
        output: Buffer.alloc(0) // Empty script
      };
      expect(() => payments.p2wsh({ redeem: invalidRedeemOutput })).toThrow('Redeem.output is invalid');
    });

    test('should use redeem network when provided', () => {
      const redeemWithNetwork = {
        output: Buffer.from('51', 'hex'),
        network: networks.bitcoin
      };
      const payment = payments.p2wsh({ redeem: redeemWithNetwork });
      expect(payment.network).toBe(networks.bitcoin);
    });

    test('should validate output buffer length', () => {
      const hash = Buffer.from('751e76c64647561e0b75f78e7e8f83c9d0a4b5c6751e76c64647561e0b75f78e', 'hex');
      const invalidOutput = Buffer.from('0020' + hash.toString('hex') + 'aa', 'hex'); // Wrong length
      expect(() => payments.p2wsh({ output: invalidOutput })).toThrow(); // TypeForce validation
    });

    test('should use redeem network when main network not provided', () => {
      const redeemScript = Buffer.from('51', 'hex');
      const redeem = { 
        output: redeemScript,
        network: networks.bitcoin
      };
      const payment = payments.p2wsh({ redeem });
      expect(payment.network).toBe(networks.bitcoin);
    });
  });

  describe('p2tr payment tests', () => {
    test('should throw when insufficient data', () => {
      expect(() => payments.p2tr({})).toThrow('Not enough data');
    });

    test('should create p2tr from internal pubkey', () => {
      const payment = payments.p2tr({ internalPubkey });
      expect(payment.internalPubkey).toEqual(internalPubkey);
      expect(payment.address).toBeDefined();
      expect(payment.pubkey).toBeDefined();
      expect(payment.name).toBe('p2tr');
    });

    test('should create payment with internal pubkey', () => {
      const payment = payments.p2tr({ internalPubkey });
      expect(payment.internalPubkey).toEqual(internalPubkey);
      expect(payment.address).toBeDefined();
    });

    test('should create p2tr from output', () => {
      const output = Buffer.from('5120' + validHash32.toString('hex'), 'hex');
      const payment = payments.p2tr({ output });
      expect(payment.output).toEqual(output);
      expect(payment.pubkey).toEqual(validHash32);
    });

    test('should handle key spending witness', () => {
      const witness = [validSignature];
      const payment = payments.p2tr({ witness, internalPubkey });
      expect(payment.witness).toEqual(witness);
      expect(payment.signature).toEqual(validSignature);
    });

    test('should handle redeem version scenarios', () => {
      // Default version
      const payment1 = payments.p2tr({ internalPubkey });
      expect(payment1.redeemVersion).toBe(0xc0); // LEAF_VERSION_TAPSCRIPT
      
      // Explicit version
      const payment2 = payments.p2tr({ internalPubkey, redeemVersion: 0xc1 });
      expect(payment2.redeemVersion).toBe(0xc1);
      
      // Redeem version from redeem object
      const payment3 = payments.p2tr({ 
        internalPubkey, 
        redeem: { redeemVersion: 0xc2 } 
      });
      expect(payment3.redeemVersion).toBe(0xc2);
    });

    test('should handle script tree', () => {
      const scriptTree = { output: Buffer.from('51', 'hex'), version: 0xc0 };
      const payment = payments.p2tr({ internalPubkey, scriptTree });
      expect(payment.scriptTree).toEqual(scriptTree);
      expect(payment.hash).toBeDefined();
    });

    test('should handle internal pubkey mismatch', () => {
      const wrongInternalKey = Buffer.alloc(32, 1);
      expect(() => payments.p2tr({ 
        internalPubkey: wrongInternalKey,
        pubkey: Buffer.alloc(32, 2)
      })).toThrow('Pubkey mismatch');
    });

    test('should handle key spending signature mismatch', () => {
      const witness = [validSignature];
      const wrongSig = Buffer.alloc(64, 1);
      expect(() => payments.p2tr({ 
        signature: wrongSig,
        witness,
        internalPubkey 
      })).toThrow('Signature mismatch');
    });

    test('should handle script path witness validation', () => {
      // Control block too small
      const smallControlBlock = Buffer.alloc(32);
      const scriptWitness = [Buffer.from('51', 'hex'), smallControlBlock];
      expect(() => payments.p2tr({ 
        witness: scriptWitness,
        internalPubkey 
      })).toThrow('The control-block length is too small');
    });

    test('should handle redeem script validation', () => {
      const scriptTree = { output: Buffer.from('51', 'hex'), version: 0xc0 };
      const wrongRedeem = { output: Buffer.from('52', 'hex'), version: 0xc0 };
      expect(() => payments.p2tr({ 
        redeem: wrongRedeem,
        scriptTree,
        internalPubkey 
      })).toThrow('Redeem script not in tree');
    });

    test('should validate output buffer length', () => {
      const pubkey = Buffer.from('751e76c64647561e0b75f78e7e8f83c9d0a4b5c6751e76c64647561e0b75f78e', 'hex');
      const invalidOutput = Buffer.from('5120' + pubkey.toString('hex') + 'aa', 'hex'); // Wrong length
      expect(() => payments.p2tr({ output: invalidOutput })).toThrow(); // TypeForce validation
    });

    test('should handle simple witness array', () => {
      const witness = [Buffer.from('signature', 'utf8')];
      const payment = payments.p2tr({ witness, internalPubkey }, { validate: false });
      expect(payment.witness).toEqual(witness);
    });

    test('should use default redeem version', () => {
      const payment = payments.p2tr({ internalPubkey });
      expect(payment.redeemVersion).toBe(0xc0); // LEAF_VERSION_TAPSCRIPT
    });

    test('should use provided redeem version', () => {
      const payment = payments.p2tr({ internalPubkey, redeemVersion: 0xc1 });
      expect(payment.redeemVersion).toBe(0xc1);
    });

    test('should use redeem.redeemVersion when available', () => {
      const redeem = { redeemVersion: 0xc2 };
      const payment = payments.p2tr({ internalPubkey, redeem });
      expect(payment.redeemVersion).toBe(0xc2);
    });

    test('should handle scriptTree with script path', () => {
      const scriptTree = {
        output: Buffer.from('51', 'hex'), // OP_1
        version: 0xc0
      };
      const payment = payments.p2tr({ internalPubkey, scriptTree });
      expect(payment.scriptTree).toEqual(scriptTree);
    });
  });

  describe('Validation and option handling', () => {
         test('should bypass validation when validate is false', () => {
       // These should work with validation disabled
       expect(() => payments.embed({ data: [Buffer.from('test')] }, { validate: false })).not.toThrow();
       expect(() => payments.p2ms({ m: 1, pubkeys: [validPubkey] }, { validate: false })).not.toThrow();
       expect(() => payments.p2pk({ pubkey: validPubkey }, { validate: false })).not.toThrow();
       expect(() => payments.p2pkh({ pubkey: validPubkey }, { validate: false })).not.toThrow();
       expect(() => payments.p2wpkh({ pubkey: validPubkey }, { validate: false })).not.toThrow();
       expect(() => payments.p2sh({ redeem: { output: Buffer.from('51', 'hex') } }, { validate: false })).not.toThrow();
       expect(() => payments.p2wsh({ redeem: { output: Buffer.from('51', 'hex') } }, { validate: false })).not.toThrow();
       expect(() => payments.p2tr({ internalPubkey }, { validate: false })).not.toThrow();
     });

    test('should handle allowIncomplete for multisig', () => {
      const incompleteSignatures = [validSignature, Buffer.from([0])];
      const payment = payments.p2ms({ 
        m: 2, 
        signatures: incompleteSignatures,
        pubkeys: [validPubkey, validPubkey2]
      }, { allowIncomplete: true });
      expect(payment.signatures).toEqual(incompleteSignatures);
    });

    test('should bypass validation for some payment types', () => {
      const validData = { pubkey: validPubkey };
      const multisigData = { m: 1, pubkeys: [validPubkey] };
      const redeemData = { redeem: { output: Buffer.from('51', 'hex') } };
      const p2trData = { internalPubkey };
      
      // Only test payment types that can actually bypass validation
      expect(() => payments.p2ms(multisigData, { validate: false })).not.toThrow();
      expect(() => payments.p2pk(validData, { validate: false })).not.toThrow();
      expect(() => payments.p2pkh(validData, { validate: false })).not.toThrow();
      expect(() => payments.p2wpkh(validData, { validate: false })).not.toThrow();
      expect(() => payments.p2sh(redeemData, { validate: false })).not.toThrow();
      expect(() => payments.p2wsh(redeemData, { validate: false })).not.toThrow();
      expect(() => payments.p2tr(p2trData, { validate: false })).not.toThrow();
    });

    test('should test embed with required data', () => {
      const data = [Buffer.from('test')];
      expect(() => payments.embed({ data }, { validate: false })).not.toThrow();
    });
  });

  describe('Property lazy loading', () => {
    test('should handle lazy property evaluation', () => {
      const payment = payments.p2pkh({ hash: validHash });
      
      // Properties should be consistently available
      expect(payment.address).toBeDefined();
      expect(payment.address).toBe(payment.address); // Should return same value
      
      expect(payment.output).toBeDefined();
      expect(payment.output).toEqual(payment.output); // Should return same value
    });

    test('should handle undefined properties when data not available', () => {
      const payment = payments.p2pk({ pubkey: validPubkey });
      
      // These should be undefined without the required data
      expect(payment.signature).toBeUndefined();
      expect(payment.input).toBeUndefined();
    });

    test('should handle lazy witness loading', () => {
      const payment = payments.p2pkh({ pubkey: validPubkey, signature: validSignature });
      expect(payment.witness).toEqual([]); // Should be empty array for p2pkh
    });
  });
}); 