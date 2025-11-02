// this file aims to unify the RPC specification types used by the common Provider class

import * as RPCSPEC08 from '../../types/starknet-types-08'
export * as RPCSPEC08 from '../../types/starknet-types-08'
import { SimpleOneOf } from '../../types/helpers';

// taken from type-fest
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

// taken from type-fest
export type RequiredKeysOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? K : never;
  }[keyof T],
  undefined
>;

type ArrayElement<T> = T extends Array<infer U> ? U : never;

type MergeProperties<T1 extends Record<any, any>, T2 extends Record<any, any>> = {
  [K in RequiredKeysOf<T1> & RequiredKeysOf<T2>]: Merge<T1[K], T2[K]>;
} & {
  [K in keyof T1 & keyof T2]?: Merge<T1[K], T2[K]>;
} & {
  [K in Exclude<keyof T1, keyof T2>]?: T1[K];
} & {
  [K in Exclude<keyof T2, keyof T1>]?: T2[K];
};

/**
 *  type a = { w: bigint[]; x: bigint; y: string };
 type b = { w: number[]; x: number; z: string };
 type c = Merge<a, b>; // { w: (bigint | number)[] x: bigint | number; y?: string; z?: string; }

 NOTE: handling for ambiguous overlaps, such as a shared property being an array or object,
 is simplified to resolve to only one type since there shouldn't be such occurrences in the
 currently supported RPC specifications
 */
type Merge<T1, T2> = Simplify<
  T1 extends Array<any>
    ? T2 extends Array<any>
      ? Array<Merge<ArrayElement<T1>, ArrayElement<T2>>>
      : T1
    : T2 extends Array<any>
      ? T2
      : T1 extends object
        ? T2 extends object
          ? MergeProperties<T1, T2>
          : T1
        : T2 extends object
          ? T2
          : T1 | T2
>;

// Default exports for both RPCs
export type ETransactionVersion = RPCSPEC08.ETransactionVersion;
export const { ETransactionVersion } = RPCSPEC08;

export type ETransactionVersion2 = RPCSPEC08.ETransactionVersion2;
export const { ETransactionVersion2 } = RPCSPEC08;

export type ETransactionVersion3 = RPCSPEC08.ETransactionVersion3;
export const { ETransactionVersion3 } = RPCSPEC08;

// MERGES
export type BLOCK_HASH = RPCSPEC08.BLOCK_HASH;
export type BLOCK_NUMBER = RPCSPEC08.BLOCK_NUMBER;
export type FELT = RPCSPEC08.FELT;
export type TXN_HASH = RPCSPEC08.TXN_HASH;

export type PRICE_UNIT = RPCSPEC08.PRICE_UNIT;
export type RESOURCE_PRICE = RPCSPEC08.RESOURCE_PRICE;
export type SIMULATION_FLAG = RPCSPEC08.SIMULATION_FLAG;

export type STATE_UPDATE = RPCSPEC08.STATE_UPDATE;
export type PENDING_STATE_UPDATE = RPCSPEC08.PENDING_STATE_UPDATE;

// TODO: Can we remove all of this ?
/* export type INVOKE_TXN_RECEIPT = IsInBlock<RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'INVOKE'>>;
export type DECLARE_TXN_RECEIPT = IsInBlock<RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'DECLARE'>>;
export type DEPLOY_ACCOUNT_TXN_RECEIPT = IsInBlock<
  RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'DEPLOY_ACCOUNT'>
>;
export type L1_HANDLER_TXN_RECEIPT = IsInBlock<RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'L1_HANDLER'>>; */

export type PENDING_INVOKE_TXN_RECEIPT = RPCSPEC08.IsPending<
  RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'INVOKE'>
>;
export type PENDING_DECLARE_TXN_RECEIPT = RPCSPEC08.IsPending<
  RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'DECLARE'>
>;
export type PENDING_DEPLOY_ACCOUNT_TXN_RECEIPT = RPCSPEC08.IsPending<
  RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'DEPLOY_ACCOUNT'>
