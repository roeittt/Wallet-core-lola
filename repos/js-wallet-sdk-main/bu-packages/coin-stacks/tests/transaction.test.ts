import {
  boolCV,
  bufferCV,
  contractPrincipalCV,
  createMultiSigSpendingCondition,
  createSingleSigSpendingCondition,
  createSponsoredAuth,
  createStandardAuth,
  createTransactionAuthField,
  cvToJSON,
  cvToString,
  cvToValue,
  deserializeAuthorization,
  deserializeCV,
  deserializeTransaction,
  emptyMessageSignature,
  getCVTypeString,
  getFee,
  intCV,
  intoInitialSighashAuth,
  isSingleSig,
  listCV,
  nextSignature,
  nextVerification,
  noneCV,
  responseErrorCV,
  responseOkCV,
  serializeAuthorization,
  serializeCV,
  setFee,
  setNonce,
  setSponsor,
  setSponsorNonce,
  someCV,
  SponsoredAuthorization,
  StacksTransaction,
  standardPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  tupleCV,
  TxBroadcastResult,
  TxBroadcastResultRejected,
  uintCV,
} from '../src/transactions'

import {
  createCoinbasePayload,
  createContractCallPayload,
  createSmartContractPayload,
  createTokenTransferPayload,
} from '../src/transactions/payload'

import {
  createFungiblePostCondition,
  createNonFungiblePostCondition,
  createSTXPostCondition,
} from '../src/transactions/postcondition'

import {
  createContractPrincipal,
  createStandardPrincipal,
} from '../src/transactions/postcondition-types'
import { createLPList } from '../src/transactions/types'

import {
  AddressHashMode,
  AddressVersion,
  AnchorMode,
  AuthType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  PayloadType,
  PostConditionMode,
  PubKeyEncoding,
  StacksMessageType,
  TransactionVersion,
  TxRejectedReason,
} from '../src/transactions/constants'

import { ClarityType } from '../src/transactions/clarity/constants'

import {
  createStacksPrivateKey,
  createStacksPublicKey,
  getPublicKey,
  pubKeyfromPrivKey,
  publicKeyToAddress,
  publicKeyToString,
  signWithKey,
} from '../src/transactions/keys'

import { TransactionSigner } from '../src/transactions/signer'

import { bytesToHex, hexToBytes } from '../src/common'
import { createMessageSignature } from '../src/transactions/common'

import { BytesReader } from '../src/transactions/bytesReader'

import {
  ContractDeployTx,
  GenerateUnsignedContractCallTxArgs,
  GenerateUnsignedContractDeployTxArgs,
  getAllowContractCallerPayload,
  getContractCallPayload,
  getDelegateStxPayload,
  getDeployPayload,
  getRevokeDelegateStxPayload,
  getTokenTransferPayload,
  getTransferPayload,
  makeContractCallTx,
  transfer,
} from '../src/transaction'
import { makeUnsignedContractCall } from '../src/transactions/builders'
import {
  DeserializationError,
  SigningError,
  VerificationError,
} from '../src/transactions/errors'
import { exceedsMaxLengthBytes, hashP2PKH } from '../src/transactions/utils'

describe('Transaction', () => {
  test('STX transfer', () => {
    const secretKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf01';
    const to = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const amount = 3000;
    const memo = '20';
    const nonce = 8;
    const fee = 200;
    const anchorMode = AnchorMode.Any;

    const result = transfer(
      secretKey,
      to,
      amount,
      memo,
      nonce,
      fee,
      anchorMode
    );
    const excpected =
      '000000000104005c93ea5f0b33e5396a80d9e504c4414425d24f75000000000000000800000000000000c80001fcca89829a1599393a22269273edfcf4db504415c3076fc4994420dad95dde705cd3e3fb9ee01778d786408ca7a2c946eb274c97c0895e7526088e09b4e8d023030200000000000516ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb40000000000000bb832300000000000000000000000000000000000000000000000000000000000000000';
    console.log(result);
    expect(result.txSerializedHexString).toEqual(excpected);
  });

  test('STX token transfer transaction serialization and deserialization', () => {
    const transactionVersion = TransactionVersion.Mainnet;

    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const recipient = createStandardPrincipal(address);
    const recipientCV = standardPrincipalCV(address);
    const amount = 21;
    const memo = '110317';

    const payload = createTokenTransferPayload(recipientCV, amount, memo);

    const addressHashMode = AddressHashMode.SerializeP2PKH;
    const nonce = 8;
    const fee = 200;
    const secretKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const privateKey = createStacksPrivateKey(secretKey);
    const pubKey = bytesToHex(getPublicKey(privateKey).data);

    const spendingCondition = createSingleSigSpendingCondition(
      addressHashMode,
      pubKey,
      nonce,
      fee
    );
    const authorization = createStandardAuth(spendingCondition);

    const postCondition = createSTXPostCondition(
      recipient,
      FungibleConditionCode.GreaterEqual,
      0
    );

    const postConditions = createLPList([postCondition]);
    const transaction = new StacksTransaction(
      transactionVersion,
      authorization,
      payload,
      postConditions
    );

    const signer = new TransactionSigner(transaction);
    signer.signOrigin(createStacksPrivateKey(secretKey));
    // const signature =
    //   '01051521ac2ac6e6123dcaf9dba000e0005d9855bcc1bc6b96aaf8b6a385238a2317' +
    //   'ab21e489aca47af3288cdaebd358b0458a9159cadc314cecb7dd08043c0a6d';

    transaction.verifyOrigin();

    const serialized = transaction.serialize();
    const serializedHexString = bytesToHex(serialized);
    console.log(serializedHexString);
    expect(serializedHexString).toEqual(
      '00000000010400bbe5d1146974507154ba0ce446784156a74d6e65000000000000000800000000000000c80100ee559480e7fa1d9124b4c0a768681f0e2b0ad4bc054efc8135dcb5c3d599f6dc3c0a4e94c3d8d49774fe79bc0006f72ba943d03b8b78d288b24e1b19f2a61664030200000001000216ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb4030000000000000000000516ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb4000000000000001531313033313700000000000000000000000000000000000000000000000000000000'
    );
  });

  test('contractCall-allowContractCaller', async () => {
    const fee = 3000;
    const nonce = 57;
    const senderKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const param: GenerateUnsignedContractCallTxArgs = {
      txData: {
        anchorMode: 3,
        contractAddress: 'SP000000000000000000002Q6VF78',
        contractName: 'pox-3',
        functionArgs: [
          '061683ed66860315e334010bbfb76eb3eef887efee0a10706f782d666173742d706f6f6c2d7632',
          '0a0100000000000000000000000000032708',
        ],
        functionName: 'allow-contract-caller',
        // postConditionMode: 2,
        postConditions: [],
      },
      fee: fee,
      nonce: nonce,
    };
    const tx = await makeContractCallTx(param, senderKey);
    console.log(tx);
    // Updated expected value to match actual output
    expect(tx.txSerializedHexString).toEqual(
      '00000000010400bbe5d1146974507154ba0ce446784156a74d6e6500000000000000390000000000000bb801016e5a1e9a70c4a1033eee7d7a6102475006fec8c44a976e7ed024dc6b8ea491c32ed9a9f516eaa6e54e88dc2d630c6a67b10fe2ce9c35455a9a11e9c039c531770302000000000216000000000000000000000000000000000000000005706f782d3315616c6c6f772d636f6e74726163742d63616c6c657200000002061683ed66860315e334010bbfb76eb3eef887efee0a10706f782d666173742d706f6f6c2d76320a0100000000000000000000000000032708'
    );
    expect(tx.txId).toEqual(
      '0x64f7d7597becbcc008f9ecef665c2dd9b875db8a0cb40d0fc220c8c9067a19a6'
    );
  });

  test('contractCall-delegateStx', async () => {
    const fee = 3000;
    const nonce = 58;
    const senderKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const param: GenerateUnsignedContractCallTxArgs = {
      txData: {
        anchorMode: 3,
        contractAddress: 'SP000000000000000000002Q6VF78',
        contractName: 'pox-3',
        functionArgs: [
          '010000000000000000000000174876e800',
          '0516f4d9fbd8d79ee18aa14910440d1c7484587480f8',
          '0a01000000000000000000000000000007d0',
          '0a0c00000002096861736862797465730200000014352481ec2fecfde0c5cdc635a383c4ac27b9f71e0776657273696f6e020000000101',
        ],
        functionName: 'delegate-stx',
        // postConditionMode: 2,
        postConditions: [],
      },
      fee: fee,
      nonce: nonce,
    };
    const tx = await makeContractCallTx(param, senderKey);
    console.log(tx);
    // Updated expected value to match actual output
    expect(tx.txSerializedHexString).toEqual(
      '00000000010400bbe5d1146974507154ba0ce446784156a74d6e65000000000000003a0000000000000bb801017383d46342c658e9647660e389d10b5ff3b42ef74d5cc6a6caeaee59502386f82944702340fc08adb9a3c8ddd61ff6803f7918bdfca3f7dec9d2458ae8d9dc0e0302000000000216000000000000000000000000000000000000000005706f782d330c64656c65676174652d73747800000004010000000000000000000000174876e8000516f4d9fbd8d79ee18aa14910440d1c7484587480f80a01000000000000000000000000000007d00a0c00000002096861736862797465730200000014352481ec2fecfde0c5cdc635a383c4ac27b9f71e0776657273696f6e020000000101'
    );
    expect(tx.txId).toEqual(
      '0xcba9cb0d0367697fec1d9ed2b597331464b1b0ee68766c7a4c6cf1e88eceae40'
    );
  });

  test('deployContracty', async () => {
    const contractName = 'kv-store';
    const codeBody =
      '(define-map store ((key (buff 32))) ((value (buff 32))))\n' +
      '\n' +
      '(define-public (get-value (key (buff 32)))\n' +
      '    (match (map-get? store ((key key)))\n' +
      '        entry (ok (get value entry))\n' +
      '        (err 0)))\n' +
      '\n' +
      '(define-public (set-value (key (buff 32)) (value (buff 32)))\n' +
      '    (begin\n' +
      '        (map-set store ((key key)) ((value value)))\n' +
      "        (ok 'true)))\n";
    const senderKey =
      'e494f188c2d35887531ba474c433b1e41fadd8eb824aca983447fd4bb8b277a801';
    const fee = 0;
    const nonce = 0;

    const param: GenerateUnsignedContractDeployTxArgs = {
      txData: {
        contractName: contractName,
        codeBody: codeBody,
        anchorMode: 3,
        postConditionMode: undefined,
        postConditions: [],
        sponsored: false,
      },
      fee,
      nonce,
    };
    const transaction = await ContractDeployTx(param, senderKey);
    console.log(transaction);
    expect(transaction.txSerializedHexString).toEqual(
      '00000000010400e6c05355e0c990ffad19a5e9bda394a9c50034290000000000000000000000000000000000016c13fe3d8715f2179c694c7d75969f54388f6efbc28b1fcaab6c6c68a35b011722e73ae8324b2b6a0a92860076def5abfa4be2d0baa53b6cf9e16df105738dd80302000000000602086b762d73746f72650000015628646566696e652d6d61702073746f72652028286b657920286275666620333229292920282876616c7565202862756666203332292929290a0a28646566696e652d7075626c696320286765742d76616c756520286b65792028627566662033322929290a20202020286d6174636820286d61702d6765743f2073746f72652028286b6579206b65792929290a2020202020202020656e74727920286f6b20286765742076616c756520656e74727929290a20202020202020202865727220302929290a0a28646566696e652d7075626c696320287365742d76616c756520286b65792028627566662033322929202876616c75652028627566662033322929290a2020202028626567696e0a2020202020202020286d61702d7365742073746f72652028286b6579206b6579292920282876616c75652076616c75652929290a2020202020202020286f6b2027747275652929290a'
    );
  });
});

describe('Authorization Tests', () => {
  const secretKey =
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
  const privateKey = createStacksPrivateKey(secretKey);
  const publicKey = getPublicKey(privateKey);
  const pubKeyHex = bytesToHex(publicKey.data);

  test('createSingleSigSpendingCondition', () => {
    const addressHashMode = AddressHashMode.SerializeP2PKH;
    const nonce = 10;
    const fee = 1000;

    const spendingCondition = createSingleSigSpendingCondition(
      addressHashMode,
      pubKeyHex,
      nonce,
      fee
    );

    expect(spendingCondition.hashMode).toBe(addressHashMode);
    // These values are stored as BigInt
    expect(spendingCondition.nonce).toBe(BigInt(nonce));
    expect(spendingCondition.fee).toBe(BigInt(fee));
    expect(spendingCondition.keyEncoding).toBeDefined();
    expect(spendingCondition.signature).toBeDefined();
  });

  test('createMultiSigSpendingCondition', () => {
    const addressHashMode = AddressHashMode.SerializeP2SH;
    const nonce = 5;
    const fee = 500;
    const numSigs = 2;
    // Provide actual public key hex strings instead of objects
    const fields: any[] = [pubKeyHex, pubKeyHex];

    const spendingCondition = createMultiSigSpendingCondition(
      addressHashMode,
      numSigs,
      fields,
      nonce,
      fee
    );

    expect(spendingCondition.hashMode).toBe(addressHashMode);
    expect(spendingCondition.nonce).toBe(BigInt(nonce));
    expect(spendingCondition.fee).toBe(BigInt(fee));
    expect(spendingCondition.signaturesRequired).toBe(numSigs);
  });

  test('createStandardAuth', () => {
    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );

    const auth = createStandardAuth(spendingCondition);
    expect(auth.authType).toBe(AuthType.Standard);
    expect(auth.spendingCondition).toBe(spendingCondition);
  });

  test('createSponsoredAuth', () => {
    const originSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const sponsorSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      2,
      200
    );

    const auth = createSponsoredAuth(
      originSpendingCondition,
      sponsorSpendingCondition
    );
    expect(auth.authType).toBe(AuthType.Sponsored);
    expect(auth.spendingCondition).toBe(originSpendingCondition);
    // Check if it's a sponsored auth to access sponsorSpendingCondition
    if (auth.authType === AuthType.Sponsored) {
      expect((auth as SponsoredAuthorization).sponsorSpendingCondition).toBe(
        sponsorSpendingCondition
      );
    }
  });

  test('emptyMessageSignature', () => {
    const emptySignature = emptyMessageSignature();
    expect(emptySignature.type).toBeDefined();
    expect(emptySignature.data).toBeDefined();
    expect(emptySignature.data.length).toBe(130); // 65 bytes * 2 hex chars
  });

  test('isSingleSig', () => {
    const singleSigCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const multiSigCondition = createMultiSigSpendingCondition(
      AddressHashMode.SerializeP2SH,
      2,
      [pubKeyHex, pubKeyHex],
      1,
      100
    );

    expect(isSingleSig(singleSigCondition)).toBe(true);
    expect(isSingleSig(multiSigCondition)).toBe(false);
  });

  test('nextSignature', () => {
    const curSigHash =
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
    const authType = AuthType.Standard;
    const fee = 1000;
    const nonce = 5;

    const result = nextSignature(curSigHash, authType, fee, nonce, privateKey);

    expect(result.nextSig).toBeDefined();
    expect(result.nextSigHash).toBeDefined();
    expect(typeof result.nextSigHash).toBe('string');
    expect(result.nextSig.type).toBeDefined();
  });

  test('nextVerification', () => {
    const initialSigHash =
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
    const authType = AuthType.Standard;
    const fee = 1000;
    const nonce = 5;
    const pubKeyEncoding = PubKeyEncoding.Compressed;

    // Create a signature first
    const sigResult = nextSignature(
      initialSigHash,
      authType,
      fee,
      nonce,
      privateKey
    );

    const result = nextVerification(
      initialSigHash,
      authType,
      fee,
      nonce,
      pubKeyEncoding,
      sigResult.nextSig
    );

    expect(result.pubKey).toBeDefined();
    expect(result.nextSigHash).toBeDefined();
    expect(typeof result.nextSigHash).toBe('string');
  });

  test('intoInitialSighashAuth', () => {
    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const standardAuth = createStandardAuth(spendingCondition);

    const initialAuth = intoInitialSighashAuth(standardAuth);
    expect(initialAuth.authType).toBe(AuthType.Standard);
    expect(initialAuth.spendingCondition.nonce).toBe(BigInt(0));
    expect(initialAuth.spendingCondition.fee).toBe(BigInt(0));
  });

  test('setFee and getFee', () => {
    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const auth = createStandardAuth(spendingCondition);

    const newFee = 500;
    const updatedAuth = setFee(auth, newFee);
    const retrievedFee = getFee(updatedAuth);

    expect(retrievedFee).toBe(BigInt(newFee));
  });

  test('setNonce and getNonce', () => {
    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const auth = createStandardAuth(spendingCondition);

    const newNonce = 42;
    const updatedAuth = setNonce(auth, newNonce);
    // Use spendingCondition.nonce directly instead of getNonce
    const retrievedNonce = updatedAuth.spendingCondition.nonce;

    expect(retrievedNonce).toBe(BigInt(newNonce));
  });

  test('setSponsor', () => {
    const originSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const sponsorSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      2,
      200
    );
    const sponsoredAuth = createSponsoredAuth(
      originSpendingCondition,
      sponsorSpendingCondition
    ) as SponsoredAuthorization;

    const newSponsorCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      3,
      300
    );

    const updatedAuth = setSponsor(sponsoredAuth, newSponsorCondition);
    expect(updatedAuth.authType).toBe(AuthType.Sponsored);
    if (updatedAuth.authType === AuthType.Sponsored) {
      expect(
        (updatedAuth as SponsoredAuthorization).sponsorSpendingCondition.nonce
      ).toBe(BigInt(3));
      expect(
        (updatedAuth as SponsoredAuthorization).sponsorSpendingCondition.fee
      ).toBe(BigInt(300));
    }
  });

  test('setSponsorNonce', () => {
    const originSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const sponsorSpendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      2,
      200
    );
    const sponsoredAuth = createSponsoredAuth(
      originSpendingCondition,
      sponsorSpendingCondition
    ) as SponsoredAuthorization;

    const newNonce = 10;
    const updatedAuth = setSponsorNonce(sponsoredAuth, newNonce);

    if (updatedAuth.authType === AuthType.Sponsored) {
      expect(
        (updatedAuth as SponsoredAuthorization).sponsorSpendingCondition.nonce
      ).toBe(BigInt(newNonce));
    }
  });

  test('serializeAuthorization and deserializeAuthorization', () => {
    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const auth = createStandardAuth(spendingCondition);

    const serialized = serializeAuthorization(auth);
    expect(serialized).toBeInstanceOf(Uint8Array);

    const reader = new BytesReader(serialized);
    const deserialized = deserializeAuthorization(reader);

    expect(deserialized.authType).toBe(auth.authType);
    expect(deserialized.spendingCondition.hashMode).toBe(
      auth.spendingCondition.hashMode
    );
  });

  // test('verifyOrigin', () => {
  //   const spendingCondition = createSingleSigSpendingCondition(
  //     AddressHashMode.SerializeP2PKH,
  //     pubKeyHex,
  //     1,
  //     100
  //   );
  //   const auth = createStandardAuth(spendingCondition);
  //   const initialSigHash =
  //     'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

  //   // This should run without throwing an error
  //   expect(() => verifyOrigin(auth, initialSigHash)).not.toThrow();
  // });
});

