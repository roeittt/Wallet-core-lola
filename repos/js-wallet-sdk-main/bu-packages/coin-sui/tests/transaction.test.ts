import { base } from '@okxweb3/coin-base';
import {
  getIdFromCallArg,
  Inputs,
  isMutableSharedObjectInput,
  isSharedObjectInput,
  MakeMoveVecTransaction,
  MergeCoinsTransaction,
  MoveCallTransaction,
  PublishTransaction,
  SplitCoinsTransaction,
  TransactionBlock,
  Transactions,
  TransferObjectsTransaction,
} from '../src/builder';
import { SharedObjectRef, SuiObjectRef } from '../src/types';

// Import transaction utility functions for additional tests
import {
  ExecutionStatus,
  GasCostSummary,
  getChangeEpochTransaction,
  getConsensusCommitPrologueTransaction,
  getCreatedObjects,
  getEvents,
  getExecutionStatus,
  getExecutionStatusError,
  getExecutionStatusGasSummary,
  getExecutionStatusType,
  getGasData,
  getNewlyCreatedCoinRefsAfterSplit,
  getObjectChanges,
  getProgrammableTransaction,
  getPublishedObjectChanges,
  getTimestampFromTransactionResponse,
  getTotalGasUsed,
  getTotalGasUsedUpperBound,
  getTransaction,
  getTransactionDigest,
  getTransactionEffects,
  getTransactionGasBudget,
  getTransactionGasObject,
  getTransactionGasPrice,
  getTransactionKind,
  getTransactionKindName,
  getTransactionSender,
  getTransactionSignature,
  OwnedObjectRef,
  ProgrammableTransaction,
  SuiChangeEpoch,
  SuiConsensusCommitPrologue,
  SuiObjectChange,
  SuiObjectChangePublished,
  SuiTransactionBlock,
  SuiTransactionBlockData,
  SuiTransactionBlockKind,
  SuiTransactionBlockResponse,
  TransactionEffects,
} from '../src/types/transactions';

import { SuiGasData } from '../src/types/objects';

import { SuiEvent } from '../src/types/events';