>;
export type PENDING_L1_HANDLER_TXN_RECEIPT = RPCSPEC08.IsPending<
  RPCSPEC08.IsType<RPCSPEC08.TransactionReceipt, 'L1_HANDLER'>
>;
//

export type BlockWithTxHashes = RPCSPEC08.BlockWithTxHashes;
export type ContractClassPayload = RPCSPEC08.ContractClass;
export type DeclaredTransaction = RPCSPEC08.DeclaredTransaction;
export type InvokedTransaction = RPCSPEC08.InvokedTransaction;
export type DeployedAccountTransaction = RPCSPEC08.DeployedAccountTransaction;

export type L1Message = RPCSPEC08.L1Message;
export type EventFilter = RPCSPEC08.EventFilter;
export type L1_HANDLER_TXN = RPCSPEC08.L1_HANDLER_TXN;
export type EDataAvailabilityMode = RPCSPEC08.EDataAvailabilityMode;
export const { EDataAvailabilityMode } = RPCSPEC08;
export type EDAMode = RPCSPEC08.EDAMode;
export const { EDAMode } = RPCSPEC08;
export type EmittedEvent = RPCSPEC08.EmittedEvent;
export type Event = RPCSPEC08.Event;

export type PendingReceipt = RPCSPEC08.TransactionReceiptPendingBlock;
export type Receipt = RPCSPEC08.TransactionReceiptProductionBlock;

// One of
export type FeeEstimate = RPCSPEC08.FEE_ESTIMATE;

export function isRPC08_FeeEstimate(entry: FeeEstimate): entry is RPCSPEC08.FEE_ESTIMATE {
  return 'l1_data_gas_consumed' in entry;
}

// One of
export type ResourceBounds = RPCSPEC08.ResourceBounds;

export function isRPC08_ResourceBounds(entry: ResourceBounds): entry is RPCSPEC08.ResourceBounds {
  return 'l1_data_gas' in entry;
}

/**
 * overhead percentage on estimate fee
 */
export type ResourceBoundsOverhead = ResourceBoundsOverheadRPC08 | ResourceBoundsOverheadRPC07;

/**
 * percentage overhead on estimated fee
 */
export type ResourceBoundsOverheadRPC08 = {
  l1_gas: {
    max_amount: number;
    max_price_per_unit: number;
  };
  l2_gas: {
    max_amount: number;
    max_price_per_unit: number;
  };
  l1_data_gas: {
    max_amount: number;
    max_price_per_unit: number;
  };
};

export type ResourceBoundsOverheadRPC07 = {
  l1_gas: {
    max_amount: number;
    max_price_per_unit: number;
  };
};

// TODO: ja mislin da types-js rpc 0.7 ima krivu definiciju za transaction trace
export type SimulateTransaction = RPCSPEC08.SimulateTransaction;

export type TransactionWithHash = RPCSPEC08.TransactionWithHash;

export type TransactionReceipt = RPCSPEC08.TransactionReceipt;
export type Methods = RPCSPEC08.Methods;
export type TXN_STATUS = RPCSPEC08.TXN_STATUS;
export type TXN_EXECUTION_STATUS = RPCSPEC08.TXN_EXECUTION_STATUS;
export type TransactionStatus = RPCSPEC08.TransactionStatus;
export type ETransactionStatus = RPCSPEC08.ETransactionStatus;
export const { ETransactionStatus } = RPCSPEC08;
export type ETransactionExecutionStatus = RPCSPEC08.ETransactionExecutionStatus;
export const { ETransactionExecutionStatus } = RPCSPEC08;
export type TRANSACTION_TRACE = RPCSPEC08.TRANSACTION_TRACE;
export type FEE_ESTIMATE = RPCSPEC08.FEE_ESTIMATE;
export type EVENTS_CHUNK = RPCSPEC08.EVENTS_CHUNK;