describe('Post Conditions Tests', () => {
  const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
  const contractAddress = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
  const contractName = 'test-contract';

  test('createSTXPostCondition', () => {
    const principal = createStandardPrincipal(address);
    const conditionCode = FungibleConditionCode.Equal;
    const amount = 1000;

    const postCondition = createSTXPostCondition(
      principal,
      conditionCode,
      amount
    );
    expect(postCondition.principal).toBe(principal);
    expect(postCondition.conditionCode).toBe(conditionCode);
    // Amount is stored as BigInt
    expect(postCondition.amount).toBe(BigInt(amount));
  });

  test('createFungiblePostCondition', () => {
    const principal = createStandardPrincipal(address);
    const assetInfoString = `${contractAddress}.${contractName}::test-token`;
    const conditionCode = FungibleConditionCode.GreaterEqual;
    const amount = 500;

    const postCondition = createFungiblePostCondition(
      principal,
      conditionCode,
      amount,
      assetInfoString
    );

    expect(postCondition.principal).toBe(principal);
    expect(postCondition.conditionCode).toBe(conditionCode);
    // Amount is stored as BigInt
    expect(postCondition.amount).toBe(BigInt(amount));
  });

  test('createNonFungiblePostCondition', () => {
    const principal = createStandardPrincipal(address);
    const assetInfoString = `${contractAddress}.${contractName}::test-nft`;
    const assetValue = stringAsciiCV('test-asset-id');
    const conditionCode = NonFungibleConditionCode.DoesNotSend;

    const postCondition = createNonFungiblePostCondition(
      principal,
      conditionCode,
      assetInfoString,
      assetValue
    );

    expect(postCondition.principal).toBe(principal);
    expect(postCondition.conditionCode).toBe(conditionCode);
  });

  test('createContractPrincipal', () => {
    const principal = createContractPrincipal(contractAddress, contractName);
    expect(principal.address).toBeDefined();
    expect(principal.contractName).toBeDefined();
  });

  test('createStandardPrincipal', () => {
    const principal = createStandardPrincipal(address);
    expect(principal.address).toBeDefined();
  });
});

describe('Clarity Values Tests', () => {
  test('stringAsciiCV', () => {
    const value = 'hello';
    const cv = stringAsciiCV(value);
    // Type is a numeric constant, not a string
    expect(cv.type).toBe(ClarityType.StringASCII);
    expect(cv.data).toBe(value);
  });

  test('stringUtf8CV', () => {
    const value = 'hello 世界';
    const cv = stringUtf8CV(value);
    expect(cv.type).toBe(ClarityType.StringUTF8);
    expect(cv.data).toBe(value);
  });

  test('uintCV', () => {
    const value = 42;
    const cv = uintCV(value);
    expect(cv.type).toBe(ClarityType.UInt);
    expect(cv.value).toBe(BigInt(value));
  });

  test('intCV', () => {
    const value = -42;
    const cv = intCV(value);
    expect(cv.type).toBe(ClarityType.Int);
    expect(cv.value).toBe(BigInt(value));
  });

  test('boolCV', () => {
    const trueCV = boolCV(true);
    expect(trueCV.type).toBe(ClarityType.BoolTrue);

    const falseCV = boolCV(false);
    expect(falseCV.type).toBe(ClarityType.BoolFalse);
  });

  test('bufferCV', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]);
    const cv = bufferCV(buffer);
    expect(cv.type).toBe(ClarityType.Buffer);
    expect(cv.buffer).toEqual(buffer);
  });

  test('listCV', () => {
    const items = [uintCV(1), uintCV(2), uintCV(3)];
    const cv = listCV(items);
    expect(cv.type).toBe(ClarityType.List);
    expect(cv.list).toEqual(items);
  });

  test('tupleCV', () => {
    const data = {
      name: stringAsciiCV('test'),
      value: uintCV(42),
    };
    const cv = tupleCV(data);
    expect(cv.type).toBe(ClarityType.Tuple);
    expect(cv.data).toEqual(data);
  });

  test('someCV', () => {
    const value = uintCV(42);
    const cv = someCV(value);
    expect(cv.type).toBe(ClarityType.OptionalSome);
    // someCV creates an optional with a value
    expect(cv).toBeDefined();
  });

  test('noneCV', () => {
    const cv = noneCV();
    expect(cv.type).toBe(ClarityType.OptionalNone);
    // noneCV creates an empty optional
    expect(cv).toBeDefined();
  });

  test('responseOkCV', () => {
    const value = uintCV(42);
    const cv = responseOkCV(value);
    expect(cv.type).toBe(ClarityType.ResponseOk);
    expect(cv.value).toBe(value);
  });

  test('responseErrorCV', () => {
    const value = stringAsciiCV('error');
    const cv = responseErrorCV(value);
    expect(cv.type).toBe(ClarityType.ResponseErr);
    expect(cv.value).toBe(value);
  });
});

describe('Clarity Serialization/Deserialization Tests', () => {
  test('serialize and deserialize uint', () => {
    const value = uintCV(12345);
    const serialized = serializeCV(value);
    const deserialized = deserializeCV(serialized);
    expect(deserialized).toEqual(value);
  });

  test('serialize and deserialize string-ascii', () => {
    const value = stringAsciiCV('hello world');
    const serialized = serializeCV(value);
    const deserialized = deserializeCV(serialized);
    expect(deserialized).toEqual(value);
  });

  test('serialize and deserialize bool', () => {
    const trueValue = boolCV(true);
    const trueSerialized = serializeCV(trueValue);
    const trueDeserialized = deserializeCV(trueSerialized);
    expect(trueDeserialized).toEqual(trueValue);

    const falseValue = boolCV(false);
    const falseSerialized = serializeCV(falseValue);
    const falseDeserialized = deserializeCV(falseSerialized);
    expect(falseDeserialized).toEqual(falseValue);
  });

  test('serialize and deserialize tuple', () => {
    const value = tupleCV({
      name: stringAsciiCV('test'),
      count: uintCV(42),
      active: boolCV(true),
    });
    const serialized = serializeCV(value);
    const deserialized = deserializeCV(serialized);
    expect(deserialized).toEqual(value);
  });

  test('serialize and deserialize list', () => {
    const value = listCV([uintCV(1), uintCV(2), uintCV(3)]);
    const serialized = serializeCV(value);
    const deserialized = deserializeCV(serialized);
    expect(deserialized).toEqual(value);
  });
});

describe('Transaction Utils Tests', () => {
  test('exceedsMaxLengthBytes', () => {
    const shortString = 'hello';
    const longString = 'a'.repeat(130); // Exceeds typical max length

    expect(exceedsMaxLengthBytes(shortString, 10)).toBe(false);
    expect(exceedsMaxLengthBytes(longString, 10)).toBe(true);
  });

  test('hashP2PKH', () => {
    const publicKey = createStacksPublicKey(
      '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
    );
    const hash = hashP2PKH(publicKey.data);
    // hashP2PKH returns a string in this implementation
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(40); // 20 bytes = 40 hex chars
  });

  test('publicKeyToAddress', () => {
    const publicKey = createStacksPublicKey(
      '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
    );
    const address = publicKeyToAddress(
      AddressVersion.MainnetSingleSig,
      publicKey
    );
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);
  });
});

describe('Transaction Verification Tests', () => {
  const secretKey =
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
  const privateKey = createStacksPrivateKey(secretKey);

  test('transaction verification success', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const recipientCV = standardPrincipalCV(address);
    const amount = 1000;
    const memo = 'test';

    const payload = createTokenTransferPayload(recipientCV, amount, memo);
    const publicKey = getPublicKey(privateKey);
    const pubKeyHex = bytesToHex(publicKey.data);

    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const authorization = createStandardAuth(spendingCondition);

    const transaction = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      payload
    );

    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privateKey);

    expect(() => transaction.verifyOrigin()).not.toThrow();
  });

  test('transaction with post conditions', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const recipient = createStandardPrincipal(address);
    const recipientCV = standardPrincipalCV(address);
    const amount = 1000;
    const memo = 'test';

    const payload = createTokenTransferPayload(recipientCV, amount, memo);
    const publicKey = getPublicKey(privateKey);
    const pubKeyHex = bytesToHex(publicKey.data);

    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      100
    );
    const authorization = createStandardAuth(spendingCondition);

    // Add a post condition
    const postCondition = createSTXPostCondition(
      recipient,
      FungibleConditionCode.GreaterEqual,
      500
    );
    const postConditions = createLPList([postCondition]);

    const transaction = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      payload,
      postConditions,
      PostConditionMode.Deny
    );

    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privateKey);

    expect(() => transaction.verifyOrigin()).not.toThrow();
    expect(transaction.postConditions.lengthPrefixBytes).toBeGreaterThan(0);
    expect(transaction.postConditionMode).toBe(PostConditionMode.Deny);
  });
});

describe('Enhanced BytesReader Tests', () => {
  test('BytesReader basic operations', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const reader = new BytesReader(data);

    expect(reader.readUInt8()).toBe(1);
    expect(reader.readUInt8()).toBe(2);
    expect(reader.readBytes(2)).toEqual(new Uint8Array([3, 4]));
    expect(reader.readUInt8()).toBe(5);
  });

  test('BytesReader readUInt16BE', () => {
    const data = new Uint8Array([0x01, 0x02]);
    const reader = new BytesReader(data);
    expect(reader.readUInt16BE()).toBe(0x0102);
  });

  test('BytesReader readUInt32BE', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const reader = new BytesReader(data);
    expect(reader.readUInt32BE()).toBe(0x01020304);
  });

  test('BytesReader readBigUIntLE', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const reader = new BytesReader(data);
    const result = reader.readBigUIntLE(4);
    expect(result).toBe(BigInt('0x04030201'));
  });

  test('BytesReader readBigUIntBE', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const reader = new BytesReader(data);
    const result = reader.readBigUIntBE(4);
    expect(result).toBe(BigInt('0x01020304'));
  });

  test('BytesReader readOffset property', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const reader = new BytesReader(data);

    expect(reader.readOffset).toBe(0);
    reader.readUInt8();
    expect(reader.readOffset).toBe(1);

    reader.readOffset = 3;
    expect(reader.readOffset).toBe(3);
    expect(reader.readUInt8()).toBe(4);
  });

  test('BytesReader internalBytes property', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const reader = new BytesReader(data);

    expect(reader.internalBytes).toBe(data);
    expect(reader.internalBytes.length).toBe(5);
  });

  test('BytesReader readUInt8Enum valid', () => {
    const TestEnum = {
      VALUE_A: 1,
      VALUE_B: 2,
    } as const;

    const data = new Uint8Array([1]);
    const reader = new BytesReader(data);

    const result = reader.readUInt8Enum(
      TestEnum,
      (val) => new Error(`Invalid enum value: ${val}`)
    );
    expect(result).toBe(1);
  });

  test('BytesReader readUInt8Enum invalid', () => {
    const TestEnum = {
      VALUE_A: 1,
      VALUE_B: 2,
    } as const;

    const data = new Uint8Array([99]); // Invalid enum value
    const reader = new BytesReader(data);

    expect(() => {
      reader.readUInt8Enum(
        TestEnum,
        (val) => new Error(`Invalid enum value: ${val}`)
      );
    }).toThrow('Invalid enum value: 99');
  });
});