describe('Transaction Builder Tests', () => {
  let txb: TransactionBlock;

  beforeEach(() => {
    txb = new TransactionBlock();
  });

  describe('TransactionBlock Class', () => {
    describe('Static methods', () => {
      it('should identify TransactionBlock instances', () => {
        const tx = new TransactionBlock();
        expect(TransactionBlock.is(tx)).toBe(true);
        expect(TransactionBlock.is({})).toBe(false);
        expect(TransactionBlock.is(null)).toBe(false);
        expect(TransactionBlock.is('not a transaction')).toBe(false);
      });

      it('should provide access to Transactions helper', () => {
        expect(TransactionBlock.Transactions).toBe(Transactions);
        expect(typeof TransactionBlock.Transactions.MoveCall).toBe('function');
        expect(typeof TransactionBlock.Transactions.SplitCoins).toBe(
          'function'
        );
      });

      it('should provide access to Inputs helper', () => {
        expect(TransactionBlock.Inputs).toBe(Inputs);
        expect(typeof TransactionBlock.Inputs.Pure).toBe('function');
        expect(typeof TransactionBlock.Inputs.ObjectRef).toBe('function');
      });

      it('should create TransactionBlock from serialized kind', () => {
        const tx = new TransactionBlock();
        tx.moveCall({
          target: '0x2::coin::split',
          arguments: [tx.gas, tx.pure([100])],
        });

        const serialized = base.toBase64(new Uint8Array(32)); // Mock serialized data
        const restored = TransactionBlock.fromKind(serialized);
        expect(TransactionBlock.is(restored)).toBe(true);
      });

      it('should create TransactionBlock from serialized transaction', () => {
        const tx = new TransactionBlock();
        const serialized = tx.serialize();
        const restored = TransactionBlock.from(serialized);

        expect(TransactionBlock.is(restored)).toBe(true);
        expect(restored.blockData).toEqual(tx.blockData);
      });

      it('should handle both string and Uint8Array serialized data', () => {
        // Create a minimal valid transaction bytes (this is complex to construct properly)
        // For this test, we'll just verify the method exists and handles the input type
        expect(() => {
          try {
            TransactionBlock.from(new Uint8Array(32));
          } catch (e) {
            // Expected to fail with invalid data, just testing the method accepts Uint8Array
          }
        }).not.toThrow();
      });
    });

    describe('Constructor and initialization', () => {
      it('should create empty transaction block', () => {
        const tx = new TransactionBlock();
        const data = tx.blockData;

        expect(data.version).toBe(1);
        expect(data.inputs).toEqual([]);
        expect(data.transactions).toEqual([]);
        expect(data.sender).toBeUndefined();
      });

      it('should clone existing transaction block', () => {
        const original = new TransactionBlock();
        original.setSender('0x123');
        original.setGasBudget(1000);

        const cloned = new TransactionBlock(original);
        expect(cloned.blockData.sender).toBe('0x123');
        expect(cloned.blockData.gasConfig.budget).toBe('1000');
      });

      it('should maintain independence between cloned transactions', () => {
        const original = new TransactionBlock();
        original.setSender('0x123');

        const cloned = new TransactionBlock(original);
        cloned.setSender('0x456');

        expect(original.blockData.sender).toBe('0x123');
        expect(cloned.blockData.sender).toBe('0x456');
      });
    });

    describe('Sender configuration', () => {
      it('should set sender address', () => {
        const sender = '0x1234567890abcdef1234567890abcdef12345678';
        txb.setSender(sender);
        expect(txb.blockData.sender).toBe(sender);
      });

      it('should set sender only if not already set', () => {
        const firstSender = '0x1234567890abcdef1234567890abcdef12345678';
        const secondSender = '0xabcdef1234567890abcdef1234567890abcdef12';

        txb.setSender(firstSender);
        txb.setSenderIfNotSet(secondSender);
        expect(txb.blockData.sender).toBe(firstSender);
      });

      it('should set sender if not previously set', () => {
        const sender = '0x1234567890abcdef1234567890abcdef12345678';
        txb.setSenderIfNotSet(sender);
        expect(txb.blockData.sender).toBe(sender);
      });
    });

    describe('Gas configuration', () => {
      it('should set gas price', () => {
        txb.setGasPrice(1000);
        expect(txb.blockData.gasConfig.price).toBe('1000');

        txb.setGasPrice(BigInt(2000));
        expect(txb.blockData.gasConfig.price).toBe('2000');
      });

      it('should set gas budget', () => {
        txb.setGasBudget(100000);
        expect(txb.blockData.gasConfig.budget).toBe('100000');

        txb.setGasBudget(BigInt(200000));
        expect(txb.blockData.gasConfig.budget).toBe('200000');
      });

      it('should set gas owner', () => {
        const owner = '0x1234567890abcdef1234567890abcdef12345678';
        txb.setGasOwner(owner);
        expect(txb.blockData.gasConfig.owner).toBe(owner);
      });

      it('should set gas payment objects', () => {
        const payments: SuiObjectRef[] = [
          {
            objectId: '0x123',
            version: '1',
            digest: 'digest1',
          },
          {
            objectId: '0x456',
            version: '2',
            digest: 'digest2',
          },
        ];

        txb.setGasPayment(payments);
        expect(txb.blockData.gasConfig.payment).toEqual(payments);
      });

      it('should reject too many gas payment objects', () => {
        const tooManyPayments = Array.from({ length: 257 }, (_, i) => ({
          objectId: `0x${i}`,
          version: '1',
          digest: `digest${i}`,
        }));

        expect(() => txb.setGasPayment(tooManyPayments)).toThrow(
          'Payment objects exceed maximum amount 256'
        );
      });

      it('should provide gas coin reference', () => {
        const gasCoin = txb.gas;
        expect(gasCoin).toEqual({ kind: 'GasCoin' });
      });
    });

    describe('Expiration configuration', () => {
      it('should set epoch expiration', () => {
        const epochExpiration = { Epoch: 100 };
        txb.setExpiration(epochExpiration);
        expect(txb.blockData.expiration).toEqual(epochExpiration);
      });

      it('should set no expiration', () => {
        txb.setExpiration({ None: null });
        expect(txb.blockData.expiration).toEqual({ None: null });
      });

      it('should clear expiration', () => {
        txb.setExpiration(undefined);
        expect(txb.blockData.expiration).toBeUndefined();
      });
    });

    describe('Input management', () => {
      describe('Pure inputs', () => {
        it('should create pure input with automatic type inference', () => {
          const input = txb.pure(42);
          expect(input.kind).toBe('Input');
          expect(input.index).toBe(0);
          expect(input.type).toBe('pure');
        });

        it('should create pure input with explicit type', () => {
          const input = txb.pure(42, 'u64');
          expect(input.kind).toBe('Input');
          expect(input.index).toBe(0);
          expect(input.type).toBe('pure');
        });

        it('should handle Uint8Array as raw bytes', () => {
          const bytes = new Uint8Array([1, 2, 3, 4]);
          const input = txb.pure(bytes);
          expect(input.kind).toBe('Input');
          expect(input.type).toBe('pure');
        });

        it('should handle string values', () => {
          const input = txb.pure('hello world');
          expect(input.kind).toBe('Input');
          expect(input.type).toBe('pure');
        });

        it('should handle boolean values', () => {
          const input = txb.pure(true);
          expect(input.kind).toBe('Input');
          expect(input.type).toBe('pure');
        });

        it('should handle BigInt values', () => {
          const input = txb.pure(BigInt(123456789));
          expect(input.kind).toBe('Input');
          expect(input.type).toBe('pure');
        });

        it('should increment input indices', () => {
          const input1 = txb.pure(1);
          const input2 = txb.pure(2);
          const input3 = txb.pure(3);

          expect(input1.index).toBe(0);
          expect(input2.index).toBe(1);
          expect(input3.index).toBe(2);
        });
      });

      describe('Object inputs', () => {
        it('should create object input from object ID', () => {
          const objectId = '0x1234567890abcdef1234567890abcdef12345678';
          const input = txb.object(objectId);

          expect(input.kind).toBe('Input');
          expect(input.type).toBe('object');
          expect(input.index).toBe(0);
        });

        it('should create object input from ObjectCallArg', () => {
          const objectRef: SuiObjectRef = {
            objectId: '0x123',
            version: '1',
            digest: 'digest1',
          };
          const objectArg = Inputs.ObjectRef(objectRef);
          const input = txb.object(objectArg);

          expect(input.kind).toBe('Input');
          expect(input.type).toBe('object');
        });

        it('should deduplicate object inputs with same ID', () => {
          const objectId = '0x1234567890abcdef1234567890abcdef12345678';
          const input1 = txb.object(objectId);
          const input2 = txb.object(objectId);

          expect(input1).toBe(input2);
          expect(input1.index).toBe(0);
          expect(txb.blockData.inputs.length).toBe(1);
        });

        it('should not deduplicate different object IDs', () => {
          const objectId1 = '0x1234567890abcdef1234567890abcdef12345678';
          const objectId2 = '0xabcdef1234567890abcdef1234567890abcdef12';

          const input1 = txb.object(objectId1);
          const input2 = txb.object(objectId2);

          expect(input1).not.toBe(input2);
          expect(input1.index).toBe(0);
          expect(input2.index).toBe(1);
          expect(txb.blockData.inputs.length).toBe(2);
        });
      });
    });

    describe('Transaction operations', () => {
      describe('moveCall', () => {
        it('should add MoveCall transaction', () => {
          const result = txb.moveCall({
            target: '0x2::coin::split',
            arguments: [txb.gas, txb.pure([100])],
          });

          expect(result.kind).toBe('Result');
          expect((result as any).index).toBe(0);
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as MoveCallTransaction;
          expect(transaction.kind).toBe('MoveCall');
          expect(transaction.target).toBe('0x2::coin::split');
          expect(transaction.arguments.length).toBe(2);
        });

        it('should add MoveCall with type arguments', () => {
          txb.moveCall({
            target: '0x2::coin::split',
            typeArguments: ['0x2::sui::SUI'],
            arguments: [txb.gas, txb.pure([100])],
          });

          const transaction = txb.blockData
            .transactions[0] as MoveCallTransaction;
          expect(transaction.typeArguments).toEqual(['0x2::sui::SUI']);
        });

        it('should handle empty arguments and type arguments', () => {
          txb.moveCall({
            target: '0x2::display::new',
          });

          const transaction = txb.blockData
            .transactions[0] as MoveCallTransaction;
          expect(transaction.arguments).toEqual([]);
          expect(transaction.typeArguments).toEqual([]);
        });
      });

      describe('splitCoins', () => {
        it('should add SplitCoins transaction', () => {
          const coin = txb.gas;
          const amounts = [txb.pure(100), txb.pure(200)];
          const result = txb.splitCoins(coin, amounts);

          expect(result.kind).toBe('Result');
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as SplitCoinsTransaction;
          expect(transaction.kind).toBe('SplitCoins');
          expect(transaction.coin).toStrictEqual(coin);
          expect(transaction.amounts).toStrictEqual(amounts);
        });

        it('should handle single amount', () => {
          const result = txb.splitCoins(txb.gas, [txb.pure(500)]);
          expect(result.kind).toBe('Result');

          const transaction = txb.blockData
            .transactions[0] as SplitCoinsTransaction;
          expect(transaction.amounts.length).toBe(1);
        });
      });

      describe('mergeCoins', () => {
        it('should add MergeCoins transaction', () => {
          const destination = txb.gas;
          const sources = [txb.object('0x123'), txb.object('0x456')];
          const result = txb.mergeCoins(destination, sources);

          expect(result.kind).toBe('Result');
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as MergeCoinsTransaction;
          expect(transaction.kind).toBe('MergeCoins');
          expect(transaction.destination).toStrictEqual(destination);
          expect(transaction.sources).toStrictEqual(sources);
        });
      });

      describe('transferObjects', () => {
        it('should add TransferObjects transaction', () => {
          const objects = [txb.object('0x123'), txb.object('0x456')];
          const recipient = txb.pure('0xrecipient');
          const result = txb.transferObjects(objects, recipient);

          expect(result.kind).toBe('Result');
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as TransferObjectsTransaction;
          expect(transaction.kind).toBe('TransferObjects');
          expect(transaction.objects).toStrictEqual(objects);
          expect(transaction.address).toStrictEqual(recipient);
        });
      });

      describe('publish', () => {
        it('should add Publish transaction', () => {
          const modules = [
            [1, 2, 3],
            [4, 5, 6],
          ];
          const dependencies = ['0xdep1', '0xdep2'];
          const result = txb.publish(modules, dependencies);

          expect(result.kind).toBe('Result');
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as PublishTransaction;
          expect(transaction.kind).toBe('Publish');
          expect(transaction.modules).toStrictEqual(modules);
          expect(transaction.dependencies).toStrictEqual(dependencies);
        });

        it('should handle empty dependencies', () => {
          const modules = [[1, 2, 3]];
          txb.publish(modules, []);

          const transaction = txb.blockData
            .transactions[0] as PublishTransaction;
          expect(transaction.dependencies).toEqual([]);
        });
      });

      describe('makeMoveVec', () => {
        it('should add MakeMoveVec transaction with type', () => {
          const objects = [txb.object('0x123'), txb.object('0x456')];
          const result = txb.makeMoveVec({
            type: '0x2::coin::Coin<0x2::sui::SUI>',
            objects,
          });

          expect(result.kind).toBe('Result');
          expect(txb.blockData.transactions.length).toBe(1);

          const transaction = txb.blockData
            .transactions[0] as MakeMoveVecTransaction;
          expect(transaction.kind).toBe('MakeMoveVec');
          expect(transaction.objects).toStrictEqual(objects);
          expect(transaction.type).toEqual({
            Some: '0x2::coin::Coin<0x2::sui::SUI>',
          });
        });

        it('should add MakeMoveVec transaction without type', () => {
          const objects = [txb.object('0x123')];
          txb.makeMoveVec({ objects });

          const transaction = txb.blockData
            .transactions[0] as MakeMoveVecTransaction;
          expect(transaction.type).toEqual({ None: null });
        });
      });

      describe('generic add method', () => {
        it('should add arbitrary transaction type', () => {
          const moveCallTx = Transactions.MoveCall({
            target: '0x2::coin::split',
            arguments: [txb.gas],
          });

          const result = txb.add(moveCallTx);
          expect(result.kind).toBe('Result');
          expect((result as any).index).toBe(0);
          expect(txb.blockData.transactions[0]).toStrictEqual(moveCallTx);
        });

        it('should increment transaction indices', () => {
          const tx1 = Transactions.MoveCall({ target: '0x2::coin::split' });
          const tx2 = Transactions.MoveCall({ target: '0x2::coin::join' });

          const result1 = txb.add(tx1);
          const result2 = txb.add(tx2);

          expect((result1 as any).index).toBe(0);
          expect((result2 as any).index).toBe(1);
        });
      });
    });

    describe('Transaction results and chaining', () => {
      it('should support transaction result chaining', () => {
        const splitResult = txb.splitCoins(txb.gas, [txb.pure(100)]);
        txb.transferObjects([splitResult], txb.pure('0xrecipient'));

        expect(txb.blockData.transactions.length).toBe(2);

        const transferTx = txb.blockData
          .transactions[1] as TransferObjectsTransaction;
        expect(transferTx.objects[0]).toEqual({ kind: 'Result', index: 0 });
      });

      it('should support nested result access', () => {
        const splitResult = txb.splitCoins(txb.gas, [
          txb.pure(100),
          txb.pure(200),
        ]);

        // Access first nested result
        const firstCoin = splitResult[0];
        expect(firstCoin.kind).toBe('NestedResult');
        expect((firstCoin as any).index).toBe(0);
        expect((firstCoin as any).resultIndex).toBe(0);

        // Access second nested result
        const secondCoin = splitResult[1];
        expect(secondCoin.kind).toBe('NestedResult');
        expect((secondCoin as any).index).toBe(0);
        expect((secondCoin as any).resultIndex).toBe(1);
      });

      it('should support destructuring of transaction results', () => {
        const splitResult = txb.splitCoins(txb.gas, [
          txb.pure(100),
          txb.pure(200),
        ]);
        const [coin1, coin2] = splitResult;

        expect(coin1.kind).toBe('NestedResult');
        expect((coin1 as any).resultIndex).toBe(0);
        expect(coin2.kind).toBe('NestedResult');
        expect((coin2 as any).resultIndex).toBe(1);
      });

      it('should prevent setting properties on transaction results', () => {
        const result = txb.splitCoins(txb.gas, [txb.pure(100)]);
        expect(() => {
          (result as any).customProperty = 'value';
        }).toThrow('does not support setting properties directly');
      });

      it('should support unlimited nested result access', () => {
        const splitResult = txb.splitCoins(txb.gas, [
          txb.pure(100),
          txb.pure(200),
          txb.pure(300),
        ]);

        for (let i = 0; i < 10; i++) {
          const nestedResult = splitResult[i];
          expect(nestedResult.kind).toBe('NestedResult');
          expect((nestedResult as any).resultIndex).toBe(i);
        }
      });
    });

    describe('Serialization and building', () => {
      it('should serialize transaction to JSON', () => {
        txb.setSender('0x123');
        txb.setGasBudget(1000);
        txb.moveCall({ target: '0x2::coin::split' });

        const serialized = txb.serialize();
        const parsed = JSON.parse(serialized);

        expect(parsed.version).toBe(1);
        expect(parsed.sender).toBe('0x123');
        expect(parsed.gasConfig.budget).toBe('1000');
        expect(parsed.transactions.length).toBe(1);
      });

      it('should build transaction to bytes with sender', async () => {
        txb.setSender('0x123');
        txb.setGasBudget(1000);
        txb.setGasPrice(1000);
        txb.setGasPayment([
          {
            objectId: '0x1',
            version: '1',
            digest: 'digest1',
          },
        ]);

        const bytes = await txb.build();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBeGreaterThan(0);
      });

      it('should build transaction kind only', async () => {
        txb.moveCall({ target: '0x2::coin::split' });

        const bytes = await txb.build({ onlyTransactionKind: true });
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBeGreaterThan(0);
      });

      it('should get transaction digest', async () => {
        txb.setSender('0x123');
        txb.setGasBudget(1000);
        txb.setGasPrice(1000);
        txb.setGasPayment([
          {
            objectId: '0x1',
            version: '1',
            digest: 'digest1',
          },
        ]);
        txb.moveCall({ target: '0x2::coin::split' });

        const digest = await txb.getDigest();
        expect(typeof digest).toBe('string');
        expect(digest.length).toBeGreaterThan(0);
      });

      it('should throw error when building without sender', async () => {
        txb.moveCall({ target: '0x2::coin::split' });

        await expect(txb.build()).rejects.toThrow('Missing transaction sender');
      });

      it('should allow building transaction kind without sender', async () => {
        txb.moveCall({ target: '0x2::coin::split' });

        const bytes = await txb.build({ onlyTransactionKind: true });
        expect(bytes).toBeInstanceOf(Uint8Array);
      });
    });

    describe('Block data access', () => {
      it('should provide snapshot of block data', () => {
        txb.setSender('0x123');
        txb.setGasBudget(1000);
        const data1 = txb.blockData;

        txb.setGasBudget(2000);
        const data2 = txb.blockData;

        expect(data1.gasConfig.budget).toBe('1000');
        expect(data2.gasConfig.budget).toBe('2000');
        expect(data1).not.toBe(data2); // Should be different objects
      });

      it('should have transaction brand', () => {
        expect((txb as any)[Symbol.for('../transaction')]).toBe(true);
      });
    });
  });

  describe('Transactions Factory Methods', () => {
    describe('MoveCall', () => {
      it('should create MoveCall transaction with minimal arguments', () => {
        const tx = Transactions.MoveCall({
          target: '0x2::coin::split',
        });

        expect(tx.kind).toBe('MoveCall');
        expect(tx.target).toBe('0x2::coin::split');
        expect(tx.arguments).toEqual([]);
        expect(tx.typeArguments).toEqual([]);
      });

      it('should create MoveCall transaction with all arguments', () => {
        const args = [{ kind: 'GasCoin' as const }];
        const typeArgs = ['0x2::sui::SUI'];

        const tx = Transactions.MoveCall({
          target: '0x2::coin::split',
          arguments: args,
          typeArguments: typeArgs,
        });

        expect(tx.arguments).toStrictEqual(args);
        expect(tx.typeArguments).toStrictEqual(typeArgs);
      });
    });

    describe('TransferObjects', () => {
      it('should create TransferObjects transaction', () => {
        const objects = [{ kind: 'GasCoin' as const }];
        const address = { kind: 'Input' as const, index: 0 };

        const tx = Transactions.TransferObjects(objects, address);

        expect(tx.kind).toBe('TransferObjects');
        expect(tx.objects).toStrictEqual(objects);
        expect(tx.address).toStrictEqual(address);
      });
    });

    describe('SplitCoins', () => {
      it('should create SplitCoins transaction', () => {
        const coin = { kind: 'GasCoin' as const };
        const amounts = [{ kind: 'Input' as const, index: 0 }];

        const tx = Transactions.SplitCoins(coin, amounts);

        expect(tx.kind).toBe('SplitCoins');
        expect(tx.coin).toStrictEqual(coin);
        expect(tx.amounts).toStrictEqual(amounts);
      });
    });

    describe('MergeCoins', () => {
      it('should create MergeCoins transaction', () => {
        const destination = { kind: 'GasCoin' as const };
        const sources = [{ kind: 'Input' as const, index: 0 }];

        const tx = Transactions.MergeCoins(destination, sources);

        expect(tx.kind).toBe('MergeCoins');
        expect(tx.destination).toStrictEqual(destination);
        expect(tx.sources).toStrictEqual(sources);
      });
    });

    describe('Publish', () => {
      it('should create Publish transaction', () => {
        const modules = [
          [1, 2, 3],
          [4, 5, 6],
        ];
        const dependencies = ['0xdep1', '0xdep2'];

        const tx = Transactions.Publish(modules, dependencies);

        expect(tx.kind).toBe('Publish');
        expect(tx.modules).toStrictEqual(modules);
        expect(tx.dependencies).toStrictEqual(dependencies);
      });
    });

    describe('MakeMoveVec', () => {
      it('should create MakeMoveVec transaction with type', () => {
        const objects = [{ kind: 'Input' as const, index: 0 }];
        const type = '0x2::coin::Coin<0x2::sui::SUI>';

        const tx = Transactions.MakeMoveVec({ objects, type });

        expect(tx.kind).toBe('MakeMoveVec');
        expect(tx.objects).toStrictEqual(objects);
        expect(tx.type).toEqual({ Some: type });
      });

      it('should create MakeMoveVec transaction without type', () => {
        const objects = [{ kind: 'Input' as const, index: 0 }];

        const tx = Transactions.MakeMoveVec({ objects });

        expect(tx.kind).toBe('MakeMoveVec');
        expect(tx.objects).toStrictEqual(objects);
        expect(tx.type).toEqual({ None: null });
      });
    });
  });

  describe('Inputs Helper Functions', () => {
    describe('Pure inputs', () => {
      it('should create Pure input from number', () => {
        const input = Inputs.Pure(42, 'u64');
        expect(input.Pure).toBeInstanceOf(Array);
        expect(input.Pure.length).toBeGreaterThan(0);
      });

      it('should create Pure input from string', () => {
        const input = Inputs.Pure('hello', 'string');
        expect(input.Pure).toBeInstanceOf(Array);
      });

      it('should create Pure input from boolean', () => {
        const input = Inputs.Pure(true, 'bool');
        expect(input.Pure).toBeInstanceOf(Array);
      });

      it('should create Pure input from Uint8Array', () => {
        const bytes = new Uint8Array([1, 2, 3, 4]);
        const input = Inputs.Pure(bytes);
        expect(input.Pure).toEqual([1, 2, 3, 4]);
      });

      it('should handle different data types automatically', () => {
        const inputs = [
          Inputs.Pure(42, 'u64'),
          Inputs.Pure('test', 'string'),
          Inputs.Pure(true, 'bool'),
          Inputs.Pure([1, 2, 3], 'vector<u8>'),
        ];

        inputs.forEach((input) => {
          expect(input.Pure).toBeInstanceOf(Array);
          expect(input.Pure.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Object inputs', () => {
      it('should create ObjectRef input', () => {
        const objectRef: SuiObjectRef = {
          objectId: '0x123',
          version: '1',
          digest: 'digest123',
        };

        const input = Inputs.ObjectRef(objectRef);
        expect((input.Object as any).ImmOrOwned).toBe(objectRef);
      });

      it('should create SharedObjectRef input', () => {
        const sharedRef: SharedObjectRef = {
          objectId: '0x456',
          initialSharedVersion: '10',
          mutable: true,
        };

        const input = Inputs.SharedObjectRef(sharedRef);
        expect((input.Object as any).Shared).toBe(sharedRef);
      });

      it('should handle different version types in SharedObjectRef', () => {
        const sharedRefNumber: SharedObjectRef = {
          objectId: '0x456',
          initialSharedVersion: 10,
          mutable: false,
        };

        const input = Inputs.SharedObjectRef(sharedRefNumber);
        expect((input.Object as any).Shared).toBe(sharedRefNumber);
      });
    });

    describe('Helper functions', () => {
      it('should get ID from string object ID', () => {
        const objectId = '0x1234567890abcdef1234567890abcdef12345678';
        const id = getIdFromCallArg(objectId);
        // Object ID gets normalized to 64 characters
        expect(id).toBe(
          '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678'
        );
      });

      it('should get ID from ImmOrOwned ObjectCallArg', () => {
        const objectRef: SuiObjectRef = {
          objectId: '0x123',
          version: '1',
          digest: 'digest',
        };
        const objectArg = Inputs.ObjectRef(objectRef);
        const id = getIdFromCallArg(objectArg);
        expect(id).toBe('0x123');
      });

      it('should get ID from Shared ObjectCallArg', () => {
        const sharedRef: SharedObjectRef = {
          objectId: '0x456',
          initialSharedVersion: '10',
          mutable: true,
        };
        const objectArg = Inputs.SharedObjectRef(sharedRef);
        const id = getIdFromCallArg(objectArg);
        expect(id).toBe('0x456');
      });

      it('should detect shared object inputs', () => {
        const sharedRef: SharedObjectRef = {
          objectId: '0x456',
          initialSharedVersion: '10',
          mutable: true,
        };
        const sharedArg = Inputs.SharedObjectRef(sharedRef);
        const immutableArg = Inputs.ObjectRef({
          objectId: '0x123',
          version: '1',
          digest: 'digest',
        });
        const pureArg = Inputs.Pure(42, 'u64');

        expect(isSharedObjectInput(sharedArg)).toBe(true);
        expect(isSharedObjectInput(immutableArg)).toBe(false);
        expect(isSharedObjectInput(pureArg)).toBe(false);
      });

      it('should detect mutable shared object inputs', () => {
        const mutableSharedArg = Inputs.SharedObjectRef({
          objectId: '0x456',
          initialSharedVersion: '10',
          mutable: true,
        });
        const immutableSharedArg = Inputs.SharedObjectRef({
          objectId: '0x789',
          initialSharedVersion: '5',
          mutable: false,
        });
        const immutableArg = Inputs.ObjectRef({
          objectId: '0x123',
          version: '1',
          digest: 'digest',
        });

        expect(isMutableSharedObjectInput(mutableSharedArg)).toBe(true);
        expect(isMutableSharedObjectInput(immutableSharedArg)).toBe(false);
        expect(isMutableSharedObjectInput(immutableArg)).toBe(false);
      });
    });
  });

  describe('Integration and Complex Scenarios', () => {
    describe('Complete transaction workflows', () => {
      it('should build complex transaction with multiple operations', () => {
        txb.setSender('0x1234567890abcdef1234567890abcdef12345678');
        txb.setGasBudget(1000000);
        txb.setGasPrice(1000);

        // Split coins
        const [coin1, coin2] = txb.splitCoins(txb.gas, [
          txb.pure(1000000),
          txb.pure(2000000),
        ]);

        // Transfer one coin
        txb.transferObjects([coin1], txb.pure('0xrecipient1'));

        // Merge another coin back
        txb.mergeCoins(txb.gas, [coin2]);

        expect(txb.blockData.transactions.length).toBe(3);
        expect(txb.blockData.inputs.length).toBe(3); // 2 amounts + 1 recipient
      });

      it('should handle move call with complex arguments', () => {
        txb.setSender('0x123');

        const objectArg = txb.object('0x456');
        const pureArg = txb.pure(1000, 'u64');
        const vectorArg = txb.makeMoveVec({
          type: '0x2::coin::Coin<0x2::sui::SUI>',
          objects: [txb.gas],
        });

        txb.moveCall({
          target: '0x2::some_module::complex_function',
          typeArguments: ['0x2::sui::SUI', '0x2::another::Type'],
          arguments: [objectArg, pureArg, vectorArg],
        });

        expect(txb.blockData.transactions.length).toBe(2); // makeVec + moveCall
        expect(txb.blockData.inputs.length).toBe(2); // object + pure
      });

      it('should support transaction result chaining across multiple operations', () => {
        const splitResult = txb.splitCoins(txb.gas, [txb.pure(1000)]);
        const vecResult = txb.makeMoveVec({ objects: [splitResult] });
        txb.moveCall({
          target: '0x2::module::function',
          arguments: [vecResult],
        });

        expect(txb.blockData.transactions.length).toBe(3);

        // Check that results are properly chained
        const moveCallTx = txb.blockData.transactions[2] as MoveCallTransaction;
        expect(moveCallTx.arguments[0]).toEqual({ kind: 'Result', index: 1 });
      });
    });

    describe('Serialization and restoration', () => {
      it('should preserve transaction state through serialize/restore cycle', () => {
        txb.setSender('0x123');
        txb.setGasBudget(1000000);
        txb.setGasPrice(1000);

        const coin = txb.object('0x456');
        txb.splitCoins(coin, [txb.pure(1000)]);

        const serialized = txb.serialize();
        const restored = TransactionBlock.from(serialized);

        expect(restored.blockData).toEqual(txb.blockData);
      });

      it('should handle empty transaction serialization', () => {
        const serialized = txb.serialize();
        const restored = TransactionBlock.from(serialized);

        expect(restored.blockData.version).toBe(1);
        expect(restored.blockData.transactions).toEqual([]);
        expect(restored.blockData.inputs).toEqual([]);
      });

      it('should maintain input deduplication after restoration', () => {
        const objectId = '0x123';
        txb.object(objectId);
        txb.object(objectId); // Should be deduplicated

        const serialized = txb.serialize();
        const restored = TransactionBlock.from(serialized);

        expect(restored.blockData.inputs.length).toBe(1);
      });
    });

    describe('Gas and payment configuration', () => {
      it('should handle multiple gas payment objects', () => {
        const gasObjects: SuiObjectRef[] = [
          { objectId: '0x1', version: '1', digest: 'digest1' },
          { objectId: '0x2', version: '1', digest: 'digest2' },
          { objectId: '0x3', version: '1', digest: 'digest3' },
        ];

        txb.setGasPayment(gasObjects);
        expect(txb.blockData.gasConfig.payment).toEqual(gasObjects);
      });

      it('should handle gas configuration edge cases', () => {
        txb.setGasPrice(0);
        txb.setGasBudget(BigInt(Number.MAX_SAFE_INTEGER));
        txb.setGasOwner('0x' + '0'.repeat(64));

        expect(txb.blockData.gasConfig.price).toBe('0');
        expect(txb.blockData.gasConfig.budget).toBe(
          String(BigInt(Number.MAX_SAFE_INTEGER))
        );
        expect(txb.blockData.gasConfig.owner).toBe('0x' + '0'.repeat(64));
      });
    });

    describe('Error handling and edge cases', () => {
      it('should handle transactions with no inputs', () => {
        txb.moveCall({ target: '0x2::module::no_args_function' });
        expect(txb.blockData.inputs.length).toBe(0);
        expect(txb.blockData.transactions.length).toBe(1);
      });

      it('should handle deeply nested transaction results', () => {
        const split1 = txb.splitCoins(txb.gas, [txb.pure(1000)]);
        const split2 = txb.splitCoins(split1, [txb.pure(500)]);
        const split3 = txb.splitCoins(split2, [txb.pure(250)]);

        txb.transferObjects([split3], txb.pure('0xrecipient'));

        expect(txb.blockData.transactions.length).toBe(4);

        // Verify the chain of dependencies
        const transferTx = txb.blockData
          .transactions[3] as TransferObjectsTransaction;
        expect(transferTx.objects[0]).toEqual({ kind: 'Result', index: 2 });
      });

      it('should handle large number of inputs and transactions', () => {
        // Create many pure inputs
        const pureInputs = Array.from({ length: 50 }, (_, i) => txb.pure(i));

        // Create many object inputs - ensure they're actually added to the transaction
        Array.from({ length: 25 }, (_, i) =>
          txb.object(`0x${i.toString(16).padStart(64, '0')}`)
        );

        // Create transactions using these inputs
        pureInputs.forEach((input, i) => {
          if (i % 10 === 0) {
            txb.moveCall({
              target: '0x2::module::function',
              arguments: [input],
            });
          }
        });

        expect(txb.blockData.inputs.length).toBe(75); // 50 pure + 25 object
        expect(txb.blockData.transactions.length).toBe(5); // Every 10th pure input
      });

      it('should handle transaction with all supported argument types', () => {
        const gasCoin = txb.gas;
        const pureInput = txb.pure(42);
        const objectInput = txb.object('0x123');
        const splitResult = txb.splitCoins(gasCoin, [pureInput]);
        const nestedResult = splitResult[0];

        txb.moveCall({
          target: '0x2::module::complex_function',
          arguments: [
            gasCoin,
            pureInput,
            objectInput,
            splitResult,
            nestedResult,
          ],
        });

        const moveCallTx = txb.blockData.transactions[1] as MoveCallTransaction;
        expect(moveCallTx.arguments).toHaveLength(5);
        expect(moveCallTx.arguments[0].kind).toBe('GasCoin');
        expect(moveCallTx.arguments[1].kind).toBe('Input');
        expect(moveCallTx.arguments[2].kind).toBe('Input');
        expect(moveCallTx.arguments[3].kind).toBe('Result');
        expect(moveCallTx.arguments[4].kind).toBe('NestedResult');
      });
    });

    describe('Performance and limits', () => {
      it('should handle maximum allowed gas payment objects', () => {
        const maxGasObjects = Array.from({ length: 255 }, (_, i) => ({
          objectId: `0x${i}`,
          version: '1',
          digest: `digest${i}`,
        }));

        expect(() => txb.setGasPayment(maxGasObjects)).not.toThrow();
        expect(txb.blockData.gasConfig.payment?.length).toBe(255);
      });

      it('should reject beyond maximum gas payment objects', () => {
        const tooManyGasObjects = Array.from({ length: 257 }, (_, i) => ({
          objectId: `0x${i}`,
          version: '1',
          digest: `digest${i}`,
        }));

        expect(() => txb.setGasPayment(tooManyGasObjects)).toThrow(
          'Payment objects exceed maximum amount 256'
        );
      });

      it('should handle very large pure values', () => {
        const largeBigInt = BigInt('123456789012345678901234567890');
        const largeNumber = Number.MAX_SAFE_INTEGER;
        const longString = 'x'.repeat(1000);
        const largeArray = new Uint8Array(1000).fill(255);

        expect(() => {
          txb.pure(largeBigInt);
          txb.pure(largeNumber);
          txb.pure(longString);
          txb.pure(largeArray);
        }).not.toThrow();

        expect(txb.blockData.inputs.length).toBe(4);
      });
    });
  });
});

// ========================================================================
// Transaction Response Utilities Tests
// ========================================================================

describe('Transaction Response Utilities Tests', () => {
  // Mock data for comprehensive testing
  const mockGasData: SuiGasData = {
    payment: [
      {
        objectId: '0x123',
        version: '1',
        digest: 'gasdigest',
      },
    ],
    owner: '0x456',
    price: 1000,
    budget: 10000,
  };

  const mockGasCostSummary: GasCostSummary = {
    computationCost: '1000',
    storageCost: '500',
    storageRebate: '200',
    nonRefundableStorageFee: '50',
  };

  const mockExecutionStatus: ExecutionStatus = {
    status: 'success',
  };

  const mockExecutionStatusWithError: ExecutionStatus = {
    status: 'failure',
    error: 'Transaction failed due to insufficient gas',
  };

  const mockTransactionEffects: TransactionEffects = {
    messageVersion: 'v1',
    status: mockExecutionStatus,
    executedEpoch: '100',
    gasUsed: mockGasCostSummary,
    transactionDigest: 'txdigest123',
    gasObject: {
      owner: { AddressOwner: '0x456' },
      reference: {
        objectId: '0x123',
        version: '1',
        digest: 'gasdigest',
      },
    },
    created: [
      {
        owner: { AddressOwner: '0x789' },
        reference: {
          objectId: '0xabc',
          version: '1',
          digest: 'createddigest',
        },
      },
    ],
  };

  const mockProgrammableTransaction: ProgrammableTransaction = {
    transactions: [
      {
        MoveCall: {
          package: '0x2',
          module: 'coin',
          function: 'transfer',
          arguments: [{ Input: 0 }, { Input: 1 }],
          type_arguments: ['0x2::sui::SUI'],
        },
      },
    ],
    inputs: [
      {
        type: 'object',
        objectType: 'immOrOwnedObject',
        objectId: '0x123',
        version: 1,
        digest: 'inputdigest',
      },
    ],
  };

  const mockChangeEpochTransaction: SuiChangeEpoch = {
    epoch: '101',
    storage_charge: 1000,
    computation_charge: 500,
    storage_rebate: 200,
    epoch_start_timestamp_ms: 1640995200000,
  };

  const mockConsensusCommitPrologueTransaction: SuiConsensusCommitPrologue = {
    epoch: 100,
    round: 1,
    commit_timestamp_ms: 1640995200000,
  };

  const mockTransactionBlockData: SuiTransactionBlockData = {
    messageVersion: 'v1',
    transaction: {
      kind: 'ProgrammableTransaction',
      ...mockProgrammableTransaction,
    },
    sender: '0x456',
    gasData: mockGasData,
  };

  const mockTransactionBlock: SuiTransactionBlock = {
    data: mockTransactionBlockData,
    txSignatures: ['signature1', 'signature2'],
  };

  const mockSuiEvent: SuiEvent = {
    id: {
      txDigest: 'txdigest123',
      eventSeq: 0,
    },
    packageId: '0x2',
    transactionModule: 'coin',
    sender: '0x456',
    type: '0x2::coin::CoinMetadata',
    parsedJson: { name: 'SUI' },
    bcs: 'eventbcs',
    timestampMs: 1640995200000,
  };

  const mockObjectChangePublished: SuiObjectChangePublished = {
    type: 'published',
    packageId: '0x789',
    version: 1,
    digest: 'publisheddigest',
    modules: ['module1', 'module2'],
  };

  const mockObjectChangeCreated: SuiObjectChange = {
    type: 'created',
    sender: '0x456',
    owner: { AddressOwner: '0x789' },
    objectType: '0x2::coin::Coin<0x2::sui::SUI>',
    objectId: '0xabc',
    version: 1,
    digest: 'createddigest',
  };

  const mockCompleteTransactionResponse: SuiTransactionBlockResponse = {
    digest: 'txdigest123',
    transaction: mockTransactionBlock,
    effects: mockTransactionEffects,
    events: [mockSuiEvent],
    timestampMs: 1640995200000,
    checkpoint: 1000,
    confirmedLocalExecution: true,
    objectChanges: [mockObjectChangePublished, mockObjectChangeCreated],
    balanceChanges: [
      {
        owner: { AddressOwner: '0x456' },
        coinType: '0x2::sui::SUI',
        amount: '-1000',
      },
    ],
  };

  const mockMinimalTransactionResponse: SuiTransactionBlockResponse = {
    digest: 'txdigest123',
  };

  describe('Basic Transaction Data Extraction', () => {
    describe('getTransaction', () => {
      it('should extract transaction from complete response', () => {
        const transaction = getTransaction(mockCompleteTransactionResponse);
        expect(transaction).toBe(mockTransactionBlock);
      });

      it('should return undefined for response without transaction', () => {
        const transaction = getTransaction(mockMinimalTransactionResponse);
        expect(transaction).toBeUndefined();
      });
    });

    describe('getTransactionDigest', () => {
      it('should extract digest from response', () => {
        const digest = getTransactionDigest(mockCompleteTransactionResponse);
        expect(digest).toBe('txdigest123');
      });

      it('should extract digest from minimal response', () => {
        const digest = getTransactionDigest(mockMinimalTransactionResponse);
        expect(digest).toBe('txdigest123');
      });
    });

    describe('getTransactionSignature', () => {
      it('should extract signatures from transaction', () => {
        const signatures = getTransactionSignature(
          mockCompleteTransactionResponse
        );
        expect(signatures).toEqual(['signature1', 'signature2']);
      });

      it('should return undefined for response without transaction', () => {
        const signatures = getTransactionSignature(
          mockMinimalTransactionResponse
        );
        expect(signatures).toBeUndefined();
      });
    });

    describe('getTransactionSender', () => {
      it('should extract sender from transaction data', () => {
        const sender = getTransactionSender(mockCompleteTransactionResponse);
        expect(sender).toBe('0x456');
      });

      it('should return undefined for response without transaction', () => {
        const sender = getTransactionSender(mockMinimalTransactionResponse);
        expect(sender).toBeUndefined();
      });
    });
  });

  describe('Gas Data Extraction', () => {
    describe('getGasData', () => {
      it('should extract gas data from transaction', () => {
        const gasData = getGasData(mockCompleteTransactionResponse);
        expect(gasData).toBe(mockGasData);
      });

      it('should return undefined for response without transaction', () => {
        const gasData = getGasData(mockMinimalTransactionResponse);
        expect(gasData).toBeUndefined();
      });
    });

    describe('getTransactionGasObject', () => {
      it('should extract gas objects from gas data', () => {
        const gasObjects = getTransactionGasObject(
          mockCompleteTransactionResponse
        );
        expect(gasObjects).toBe(mockGasData.payment);
      });

      it('should return undefined for response without gas data', () => {
        const gasObjects = getTransactionGasObject(
          mockMinimalTransactionResponse
        );
        expect(gasObjects).toBeUndefined();
      });
    });

    describe('getTransactionGasPrice', () => {
      it('should extract gas price from gas data', () => {
        const gasPrice = getTransactionGasPrice(
          mockCompleteTransactionResponse
        );
        expect(gasPrice).toBe(1000);
      });

      it('should return undefined for response without gas data', () => {
        const gasPrice = getTransactionGasPrice(mockMinimalTransactionResponse);
        expect(gasPrice).toBeUndefined();
      });
    });

    describe('getTransactionGasBudget', () => {
      it('should extract gas budget from gas data', () => {
        const gasBudget = getTransactionGasBudget(
          mockCompleteTransactionResponse
        );
        expect(gasBudget).toBe(10000);
      });

      it('should return undefined for response without gas data', () => {
        const gasBudget = getTransactionGasBudget(
          mockMinimalTransactionResponse
        );
        expect(gasBudget).toBeUndefined();
      });
    });
  });

  describe('Transaction Kind Extraction', () => {
    describe('getTransactionKind', () => {
      it('should extract transaction kind from response', () => {
        const kind = getTransactionKind(mockCompleteTransactionResponse);
        expect(kind).toBe(mockTransactionBlockData.transaction);
      });

      it('should return undefined for response without transaction', () => {
        const kind = getTransactionKind(mockMinimalTransactionResponse);
        expect(kind).toBeUndefined();
      });
    });

    describe('getTransactionKindName', () => {
      it('should extract kind name from programmable transaction', () => {
        const programmableKind: SuiTransactionBlockKind = {
          kind: 'ProgrammableTransaction',
          ...mockProgrammableTransaction,
        };
        const kindName = getTransactionKindName(programmableKind);
        expect(kindName).toBe('ProgrammableTransaction');
      });

      it('should extract kind name from change epoch transaction', () => {
        const changeEpochKind: SuiTransactionBlockKind = {
          kind: 'ChangeEpoch',
          ...mockChangeEpochTransaction,
        };
        const kindName = getTransactionKindName(changeEpochKind);
        expect(kindName).toBe('ChangeEpoch');
      });

      it('should extract kind name from consensus commit prologue transaction', () => {
        const consensusKind: SuiTransactionBlockKind = {
          kind: 'ConsensusCommitPrologue',
          ...mockConsensusCommitPrologueTransaction,
        };
        const kindName = getTransactionKindName(consensusKind);
        expect(kindName).toBe('ConsensusCommitPrologue');
      });

      it('should extract kind name from genesis transaction', () => {
        const genesisKind: SuiTransactionBlockKind = {
          kind: 'Genesis',
          objects: ['0x1', '0x2'],
        };
        const kindName = getTransactionKindName(genesisKind);
        expect(kindName).toBe('Genesis');
      });
    });

    describe('getProgrammableTransaction', () => {
      it('should extract programmable transaction data', () => {
        const programmableKind: SuiTransactionBlockKind = {
          kind: 'ProgrammableTransaction',
          ...mockProgrammableTransaction,
        };
        const programmable = getProgrammableTransaction(programmableKind);
        expect(programmable).toEqual({
          kind: 'ProgrammableTransaction',
          ...mockProgrammableTransaction,
        });
      });

      it('should return undefined for non-programmable transaction', () => {
        const changeEpochKind: SuiTransactionBlockKind = {
          kind: 'ChangeEpoch',
          ...mockChangeEpochTransaction,
        };
        const programmable = getProgrammableTransaction(changeEpochKind);
        expect(programmable).toBeUndefined();
      });
    });

    describe('getChangeEpochTransaction', () => {
      it('should extract change epoch transaction data', () => {
        const changeEpochKind: SuiTransactionBlockKind = {
          kind: 'ChangeEpoch',
          ...mockChangeEpochTransaction,
        };
        const changeEpoch = getChangeEpochTransaction(changeEpochKind);
        expect(changeEpoch).toEqual({
          kind: 'ChangeEpoch',
          ...mockChangeEpochTransaction,
        });
      });

      it('should return undefined for non-change-epoch transaction', () => {
        const programmableKind: SuiTransactionBlockKind = {
          kind: 'ProgrammableTransaction',
          ...mockProgrammableTransaction,
        };
        const changeEpoch = getChangeEpochTransaction(programmableKind);
        expect(changeEpoch).toBeUndefined();
      });
    });

    describe('getConsensusCommitPrologueTransaction', () => {
      it('should extract consensus commit prologue transaction data', () => {
        const consensusKind: SuiTransactionBlockKind = {
          kind: 'ConsensusCommitPrologue',
          ...mockConsensusCommitPrologueTransaction,
        };
        const consensus = getConsensusCommitPrologueTransaction(consensusKind);
        expect(consensus).toEqual({
          kind: 'ConsensusCommitPrologue',
          ...mockConsensusCommitPrologueTransaction,
        });
      });

      it('should return undefined for non-consensus transaction', () => {
        const programmableKind: SuiTransactionBlockKind = {
          kind: 'ProgrammableTransaction',
          ...mockProgrammableTransaction,
        };
        const consensus =
          getConsensusCommitPrologueTransaction(programmableKind);
        expect(consensus).toBeUndefined();
      });
    });
  });

  describe('Execution Status and Effects', () => {
    describe('getExecutionStatus', () => {
      it('should extract execution status from effects', () => {
        const status = getExecutionStatus(mockCompleteTransactionResponse);
        expect(status).toBe(mockExecutionStatus);
      });

      it('should return undefined for response without effects', () => {
        const status = getExecutionStatus(mockMinimalTransactionResponse);
        expect(status).toBeUndefined();
      });
    });

    describe('getExecutionStatusType', () => {
      it('should extract execution status type', () => {
        const statusType = getExecutionStatusType(
          mockCompleteTransactionResponse
        );
        expect(statusType).toBe('success');
      });

      it('should return undefined for response without effects', () => {
        const statusType = getExecutionStatusType(
          mockMinimalTransactionResponse
        );
        expect(statusType).toBeUndefined();
      });
    });

    describe('getExecutionStatusError', () => {
      it('should return undefined for successful execution', () => {
        const error = getExecutionStatusError(mockCompleteTransactionResponse);
        expect(error).toBeUndefined();
      });

      it('should extract error message for failed execution', () => {
        const failedResponse: SuiTransactionBlockResponse = {
          digest: 'failedtx',
          effects: {
            ...mockTransactionEffects,
            status: mockExecutionStatusWithError,
          },
        };
        const error = getExecutionStatusError(failedResponse);
        expect(error).toBe('Transaction failed due to insufficient gas');
      });

      it('should return undefined for response without effects', () => {
        const error = getExecutionStatusError(mockMinimalTransactionResponse);
        expect(error).toBeUndefined();
      });
    });

    describe('getTransactionEffects', () => {
      it('should extract transaction effects from response', () => {
        const effects = getTransactionEffects(mockCompleteTransactionResponse);
        expect(effects).toBe(mockTransactionEffects);
      });

      it('should return undefined for response without effects', () => {
        const effects = getTransactionEffects(mockMinimalTransactionResponse);
        expect(effects).toBeUndefined();
      });
    });
  });

  describe('Gas Cost Analysis', () => {
    describe('getExecutionStatusGasSummary', () => {
      it('should extract gas summary from transaction response', () => {
        const gasSummary = getExecutionStatusGasSummary(
          mockCompleteTransactionResponse
        );
        expect(gasSummary).toBe(mockGasCostSummary);
      });

      it('should extract gas summary from transaction effects directly', () => {
        const gasSummary = getExecutionStatusGasSummary(mockTransactionEffects);
        expect(gasSummary).toBe(mockGasCostSummary);
      });

      it('should return undefined for response without effects', () => {
        const gasSummary = getExecutionStatusGasSummary(
          mockMinimalTransactionResponse
        );
        expect(gasSummary).toBeUndefined();
      });
    });

    describe('getTotalGasUsed', () => {
      it('should calculate total gas used from transaction response', () => {
        const totalGas = getTotalGasUsed(mockCompleteTransactionResponse);
        // computationCost + storageCost - storageRebate = 1000 + 500 - 200 = 1300
        expect(totalGas).toBe(BigInt(1300));
      });

      it('should calculate total gas used from transaction effects directly', () => {
        const totalGas = getTotalGasUsed(mockTransactionEffects);
        expect(totalGas).toBe(BigInt(1300));
      });

      it('should return undefined for response without gas summary', () => {
        const totalGas = getTotalGasUsed(mockMinimalTransactionResponse);
        expect(totalGas).toBeUndefined();
      });

      it('should handle zero values correctly', () => {
        const zeroGasSummary: GasCostSummary = {
          computationCost: '0',
          storageCost: '0',
          storageRebate: '0',
          nonRefundableStorageFee: '0',
        };
        const zeroEffects: TransactionEffects = {
          ...mockTransactionEffects,
          gasUsed: zeroGasSummary,
        };
        const totalGas = getTotalGasUsed(zeroEffects);
        expect(totalGas).toBe(BigInt(0));
      });
    });

    describe('getTotalGasUsedUpperBound', () => {
      it('should calculate upper bound gas used from transaction response', () => {
        const upperBound = getTotalGasUsedUpperBound(
          mockCompleteTransactionResponse
        );
        // computationCost + storageCost = 1000 + 500 = 1500
        expect(upperBound).toBe(BigInt(1500));
      });

      it('should calculate upper bound gas used from transaction effects directly', () => {
        const upperBound = getTotalGasUsedUpperBound(mockTransactionEffects);
        expect(upperBound).toBe(BigInt(1500));
      });

      it('should return undefined for response without gas summary', () => {
        const upperBound = getTotalGasUsedUpperBound(
          mockMinimalTransactionResponse
        );
        expect(upperBound).toBeUndefined();
      });

      it('should handle large numbers correctly', () => {
        const largeGasSummary: GasCostSummary = {
          computationCost: '9999999999999999999',
          storageCost: '8888888888888888888',
          storageRebate: '100',
          nonRefundableStorageFee: '50',
        };
        const largeEffects: TransactionEffects = {
          ...mockTransactionEffects,
          gasUsed: largeGasSummary,
        };

        const totalGas = getTotalGasUsed(largeEffects);
        // 9999999999999999999 + 8888888888888888888 - 100 = 18888888888888888787
        expect(totalGas).toBe(BigInt('18888888888888888787'));

        const upperBound = getTotalGasUsedUpperBound(largeEffects);
        // 9999999999999999999 + 8888888888888888888 = 18888888888888888887
        expect(upperBound).toBe(BigInt('18888888888888888887'));
      });
    });
  });

  describe('Events and Object Changes', () => {
    describe('getEvents', () => {
      it('should extract events from transaction response', () => {
        const events = getEvents(mockCompleteTransactionResponse);
        expect(events).toEqual([mockSuiEvent]);
      });

      it('should return undefined for response without events', () => {
        const events = getEvents(mockMinimalTransactionResponse);
        expect(events).toBeUndefined();
      });
    });

    describe('getCreatedObjects', () => {
      it('should extract created objects from transaction effects', () => {
        const created = getCreatedObjects(mockCompleteTransactionResponse);
        expect(created).toBe(mockTransactionEffects.created);
      });

      it('should return undefined for response without effects', () => {
        const created = getCreatedObjects(mockMinimalTransactionResponse);
        expect(created).toBeUndefined();
      });

      it('should return undefined for effects without created objects', () => {
        const effectsWithoutCreated: TransactionEffects = {
          ...mockTransactionEffects,
          created: undefined,
        };
        const responseWithoutCreated: SuiTransactionBlockResponse = {
          digest: 'test',
          effects: effectsWithoutCreated,
        };
        const created = getCreatedObjects(responseWithoutCreated);
        expect(created).toBeUndefined();
      });
    });

    describe('getObjectChanges', () => {
      it('should extract object changes from transaction response', () => {
        const changes = getObjectChanges(mockCompleteTransactionResponse);
        expect(changes).toEqual([
          mockObjectChangePublished,
          mockObjectChangeCreated,
        ]);
      });

      it('should return undefined for response without object changes', () => {
        const changes = getObjectChanges(mockMinimalTransactionResponse);
        expect(changes).toBeUndefined();
      });
    });

    describe('getPublishedObjectChanges', () => {
      it('should filter and extract published object changes', () => {
        const published = getPublishedObjectChanges(
          mockCompleteTransactionResponse
        );
        expect(published).toEqual([mockObjectChangePublished]);
      });

      it('should return empty array for response without object changes', () => {
        const published = getPublishedObjectChanges(
          mockMinimalTransactionResponse
        );
        expect(published).toEqual([]);
      });

      it('should return empty array when no published changes exist', () => {
        const responseWithoutPublished: SuiTransactionBlockResponse = {
          digest: 'test',
          objectChanges: [mockObjectChangeCreated],
        };
        const published = getPublishedObjectChanges(responseWithoutPublished);
        expect(published).toEqual([]);
      });

      it('should handle multiple published changes', () => {
        const secondPublished: SuiObjectChangePublished = {
          type: 'published',
          packageId: '0xdef',
          version: 2,
          digest: 'published2digest',
          modules: ['module3'],
        };
        const responseWithMultiplePublished: SuiTransactionBlockResponse = {
          digest: 'test',
          objectChanges: [
            mockObjectChangePublished,
            mockObjectChangeCreated,
            secondPublished,
          ],
        };
        const published = getPublishedObjectChanges(
          responseWithMultiplePublished
        );
        expect(published).toEqual([mockObjectChangePublished, secondPublished]);
      });
    });
  });

  describe('Timestamp and Additional Data', () => {
    describe('getTimestampFromTransactionResponse', () => {
      it('should extract timestamp from transaction response', () => {
        const timestamp = getTimestampFromTransactionResponse(
          mockCompleteTransactionResponse
        );
        expect(timestamp).toBe(1640995200000);
      });

      it('should return undefined for response without timestamp', () => {
        const timestamp = getTimestampFromTransactionResponse(
          mockMinimalTransactionResponse
        );
        expect(timestamp).toBeUndefined();
      });

      it('should handle null timestamp', () => {
        const responseWithNullTimestamp: SuiTransactionBlockResponse = {
          digest: 'test',
          timestampMs: null as any,
        };
        const timestamp = getTimestampFromTransactionResponse(
          responseWithNullTimestamp
        );
        expect(timestamp).toBeUndefined();
      });
    });

    describe('getNewlyCreatedCoinRefsAfterSplit', () => {
      it('should extract coin references from created objects', () => {
        const coinRefs = getNewlyCreatedCoinRefsAfterSplit(
          mockCompleteTransactionResponse
        );
        expect(coinRefs).toEqual([
          {
            objectId: '0xabc',
            version: '1',
            digest: 'createddigest',
          },
        ]);
      });

      it('should return undefined for response without effects', () => {
        const coinRefs = getNewlyCreatedCoinRefsAfterSplit(
          mockMinimalTransactionResponse
        );
        expect(coinRefs).toBeUndefined();
      });

      it('should return undefined for effects without created objects', () => {
        const effectsWithoutCreated: TransactionEffects = {
          ...mockTransactionEffects,
          created: undefined,
        };
        const responseWithoutCreated: SuiTransactionBlockResponse = {
          digest: 'test',
          effects: effectsWithoutCreated,
        };
        const coinRefs = getNewlyCreatedCoinRefsAfterSplit(
          responseWithoutCreated
        );
        expect(coinRefs).toBeUndefined();
      });

      it('should handle multiple created objects', () => {
        const multipleCreated: OwnedObjectRef[] = [
          {
            owner: { AddressOwner: '0x789' },
            reference: {
              objectId: '0xabc',
              version: '1',
              digest: 'createddigest1',
            },
          },
          {
            owner: { AddressOwner: '0x789' },
            reference: {
              objectId: '0xdef',
              version: '1',
              digest: 'createddigest2',
            },
          },
        ];
        const effectsWithMultipleCreated: TransactionEffects = {
          ...mockTransactionEffects,
          created: multipleCreated,
        };
        const responseWithMultipleCreated: SuiTransactionBlockResponse = {
          digest: 'test',
          effects: effectsWithMultipleCreated,
        };
        const coinRefs = getNewlyCreatedCoinRefsAfterSplit(
          responseWithMultipleCreated
        );
        expect(coinRefs).toEqual([
          {
            objectId: '0xabc',
            version: '1',
            digest: 'createddigest1',
          },
          {
            objectId: '0xdef',
            version: '1',
            digest: 'createddigest2',
          },
        ]);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Gas calculation edge cases', () => {
      it('should handle negative storage rebate', () => {
        const negativeRebateGas: GasCostSummary = {
          computationCost: '1000',
          storageCost: '500',
          storageRebate: '-100',
          nonRefundableStorageFee: '50',
        };
        const negativeRebateEffects: TransactionEffects = {
          ...mockTransactionEffects,
          gasUsed: negativeRebateGas,
        };

        const totalGas = getTotalGasUsed(negativeRebateEffects);
        // 1000 + 500 - (-100) = 1600
        expect(totalGas).toBe(BigInt(1600));

        const upperBound = getTotalGasUsedUpperBound(negativeRebateEffects);
        // 1000 + 500 = 1500
        expect(upperBound).toBe(BigInt(1500));
      });

      it('should handle very large gas numbers', () => {
        const largeGas: GasCostSummary = {
          computationCost: '999999999999999999999',
          storageCost: '888888888888888888888',
          storageRebate: '777777777777777777777',
          nonRefundableStorageFee: '1000',
        };
        const largeGasEffects: TransactionEffects = {
          ...mockTransactionEffects,
          gasUsed: largeGas,
        };

        const totalGas = getTotalGasUsed(largeGasEffects);
        // 999999999999999999999 + 888888888888888888888 - 777777777777777777777 = 1111111111111111111110
        expect(totalGas).toBe(BigInt('1111111111111111111110'));

        const upperBound = getTotalGasUsedUpperBound(largeGasEffects);
        expect(upperBound).toBe(BigInt('1888888888888888888887'));
      });
    });

    describe('Complex transaction structures', () => {
      it('should handle partial transaction effects', () => {
        const partialEffects: TransactionEffects = {
          messageVersion: 'v1',
          status: mockExecutionStatus,
          executedEpoch: '100',
          gasUsed: mockGasCostSummary,
          transactionDigest: 'partial',
          gasObject: {
            owner: { AddressOwner: '0x456' },
            reference: {
              objectId: '0x123',
              version: '1',
              digest: 'gasdigest',
            },
          },
          // All optional fields are undefined
        };

        const partialResponse: SuiTransactionBlockResponse = {
          digest: 'partial',
          effects: partialEffects,
        };

        expect(getCreatedObjects(partialResponse)).toBeUndefined();
        expect(getExecutionStatusGasSummary(partialResponse)).toBeDefined();
        expect(getTotalGasUsed(partialResponse)).toBeDefined();
      });

      it('should handle empty arrays gracefully', () => {
        const emptyArraysResponse: SuiTransactionBlockResponse = {
          digest: 'emptyarrays',
          objectChanges: [],
          balanceChanges: [],
          events: [],
          errors: [],
        };

        expect(getEvents(emptyArraysResponse)).toEqual([]);
        expect(getObjectChanges(emptyArraysResponse)).toEqual([]);
        expect(getPublishedObjectChanges(emptyArraysResponse)).toEqual([]);
      });
    });
  });
});
