import { SignerInterface } from '../signer';
import {
  AllowArray,
  BlockIdentifier,
  CairoVersion,
  Call,
  DeclareAndDeployContractPayload,
  DeclareContractPayload,
  DeclareContractResponse,
  DeclareDeployUDCResponse,
  DeployAccountContractPayload,
  DeployContractResponse,
  DeployContractUDCResponse,
  EstimateFee,
  EstimateFeeAction,
  EstimateFeeDetails,
  EstimateFeeResponse,
  EstimateFeeResponseBulk,
  Invocations,
  InvocationsDetails,
  InvokeFunctionResponse,
  MultiDeployContractResponse,
  Nonce,
  Signature,
  SimulateTransactionDetails,
  SimulateTransactionResponse,
  TypedData,
  UniversalDeployerContractPayload,
} from '../types';

export abstract class AccountInterface {
  public abstract address: string;

  public abstract signer: SignerInterface;

  public abstract cairoVersion: CairoVersion;


  /**
   * Invoke execute function in account contract
   *
   * @param transactions the invocation object or an array of them, containing:
   * - contractAddress - the address of the contract
   * - entrypoint - the entrypoint of the contract
   * - calldata - (defaults to []) the calldata
   * - signature - (defaults to []) the signature
   * @param {InvocationsDetails} transactionsDetail Additional optional parameters for the transaction
   *
   * @returns response from addTransaction
   */
  public abstract execute(
    transactions: AllowArray<Call>,
    transactionsDetail?: InvocationsDetails
  ): Promise<any>;

  /**
   * Declares a given compiled contract (json) to starknet
   *
   * @param contractPayload transaction payload to be deployed containing:
   * - contract: compiled contract code
   * - (optional) classHash: computed class hash of compiled contract. Pre-compute it for faster execution.
   * - (required for Cairo1 without compiledClassHash) casm: CompiledContract | string;
   * - (optional for Cairo1 with casm) compiledClassHash: compiled class hash from casm. Pre-compute it for faster execution.
   * @param transactionsDetail - InvocationsDetails
   *
   * @returns a confirmation of sending a transaction on the starknet contract
   */
  public abstract declare(
    contractPayload: DeclareContractPayload,
    transactionsDetail?: InvocationsDetails
  ): Promise<any>;

  /**
   * Deploys a declared contract to starknet - using Universal Deployer Contract (UDC)
   * support multicall
   *
   * @param payload -
   * - classHash: computed class hash of compiled contract
   * - [constructorCalldata] contract constructor calldata
   * - [salt=pseudorandom] deploy address salt
   * - [unique=true] ensure unique salt
   * @param details - InvocationsDetails
   *
   * @returns
   * - contract_address[]
   * - transaction_hash
   */
  public abstract deploy(
    payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[],
    details?: InvocationsDetails
  ): Promise<any>;

  /**
   * Signs a TypedData object for off-chain usage with the Starknet private key and returns the signature
   * This adds a message prefix so it can't be interchanged with transactions
   *
   * @param typedData - TypedData object to be signed
   * @returns the signature of the TypedData object
   * @throws {Error} if typedData is not a valid TypedData
   */
  public abstract signMessage(typedData: TypedData): Promise<any>;

  /**
   * Hash a TypedData object with Pedersen hash and return the hash
   * This adds a message prefix so it can't be interchanged with transactions
   *
   * @param typedData - TypedData object to be hashed
   * @returns the hash of the TypedData object
   * @throws {Error} if typedData is not a valid TypedData
   */
  public abstract hashMessage(typedData: TypedData): Promise<string>;

}