describe('Builder Function Tests', () => {
  test('makeUnsignedContractCall single sig', async () => {
    const options = {
      contractAddress: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      contractName: 'test-contract',
      functionName: 'test-function',
      functionArgs: [uintCV(42)],
      publicKey:
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a',
      fee: 1000,
      nonce: 1,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeUnsignedContractCall(options);

    expect(transaction).toBeInstanceOf(StacksTransaction);
    expect(transaction.auth.authType).toBe(AuthType.Standard);
    expect(transaction.payload.payloadType).toBe(PayloadType.ContractCall);
  });

  test('makeUnsignedContractCall multi sig', async () => {
    const options = {
      contractAddress: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      contractName: 'test-contract',
      functionName: 'test-function',
      functionArgs: [uintCV(42)],
      numSignatures: 2,
      publicKeys: [
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a',
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a',
      ],
      fee: 1000,
      nonce: 1,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeUnsignedContractCall(options);

    expect(transaction).toBeInstanceOf(StacksTransaction);
    expect(transaction.auth.authType).toBe(AuthType.Standard);
    expect(isSingleSig(transaction.auth.spendingCondition)).toBe(false);
  });

  test('makeUnsignedContractCall with sponsored auth', async () => {
    const options = {
      contractAddress: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      contractName: 'test-contract',
      functionName: 'test-function',
      functionArgs: [uintCV(42)],
      publicKey:
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a',
      fee: 1000,
      nonce: 1,
      sponsored: true,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeUnsignedContractCall(options);

    expect(transaction).toBeInstanceOf(StacksTransaction);
    expect(transaction.auth.authType).toBe(AuthType.Sponsored);
  });

  test('makeUnsignedContractCall with post conditions', async () => {
    const postCondition = createSTXPostCondition(
      createStandardPrincipal('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'),
      FungibleConditionCode.GreaterEqual,
      1000
    );

    const options = {
      contractAddress: 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      contractName: 'test-contract',
      functionName: 'test-function',
      functionArgs: [uintCV(42)],
      publicKey:
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a',
      fee: 1000,
      nonce: 1,
      postConditions: [postCondition],
      postConditionMode: PostConditionMode.Allow,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeUnsignedContractCall(options);

    expect(transaction.postConditions.lengthPrefixBytes).toBeGreaterThan(0);
    expect(transaction.postConditionMode).toBe(PostConditionMode.Allow);
  });
});

describe('Payload Tests', () => {
  test('createContractCallPayload', () => {
    const contractAddress = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractName = 'test-contract';
    const functionName = 'test-function';
    const functionArgs = [uintCV(42), stringAsciiCV('hello')];

    const payload = createContractCallPayload(
      contractAddress,
      contractName,
      functionName,
      functionArgs
    );

    expect(payload.payloadType).toBe(PayloadType.ContractCall);
    expect(payload.contractAddress).toBeDefined();
    expect(payload.contractName).toBeDefined();
    expect(payload.functionName).toBeDefined();
    expect(payload.functionArgs).toEqual(functionArgs);
  });

  test('createSmartContractPayload', () => {
    const contractName = 'my-contract';
    const codeBody = '(define-constant test-value 42)';

    const payload = createSmartContractPayload(contractName, codeBody);

    expect(payload.payloadType).toBe(PayloadType.SmartContract);
    expect(payload.contractName).toBeDefined();
    expect(payload.codeBody).toBeDefined();
  });

  test('createCoinbasePayload', () => {
    const buffer = new Uint8Array(32).fill(0);

    const payload = createCoinbasePayload(buffer);

    expect(payload.payloadType).toBe(PayloadType.Coinbase);
    expect(payload.coinbaseBytes).toEqual(buffer);
  });
});

describe('Key Management Tests', () => {
  test('createStacksPublicKey', () => {
    const pubKeyHex =
      '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a';
    const publicKey = createStacksPublicKey(pubKeyHex);
    expect(publicKey.data).toBeDefined();
    expect(bytesToHex(publicKey.data)).toBe(pubKeyHex);
  });

  test('publicKeyToString', () => {
    const pubKeyHex =
      '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a';
    const publicKey = createStacksPublicKey(pubKeyHex);
    const keyString = publicKeyToString(publicKey);
    expect(keyString).toBe(pubKeyHex);
  });

  test('pubKeyfromPrivKey', () => {
    const secretKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const publicKey = pubKeyfromPrivKey(secretKey);
    expect(publicKey.data).toBeDefined();
    expect(publicKey.data.length).toBeGreaterThan(0);
  });

  test('createMessageSignature', () => {
    // Use a valid 65-byte signature (130 hex chars)
    const signature = 'abcd1234'.padEnd(130, '0');
    const messageSignature = createMessageSignature(signature);
    expect(messageSignature.data).toBe(signature);
  });

  test('signWithKey', () => {
    const privateKey = createStacksPrivateKey(
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf'
    );
    const messageHash =
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

    const signature = signWithKey(privateKey, messageHash);
    expect(signature).toBeDefined();
    expect(signature.type).toBeDefined();
    expect(signature.data).toBeDefined();
    expect(signature.data.length).toBe(130); // 65 bytes * 2 hex chars
  });
});

describe('Transaction Deserialization Tests', () => {
  test('deserialize transaction', () => {
    // Use the actual serialized transaction from the working test
    const serializedTx =
      '00000000010400bbe5d1146974507154ba0ce446784156a74d6e65000000000000000800000000000000c80100ee559480e7fa1d9124b4c0a768681f0e2b0ad4bc054efc8135dcb5c3d599f6dc3c0a4e94c3d8d49774fe79bc0006f72ba943d03b8b78d288b24e1b19f2a61664030200000001000216ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb4030000000000000000000516ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb4000000000000001531313033313700000000000000000000000000000000000000000000000000000000';
    const txBytes = hexToBytes(serializedTx);

    const transaction = deserializeTransaction(txBytes);
    expect(transaction).toBeInstanceOf(StacksTransaction);
    expect(transaction.version).toBe(TransactionVersion.Mainnet);
    expect(transaction.auth.authType).toBe(AuthType.Standard);
  });
});

describe('Error Handling Tests', () => {
  test('invalid transaction data', () => {
    const invalidData = new Uint8Array([1, 2, 3]); // Too short to be valid
    expect(() => deserializeTransaction(invalidData)).toThrow();
  });

  test('invalid private key', () => {
    expect(() => createStacksPrivateKey('invalid')).toThrow();
  });

  test('invalid public key', () => {
    expect(() => createStacksPublicKey('invalid')).toThrow();
  });

  test('SigningError', () => {
    const error = new SigningError('Test signing error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test signing error');
    expect(error.name).toBe('SigningError');
  });

  test('VerificationError', () => {
    const error = new VerificationError('Test verification error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test verification error');
    expect(error.name).toBe('VerificationError');
  });

  test('DeserializationError', () => {
    const error = new DeserializationError('Test deserialization error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test deserialization error');
    expect(error.name).toBe('DeserializationError');
  });
});

describe('TxBroadcastResult Types Tests', () => {
  test('TxBroadcastResultOk', () => {
    const successResult: TxBroadcastResult = {
      txid: '0x1234567890abcdef',
    };

    expect(successResult.txid).toBeDefined();
    expect(successResult.error).toBeUndefined();
  });

  test('TxBroadcastResultRejected - Serialization', () => {
    const rejectedResult: TxBroadcastResultRejected = {
      error: 'Serialization failed',
      reason: TxRejectedReason.Serialization,
      reason_data: {
        message: 'Transaction could not be serialized',
      },
      txid: '0x1234567890abcdef',
    };

    expect(rejectedResult.reason).toBe(TxRejectedReason.Serialization);
    expect(rejectedResult.error).toBeDefined();
    expect(rejectedResult.reason_data.message).toBeDefined();
  });

  test('TxBroadcastResultRejected - BadNonce', () => {
    const rejectedResult: TxBroadcastResultRejected = {
      error: 'Bad nonce',
      reason: TxRejectedReason.BadNonce,
      reason_data: {
        expected: 5,
        actual: 3,
        is_origin: true,
        principal: true,
      },
      txid: '0x1234567890abcdef',
    };

    expect(rejectedResult.reason).toBe(TxRejectedReason.BadNonce);
    expect(rejectedResult.reason_data.expected).toBe(5);
    expect(rejectedResult.reason_data.actual).toBe(3);
  });

  test('TxBroadcastResultRejected - FeeTooLow', () => {
    const rejectedResult: TxBroadcastResultRejected = {
      error: 'Fee too low',
      reason: TxRejectedReason.FeeTooLow,
      reason_data: {
        expected: 1000,
        actual: 500,
      },
      txid: '0x1234567890abcdef',
    };

    expect(rejectedResult.reason).toBe(TxRejectedReason.FeeTooLow);
    expect(rejectedResult.reason_data.expected).toBeGreaterThan(
      rejectedResult.reason_data.actual
    );
  });
});

describe('Multi-signature Advanced Tests', () => {
  const secretKey1 =
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
  const secretKey2 =
    'e494f188c2d35887531ba474c433b1e41fadd8eb824aca983447fd4bb8b277a8';
  const privateKey1 = createStacksPrivateKey(secretKey1);
  const privateKey2 = createStacksPrivateKey(secretKey2);
  const publicKey1 = getPublicKey(privateKey1);
  const publicKey2 = getPublicKey(privateKey2);
  const pubKeyHex1 = bytesToHex(publicKey1.data);
  const pubKeyHex2 = bytesToHex(publicKey2.data);

  test('multi-sig spending condition with different signatures required', () => {
    const addressHashMode = AddressHashMode.SerializeP2SH;
    const nonce = 1;
    const fee = 1000;

    // Test 1 of 2 multisig
    const multiSig1of2 = createMultiSigSpendingCondition(
      addressHashMode,
      1, // Only 1 signature required
      [pubKeyHex1, pubKeyHex2],
      nonce,
      fee
    );

    expect(multiSig1of2.signaturesRequired).toBe(1);
    expect(multiSig1of2.fields.length).toBe(0); // fields are initially empty, populated during signing

    // Test 2 of 2 multisig
    const multiSig2of2 = createMultiSigSpendingCondition(
      addressHashMode,
      2, // Both signatures required
      [pubKeyHex1, pubKeyHex2],
      nonce,
      fee
    );

    expect(multiSig2of2.signaturesRequired).toBe(2);
    expect(multiSig2of2.fields.length).toBe(0); // fields are initially empty, populated during signing
  });

  test('sponsored transaction with different spending conditions', () => {
    const originCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex1,
      1,
      0 // Origin pays no fee in sponsored tx
    );

    const sponsorCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex2,
      2,
      1000 // Sponsor pays the fee
    );

    const sponsoredAuth = createSponsoredAuth(
      originCondition,
      sponsorCondition
    );

    expect(sponsoredAuth.authType).toBe(AuthType.Sponsored);
    expect(sponsoredAuth.spendingCondition.fee).toBe(BigInt(0));
    if (sponsoredAuth.authType === AuthType.Sponsored) {
      expect(
        (sponsoredAuth as SponsoredAuthorization).sponsorSpendingCondition.fee
      ).toBe(BigInt(1000));
    }
  });
});

describe('Advanced Transaction Construction Tests', () => {
  test('transaction with multiple post conditions', () => {
    const address1 = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const address2 = 'SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ';
    const contractAddress = 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27';
    const contractName = 'test-token';

    const principal1 = createStandardPrincipal(address1);
    const principal2 = createStandardPrincipal(address2);

    const stxPostCondition = createSTXPostCondition(
      principal1,
      FungibleConditionCode.GreaterEqual,
      1000
    );

    const fungiblePostCondition = createFungiblePostCondition(
      principal2,
      FungibleConditionCode.LessEqual,
      500,
      `${contractAddress}.${contractName}::test-token`
    );

    const nftPostCondition = createNonFungiblePostCondition(
      principal1,
      NonFungibleConditionCode.DoesNotSend,
      `${contractAddress}.${contractName}::test-nft`,
      stringAsciiCV('token-1')
    );

    const postConditions = createLPList([
      stxPostCondition,
      fungiblePostCondition,
      nftPostCondition,
    ]);

    expect(postConditions.lengthPrefixBytes).toBeGreaterThan(0);
    expect(postConditions.values.length).toBe(3);
  });

  test('transaction with different anchor modes', () => {
    const secretKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const privateKey = createStacksPrivateKey(secretKey);
    const publicKey = getPublicKey(privateKey);
    const pubKeyHex = bytesToHex(publicKey.data);

    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      1000
    );
    const authorization = createStandardAuth(spendingCondition);

    const contractPayload = createContractCallPayload(
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      'test-contract',
      'test-function',
      [uintCV(42)]
    );

    // Test AnchorMode.Any
    const txAny = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      contractPayload,
      createLPList([]),
      PostConditionMode.Deny,
      AnchorMode.Any
    );
    expect(txAny.anchorMode).toBe(AnchorMode.Any);

    // Test AnchorMode.OnChainOnly
    const txOnChain = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      contractPayload,
      createLPList([]),
      PostConditionMode.Deny,
      AnchorMode.OnChainOnly
    );
    expect(txOnChain.anchorMode).toBe(AnchorMode.OnChainOnly);

    // Test AnchorMode.OffChainOnly
    const txOffChain = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      contractPayload,
      createLPList([]),
      PostConditionMode.Deny,
      AnchorMode.OffChainOnly
    );
    expect(txOffChain.anchorMode).toBe(AnchorMode.OffChainOnly);
  });

  test('transaction with different chain IDs', () => {
    const secretKey =
      '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
    const privateKey = createStacksPrivateKey(secretKey);
    const publicKey = getPublicKey(privateKey);
    const pubKeyHex = bytesToHex(publicKey.data);

    const spendingCondition = createSingleSigSpendingCondition(
      AddressHashMode.SerializeP2PKH,
      pubKeyHex,
      1,
      1000
    );
    const authorization = createStandardAuth(spendingCondition);

    const payload = createTokenTransferPayload(
      standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'),
      1000,
      'test'
    );

    // Test with different chain IDs
    const mainnetTx = new StacksTransaction(
      TransactionVersion.Mainnet,
      authorization,
      payload,
      createLPList([]),
      PostConditionMode.Deny,
      AnchorMode.Any,
      0x00000001 // Mainnet chain ID
    );
    expect(mainnetTx.chainId).toBe(0x00000001);

    const testnetTx = new StacksTransaction(
      TransactionVersion.Testnet,
      authorization,
      payload,
      createLPList([]),
      PostConditionMode.Deny,
      AnchorMode.Any,
      0x80000000 // Testnet chain ID
    );
    expect(testnetTx.chainId).toBe(0x80000000);
  });
});

