import { config } from '../global/config';
import {
  SupportedRpcVersion,
  SupportedTransactionVersion,
  UDC,
  ZERO,
} from '../global/constants';
import {
  ETransactionVersion,
  ETransactionVersion3,
  ResourceBounds,
} from '../provider/types/spec.type';
import { Signer, SignerInterface } from '../signer';
import {
  AllowArray,
  CairoVersion,
  Call,
  DeclareContractPayload,
  DeclareContractTransaction,
  DeployAccountContractPayload,
  DeployAccountContractTransaction,
  InvocationsSignerDetails,
  Signature,
  TransactionType,
  TypedData,
  UniversalDeployerContractPayload,
  UniversalDetails,
} from '../types';
import { CallData } from '../utils/calldata';
import { extractContractHashes, isSierra } from '../utils/contract';
import { calculateContractAddressFromHash } from '../utils/hash';
import {  toCairoBool, toHex } from '../utils/num';
import { parseContract } from '../utils/provider';
import {
  signatureToDecimalArray, signatureToHexArray,
  v3Details,
} from '../utils/stark';
import { buildUDCCall, getExecuteCalldata } from '../utils/transaction';
import { isString, isUndefined } from '../utils/typed';
import { getMessageHash } from '../utils/typedData';
import { AccountInterface } from './interface';


const v3DetailsOutput = (transactionsDetail: UniversalDetails, includeaccountDeploymentData: boolean = true) => {
  const {
    tip: tip,
    paymasterData: paymaster_data,
    accountDeploymentData: account_deployment_data,
    nonceDataAvailabilityMode: nonce_data_availability_mode,
    feeDataAvailabilityMode: fee_data_availability_mode,
    resourceBounds: resource_bounds,
  } = v3Details(transactionsDetail, SupportedRpcVersion.v0_8_1)

  let outputs: any = {
    resource_bounds: {
      "L1_GAS": resource_bounds.l1_gas,
      "L1_DATA_GAS": resource_bounds.l1_data_gas,
      "L2_GAS": resource_bounds.l2_gas,
    },
    tip: toHex(tip),
    paymaster_data,
    nonce_data_availability_mode: fee_data_availability_mode == 'L1' ? 0 : 1,
    fee_data_availability_mode: nonce_data_availability_mode == 'L1' ? 0 : 1,
  }
  if (includeaccountDeploymentData) {
    outputs.account_deployment_data = account_deployment_data
  }
  return outputs
}


export class Account implements AccountInterface {
  public signer: SignerInterface;

  public address: string;

  public cairoVersion: CairoVersion;

  readonly transactionVersion: typeof ETransactionVersion.V2 | typeof ETransactionVersion.V3;

  constructor(
      address: string,
      pkOrSigner: Uint8Array | string | SignerInterface,
      cairoVersion?: CairoVersion,
      transactionVersion: SupportedTransactionVersion = config.get('transactionVersion')
  ) {
    this.address = address.toLowerCase();
    this.signer =
        isString(pkOrSigner) || pkOrSigner instanceof Uint8Array
            ? new Signer(pkOrSigner)
            : pkOrSigner;

    if (cairoVersion) {
      this.cairoVersion = cairoVersion.toString() as CairoVersion;
    }
    this.transactionVersion = transactionVersion;
  }

  /**
   * Retrieves the Cairo version from the network and sets `cairoVersion` if not already set in the constructor.
   * @param classHash if provided detects Cairo version from classHash, otherwise from the account address
   */
  public async getCairoVersion() {
    return this.cairoVersion;
  }


  public async execute(
      transactions: AllowArray<Call>,
      transactionsDetail: UniversalDetails = {},
  ) {
    const calls = Array.isArray(transactions) ? transactions : [transactions];
    if (transactionsDetail.nonce === undefined || transactionsDetail.chainId === undefined) {
      throw new Error('missing transaction parameter');
    }
    const version = ETransactionVersion.V3
    const signerDetails: InvocationsSignerDetails = {
      ...v3Details(transactionsDetail, SupportedRpcVersion.v0_8_1),
      walletAddress: this.address,
      nonce: transactionsDetail.nonce,
      chainId: transactionsDetail.chainId,
      cairoVersion: await this.getCairoVersion(),
      version,
    };

    const signature = await this.signer.signTransaction(calls, signerDetails);

    const calldata = getExecuteCalldata(calls, await this.getCairoVersion());

    return {
      txId: signature.hash,
      signature: {
        type: TransactionType.INVOKE,
        sender_address: this.address,
        calldata: signatureToHexArray(CallData.compile(calldata)),
        signature: signatureToHexArray(signature.signature),
        nonce: toHex(transactionsDetail.nonce),
        ...v3DetailsOutput(transactionsDetail),
        version,
      },
    }
  }