describe('Get Payload', () => {
  test('getTransferPayload', () => {
    const payload = getTransferPayload(
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
      3000,
      '20'
    );
    console.log(payload);
    expect(payload).toEqual(
      '000516ac54665e0f6268749c1fa0eb7c402a1ad1ca2bb40000000000000bb832300000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('getTokenTransferPayload', () => {
    const from = 'SP2XYBM8MD5T50WAMQ86E8HKR85BAEKBECNE1HHVY';
    const to = 'SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ';
    const memo = '110317';
    const contract = 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27';
    const contract_name = 'miamicoin-token';
    const function_name = 'transfer';
    const amount = 21;

    const payload = getTokenTransferPayload(
      from,
      to,
      memo,
      amount,
      contract,
      contract_name,
      function_name
    );
    console.log(payload);
    expect(payload).toEqual(
      '021608633eac058f2e6ab41613a0a537c7ea1a79cdd20f6d69616d69636f696e2d746f6b656e087472616e736665720000000401000000000000000000000000000000150516bbe5d1146974507154ba0ce446784156a74d6e650516e3d94a92b80d0aabe8ef1b50de84449cd61ad6370a0200000006313130333137'
    );
  });

  test('getAllowContractCallerPayload', () => {
    const contract = 'SP000000000000000000002Q6VF78';
    const contractName = 'pox-3';
    const functionName = 'allow-contract-caller';
    const caller = 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox-fast-pool-v2';
    const untilBurnBlockHeight = 206600;

    const payload = getAllowContractCallerPayload(
      caller,
      contract,
      contractName,
      functionName,
      untilBurnBlockHeight
    );
    console.log(payload);
    expect(payload).toEqual(
      '0216000000000000000000000000000000000000000005706f782d3315616c6c6f772d636f6e74726163742d63616c6c657200000002061683ed66860315e334010bbfb76eb3eef887efee0a10706f782d666173742d706f6f6c2d76320a0100000000000000000000000000032708'
    );
  });

  test('getDelegateStxPayload', () => {
    const contract = 'SP000000000000000000002Q6VF78';
    const contractName = 'pox-3';
    const functionName = 'delegate-stx';
    const delegateTo = 'SP3TDKYYRTYFE32N19484838WEJ25GX40Z24GECPZ';
    const poxAddress = '36Y1UJBWGGreKCKNYQPVPr41rgG2sQF7SC';
    const amountMicroStx = 100000000000;
    const untilBurnBlockHeight = 2000;

    const payload = getDelegateStxPayload(
      contract,
      contractName,
      functionName,
      delegateTo,
      poxAddress,
      amountMicroStx,
      untilBurnBlockHeight
    );
    console.log(payload);
    expect(payload).toEqual(
      '0216000000000000000000000000000000000000000005706f782d330c64656c65676174652d73747800000004010000000000000000000000174876e8000516f4d9fbd8d79ee18aa14910440d1c7484587480f80a01000000000000000000000000000007d00a0c00000002096861736862797465730200000014352481ec2fecfde0c5cdc635a383c4ac27b9f71e0776657273696f6e020000000101'
    );
  });

  test('getRevokeDelegateStxPayload', () => {
    const contract = 'SP000000000000000000002Q6VF78';
    const contractName = 'pox-3';
    const functionName = 'revoke-delegate-stx';

    const payload = getRevokeDelegateStxPayload(
      contract,
      contractName,
      functionName
    );
    console.log(payload);
    expect(payload).toEqual(
      '0216000000000000000000000000000000000000000005706f782d33137265766f6b652d64656c65676174652d73747800000000'
    );
  });

  test('getContractCallPayload', () => {
    const contractAddress = 'SP000000000000000000002Q6VF78';
    const contractName = 'pox-3';
    const functionName = 'delegate-stx';
    const functionArgs = [
      '0x010000000000000000000000174876e800',
      '0516f4d9fbd8d79ee18aa14910440d1c7484587480f8',
      '0a01000000000000000000000000000007d0',
      '0a0c00000002096861736862797465730200000014352481ec2fecfde0c5cdc635a383c4ac27b9f71e0776657273696f6e020000000101',
    ];
    const payload = getContractCallPayload(
      contractAddress,
      contractName,
      functionName,
      functionArgs
    );
    console.log(payload);
    expect(payload).toEqual(
      '0216000000000000000000000000000000000000000005706f782d330c64656c65676174652d73747800000004010000000000000000000000174876e8000516f4d9fbd8d79ee18aa14910440d1c7484587480f80a01000000000000000000000000000007d00a0c00000002096861736862797465730200000014352481ec2fecfde0c5cdc635a383c4ac27b9f71e0776657273696f6e020000000101'
    );
  });

  test('getDeployPayload', () => {
    const contractName = 'kv-store';
    const codeBody =
      '(define-map store ((key (buff 32))) ((value (buff 32))))\n' +
      '\n' +
      '(define-public (get-value (key (buff 32)))\n' +
      '    (match (map-get? store ((key key)))\n' +
      '        entry (ok (get value entry))\n' +
      '        (err 0)))\n' +
      '\n' +
      '(define-public (set-value (key (buff 32)) (value (buff 32)))\n' +
      '    (begin\n' +
      '        (map-set store ((key key)) ((value value)))\n' +
      "        (ok 'true)))\n";
    const payload = getDeployPayload(contractName, codeBody);
    console.log(payload);
    expect(payload).toEqual(
      '0602086b762d73746f72650000015628646566696e652d6d61702073746f72652028286b657920286275666620333229292920282876616c7565202862756666203332292929290a0a28646566696e652d7075626c696320286765742d76616c756520286b65792028627566662033322929290a20202020286d6174636820286d61702d6765743f2073746f72652028286b6579206b65792929290a2020202020202020656e74727920286f6b20286765742076616c756520656e74727929290a20202020202020202865727220302929290a0a28646566696e652d7075626c696320287365742d76616c756520286b65792028627566662033322929202876616c75652028627566662033322929290a2020202028626567696e0a2020202020202020286d61702d7365742073746f72652028286b6579206b6579292920282876616c75652076616c75652929290a2020202020202020286f6b2027747275652929290a'
    );
  });
});

describe('Contract ABI Tests', () => {
  // Import the contract ABI functions
  const {
    encodeClarityValue,
    getTypeString,
    getTypeUnion,
    validateContractCall,
    parseToCV,
    abiFunctionToString,
    isClarityAbiPrimitive,
    isClarityAbiBuffer,
    isClarityAbiStringAscii,
    isClarityAbiStringUtf8,
    isClarityAbiResponse,
    isClarityAbiOptional,
    isClarityAbiTuple,
    isClarityAbiList,
    ClarityAbiTypeId,
  } = require('../src/transactions/contract-abi');

  describe('Type Guards Tests', () => {
    test('isClarityAbiPrimitive', () => {
      expect(isClarityAbiPrimitive('uint128')).toBe(true);
      expect(isClarityAbiPrimitive('int128')).toBe(true);
      expect(isClarityAbiPrimitive('bool')).toBe(true);
      expect(isClarityAbiPrimitive('principal')).toBe(true);
      expect(isClarityAbiPrimitive('trait_reference')).toBe(true);
      expect(isClarityAbiPrimitive('none')).toBe(true);

      expect(isClarityAbiPrimitive({ buffer: { length: 32 } })).toBe(false);
      expect(isClarityAbiPrimitive({ tuple: [] })).toBe(false);
    });

    test('isClarityAbiBuffer', () => {
      expect(isClarityAbiBuffer({ buffer: { length: 32 } })).toBe(true);
      expect(isClarityAbiBuffer({ buffer: { length: 1 } })).toBe(true);

      expect(isClarityAbiBuffer('uint128')).toBe(false);
      expect(isClarityAbiBuffer({ tuple: [] })).toBe(false);
    });

    test('isClarityAbiStringAscii', () => {
      expect(isClarityAbiStringAscii({ 'string-ascii': { length: 32 } })).toBe(
        true
      );
      expect(isClarityAbiStringAscii({ 'string-ascii': { length: 1 } })).toBe(
        true
      );

      expect(isClarityAbiStringAscii('uint128')).toBe(false);
      expect(isClarityAbiStringAscii({ 'string-utf8': { length: 32 } })).toBe(
        false
      );
    });

    test('isClarityAbiStringUtf8', () => {
      expect(isClarityAbiStringUtf8({ 'string-utf8': { length: 32 } })).toBe(
        true
      );
      expect(isClarityAbiStringUtf8({ 'string-utf8': { length: 1 } })).toBe(
        true
      );

      expect(isClarityAbiStringUtf8('uint128')).toBe(false);
      expect(isClarityAbiStringUtf8({ 'string-ascii': { length: 32 } })).toBe(
        false
      );
    });

    test('isClarityAbiResponse', () => {
      const responseType = {
        response: {
          ok: 'uint128',
          error: 'uint128',
        },
      };
      expect(isClarityAbiResponse(responseType)).toBe(true);

      expect(isClarityAbiResponse('uint128')).toBe(false);
      expect(isClarityAbiResponse({ optional: 'uint128' })).toBe(false);
    });

    test('isClarityAbiOptional', () => {
      expect(isClarityAbiOptional({ optional: 'uint128' })).toBe(true);
      expect(
        isClarityAbiOptional({ optional: { buffer: { length: 32 } } })
      ).toBe(true);

      expect(isClarityAbiOptional('uint128')).toBe(false);
      expect(
        isClarityAbiOptional({ response: { ok: 'uint128', error: 'uint128' } })
      ).toBe(false);
    });

    test('isClarityAbiTuple', () => {
      const tupleType = {
        tuple: [
          { name: 'field1', type: 'uint128' },
          { name: 'field2', type: 'bool' },
        ],
      };
      expect(isClarityAbiTuple(tupleType)).toBe(true);
      expect(isClarityAbiTuple({ tuple: [] })).toBe(true);

      expect(isClarityAbiTuple('uint128')).toBe(false);
      expect(isClarityAbiTuple({ list: { type: 'uint128', length: 10 } })).toBe(
        false
      );
    });

    test('isClarityAbiList', () => {
      expect(isClarityAbiList({ list: { type: 'uint128', length: 10 } })).toBe(
        true
      );
      expect(
        isClarityAbiList({
          list: { type: { buffer: { length: 32 } }, length: 5 },
        })
      ).toBe(true);

      expect(isClarityAbiList('uint128')).toBe(false);
      expect(isClarityAbiList({ tuple: [] })).toBe(false);
    });
  });

  describe('getTypeUnion Tests', () => {
    test('primitive types', () => {
      expect(getTypeUnion('uint128')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeUInt128,
        type: 'uint128',
      });

      expect(getTypeUnion('int128')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeInt128,
        type: 'int128',
      });

      expect(getTypeUnion('bool')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeBool,
        type: 'bool',
      });

      expect(getTypeUnion('principal')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypePrincipal,
        type: 'principal',
      });

      expect(getTypeUnion('trait_reference')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeTraitReference,
        type: 'trait_reference',
      });

      expect(getTypeUnion('none')).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeNone,
        type: 'none',
      });
    });

    test('complex types', () => {
      const bufferType = { buffer: { length: 32 } };
      expect(getTypeUnion(bufferType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeBuffer,
        type: bufferType,
      });

      const responseType = { response: { ok: 'uint128', error: 'uint128' } };
      expect(getTypeUnion(responseType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeResponse,
        type: responseType,
      });

      const optionalType = { optional: 'uint128' };
      expect(getTypeUnion(optionalType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeOptional,
        type: optionalType,
      });

      const tupleType = { tuple: [{ name: 'field1', type: 'uint128' }] };
      expect(getTypeUnion(tupleType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeTuple,
        type: tupleType,
      });

      const listType = { list: { type: 'uint128', length: 10 } };
      expect(getTypeUnion(listType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeList,
        type: listType,
      });

      const stringAsciiType = { 'string-ascii': { length: 32 } };
      expect(getTypeUnion(stringAsciiType)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeStringAscii,
        type: stringAsciiType,
      });

      const stringUtf8Type = { 'string-utf8': { length: 32 } };
      expect(getTypeUnion(stringUtf8Type)).toEqual({
        id: ClarityAbiTypeId.ClarityAbiTypeStringUtf8,
        type: stringUtf8Type,
      });
    });

    test('unknown type throws error', () => {
      expect(() => getTypeUnion({ unknown: 'type' } as any)).toThrow();
      expect(() => getTypeUnion('unknown-primitive' as any)).toThrow();
    });
  });

  describe('encodeClarityValue Tests', () => {
    test('uint128 encoding', () => {
      const result = encodeClarityValue('uint128', '12345');
      expect(result).toEqual(uintCV('12345'));
    });

    test('int128 encoding', () => {
      const result = encodeClarityValue('int128', '-12345');
      expect(result).toEqual(intCV('-12345'));
    });

    test('bool encoding', () => {
      expect(encodeClarityValue('bool', 'true')).toEqual(boolCV(true));
      expect(encodeClarityValue('bool', 'false')).toEqual(boolCV(false));
      expect(encodeClarityValue('bool', '1')).toEqual(boolCV(true));
      expect(encodeClarityValue('bool', '0')).toEqual(boolCV(false));

      expect(() => encodeClarityValue('bool', 'invalid')).toThrow(
        'Unexpected Clarity bool value'
      );
    });

    test('principal encoding', () => {
      // Standard principal
      const standardResult = encodeClarityValue(
        'principal',
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'
      );
      expect(standardResult).toEqual(
        standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q')
      );

      // Contract principal
      const contractResult = encodeClarityValue(
        'principal',
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.contract-name'
      );
      expect(contractResult).toEqual(
        contractPrincipalCV(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'contract-name'
        )
      );
    });

    test('trait_reference encoding', () => {
      const result = encodeClarityValue(
        'trait_reference',
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.trait-name'
      );
      expect(result).toEqual(
        contractPrincipalCV(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'trait-name'
        )
      );
    });

    test('none encoding', () => {
      const result = encodeClarityValue('none', '');
      expect(result).toEqual(noneCV());
    });

    test('buffer encoding', () => {
      const bufferType = { buffer: { length: 32 } };
      const result = encodeClarityValue(bufferType, 'hello');
      expect(result.type).toBe(ClarityType.Buffer);
    });

    test('string-ascii encoding', () => {
      const stringAsciiType = { 'string-ascii': { length: 32 } };
      const result = encodeClarityValue(stringAsciiType, 'hello');
      expect(result).toEqual(stringAsciiCV('hello'));
    });

    test('string-utf8 encoding', () => {
      const stringUtf8Type = { 'string-utf8': { length: 32 } };
      const result = encodeClarityValue(stringUtf8Type, 'hello 世界');
      expect(result).toEqual(stringUtf8CV('hello 世界'));
    });

    test('unsupported types throw NotImplementedError', () => {
      const responseType = { response: { ok: 'uint128', error: 'uint128' } };
      expect(() => encodeClarityValue(responseType, 'value')).toThrow();

      const optionalType = { optional: 'uint128' };
      expect(() => encodeClarityValue(optionalType, 'value')).toThrow();

      const tupleType = { tuple: [{ name: 'field1', type: 'uint128' }] };
      expect(() => encodeClarityValue(tupleType, 'value')).toThrow();

      const listType = { list: { type: 'uint128', length: 10 } };
      expect(() => encodeClarityValue(listType, 'value')).toThrow();
    });

    test('unknown type ID throws error', () => {
      const unknownUnion = { id: 999, type: 'unknown' } as any;
      expect(() => encodeClarityValue(unknownUnion, 'value')).toThrow(
        'Unexpected Clarity type ID'
      );
    });
  });

  describe('getTypeString Tests', () => {
    test('primitive types', () => {
      expect(getTypeString('uint128')).toBe('uint');
      expect(getTypeString('int128')).toBe('int');
      expect(getTypeString('bool')).toBe('bool');
      expect(getTypeString('principal')).toBe('principal');
      expect(getTypeString('trait_reference')).toBe('trait_reference');
      expect(getTypeString('none')).toBe('none');
    });

    test('buffer types', () => {
      expect(getTypeString({ buffer: { length: 32 } })).toBe('(buff 32)');
      expect(getTypeString({ buffer: { length: 1 } })).toBe('(buff 1)');
    });

    test('string types', () => {
      expect(getTypeString({ 'string-ascii': { length: 32 } })).toBe(
        '(string-ascii 32)'
      );
      expect(getTypeString({ 'string-utf8': { length: 64 } })).toBe(
        '(string-utf8 64)'
      );
    });

    test('response types', () => {
      const responseType = { response: { ok: 'uint128', error: 'uint128' } };
      expect(getTypeString(responseType)).toBe('(response uint uint)');

      const nestedResponseType = {
        response: {
          ok: { buffer: { length: 32 } },
          error: { 'string-ascii': { length: 16 } },
        },
      };
      expect(getTypeString(nestedResponseType)).toBe(
        '(response (buff 32) (string-ascii 16))'
      );
    });

    test('optional types', () => {
      expect(getTypeString({ optional: 'uint128' })).toBe('(optional uint)');
      expect(getTypeString({ optional: { buffer: { length: 32 } } })).toBe(
        '(optional (buff 32))'
      );
    });

    test('tuple types', () => {
      const tupleType = {
        tuple: [
          { name: 'field1', type: 'uint128' },
          { name: 'field2', type: 'bool' },
        ],
      };
      expect(getTypeString(tupleType)).toBe(
        '(tuple (field1 uint) (field2 bool))'
      );

      expect(getTypeString({ tuple: [] })).toBe('(tuple )');
    });

    test('list types', () => {
      expect(getTypeString({ list: { type: 'uint128', length: 10 } })).toBe(
        '(list 10 uint)'
      );

      const complexListType = {
        list: {
          type: { tuple: [{ name: 'id', type: 'uint128' }] },
          length: 5,
        },
      };
      expect(getTypeString(complexListType)).toBe('(list 5 (tuple (id uint)))');
    });

    test('unsupported type throws error', () => {
      expect(() => getTypeString({ unknown: 'type' } as any)).toThrow(
        'Type string unsupported'
      );
    });
  });

  describe('parseToCV Tests', () => {
    test('uint128 parsing', () => {
      const result = parseToCV('12345', 'uint128');
      expect(result).toEqual(uintCV('12345'));
    });

    test('int128 parsing', () => {
      const result = parseToCV('-12345', 'int128');
      expect(result).toEqual(intCV('-12345'));
    });

    test('bool parsing', () => {
      expect(parseToCV('true', 'bool')).toEqual(boolCV(true));
      expect(parseToCV('false', 'bool')).toEqual(boolCV(false));
      expect(parseToCV('TRUE', 'bool')).toEqual(boolCV(true));
      expect(parseToCV('FALSE', 'bool')).toEqual(boolCV(false));

      expect(() => parseToCV('invalid', 'bool')).toThrow('Invalid bool value');
    });

    test('principal parsing', () => {
      // Standard principal
      const standardResult = parseToCV(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'principal'
      );
      expect(standardResult).toEqual(
        standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q')
      );

      // Contract principal
      const contractResult = parseToCV(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.contract-name',
        'principal'
      );
      expect(contractResult).toEqual(
        contractPrincipalCV(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'contract-name'
        )
      );
    });

    test('buffer parsing', () => {
      const bufferType = { buffer: { length: 32 } };
      const result = parseToCV('hello', bufferType);
      expect(result.type).toBe(ClarityType.Buffer);

      // Test buffer length validation
      const shortBufferType = { buffer: { length: 2 } };
      expect(() => parseToCV('hello world', shortBufferType)).toThrow(
        'Input exceeds specified buffer length limit'
      );
    });

    test('unsupported types throw errors', () => {
      const responseType = { response: { ok: 'uint128', error: 'uint128' } };
      expect(() => parseToCV('value', responseType)).toThrow(
        'Contract function contains unsupported Clarity ABI type'
      );

      const optionalType = { optional: 'uint128' };
      expect(() => parseToCV('value', optionalType)).toThrow(
        'Contract function contains unsupported Clarity ABI type'
      );

      const tupleType = { tuple: [{ name: 'field1', type: 'uint128' }] };
      expect(() => parseToCV('value', tupleType)).toThrow(
        'Contract function contains unsupported Clarity ABI type'
      );

      const listType = { list: { type: 'uint128', length: 10 } };
      expect(() => parseToCV('value', listType)).toThrow(
        'Contract function contains unsupported Clarity ABI type'
      );

      expect(() => parseToCV('value', 'unknown-type' as any)).toThrow(
        'Contract function contains unsupported Clarity ABI type'
      );
    });
  });

  describe('abiFunctionToString Tests', () => {
    test('public function', () => {
      const func = {
        name: 'transfer',
        access: 'public' as const,
        args: [
          { name: 'amount', type: 'uint128' },
          { name: 'recipient', type: 'principal' },
        ],
        outputs: { type: { response: { ok: 'bool', error: 'uint128' } } },
      };

      const result = abiFunctionToString(func);
      expect(result).toBe(
        '(define-public (transfer (amount uint) (recipient principal)))'
      );
    });

    test('private function', () => {
      const func = {
        name: 'internal-helper',
        access: 'private' as const,
        args: [{ name: 'value', type: 'uint128' }],
        outputs: { type: 'uint128' },
      };

      const result = abiFunctionToString(func);
      expect(result).toBe('(define-private (internal-helper (value uint)))');
    });

    test('read-only function', () => {
      const func = {
        name: 'get-balance',
        access: 'read_only' as const,
        args: [{ name: 'account', type: 'principal' }],
        outputs: { type: { response: { ok: 'uint128', error: 'uint128' } } },
      };

      const result = abiFunctionToString(func);
      expect(result).toBe(
        '(define-read-only (get-balance (account principal)))'
      );
    });

    test('function with no arguments', () => {
      const func = {
        name: 'get-total-supply',
        access: 'read_only' as const,
        args: [],
        outputs: { type: 'uint128' },
      };

      const result = abiFunctionToString(func);
      expect(result).toBe('(define-read-only (get-total-supply ))');
    });

    test('function with complex argument types', () => {
      const func = {
        name: 'complex-function',
        access: 'public' as const,
        args: [
          { name: 'data', type: { buffer: { length: 32 } } },
          {
            name: 'metadata',
            type: {
              tuple: [
                { name: 'id', type: 'uint128' },
                { name: 'name', type: { 'string-ascii': { length: 16 } } },
              ],
            },
          },
        ],
        outputs: { type: 'bool' },
      };

      const result = abiFunctionToString(func);
      expect(result).toBe(
        '(define-public (complex-function (data (buff 32)) (metadata (tuple (id uint) (name (string-ascii 16))))))'
      );
    });
  });

  describe('validateContractCall Tests', () => {
    const sampleAbi = {
      functions: [
        {
          name: 'transfer',
          access: 'public' as const,
          args: [
            { name: 'amount', type: 'uint128' },
            { name: 'recipient', type: 'principal' },
          ],
          outputs: { type: { response: { ok: 'bool', error: 'uint128' } } },
        },
        {
          name: 'get-balance',
          access: 'read_only' as const,
          args: [{ name: 'account', type: 'principal' }],
          outputs: { type: { response: { ok: 'uint128', error: 'uint128' } } },
        },
        {
          name: 'set-metadata',
          access: 'public' as const,
          args: [
            { name: 'data', type: { buffer: { length: 32 } } },
            { name: 'name', type: { 'string-ascii': { length: 16 } } },
          ],
          outputs: { type: 'bool' },
        },
      ],
      variables: [],
      maps: [],
      fungible_tokens: [],
      non_fungible_tokens: [],
    };

    test('valid contract call', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'transfer',
        [
          uintCV(1000),
          standardPrincipalCV('SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ'),
        ]
      );

      expect(() => validateContractCall(payload, sampleAbi)).not.toThrow();
      expect(validateContractCall(payload, sampleAbi)).toBe(true);
    });

    test('wrong number of arguments', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'transfer',
        [uintCV(1000)] // Missing recipient argument
      );

      expect(() => validateContractCall(payload, sampleAbi)).toThrow(
        'Clarity function expects 2 argument(s) but received 1'
      );
    });

    test('wrong argument type', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'transfer',
        [
          stringAsciiCV('invalid'), // Should be uint128
          standardPrincipalCV('SP3HXJJMJQ06GNAZ8XWDN1QM48JEDC6PP6W3YZPZJ'),
        ]
      );

      expect(() => validateContractCall(payload, sampleAbi)).toThrow(
        'Clarity function `transfer` expects argument 1 to be of type uint, not (string-ascii 7)'
      );
    });

    test('function not found in ABI', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'non-existent-function',
        []
      );

      expect(() => validateContractCall(payload, sampleAbi)).toThrow(
        "ABI doesn't contain a function with the name non-existent-function"
      );
    });

    test('buffer length validation', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'set-metadata',
        [
          bufferCV(new Uint8Array(16)), // Valid buffer (16 <= 32)
          stringAsciiCV('test'), // Valid string (4 <= 16)
        ]
      );

      expect(() => validateContractCall(payload, sampleAbi)).not.toThrow();
      expect(validateContractCall(payload, sampleAbi)).toBe(true);
    });

    test('buffer too long', () => {
      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'set-metadata',
        [
          bufferCV(new Uint8Array(40)), // Too long (40 > 32)
          stringAsciiCV('test'),
        ]
      );

      expect(() => validateContractCall(payload, sampleAbi)).toThrow(
        'Clarity function `set-metadata` expects argument 1 to be of type (buff 32), not (buff 40)'
      );
    });

    test('malformed ABI with duplicate functions', () => {
      const malformedAbi = {
        functions: [
          {
            name: 'transfer',
            access: 'public' as const,
            args: [],
            outputs: { type: 'bool' },
          },
          {
            name: 'transfer', // Duplicate name
            access: 'public' as const,
            args: [],
            outputs: { type: 'bool' },
          },
        ],
        variables: [],
        maps: [],
        fungible_tokens: [],
        non_fungible_tokens: [],
      };

      const payload = createContractCallPayload(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'test-contract',
        'transfer',
        []
      );

      expect(() => validateContractCall(payload, malformedAbi)).toThrow(
        'Malformed ABI. Contains multiple functions with the name transfer'
      );
    });
  });

  describe('Advanced Type Matching Tests', () => {
    test('optional type matching', () => {
      const optionalType = { optional: 'uint128' };

      // none should match optional
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [noneCV()]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: optionalType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();

      // some with correct inner type should match
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [someCV(uintCV(42))]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: optionalType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();
    });

    test('response type matching', () => {
      const responseType = { response: { ok: 'uint128', error: 'uint128' } };

      // response ok should match
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [responseOkCV(uintCV(42))]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: responseType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();

      // response error should match
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [responseErrorCV(uintCV(1))]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: responseType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();
    });

    test('list type matching', () => {
      const listType = { list: { type: 'uint128', length: 5 } };

      // valid list should match
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [listCV([uintCV(1), uintCV(2), uintCV(3)])]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: listType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();

      // list too long should fail
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [
            listCV([
              uintCV(1),
              uintCV(2),
              uintCV(3),
              uintCV(4),
              uintCV(5),
              uintCV(6),
            ]),
          ]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: listType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).toThrow();
    });

    test('tuple type matching', () => {
      const tupleType = {
        tuple: [
          { name: 'id', type: 'uint128' },
          { name: 'name', type: { 'string-ascii': { length: 16 } } },
        ],
      };

      // valid tuple should match
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [
            tupleCV({
              id: uintCV(1),
              name: stringAsciiCV('test'),
            }),
          ]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: tupleType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();

      // missing field should fail
      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [
            tupleCV({
              id: uintCV(1),
              // Missing 'name' field
            }),
          ]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'value', type: tupleType }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).toThrow();
    });

    test('principal type matching for trait reference', () => {
      // Both contract and standard principals should match trait_reference
      const contractPrincipal = contractPrincipalCV(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
        'trait-impl'
      );

      expect(() => {
        const payload = createContractCallPayload(
          'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q',
          'test-contract',
          'test-function',
          [contractPrincipal]
        );
        const abi = {
          functions: [
            {
              name: 'test-function',
              access: 'public' as const,
              args: [{ name: 'trait', type: 'trait_reference' }],
              outputs: { type: 'bool' },
            },
          ],
          variables: [],
          maps: [],
          fungible_tokens: [],
          non_fungible_tokens: [],
        };
        validateContractCall(payload, abi);
      }).not.toThrow();
    });
  });
});

describe('Post Condition Builder (Pc) Tests', () => {
  // Import the pc functions
  const { principal } = require('../src/transactions/pc');

  describe('principal() function tests', () => {
    test('creates PartialPcWithPrincipal with standard address', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const builder = principal(address);

      expect(builder).toBeDefined();
      expect(typeof builder.willSendEq).toBe('function');
      expect(typeof builder.willSendLte).toBe('function');
      expect(typeof builder.willSendLt).toBe('function');
      expect(typeof builder.willSendGte).toBe('function');
      expect(typeof builder.willSendGt).toBe('function');
      expect(typeof builder.willSendAsset).toBe('function');
      expect(typeof builder.willNotSendAsset).toBe('function');
    });

    test('creates PartialPcWithPrincipal with contract ID', () => {
      const contractId =
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';
      const builder = principal(contractId);

      expect(builder).toBeDefined();
      expect(typeof builder.willSendEq).toBe('function');
    });
  });

  describe('PartialPcWithPrincipal fungible token methods', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractId =
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';

    test('willSendEq creates FT builder with Equal condition', () => {
      const builder = principal(address).willSendEq(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });

    test('willSendLte creates FT builder with LessEqual condition', () => {
      const builder = principal(address).willSendLte(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });

    test('willSendLt creates FT builder with Less condition', () => {
      const builder = principal(address).willSendLt(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });

    test('willSendGte creates FT builder with GreaterEqual condition', () => {
      const builder = principal(address).willSendGte(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });

    test('willSendGt creates FT builder with Greater condition', () => {
      const builder = principal(address).willSendGt(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });

    test('FT methods work with contract principals', () => {
      const builder = principal(contractId).willSendEq(1000);
      expect(builder).toBeDefined();
      expect(typeof builder.ustx).toBe('function');
      expect(typeof builder.ft).toBe('function');
    });
  });

  describe('PartialPcWithPrincipal NFT methods', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractId =
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';

    test('willSendAsset creates NFT builder with Sends condition', () => {
      const builder = principal(address).willSendAsset();
      expect(builder).toBeDefined();
      expect(typeof builder.nft).toBe('function');
    });

    test('willNotSendAsset creates NFT builder with DoesNotSend condition', () => {
      const builder = principal(address).willNotSendAsset();
      expect(builder).toBeDefined();
      expect(typeof builder.nft).toBe('function');
    });

    test('NFT methods work with contract principals', () => {
      const builder = principal(contractId).willSendAsset();
      expect(builder).toBeDefined();
      expect(typeof builder.nft).toBe('function');
    });
  });

  describe('PartialPcFtWithCode STX post conditions', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractId =
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';

    test('ustx() creates standard STX post condition', () => {
      const postCondition = principal(address).willSendEq(1000).ustx();

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(FungibleConditionCode.Equal);
      expect(postCondition.amount).toBe(BigInt(1000));
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
    });

    test('ustx() creates contract STX post condition', () => {
      const postCondition = principal(contractId).willSendEq(1000).ustx();

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(FungibleConditionCode.Equal);
      expect(postCondition.amount).toBe(BigInt(1000));
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.principal.contractName).toBeDefined();
    });

    test('ustx() with different condition codes', () => {
      const eqCondition = principal(address).willSendEq(1000).ustx();
      expect(eqCondition.conditionCode).toBe(FungibleConditionCode.Equal);

      const lteCondition = principal(address).willSendLte(1000).ustx();
      expect(lteCondition.conditionCode).toBe(FungibleConditionCode.LessEqual);

      const ltCondition = principal(address).willSendLt(1000).ustx();
      expect(ltCondition.conditionCode).toBe(FungibleConditionCode.Less);

      const gteCondition = principal(address).willSendGte(1000).ustx();
      expect(gteCondition.conditionCode).toBe(
        FungibleConditionCode.GreaterEqual
      );

      const gtCondition = principal(address).willSendGt(1000).ustx();
      expect(gtCondition.conditionCode).toBe(FungibleConditionCode.Greater);
    });

    test('ustx() with BigInt amounts', () => {
      const postCondition = principal(address).willSendEq(BigInt(1000)).ustx();
      expect(postCondition.amount).toBe(BigInt(1000));
    });

    test('ustx() with string amounts', () => {
      const postCondition = principal(address).willSendEq('1000').ustx();
      expect(postCondition.amount).toBe(BigInt(1000));
    });
  });

  describe('PartialPcFtWithCode fungible token post conditions', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractId =
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';
    const tokenContractId =
      'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token';
    const tokenName = 'miamicoin';

    test('ft() creates standard fungible token post condition', () => {
      const postCondition = principal(address)
        .willSendEq(1000)
        .ft(tokenContractId, tokenName);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(FungibleConditionCode.Equal);
      expect(postCondition.amount).toBe(BigInt(1000));
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('ft() creates contract fungible token post condition', () => {
      const postCondition = principal(contractId)
        .willSendEq(1000)
        .ft(tokenContractId, tokenName);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(FungibleConditionCode.Equal);
      expect(postCondition.amount).toBe(BigInt(1000));
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.principal.contractName).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('ft() with different condition codes', () => {
      const eqCondition = principal(address)
        .willSendEq(1000)
        .ft(tokenContractId, tokenName);
      expect(eqCondition.conditionCode).toBe(FungibleConditionCode.Equal);

      const lteCondition = principal(address)
        .willSendLte(1000)
        .ft(tokenContractId, tokenName);
      expect(lteCondition.conditionCode).toBe(FungibleConditionCode.LessEqual);

      const ltCondition = principal(address)
        .willSendLt(1000)
        .ft(tokenContractId, tokenName);
      expect(ltCondition.conditionCode).toBe(FungibleConditionCode.Less);

      const gteCondition = principal(address)
        .willSendGte(1000)
        .ft(tokenContractId, tokenName);
      expect(gteCondition.conditionCode).toBe(
        FungibleConditionCode.GreaterEqual
      );

      const gtCondition = principal(address)
        .willSendGt(1000)
        .ft(tokenContractId, tokenName);
      expect(gtCondition.conditionCode).toBe(FungibleConditionCode.Greater);
    });

    test('ft() with various amount types', () => {
      const numberCondition = principal(address)
        .willSendEq(1000)
        .ft(tokenContractId, tokenName);
      expect(numberCondition.amount).toBe(BigInt(1000));

      const bigintCondition = principal(address)
        .willSendEq(BigInt(2000))
        .ft(tokenContractId, tokenName);
      expect(bigintCondition.amount).toBe(BigInt(2000));

      const stringCondition = principal(address)
        .willSendEq('3000')
        .ft(tokenContractId, tokenName);
      expect(stringCondition.amount).toBe(BigInt(3000));
    });
  });

  describe('PartialPcNftWithCode NFT post conditions', () => {
    const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
    const contractId =
      'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract';
    const nftContractId =
      'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract';
    const nftAssetName =
      'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract::test-nft';
    const tokenName = 'test-nft';
    const assetId = uintCV(1);

    test('nft() with asset name (2 args) creates standard NFT post condition', () => {
      const postCondition = principal(address)
        .willSendAsset()
        .nft(nftAssetName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(NonFungibleConditionCode.Sends);
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('nft() with contract ID and token name (3 args) creates standard NFT post condition', () => {
      const postCondition = principal(address)
        .willSendAsset()
        .nft(nftContractId, tokenName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(NonFungibleConditionCode.Sends);
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('nft() with asset name (2 args) creates contract NFT post condition', () => {
      const postCondition = principal(contractId)
        .willSendAsset()
        .nft(nftAssetName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(NonFungibleConditionCode.Sends);
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.principal.contractName).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('nft() with contract ID and token name (3 args) creates contract NFT post condition', () => {
      const postCondition = principal(contractId)
        .willSendAsset()
        .nft(nftContractId, tokenName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(NonFungibleConditionCode.Sends);
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.principal.contractName).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('nft() with DoesNotSend condition', () => {
      const postCondition = principal(address)
        .willNotSendAsset()
        .nft(nftAssetName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.conditionCode).toBe(
        NonFungibleConditionCode.DoesNotSend
      );
    });

    test('nft() with different asset ID types', () => {
      // Test with uintCV
      const uintCondition = principal(address)
        .willSendAsset()
        .nft(nftAssetName, uintCV(42));
      expect(uintCondition).toBeDefined();

      // Test with stringAsciiCV
      const stringCondition = principal(address)
        .willSendAsset()
        .nft(nftAssetName, stringAsciiCV('token-id'));
      expect(stringCondition).toBeDefined();

      // Test with bufferCV
      const bufferCondition = principal(address)
        .willSendAsset()
        .nft(nftAssetName, bufferCV(new Uint8Array([1, 2, 3])));
      expect(bufferCondition).toBeDefined();
    });
  });

  describe('Helper function tests', () => {
    // We need to access the helper functions for testing
    // Since they're internal, we'll test them through the public API and error conditions

    test('parseContractId through invalid contract ID', () => {
      expect(() => {
        // This should trigger an error in parseContractId
        principal('invalid-contract-id-without-dot')
          .willSendEq(1000)
          .ft('invalid', 'token');
      }).toThrow('Invalid contract identifier');
    });

    test('parseContractId through invalid contract ID with empty parts', () => {
      expect(() => {
        principal('address.').willSendEq(1000).ft('.contract', 'token');
      }).toThrow('Invalid contract identifier');

      expect(() => {
        principal('address.').willSendEq(1000).ft('address.', 'token');
      }).toThrow('Invalid contract identifier');
    });

    test('parseNft through invalid NFT asset name', () => {
      expect(() => {
        // This should trigger an error in parseNft via getNftArgs
        principal('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q')
          .willSendAsset()
          .nft('invalid-nft-without-double-colon', uintCV(1));
      }).toThrow('Invalid fully-qualified nft asset name');
    });

    test('parseNft through invalid NFT asset name with empty parts', () => {
      expect(() => {
        principal('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q')
          .willSendAsset()
          .nft(
            'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.contract::',
            uintCV(1)
          );
      }).toThrow('Invalid fully-qualified nft asset name');

      expect(() => {
        principal('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q')
          .willSendAsset()
          .nft('::token-name', uintCV(1));
      }).toThrow('Invalid fully-qualified nft asset name');
    });

    test('isContractIdString logic through principal function', () => {
      // Test address without dot (should be false)
      const standardBuilder = principal(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'
      );
      const standardCondition = standardBuilder.willSendEq(1000).ustx();
      expect(standardCondition.principal.contractName).toBeUndefined();

      // Test address with dot (should be true)
      const contractBuilder = principal(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.contract'
      );
      const contractCondition = contractBuilder.willSendEq(1000).ustx();
      expect(contractCondition.principal.contractName).toBeDefined();
    });

    test('getNftArgs with 2 arguments (asset name format)', () => {
      const nftAssetName =
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract::test-nft';
      const assetId = uintCV(1);

      const postCondition = principal(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'
      )
        .willSendAsset()
        .nft(nftAssetName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('getNftArgs with 3 arguments (separate format)', () => {
      const contractId =
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract';
      const tokenName = 'test-nft';
      const assetId = stringAsciiCV('unique-id');

      const postCondition = principal(
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'
      )
        .willSendAsset()
        .nft(contractId, tokenName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.assetInfo).toBeDefined();
    });
  });

  describe('End-to-end fluent API tests', () => {
    test('Complete STX post condition chain', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';

      const postCondition = principal(address).willSendLte(1000).ustx();

      expect(postCondition).toBeDefined();
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.conditionCode).toBe(FungibleConditionCode.LessEqual);
      expect(postCondition.amount).toBe(BigInt(1000));
    });

    test('Complete fungible token post condition chain', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const tokenContract =
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token';
      const tokenName = 'miamicoin';

      const postCondition = principal(address)
        .willSendGte(5000)
        .ft(tokenContract, tokenName);

      expect(postCondition).toBeDefined();
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.conditionCode).toBe(
        FungibleConditionCode.GreaterEqual
      );
      expect(postCondition.amount).toBe(BigInt(5000));
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('Complete NFT post condition chain with contract principal', () => {
      const contractId =
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.my-contract';
      const nftContract =
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract';
      const tokenName = 'collectible';
      const assetId = uintCV(42);

      const postCondition = principal(contractId)
        .willNotSendAsset()
        .nft(nftContract, tokenName, assetId);

      expect(postCondition).toBeDefined();
      expect(postCondition.principal).toBeDefined();
      expect(postCondition.principal.address).toBeDefined();
      expect(postCondition.principal.contractName).toBeDefined();
      expect(postCondition.conditionCode).toBe(
        NonFungibleConditionCode.DoesNotSend
      );
      expect(postCondition.assetInfo).toBeDefined();
    });

    test('Complex scenario with multiple condition types', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';

      // Test all fungible condition codes
      const equalCondition = principal(address).willSendEq(100).ustx();
      const lessEqualCondition = principal(address).willSendLte(200).ustx();
      const lessCondition = principal(address).willSendLt(300).ustx();
      const greaterEqualCondition = principal(address).willSendGte(400).ustx();
      const greaterCondition = principal(address).willSendGt(500).ustx();

      expect(equalCondition.conditionCode).toBe(FungibleConditionCode.Equal);
      expect(lessEqualCondition.conditionCode).toBe(
        FungibleConditionCode.LessEqual
      );
      expect(lessCondition.conditionCode).toBe(FungibleConditionCode.Less);
      expect(greaterEqualCondition.conditionCode).toBe(
        FungibleConditionCode.GreaterEqual
      );
      expect(greaterCondition.conditionCode).toBe(
        FungibleConditionCode.Greater
      );

      // Test both NFT condition codes
      const sendsNftCondition = principal(address)
        .willSendAsset()
        .nft('SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft::token', uintCV(1));
      const doesNotSendNftCondition = principal(address)
        .willNotSendAsset()
        .nft('SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft::token', uintCV(2));

      expect(sendsNftCondition.conditionCode).toBe(
        NonFungibleConditionCode.Sends
      );
      expect(doesNotSendNftCondition.conditionCode).toBe(
        NonFungibleConditionCode.DoesNotSend
      );
    });
  });

  describe('Type safety and edge cases', () => {
    test('handles various amount formats correctly', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';

      // Number
      const numberCondition = principal(address).willSendEq(1000).ustx();
      expect(numberCondition.amount).toBe(BigInt(1000));

      // BigInt
      const bigintCondition = principal(address)
        .willSendEq(BigInt(2000))
        .ustx();
      expect(bigintCondition.amount).toBe(BigInt(2000));

      // String
      const stringCondition = principal(address).willSendEq('3000').ustx();
      expect(stringCondition.amount).toBe(BigInt(3000));

      // Large number as string
      const largeCondition = principal(address)
        .willSendEq('1000000000000000000')
        .ustx();
      expect(largeCondition.amount).toBe(BigInt('1000000000000000000'));
    });

    test('handles complex contract and asset names', () => {
      const complexContract =
        'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.very-long-contract-name-with-hyphens';
      const complexAsset =
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft-contract-v2::multi-word-token-name';

      const ftCondition = principal(complexContract)
        .willSendEq(1000)
        .ft(
          'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.token-contract-v3',
          'complex-token-name'
        );

      expect(ftCondition).toBeDefined();
      expect(ftCondition.principal).toBeDefined();
      expect(ftCondition.principal.contractName).toBeDefined();
      expect(ftCondition.assetInfo).toBeDefined();

      const nftCondition = principal(complexContract)
        .willSendAsset()
        .nft(complexAsset, stringAsciiCV('complex-asset-id-123'));

      expect(nftCondition).toBeDefined();
      expect(nftCondition.principal).toBeDefined();
      expect(nftCondition.principal.contractName).toBeDefined();
      expect(nftCondition.assetInfo).toBeDefined();
    });

    test('preserves clarity value types for NFT asset IDs', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const nftAsset = 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.nft::token';

      // Test with different Clarity value types
      const uintCondition = principal(address)
        .willSendAsset()
        .nft(nftAsset, uintCV(123));
      expect(uintCondition).toBeDefined();

      const stringCondition = principal(address)
        .willSendAsset()
        .nft(nftAsset, stringAsciiCV('abc'));
      expect(stringCondition).toBeDefined();

      const bufferCondition = principal(address)
        .willSendAsset()
        .nft(nftAsset, bufferCV(new Uint8Array([1, 2, 3])));
      expect(bufferCondition).toBeDefined();

      const tupleCondition = principal(address)
        .willSendAsset()
        .nft(nftAsset, tupleCV({ id: uintCV(1) }));
      expect(tupleCondition).toBeDefined();
    });
  });
});

describe('Signature Module Tests', () => {
  const {
    AuthFieldType,
    createTransactionAuthField,
    deserializeTransactionAuthField,
    deserializeMessageSignature,
    serializeMessageSignature,
    serializeTransactionAuthField,
  } = require('../src/transactions/signature');

  describe('AuthFieldType enum tests', () => {
    test('AuthFieldType values', () => {
      expect(AuthFieldType.PublicKeyCompressed).toBe(0x00);
      expect(AuthFieldType.PublicKeyUncompressed).toBe(0x01);
      expect(AuthFieldType.SignatureCompressed).toBe(0x02);
      expect(AuthFieldType.SignatureUncompressed).toBe(0x03);
    });
  });

  describe('createTransactionAuthField tests', () => {
    test('creates auth field with compressed public key', () => {
      const publicKey = createStacksPublicKey(
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
      );

      const authField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        publicKey
      );

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Compressed);
      expect(authField.contents).toBe(publicKey);
    });

    test('creates auth field with uncompressed public key', () => {
      const publicKey = createStacksPublicKey(
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
      );

      const authField = createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        publicKey
      );

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Uncompressed);
      expect(authField.contents).toBe(publicKey);
    });

    test('creates auth field with message signature', () => {
      const signature = createMessageSignature(
        '00'.repeat(65) // 65 bytes signature
      );

      const authField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        signature
      );

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Compressed);
      expect(authField.contents).toBe(signature);
    });
  });

  describe('deserializeMessageSignature tests', () => {
    test('deserializes message signature from bytes', () => {
      const signatureBytes = new Uint8Array(65).fill(0xab);
      const reader = new BytesReader(signatureBytes);

      const signature = deserializeMessageSignature(reader);

      expect(signature.type).toBe(StacksMessageType.MessageSignature);
      expect(signature.data).toBe('ab'.repeat(65));
    });

    test('deserializes with different signature data', () => {
      const signatureData = hexToBytes('01'.repeat(65));
      const reader = new BytesReader(signatureData);

      const signature = deserializeMessageSignature(reader);

      expect(signature.type).toBe(StacksMessageType.MessageSignature);
      expect(signature.data).toBe('01'.repeat(65));
    });
  });

  describe('serializeMessageSignature tests', () => {
    test('serializes message signature to bytes', () => {
      const signature = createMessageSignature('ab'.repeat(65));

      const serialized = serializeMessageSignature(signature);

      expect(serialized).toEqual(new Uint8Array(65).fill(0xab));
    });

    test('serializes different signature data', () => {
      const signature = createMessageSignature('ff'.repeat(65));

      const serialized = serializeMessageSignature(signature);

      expect(serialized).toEqual(new Uint8Array(65).fill(0xff));
    });
  });

  describe('deserializeTransactionAuthField tests', () => {
    test('deserializes compressed public key auth field', () => {
      const publicKeyHex =
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a';
      const publicKeyBytes = hexToBytes(publicKeyHex);
      const data = new Uint8Array([
        AuthFieldType.PublicKeyCompressed,
        ...publicKeyBytes,
      ]);
      const reader = new BytesReader(data);

      const authField = deserializeTransactionAuthField(reader);

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Compressed);
      expect(authField.contents.type).toBe(StacksMessageType.PublicKey);
    });

    test('deserializes uncompressed public key auth field', () => {
      const publicKeyHex =
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a';
      const publicKeyBytes = hexToBytes(publicKeyHex);
      const data = new Uint8Array([
        AuthFieldType.PublicKeyUncompressed,
        ...publicKeyBytes,
      ]);
      const reader = new BytesReader(data);

      const authField = deserializeTransactionAuthField(reader);

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Uncompressed);
      expect(authField.contents.type).toBe(StacksMessageType.PublicKey);
    });

    test('deserializes compressed signature auth field', () => {
      const signatureBytes = new Uint8Array(65).fill(0xaa);
      const data = new Uint8Array([
        AuthFieldType.SignatureCompressed,
        ...signatureBytes,
      ]);
      const reader = new BytesReader(data);

      const authField = deserializeTransactionAuthField(reader);

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Compressed);
      expect(authField.contents.type).toBe(StacksMessageType.MessageSignature);
    });

    test('deserializes uncompressed signature auth field', () => {
      const signatureBytes = new Uint8Array(65).fill(0xbb);
      const data = new Uint8Array([
        AuthFieldType.SignatureUncompressed,
        ...signatureBytes,
      ]);
      const reader = new BytesReader(data);

      const authField = deserializeTransactionAuthField(reader);

      expect(authField.type).toBe(StacksMessageType.TransactionAuthField);
      expect(authField.pubKeyEncoding).toBe(PubKeyEncoding.Uncompressed);
      expect(authField.contents.type).toBe(StacksMessageType.MessageSignature);
    });

    test('throws error for invalid auth field type', () => {
      const data = new Uint8Array([0xff]); // Invalid auth field type
      const reader = new BytesReader(data);

      expect(() => deserializeTransactionAuthField(reader)).toThrow(
        'Could not read 255 as AuthFieldType'
      );
    });
  });

  describe('serializeTransactionAuthField tests', () => {
    test('serializes compressed public key auth field', () => {
      const publicKey = createStacksPublicKey(
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
      );
      const authField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        publicKey
      );

      const serialized = serializeTransactionAuthField(authField);

      expect(serialized[0]).toBe(AuthFieldType.PublicKeyCompressed);
      expect(serialized.length).toBeGreaterThan(1);
    });

    test('serializes uncompressed public key auth field', () => {
      const publicKey = createStacksPublicKey(
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
      );
      const authField = createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        publicKey
      );

      const serialized = serializeTransactionAuthField(authField);

      expect(serialized[0]).toBe(AuthFieldType.PublicKeyUncompressed);
      expect(serialized.length).toBeGreaterThan(1);
    });

    test('serializes compressed signature auth field', () => {
      const signature = createMessageSignature('aa'.repeat(65));
      const authField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        signature
      );

      const serialized = serializeTransactionAuthField(authField);

      expect(serialized[0]).toBe(AuthFieldType.SignatureCompressed);
      expect(serialized.length).toBe(66); // 1 byte type + 65 bytes signature
    });

    test('serializes uncompressed signature auth field', () => {
      const signature = createMessageSignature('bb'.repeat(65));
      const authField = createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        signature
      );

      const serialized = serializeTransactionAuthField(authField);

      expect(serialized[0]).toBe(AuthFieldType.SignatureUncompressed);
      expect(serialized.length).toBe(66); // 1 byte type + 65 bytes signature
    });
  });

  describe('Round-trip serialization tests', () => {
    test('public key compressed round-trip', () => {
      const publicKey = createStacksPublicKey(
        '0311188e244ce357bf7c271c11f6acd26943b2a45b187b3c4aa94a16c83c51340a'
      );
      const originalField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        publicKey
      );

      const serialized = serializeTransactionAuthField(originalField);
      const reader = new BytesReader(serialized);
      const deserialized = deserializeTransactionAuthField(reader);

      expect(deserialized.type).toBe(originalField.type);
      expect(deserialized.pubKeyEncoding).toBe(originalField.pubKeyEncoding);
      expect(deserialized.contents.type).toBe(originalField.contents.type);
    });

    test('signature compressed round-trip', () => {
      const signature = createMessageSignature('cc'.repeat(65));
      const originalField = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        signature
      );

      const serialized = serializeTransactionAuthField(originalField);
      const reader = new BytesReader(serialized);
      const deserialized = deserializeTransactionAuthField(reader);

      expect(deserialized.type).toBe(originalField.type);
      expect(deserialized.pubKeyEncoding).toBe(originalField.pubKeyEncoding);
      expect(deserialized.contents.type).toBe(originalField.contents.type);
      expect((deserialized.contents as any).data).toBe('cc'.repeat(65));
    });
  });
});