  public async declare(
      payload: DeclareContractPayload,
      details: UniversalDetails = {}
  ) {
    const declareContractPayload = extractContractHashes(payload);
    const {version: providedVersion} = details;
    if (details.nonce === undefined || details.chainId === undefined) {
      throw new Error('missing transaction parameter');
    }

    const version = ETransactionVersion.V3

    const declareDetails: InvocationsSignerDetails = {
      ...v3Details(details, SupportedRpcVersion.v0_8_1),
      nonce: details.nonce,
      version,
      chainId: details.chainId,
      walletAddress: this.address,
      cairoVersion: undefined,
    };

    const {compiledClassHash, contract, signature} = await this.buildDeclarePayload(
        declareContractPayload,
        declareDetails
    );

    return {
      type: TransactionType.DECLARE,
      sender_address: this.address,
      compiled_class_hash: compiledClassHash,
      contract_class: contract,
      nonce: toHex(details.nonce),
      signature: signatureToDecimalArray(signature),
      ...v3DetailsOutput(details),
      version,
    }
  }

  public async deploy(
      payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[],
      details: UniversalDetails = {}
  ) {
    const {calls} = buildUDCCall(payload, this.address);
    return await this.execute(calls, details);
  };

  public async deployAccount(
      {
        classHash,
        constructorCalldata = [],
        addressSalt = 0,
        contractAddress: providedContractAddress,
      }: DeployAccountContractPayload,
      details: UniversalDetails = {}
  ) {
    const version = ETransactionVersion.V3

    const nonce = ZERO; // DEPLOY_ACCOUNT transaction will have a nonce zero as it is the first transaction in the account
    if (details.chainId === undefined) {
      throw new Error('missing transaction parameter');
    }

    const compiledCalldata = CallData.compile(constructorCalldata);
    const contractAddress =
        providedContractAddress ??
        calculateContractAddressFromHash(addressSalt, classHash, compiledCalldata, 0);


    const sig = await this.signer.signDeployAccountTransaction({
      ...v3Details(details, SupportedRpcVersion.v0_8_1),
      classHash,
      constructorCalldata: compiledCalldata,
      contractAddress,
      addressSalt,
      chainId: details.chainId,
      version,
      nonce,
    });
    return {
      txId: sig.hash,
      signature: {
        type: TransactionType.DEPLOY_ACCOUNT,
        version,
        signature: signatureToHexArray(sig.signature),
        nonce: toHex(nonce),
        contract_address_salt: addressSalt,
        constructor_calldata: signatureToHexArray(compiledCalldata),
        class_hash: toHex(classHash),
        ...v3DetailsOutput(details, false),
      }
    }

  }

  public async signMessage(typedData: TypedData): Promise<Signature> {
    return this.signer.signMessage(typedData, this.address);
  }

  public async hashMessage(typedData: TypedData): Promise<string> {
    return getMessageHash(typedData, this.address);
  }

  public async buildDeclarePayload(
      payload: DeclareContractPayload,
      details: InvocationsSignerDetails
  ): Promise<DeclareContractTransaction> {
    const {classHash, contract, compiledClassHash} = extractContractHashes(payload);
    const compressedCompiledContract = parseContract(contract);

    if (
        isUndefined(compiledClassHash) &&
        (details.version === ETransactionVersion3.F3 || details.version === ETransactionVersion3.V3)
    ) {
      throw Error('V3 Transaction work with Cairo1 Contracts and require compiledClassHash');
    }

    const signature = !details.skipValidate
        ? await this.signer.signDeclareTransaction({
          ...details,
          ...v3Details(details, SupportedRpcVersion.v0_8_1),
          classHash,
          compiledClassHash: compiledClassHash as string, // TODO: TS, cast because optional for v2 and required for v3, thrown if not present
          senderAddress: details.walletAddress,
        })
        : [];

    return {
      senderAddress: details.walletAddress,
      signature,
      contract: compressedCompiledContract,
      compiledClassHash,
    };
  }

  public async buildAccountDeployPayload(
      {
        classHash,
        addressSalt = 0,
        constructorCalldata = [],
        contractAddress: providedContractAddress,
      }: DeployAccountContractPayload,
      details: InvocationsSignerDetails
  ): Promise<DeployAccountContractTransaction> {
    const compiledCalldata = CallData.compile(constructorCalldata);
    const contractAddress =
        providedContractAddress ??
        calculateContractAddressFromHash(addressSalt, classHash, compiledCalldata, 0);

    const signature = !details.skipValidate
        ? await this.signer.signDeployAccountTransaction({
          ...details,
          ...v3Details(details, SupportedRpcVersion.v0_8_1),
          classHash,
          contractAddress,
          addressSalt,
          constructorCalldata: compiledCalldata,
        })
        : [];

    return {
      ...v3Details(details, SupportedRpcVersion.v0_8_1),
      classHash,
      addressSalt,
      constructorCalldata: compiledCalldata,
      signature,
    };
  }

  public buildUDCContractPayload(
      payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[]
  ): Call[] {
    const calls = [].concat(payload as []).map((it) => {
      const {
        classHash,
        salt = '0',
        unique = true,
        constructorCalldata = [],
      } = it as UniversalDeployerContractPayload;
      const compiledConstructorCallData = CallData.compile(constructorCalldata);

      return {
        contractAddress: UDC.ADDRESS,
        entrypoint: UDC.ENTRYPOINT,
        calldata: [
          classHash,
          salt,
          toCairoBool(unique),
          compiledConstructorCallData.length,
          ...compiledConstructorCallData,
        ],
      };
    });
    return calls;
  }
}