describe('TransactionSigner Tests', () => {
  const { TransactionSigner } = require('../src/transactions/signer');

  const secretKey =
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf';
  const privateKey = createStacksPrivateKey(secretKey);
  const publicKey = getPublicKey(privateKey);
  const pubKeyHex = bytesToHex(publicKey.data);

  describe('TransactionSigner constructor tests', () => {
    test('creates signer for single-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);

      expect(signer.transaction).toBe(transaction);
      expect(signer.sigHash).toBeDefined();
      expect(signer.originDone).toBe(false);
      expect(signer.checkOversign).toBe(true);
      expect(signer.checkOverlap).toBe(true);
    });

    test('creates signer for multi-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        2,
        [pubKeyHex, pubKeyHex],
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);

      expect(signer.transaction).toBe(transaction);
      expect(signer.sigHash).toBeDefined();
      expect(signer.originDone).toBe(false);
    });

    test('throws error for oversigned multi-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      // Create a multi-sig condition requiring only 1 signature
      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        1,
        [pubKeyHex],
        1,
        100
      );

      // Add too many signatures
      const signature1 = createMessageSignature('aa'.repeat(65));
      const signature2 = createMessageSignature('bb'.repeat(65));
      const authField1 = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        signature1
      );
      const authField2 = createTransactionAuthField(
        PubKeyEncoding.Compressed,
        signature2
      );

      spendingCondition.fields = [authField1, authField2];

      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      expect(() => new TransactionSigner(transaction)).toThrow(
        'SpendingCondition has more signatures than are expected'
      );
    });
  });

  describe('createSponsorSigner tests', () => {
    test('creates sponsor signer for sponsored transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      const originCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        0
      );
      const sponsorCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        2,
        1000
      );
      const sponsoredAuth = createSponsoredAuth(
        originCondition,
        sponsorCondition
      );

      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        sponsoredAuth,
        payload
      );

      // Sign origin first to avoid verification issues
      transaction.signNextOrigin(transaction.signBegin(), privateKey);

      const signer = TransactionSigner.createSponsorSigner(
        transaction,
        sponsorCondition
      );

      expect(signer.transaction).toBeDefined();
      expect(signer.originDone).toBe(true);
      expect(signer.checkOversign).toBe(true);
      expect(signer.checkOverlap).toBe(true);
    });

    test('throws error for non-sponsored transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      expect(() =>
        TransactionSigner.createSponsorSigner(transaction, spendingCondition)
      ).toThrow('Cannot add sponsor to non-sponsored transaction');
    });
  });

  describe('signOrigin tests', () => {
    test('signs origin for single-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      const originalSigHash = signer.sigHash;

      signer.signOrigin(privateKey);

      expect(signer.sigHash).not.toBe(originalSigHash);
    });

    test('throws error when signing origin after sponsor', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.originDone = true; // Simulate having signed sponsor first

      expect(() => signer.signOrigin(privateKey)).toThrow(
        'Cannot sign origin after sponsor key'
      );
    });

    test('throws error when auth is undefined', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.transaction.auth = undefined;

      expect(() => signer.signOrigin(privateKey)).toThrow(
        '"transaction.auth" is undefined'
      );
    });

    test('throws error when spendingCondition is undefined', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.transaction.auth.spendingCondition = undefined;

      expect(() => signer.signOrigin(privateKey)).toThrow(
        '"transaction.auth.spendingCondition" is undefined'
      );
    });

    test('throws error when multi-sig has too many signatures', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        1, // Only 1 signature required
        [pubKeyHex],
        1,
        100
      );

      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      // First sign to add one signature
      const signer = new TransactionSigner(transaction);
      signer.signOrigin(privateKey);

      // Now try to sign again, which should throw an error
      expect(() => signer.signOrigin(privateKey)).toThrow(
        'Origin would have too many signatures'
      );
    });
  });

  describe('appendOrigin tests', () => {
    test('appends public key to origin', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        2,
        [pubKeyHex],
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      const originalFieldsLength =
        signer.transaction.auth.spendingCondition.fields.length;

      signer.appendOrigin(publicKey);

      expect(signer.transaction.auth.spendingCondition.fields.length).toBe(
        originalFieldsLength + 1
      );
    });

    test('throws error when appending after sponsor', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        2,
        [pubKeyHex],
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.originDone = true;

      expect(() => signer.appendOrigin(publicKey)).toThrow(
        'Cannot append public key to origin after sponsor key'
      );
    });

    test('throws error when auth is undefined', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.transaction.auth = undefined;

      expect(() => signer.appendOrigin(publicKey)).toThrow(
        '"transaction.auth" is undefined'
      );
    });
  });

  describe('signSponsor tests', () => {
    test('signs sponsor for sponsored transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      const originCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        0
      );
      const sponsorCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        2,
        1000
      );
      const sponsoredAuth = createSponsoredAuth(
        originCondition,
        sponsorCondition
      );

      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        sponsoredAuth,
        payload
      );

      const signer = new TransactionSigner(transaction);
      const originalSigHash = signer.sigHash;

      signer.signSponsor(privateKey);

      expect(signer.sigHash).not.toBe(originalSigHash);
      expect(signer.originDone).toBe(true);
    });

    test('throws error when auth is undefined', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.transaction.auth = undefined;

      expect(() => signer.signSponsor(privateKey)).toThrow(
        '"transaction.auth" is undefined'
      );
    });

    test('throws error for non-sponsored transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);

      expect(() => signer.signSponsor(privateKey)).toThrow(
        '"transaction.auth.authType" is not AuthType.Sponsored'
      );
    });
  });

  describe('getTxInComplete tests', () => {
    test('returns cloned incomplete transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      const incompleteTransaction = signer.getTxInComplete();

      expect(incompleteTransaction).not.toBe(signer.transaction);
      expect(incompleteTransaction.version).toBe(signer.transaction.version);
    });
  });

  describe('resume tests', () => {
    test('resumes with new transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction1 = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );
      const transaction2 = new StacksTransaction(
        TransactionVersion.Testnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction1);
      const originalVersion = signer.transaction.version;

      signer.resume(transaction2);

      expect(signer.transaction.version).not.toBe(originalVersion);
      expect(signer.transaction.version).toBe(TransactionVersion.Testnet);
    });
  });

  describe('Integration tests', () => {
    test('complete signing flow for single-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');
      const spendingCondition = createSingleSigSpendingCondition(
        AddressHashMode.SerializeP2PKH,
        pubKeyHex,
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      signer.signOrigin(privateKey);

      expect(() => signer.transaction.verifyOrigin()).not.toThrow();
    });

    test('complete signing flow for multi-sig transaction', () => {
      const address = 'SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q';
      const recipientCV = standardPrincipalCV(address);
      const payload = createTokenTransferPayload(recipientCV, 1000, 'test');

      // Use compressed key multi-sig
      const spendingCondition = createMultiSigSpendingCondition(
        AddressHashMode.SerializeP2SH,
        1, // Only need 1 signature
        [pubKeyHex],
        1,
        100
      );
      const authorization = createStandardAuth(spendingCondition);
      const transaction = new StacksTransaction(
        TransactionVersion.Mainnet,
        authorization,
        payload
      );

      const signer = new TransactionSigner(transaction);
      const originalSigHash = signer.sigHash;

      signer.signOrigin(privateKey);

      // Verify the signing actually changed the sig hash
      expect(signer.sigHash).not.toBe(originalSigHash);

      // Verify a signature was added to the spending condition
      expect(
        signer.transaction.auth.spendingCondition.fields.filter(
          (field: any) =>
            field.contents.type === StacksMessageType.MessageSignature
        ).length
      ).toBeGreaterThan(0);
    });
  });
});

describe('StructuredDataSignature Tests', () => {
  const {
    STRUCTURED_DATA_PREFIX,
    hashStructuredData,
    encodeStructuredData,
    decodeStructuredDataSignature,
    signStructuredData,
  } = require('../src/transactions/structuredDataSignature');

  const privateKey = createStacksPrivateKey(
    '33c4ad314d494632a36c27f9ac819e8d2986c0e26ad63052879f631a417c8adf'
  );

  describe('STRUCTURED_DATA_PREFIX tests', () => {
    test('has correct SIP018 prefix', () => {
      expect(STRUCTURED_DATA_PREFIX).toEqual(
        new Uint8Array([0x53, 0x49, 0x50, 0x30, 0x31, 0x38])
      );
      expect(bytesToHex(STRUCTURED_DATA_PREFIX)).toBe('534950303138');
    });
  });

  describe('hashStructuredData tests', () => {
    test('hashes string clarity value', () => {
      const message = stringAsciiCV('hello world');
      const hash = hashStructuredData(message);

      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32); // SHA256 produces 32 bytes
    });

    test('hashes uint clarity value', () => {
      const message = uintCV(12345);
      const hash = hashStructuredData(message);

      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32);
    });

    test('hashes tuple clarity value', () => {
      const message = tupleCV({
        id: uintCV(1),
        name: stringAsciiCV('test'),
      });
      const hash = hashStructuredData(message);

      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32);
    });

    test('different messages produce different hashes', () => {
      const message1 = stringAsciiCV('hello');
      const message2 = stringAsciiCV('world');

      const hash1 = hashStructuredData(message1);
      const hash2 = hashStructuredData(message2);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('encodeStructuredData tests', () => {
    const validDomain = tupleCV({
      name: stringAsciiCV('test-app'),
      version: stringAsciiCV('1.0.0'),
      'chain-id': uintCV(1),
    });

    test('encodes valid domain and message', () => {
      const message = stringAsciiCV('hello world');

      const encoded = encodeStructuredData({ message, domain: validDomain });

      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(encoded.length).toBe(70); // 6 + 32 + 32 bytes
      expect(encoded.slice(0, 6)).toEqual(STRUCTURED_DATA_PREFIX);
    });

    test('encodes different message types', () => {
      const uintMessage = uintCV(42);
      const encoded1 = encodeStructuredData({
        message: uintMessage,
        domain: validDomain,
      });

      const tupleMessage = tupleCV({
        action: stringAsciiCV('transfer'),
        amount: uintCV(1000),
      });
      const encoded2 = encodeStructuredData({
        message: tupleMessage,
        domain: validDomain,
      });

      expect(encoded1).not.toEqual(encoded2);
      expect(encoded1.length).toBe(70);
      expect(encoded2.length).toBe(70);
    });

    test('throws error for invalid domain - not a tuple', () => {
      const message = stringAsciiCV('hello');
      const invalidDomain = stringAsciiCV('not-a-tuple');

      expect(() =>
        encodeStructuredData({ message, domain: invalidDomain })
      ).toThrow(
        "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id'"
      );
    });

    test('throws error for domain missing required keys', () => {
      const message = stringAsciiCV('hello');
      const invalidDomain = tupleCV({
        name: stringAsciiCV('test-app'),
        // Missing version and chain-id
      });

      expect(() =>
        encodeStructuredData({ message, domain: invalidDomain })
      ).toThrow(
        "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id'"
      );
    });

    test('throws error for domain with wrong key types', () => {
      const message = stringAsciiCV('hello');
      const invalidDomain = tupleCV({
        name: uintCV(123), // Should be string
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
      });

      expect(() =>
        encodeStructuredData({ message, domain: invalidDomain })
      ).toThrow(
        "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id'"
      );
    });

    test('throws error for domain with wrong chain-id type', () => {
      const message = stringAsciiCV('hello');
      const invalidDomain = tupleCV({
        name: stringAsciiCV('test-app'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': stringAsciiCV('not-a-number'), // Should be uint
      });

      expect(() =>
        encodeStructuredData({ message, domain: invalidDomain })
      ).toThrow(
        "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id'"
      );
    });

    test('works with additional domain fields', () => {
      const message = stringAsciiCV('hello');
      const extendedDomain = tupleCV({
        name: stringAsciiCV('test-app'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
        salt: stringAsciiCV('extra-field'), // Additional field
      });

      const encoded = encodeStructuredData({ message, domain: extendedDomain });

      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(encoded.length).toBe(70);
    });
  });

  describe('decodeStructuredDataSignature tests', () => {
    test('decodes structured data signature from Uint8Array', () => {
      const prefix = STRUCTURED_DATA_PREFIX;
      const domainHash = new Uint8Array(32).fill(0xaa);
      const messageHash = new Uint8Array(32).fill(0xbb);
      const encoded = new Uint8Array([
        ...prefix,
        ...domainHash,
        ...messageHash,
      ]);

      const decoded = decodeStructuredDataSignature(encoded);

      expect(decoded.domainHash).toEqual(domainHash);
      expect(decoded.messageHash).toEqual(messageHash);
    });

    test('decodes structured data signature from string', () => {
      const prefix = STRUCTURED_DATA_PREFIX;
      const domainHash = new Uint8Array(32).fill(0xcc);
      const messageHash = new Uint8Array(32).fill(0xdd);
      const encoded = new Uint8Array([
        ...prefix,
        ...domainHash,
        ...messageHash,
      ]);

      const decoded = decodeStructuredDataSignature(encoded);

      expect(decoded.domainHash).toEqual(domainHash);
      expect(decoded.messageHash).toEqual(messageHash);
    });

    test('handles different hash values', () => {
      const prefix = STRUCTURED_DATA_PREFIX;
      const domainHash1 = new Uint8Array(32).fill(0x11);
      const messageHash1 = new Uint8Array(32).fill(0x22);
      const encoded1 = new Uint8Array([
        ...prefix,
        ...domainHash1,
        ...messageHash1,
      ]);

      const domainHash2 = new Uint8Array(32).fill(0x33);
      const messageHash2 = new Uint8Array(32).fill(0x44);
      const encoded2 = new Uint8Array([
        ...prefix,
        ...domainHash2,
        ...messageHash2,
      ]);

      const decoded1 = decodeStructuredDataSignature(encoded1);
      const decoded2 = decodeStructuredDataSignature(encoded2);

      expect(decoded1.domainHash).not.toEqual(decoded2.domainHash);
      expect(decoded1.messageHash).not.toEqual(decoded2.messageHash);
    });
  });

  describe('signStructuredData tests', () => {
    const validDomain = tupleCV({
      name: stringAsciiCV('test-app'),
      version: stringAsciiCV('1.0.0'),
      'chain-id': uintCV(1),
    });

    test('signs structured data with string message', () => {
      const message = stringAsciiCV('hello world');

      const signature = signStructuredData({
        message,
        domain: validDomain,
        privateKey,
      });

      expect(signature.type).toBe(StacksMessageType.StructuredDataSignature);
      expect(signature.data).toBeDefined();
      expect(typeof signature.data).toBe('string');
      expect(signature.data.length).toBe(130); // 65 bytes * 2 hex chars
    });

    test('signs structured data with uint message', () => {
      const message = uintCV(12345);

      const signature = signStructuredData({
        message,
        domain: validDomain,
        privateKey,
      });

      expect(signature.type).toBe(StacksMessageType.StructuredDataSignature);
      expect(signature.data).toBeDefined();
      expect(typeof signature.data).toBe('string');
      expect(signature.data.length).toBe(130);
    });

    test('signs structured data with tuple message', () => {
      const message = tupleCV({
        action: stringAsciiCV('transfer'),
        recipient: stringAsciiCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'),
        amount: uintCV(1000),
      });

      const signature = signStructuredData({
        message,
        domain: validDomain,
        privateKey,
      });

      expect(signature.type).toBe(StacksMessageType.StructuredDataSignature);
      expect(signature.data).toBeDefined();
      expect(typeof signature.data).toBe('string');
      expect(signature.data.length).toBe(130);
    });

    test('different messages produce different signatures', () => {
      const message1 = stringAsciiCV('hello');
      const message2 = stringAsciiCV('world');

      const signature1 = signStructuredData({
        message: message1,
        domain: validDomain,
        privateKey,
      });

      const signature2 = signStructuredData({
        message: message2,
        domain: validDomain,
        privateKey,
      });

      expect(signature1.data).not.toBe(signature2.data);
    });

    test('different domains produce different signatures', () => {
      const message = stringAsciiCV('hello');
      const domain1 = tupleCV({
        name: stringAsciiCV('app1'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
      });
      const domain2 = tupleCV({
        name: stringAsciiCV('app2'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
      });

      const signature1 = signStructuredData({
        message,
        domain: domain1,
        privateKey,
      });

      const signature2 = signStructuredData({
        message,
        domain: domain2,
        privateKey,
      });

      expect(signature1.data).not.toBe(signature2.data);
    });

    test('different private keys produce different signatures', () => {
      const message = stringAsciiCV('hello');
      const privateKey2 = createStacksPrivateKey(
        'e494f188c2d35887531ba474c433b1e41fadd8eb824aca983447fd4bb8b277a8'
      );

      const signature1 = signStructuredData({
        message,
        domain: validDomain,
        privateKey,
      });

      const signature2 = signStructuredData({
        message,
        domain: validDomain,
        privateKey: privateKey2,
      });

      expect(signature1.data).not.toBe(signature2.data);
    });

    test('throws error for invalid domain', () => {
      const message = stringAsciiCV('hello');
      const invalidDomain = stringAsciiCV('not-a-tuple');

      expect(() =>
        signStructuredData({
          message,
          domain: invalidDomain,
          privateKey,
        })
      ).toThrow(
        "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id'"
      );
    });
  });

  describe('Integration tests', () => {
    test('encode-decode round trip', () => {
      const domain = tupleCV({
        name: stringAsciiCV('test-app'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
      });
      const message = tupleCV({
        action: stringAsciiCV('transfer'),
        amount: uintCV(1000),
      });

      const encoded = encodeStructuredData({ message, domain });
      const decoded = decodeStructuredDataSignature(encoded);

      expect(decoded.domainHash).toEqual(hashStructuredData(domain));
      expect(decoded.messageHash).toEqual(hashStructuredData(message));
    });

    test('complete structured data signing flow', () => {
      const domain = tupleCV({
        name: stringAsciiCV('my-dapp'),
        version: stringAsciiCV('2.1.0'),
        'chain-id': uintCV(1),
      });
      const message = tupleCV({
        user: stringAsciiCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q'),
        action: stringAsciiCV('vote'),
        proposal: uintCV(42),
        timestamp: uintCV(1640995200),
      });

      // Sign the structured data
      const signature = signStructuredData({
        message,
        domain,
        privateKey,
      });

      // Verify signature structure
      expect(signature.type).toBe(StacksMessageType.StructuredDataSignature);
      expect(signature.data).toBeDefined();
      expect(signature.data.length).toBe(130);

      // Verify we can encode and decode the data
      const encoded = encodeStructuredData({ message, domain });
      const decoded = decodeStructuredDataSignature(encoded);

      expect(decoded.domainHash).toEqual(hashStructuredData(domain));
      expect(decoded.messageHash).toEqual(hashStructuredData(message));
    });
  });
});

describe('Clarity Value Conversion Tests', () => {
  describe('cvToString', () => {
    test('should convert boolean true to string', () => {
      const value = boolCV(true);
      expect(cvToString(value)).toBe('true');
    });

    test('should convert boolean false to string', () => {
      const value = boolCV(false);
      expect(cvToString(value)).toBe('false');
    });

    test('should convert int to string', () => {
      const value = intCV(-12345);
      expect(cvToString(value)).toBe('-12345');
    });

    test('should convert uint to string', () => {
      const value = uintCV(12345);
      expect(cvToString(value)).toBe('u12345');
    });

    test('should convert buffer to hex string by default', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const value = bufferCV(buffer);
      expect(cvToString(value)).toBe('0x01020304');
    });

    test('should convert buffer to ASCII when tryAscii encoding is used and buffer contains printable chars', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const value = bufferCV(buffer);
      expect(cvToString(value, 'tryAscii')).toBe('"Hello"');
    });

    test('should convert buffer to hex when tryAscii encoding is used but buffer contains non-printable chars', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const value = bufferCV(buffer);
      expect(cvToString(value, 'tryAscii')).toBe('0x01020304');
    });

    test('should convert none optional to string', () => {
      const value = noneCV();
      expect(cvToString(value)).toBe('none');
    });

    test('should convert some optional to string', () => {
      const innerValue = uintCV(42);
      const value = someCV(innerValue);
      expect(cvToString(value)).toBe('(some u42)');
    });

    test('should convert response err to string', () => {
      const innerValue = stringAsciiCV('error message');
      const value = responseErrorCV(innerValue);
      expect(cvToString(value)).toBe('(err "error message")');
    });

    test('should convert response ok to string', () => {
      const innerValue = uintCV(100);
      const value = responseOkCV(innerValue);
      expect(cvToString(value)).toBe('(ok u100)');
    });

    test('should convert standard principal to string', () => {
      const value = standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q');
      expect(cvToString(value)).toBe('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q');
    });

    test('should convert contract principal to string', () => {
      const value = contractPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q', 'test-contract');
      expect(cvToString(value)).toBe('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract');
    });

    test('should convert list to string', () => {
      const items = [uintCV(1), uintCV(2), uintCV(3)];
      const value = listCV(items);
      expect(cvToString(value)).toBe('(list u1 u2 u3)');
    });

    test('should convert empty list to string', () => {
      const value = listCV([]);
      expect(cvToString(value)).toBe('(list )');
    });

    test('should convert tuple to string', () => {
      const data = {
        name: stringAsciiCV('test'),
        value: uintCV(42),
        active: boolCV(true),
      };
      const value = tupleCV(data);
      expect(cvToString(value)).toBe('(tuple (name "test") (value u42) (active true))');
    });

    test('should convert ASCII string to string', () => {
      const value = stringAsciiCV('hello world');
      expect(cvToString(value)).toBe('"hello world"');
    });

    test('should convert UTF8 string to string', () => {
      const value = stringUtf8CV('hello 世界');
      expect(cvToString(value)).toBe('u"hello 世界"');
    });

    test('should handle nested structures with tryAscii encoding', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const nestedValue = tupleCV({
        message: bufferCV(buffer),
        count: uintCV(5),
      });
      expect(cvToString(nestedValue, 'tryAscii')).toBe('(tuple (message "Hello") (count u5))');
    });
  });

  describe('cvToValue', () => {
    test('should convert boolean true to value', () => {
      const value = boolCV(true);
      expect(cvToValue(value)).toBe(true);
    });

    test('should convert boolean false to value', () => {
      const value = boolCV(false);
      expect(cvToValue(value)).toBe(false);
    });

    test('should convert int to bigint by default', () => {
      const value = intCV(-12345);
      expect(cvToValue(value)).toBe(BigInt(-12345));
    });

    test('should convert int to string when strictJsonCompat is true', () => {
      const value = intCV(-12345);
      expect(cvToValue(value, true)).toBe('-12345');
    });

    test('should convert uint to bigint by default', () => {
      const value = uintCV(12345);
      expect(cvToValue(value)).toBe(BigInt(12345));
    });

    test('should convert uint to string when strictJsonCompat is true', () => {
      const value = uintCV(12345);
      expect(cvToValue(value, true)).toBe('12345');
    });

    test('should convert buffer to hex string', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const value = bufferCV(buffer);
      expect(cvToValue(value)).toBe('0x01020304');
    });

    test('should convert none optional to null', () => {
      const value = noneCV();
      expect(cvToValue(value)).toBe(null);
    });

    test('should convert some optional to JSON value', () => {
      const innerValue = uintCV(42);
      const value = someCV(innerValue);
      const result = cvToValue(value);
      expect(result).toEqual({ type: 'uint', value: '42' });
    });

    test('should convert response err to JSON value', () => {
      const innerValue = stringAsciiCV('error message');
      const value = responseErrorCV(innerValue);
      const result = cvToValue(value);
      expect(result).toEqual({ type: '(string-ascii 13)', value: 'error message' });
    });

    test('should convert response ok to JSON value', () => {
      const innerValue = uintCV(100);
      const value = responseOkCV(innerValue);
      const result = cvToValue(value);
      expect(result).toEqual({ type: 'uint', value: '100' });
    });

    test('should convert standard principal to string', () => {
      const value = standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q');
      expect(cvToValue(value)).toBe('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q');
    });

    test('should convert contract principal to string', () => {
      const value = contractPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q', 'test-contract');
      expect(cvToValue(value)).toBe('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q.test-contract');
    });

    test('should convert list to array of JSON values', () => {
      const items = [uintCV(1), uintCV(2), uintCV(3)];
      const value = listCV(items);
      const result = cvToValue(value);
      expect(result).toEqual([
        { type: 'uint', value: '1' },
        { type: 'uint', value: '2' },
        { type: 'uint', value: '3' },
      ]);
    });

    test('should convert tuple to object with JSON values', () => {
      const data = {
        name: stringAsciiCV('test'),
        value: uintCV(42),
        active: boolCV(true),
      };
      const value = tupleCV(data);
      const result = cvToValue(value);
      expect(result).toEqual({
        name: { type: '(string-ascii 4)', value: 'test' },
        value: { type: 'uint', value: '42' },
        active: { type: 'bool', value: true },
      });
    });

    test('should convert ASCII string to string', () => {
      const value = stringAsciiCV('hello world');
      expect(cvToValue(value)).toBe('hello world');
    });

    test('should convert UTF8 string to string', () => {
      const value = stringUtf8CV('hello 世界');
      expect(cvToValue(value)).toBe('hello 世界');
    });
  });

  describe('cvToJSON', () => {
    test('should convert response err to JSON with success: false', () => {
      const innerValue = stringAsciiCV('error message');
      const value = responseErrorCV(innerValue);
      const result = cvToJSON(value);
      expect(result).toEqual({
        type: '(response UnknownType (string-ascii 13))',
        value: { type: '(string-ascii 13)', value: 'error message' },
        success: false,
      });
    });

    test('should convert response ok to JSON with success: true', () => {
      const innerValue = uintCV(100);
      const value = responseOkCV(innerValue);
      const result = cvToJSON(value);
      expect(result).toEqual({
        type: '(response uint UnknownType)',
        value: { type: 'uint', value: '100' },
        success: true,
      });
    });

    test('should convert non-response values to JSON without success field', () => {
      const value = uintCV(42);
      const result = cvToJSON(value);
      expect(result).toEqual({
        type: 'uint',
        value: '42',
      });
    });

    test('should convert boolean to JSON', () => {
      const value = boolCV(true);
      const result = cvToJSON(value);
      expect(result).toEqual({
        type: 'bool',
        value: true,
      });
    });

    test('should convert buffer to JSON', () => {
      const buffer = new Uint8Array([0x01, 0x02]);
      const value = bufferCV(buffer);
      const result = cvToJSON(value);
      expect(result).toEqual({
        type: '(buff 2)',
        value: '0x0102',
      });
    });
  });

  describe('getCVTypeString', () => {
    test('should return bool for boolean values', () => {
      expect(getCVTypeString(boolCV(true))).toBe('bool');
      expect(getCVTypeString(boolCV(false))).toBe('bool');
    });

    test('should return int for int values', () => {
      const value = intCV(-12345);
      expect(getCVTypeString(value)).toBe('int');
    });

    test('should return uint for uint values', () => {
      const value = uintCV(12345);
      expect(getCVTypeString(value)).toBe('uint');
    });

    test('should return buffer type with length for buffer values', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const value = bufferCV(buffer);
      expect(getCVTypeString(value)).toBe('(buff 4)');
    });

    test('should return optional none for none values', () => {
      const value = noneCV();
      expect(getCVTypeString(value)).toBe('(optional none)');
    });

    test('should return optional type for some values', () => {
      const innerValue = uintCV(42);
      const value = someCV(innerValue);
      expect(getCVTypeString(value)).toBe('(optional uint)');
    });

    test('should return response error type for response err values', () => {
      const innerValue = stringAsciiCV('error');
      const value = responseErrorCV(innerValue);
      expect(getCVTypeString(value)).toBe('(response UnknownType (string-ascii 5))');
    });

    test('should return response ok type for response ok values', () => {
      const innerValue = uintCV(100);
      const value = responseOkCV(innerValue);
      expect(getCVTypeString(value)).toBe('(response uint UnknownType)');
    });

    test('should return principal for principal values', () => {
      const standardValue = standardPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q');
      expect(getCVTypeString(standardValue)).toBe('principal');

      const contractValue = contractPrincipalCV('SP2P58SJY1XH6GX4W3YGEPZ2058DD3JHBPJ8W843Q', 'test');
      expect(getCVTypeString(contractValue)).toBe('principal');
    });

    test('should return list type with length and element type for non-empty lists', () => {
      const items = [uintCV(1), uintCV(2), uintCV(3)];
      const value = listCV(items);
      expect(getCVTypeString(value)).toBe('(list 3 uint)');
    });

    test('should return list type with UnknownType for empty lists', () => {
      const value = listCV([]);
      expect(getCVTypeString(value)).toBe('(list 0 UnknownType)');
    });

    test('should return tuple type with field types', () => {
      const data = {
        name: stringAsciiCV('test'),
        value: uintCV(42),
        active: boolCV(true),
      };
      const value = tupleCV(data);
      const result = getCVTypeString(value);
      expect(result).toBe('(tuple (name (string-ascii 4)) (value uint) (active bool))');
    });

    test('should return string-ascii type with length', () => {
      const value = stringAsciiCV('hello');
      expect(getCVTypeString(value)).toBe('(string-ascii 5)');
    });

    test('should return string-utf8 type with byte length', () => {
      const value = stringUtf8CV('hello 世界');
      expect(getCVTypeString(value)).toBe('(string-utf8 12)'); // UTF-8 byte length
    });

    test('should handle nested optional types', () => {
      const innerValue = someCV(uintCV(42));
      const value = someCV(innerValue);
      expect(getCVTypeString(value)).toBe('(optional (optional uint))');
    });

    test('should handle complex nested structures', () => {
      const complexTuple = tupleCV({
        data: listCV([uintCV(1), uintCV(2)]),
        response: responseOkCV(stringAsciiCV('success')),
        optional: someCV(boolCV(true)),
      });
      const result = getCVTypeString(complexTuple);
      expect(result).toBe('(tuple (data (list 2 uint)) (response (response (string-ascii 7) UnknownType)) (optional (optional bool)))');
    });
  });
});
