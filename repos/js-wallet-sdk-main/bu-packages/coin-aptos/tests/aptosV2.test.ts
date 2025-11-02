import { describe, expect, test } from '@jest/globals';

// V2 Imports
import { VERSION } from '../src/v2/version';
import { AptosWallet, AptosParam, BuildSimulateTxParams } from '../src';
import { signTransaction } from '../src/v2/internal/transactionSubmission';
import { multiSignerScriptBytecode } from './aptos.test';
import {
  Account,
  Ed25519Account,
  SingleKeyAccount,
  MultiKeyAccount,
} from '../src/v2/account';
import { AptosConfig, FungibleAsset, Transaction, Network } from '../src/v2';
import {
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  Secp256k1Signature,
  AnyPublicKey,
  AnySignature,
  MultiKey,
  MultiKeySignature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
} from '../src/v2/core/crypto';
import { convertSigningMessage } from '../src/v2/core/crypto/utils';
import { AuthenticationKey } from '../src/v2/core/authenticationKey';
import { AccountAddress } from '../src/v2/core/accountAddress';
import { SigningSchemeInput, SigningScheme } from '../src/v2/types';
import {
  AccountAuthenticatorEd25519,
  AccountAuthenticatorSingleKey,
  AccountAuthenticatorMultiKey,
} from '../src/v2/transactions/authenticator/account';
import {
  RawTransaction,
  ChainId,
  TransactionPayloadEntryFunction,
  EntryFunction,
  SimpleTransaction,
  ModuleId,
  Identifier,
  MultiAgentTransaction,
  TypeTag,
  TypeTagStruct,
  TypeTagVector,
  TypeTagGeneric,
  TypeTagReference,
  parseTypeTag,
  generateSignedTransaction,
  generateSignedTransactionForSimulation,
} from '../src/v2/transactions';
import {
  generateSigningMessageForTransaction,
  generateSigningMessage,
  generateSigningMessageForSerializable,
} from '../src/v2/transactions';
import {
  convertNumber,
  isLargeNumber,
  isEmptyOption,
  throwTypeMismatch,
  findFirstNonSignerArg,
} from '../src/v2/transactions/transactionBuilder/helpers';
// checkType is not exported, will test indirectly
import { Hex } from '../src/v2/core/hex';
import {
  MoveVector,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  Bool,
  MoveString,
  Serializer,
  Deserializer,
} from '../src/v2/bcs';
import { base, SignTxParams } from '@okxweb3/coin-base';

describe('Aptos V2 SDK Tests', () => {
  test('sign for simple_sponsor_transaction', async () => {
    const privateKey =
      '4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey.slice(0, 64));
    const senderAccount = Account.fromPrivateKey({
      privateKey: ed25519PrivateKey,
    });
    expect(senderAccount.accountAddress.toString()).toBe(
      '0x7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c19'
    );
    console.log('senderAccount :', senderAccount.accountAddress.toString());

    const from = senderAccount.accountAddress;
    const to = senderAccount.accountAddress;
    const amount = 1000;
    // get module from the full node and add into the config
    const m =
      '{"abi":{"address":"0x1","name":"aptos_account","friends":["0x1::genesis","0x1::resource_account"],"exposed_functions":[{"name":"assert_account_exists","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"assert_account_is_registered_for_apt","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"batch_transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"batch_transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"can_receive_direct_coin_transfers","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["bool"]},{"name":"create_account","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"deposit_coins","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["address","0x1::coin::Coin<T0>"],"return":[]},{"name":"set_allow_direct_coin_transfers","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address","u64"],"return":[]},{"name":"transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","address","u64"],"return":[]}],"structs":[{"name":"DirectCoinTransferConfigUpdatedEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"new_allow_direct_transfers","type":"bool"}]},{"name":"DirectTransferConfig","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"allow_arbitrary_coin_transfers","type":"bool"},{"name":"update_coin_transfer_events","type":"0x1::event::EventHandle<0x1::aptos_account::DirectCoinTransferConfigUpdatedEvent>"}]}]}}';
    const aptosConfig = new AptosConfig({
      network: Network.MAINNET,
      moveModule: m,
    });
    const transaction = new Transaction(aptosConfig);
    // let rawTx: any;
    let res = transaction.build
      .simple({
        sender: from,
        withFeePayer: true,
        data: {
          function: '0x1::aptos_account::transfer',
          functionArguments: [to, amount],
        },
        options: {
          maxGasAmount: 10000,
          gasUnitPrice: 100,
          expireTimestamp: 1660131587,
          chainId: 1,
          accountSequenceNumber: 1,
        },
      })
      .then((rawTx) => {
        // Alice signs
        const senderSignature = transaction.sign({
          signer: senderAccount,
          transaction: rawTx,
        });
        console.log('senderSignature :', senderSignature.bcsToHex().toString());
        console.log(
          'rawTx feePayerAddress :',
          rawTx.feePayerAddress?.toString()
        );
        console.log('rawTx :', rawTx.rawTransaction.bcsToHex().toString());
        console.log(
          'rawTx feePayerAddress :',
          rawTx.feePayerAddress?.toString()
        );
        console.log(
          'rawTx secondarySignerAddresses :',
          rawTx.secondarySignerAddresses
        );
        return {
          rawTransaction: rawTx.rawTransaction.bcsToHex().toString(),
          senderSignature: senderSignature.bcsToHex().toString(),
        };
      });

    // res.then(raw => {
    //     console.log(raw);
    // });
    let { rawTransaction } = await res;
    expect(rawTransaction).toEqual(
      '0x7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c1901000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002207eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c1908e803000000000000102700000000000064000000000000000399f3620000000001'
    );
  });

  test('sign as fee payer', async () => {
    const sponsor = Account.generate();
    const sponsorAddress = sponsor.accountAddress;
    const m =
      '{"abi":{"address":"0x1","name":"aptos_account","friends":["0x1::genesis","0x1::resource_account"],"exposed_functions":[{"name":"assert_account_exists","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"assert_account_is_registered_for_apt","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"batch_transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"batch_transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"can_receive_direct_coin_transfers","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["bool"]},{"name":"create_account","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"deposit_coins","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["address","0x1::coin::Coin<T0>"],"return":[]},{"name":"set_allow_direct_coin_transfers","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address","u64"],"return":[]},{"name":"transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","address","u64"],"return":[]}],"structs":[{"name":"DirectCoinTransferConfigUpdatedEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"new_allow_direct_transfers","type":"bool"}]},{"name":"DirectTransferConfig","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"allow_arbitrary_coin_transfers","type":"bool"},{"name":"update_coin_transfer_events","type":"0x1::event::EventHandle<0x1::aptos_account::DirectCoinTransferConfigUpdatedEvent>"}]}]}}';
    const aptosConfig = new AptosConfig({
      network: Network.MAINNET,
      moveModule: m,
    });
    const transaction = new Transaction(aptosConfig);

    const rawTransactionHex =
      '0xa9389f2a1cd49bed52d3d8c236afe113c74087911392954a82bc9355976530ef01000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002207cdc46c4dbfa421989105412cdf4fe74f9ffa64cfa5835522d1ab43f4d5e16f508e803000000000000102700000000000064000000000000000399f3620000000001';
    const deserializer = new Deserializer(base.fromHex(rawTransactionHex));
    const rawTransaction = RawTransaction.deserialize(deserializer);
    // const raw = {
    //     rawTransaction: rawTransaction,
    //     feePayerAddress: AccountAddress.ZERO,
    //     secondarySignerAddresses: undefined
    // };
    const raw = new SimpleTransaction(rawTransaction, AccountAddress.ZERO);
    // Sponsor signs
    const sponsorSignature = transaction.signAsFeePayer({
      signer: sponsor,
      transaction: raw,
    });
    console.log('sponsorSignature :', sponsorSignature.bcsToHex().toString());
    console.log('raw :', raw.rawTransaction.bcsToHex().toString());
    console.log('raw feePayerAddress :', raw.feePayerAddress?.toString());
    console.log('raw secondarySignerAddresses :', raw.secondarySignerAddresses);
    console.log('sponsorAddress :', sponsorAddress.toString());
    const signedTx = await transaction.submit.simple({
      transaction: raw,
      senderAuthenticator: sponsorSignature,
      feePayerAuthenticator: sponsorSignature,
    });
    console.log('signedTx :', base.toHex(signedTx));
    const partial =
      /^a9389f2a1cd49bed52d3d8c236afe113c74087911392954a82bc9355976530ef01000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002207cdc46c4dbfa421989105412cdf4fe74f9ffa64cfa5835522d1ab43f4d5e16f508e803000000000000102700000000000064000000000000000399f3620000000001030020[0-9a-fA-F]+$/;
    expect(base.toHex(signedTx)).toMatch(partial);
  });

  test('simulate sign for simple_sponsor_transaction', async () => {
    const privateKey =
      '4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey.slice(0, 64));
    const senderAccount = Account.fromPrivateKey({
      privateKey: ed25519PrivateKey,
    });
    expect(senderAccount.accountAddress.toString()).toBe(
      '0x7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c19'
    );
    console.log('senderAccount :', senderAccount.accountAddress.toString());

    const from = senderAccount.accountAddress;
    const to = senderAccount.accountAddress;
    const amount = 1000;
    // get module from the full node and add into the config
    const m =
      '{"abi":{"address":"0x1","name":"aptos_account","friends":["0x1::genesis","0x1::resource_account"],"exposed_functions":[{"name":"assert_account_exists","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"assert_account_is_registered_for_apt","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"batch_transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"batch_transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"can_receive_direct_coin_transfers","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["bool"]},{"name":"create_account","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"deposit_coins","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["address","0x1::coin::Coin<T0>"],"return":[]},{"name":"set_allow_direct_coin_transfers","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address","u64"],"return":[]},{"name":"transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","address","u64"],"return":[]}],"structs":[{"name":"DirectCoinTransferConfigUpdatedEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"new_allow_direct_transfers","type":"bool"}]},{"name":"DirectTransferConfig","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"allow_arbitrary_coin_transfers","type":"bool"},{"name":"update_coin_transfer_events","type":"0x1::event::EventHandle<0x1::aptos_account::DirectCoinTransferConfigUpdatedEvent>"}]}]}}';
    const aptosConfig = new AptosConfig({
      network: Network.MAINNET,
      moveModule: m,
    });
    const transaction = new Transaction(aptosConfig);
    // let rawTx: any;
    let res = transaction.build
      .simple({
        sender: from,
        withFeePayer: true,
        data: {
          function: '0x1::aptos_account::transfer',
          functionArguments: [to, amount],
        },
        options: {
          maxGasAmount: 10000,
          gasUnitPrice: 100,
          expireTimestamp: 1660131587,
          chainId: 1,
          accountSequenceNumber: 1,
        },
      })
      .then((rawTx) => {
        // Alice signs
        const senderSignature = transaction.sign({
          signer: senderAccount,
          transaction: rawTx,
        });
        console.log('senderSignature :', senderSignature.bcsToHex().toString());
        console.log(
          'rawTx feePayerAddress :',
          rawTx.feePayerAddress?.toString()
        );
        console.log('rawTx :', rawTx.rawTransaction.bcsToHex().toString());
        console.log(
          'rawTx feePayerAddress :',
          rawTx.feePayerAddress?.toString()
        );
        console.log(
          'rawTx secondarySignerAddresses :',
          rawTx.secondarySignerAddresses
        );
        return {
          rawTransaction: rawTx.rawTransaction.bcsToHex().toString(),
          senderSignature: senderSignature.bcsToHex().toString(),
        };
      });

    let response = res.then((raw) => {
      const privateKey =
        '4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';
      const ed25519PrivateKey = new Ed25519PrivateKey(privateKey.slice(0, 64));
      const senderAccount = Account.fromPrivateKey({
        privateKey: ed25519PrivateKey,
      });
      const m =
        '{"abi":{"address":"0x1","name":"aptos_account","friends":["0x1::genesis","0x1::resource_account"],"exposed_functions":[{"name":"assert_account_exists","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"assert_account_is_registered_for_apt","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"batch_transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"batch_transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"can_receive_direct_coin_transfers","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["bool"]},{"name":"create_account","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["address"],"return":[]},{"name":"deposit_coins","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["address","0x1::coin::Coin<T0>"],"return":[]},{"name":"set_allow_direct_coin_transfers","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"transfer","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address","u64"],"return":[]},{"name":"transfer_coins","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","address","u64"],"return":[]}],"structs":[{"name":"DirectCoinTransferConfigUpdatedEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"new_allow_direct_transfers","type":"bool"}]},{"name":"DirectTransferConfig","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"allow_arbitrary_coin_transfers","type":"bool"},{"name":"update_coin_transfer_events","type":"0x1::event::EventHandle<0x1::aptos_account::DirectCoinTransferConfigUpdatedEvent>"}]}]}}';
      const aptosConfig = new AptosConfig({
        network: Network.MAINNET,
        moveModule: m,
      });
      const transaction = new Transaction(aptosConfig);
      const rawTransactionHex = raw.rawTransaction;
      const deserializer = new Deserializer(base.fromHex(rawTransactionHex));
      const rawTransaction = RawTransaction.deserialize(deserializer);
      // const rawTxn = {
      //     rawTransaction: rawTransaction,
      //     feePayerAddress: AccountAddress.ZERO,
      //     secondarySignerAddresses: undefined
      // };
      const rawTxn = new SimpleTransaction(rawTransaction, AccountAddress.ZERO);
      const responce = transaction.simulate.simple({
        signerPublicKey: senderAccount.publicKey,
        transaction: rawTxn,
        feePayerPublicKey: senderAccount.publicKey,
      });
      return responce;
    });

    const r = await response;
    let a = r as any;
    console.log(base.toHex(a as Uint8Array));
    const expected =
      '7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c1901000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002207eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c1908e803000000000000102700000000000064000000000000000399f3620000000001030020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc264000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc264000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    expect(base.toHex(a as Uint8Array)).toEqual(expected);
  });

  test('fungible asset transfer', async () => {
    const privateKey =
      '4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey.slice(0, 64));
    const senderAccount = Account.fromPrivateKey({
      privateKey: ed25519PrivateKey,
    });
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const fungibleAsset = new FungibleAsset(aptosConfig);
    const transaction = new Transaction(aptosConfig);
    const metadataAddress =
      '0x9a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb';
    // normal fungible asset transfer between primary stores
    const transferFungibleAssetRawTransaction =
      await fungibleAsset.transferFungibleAsset({
        senderAddress: senderAccount.accountAddress,
        fungibleAssetMetadataAddress: AccountAddress.from(metadataAddress),
        recipient: senderAccount.accountAddress,
        amount: 1,
        options: {
          maxGasAmount: 200000,
          gasUnitPrice: 100,
          expireTimestamp: 1716984271,
          chainId: 135,
          accountSequenceNumber: 6,
        },
      });
    const authenticator = signTransaction({
      signer: senderAccount,
      transaction: transferFungibleAssetRawTransaction,
    });
    const signedTx = generateSignedTransaction({
      transaction: transferFungibleAssetRawTransaction,
      senderAuthenticator: authenticator,
    });
    const signedTransaction = base.toHex(signedTx);
    expect(signedTransaction).toBe(
      '7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c190600000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d657461646174610003209a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb207eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c19080100000000000000400d0300000000006400000000000000cf19576600000000870020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26402928cd5ba1f6c0a9846ef74c8ef076ae2e5065a1b4295ff73e6381e46736c488f6cff2921f31fb18db434351b623424e389dc0773d3879e7fdec478eeeea9f0d'
    );
  });

  test('fungible asset transfer for simulate', async () => {
    const privateKey =
      '4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKey.slice(0, 64));
    const senderAccount = Account.fromPrivateKey({
      privateKey: ed25519PrivateKey,
    });
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const fungibleAsset = new FungibleAsset(aptosConfig);
    const transaction = new Transaction(aptosConfig);
    const metadataAddress =
      '0x9a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb';
    // normal fungible asset transfer between primary stores
    const transferFungibleAssetRawTransaction =
      await fungibleAsset.transferFungibleAsset({
        senderAddress: senderAccount.accountAddress,
        fungibleAssetMetadataAddress: AccountAddress.from(metadataAddress),
        recipient: senderAccount.accountAddress,
        amount: 1,
        options: {
          maxGasAmount: 200000,
          gasUnitPrice: 100,
          expireTimestamp: 1716984271,
          chainId: 135,
          accountSequenceNumber: 6,
        },
      });
    const signedTx = generateSignedTransactionForSimulation({
      signerPublicKey: senderAccount.publicKey,
      transaction: transferFungibleAssetRawTransaction,
    });
    const signedTransaction = base.toHex(signedTx);
    expect(signedTransaction).toBe(
      '7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c190600000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d657461646174610003209a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb207eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c19080100000000000000400d0300000000006400000000000000cf19576600000000870020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc264000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('fungible asset transfer in wallet', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'fungible_asset_transfer',
      base: {
        sequenceNumber: '1',
        chainId: 135,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1660131587',
      },
      data: {
        fungibleAssetMetadataAddress:
          '0x9a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb',
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 10,
      },
    };
    const signParams: SignTxParams = {
      privateKey:
        '0x4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26',
      data: param,
    };
    const tx = await wallet.signTransaction(signParams);
    const expected =
      '7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c190100000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d657461646174610003209a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01080a00000000000000102700000000000064000000000000000399f36200000000870020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc2640ad8f15f58e020a0233dda36af20818722fa1ebaf30e5a7d3b8fb6f58a801187821b58c4f6b482d3c0fcf90824e8926ace17c2eb977674fe5bb22719116522702';
    expect(tx).toBe(expected);
  });

  test('fungible asset transfer for simulate in wallet', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'simulate_fungible_asset_transfer',
      base: {
        sequenceNumber: '1',
        chainId: 135,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1660131587',
      },
      data: {
        fungibleAssetMetadataAddress:
          '0x9a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb',
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 10,
      },
    };
    const signParams: SignTxParams = {
      privateKey:
        'f4118e8a1193bf164ac2223f7d0e9c625d6d5ca19d2fbfea7c55d3c0d0284cd0312a81c872aad3a910157ca7b05e70fe2e62aed55b4a14ad033db4556c1547dc',
      data: param,
    };
    const tx = await wallet.signTransaction(signParams);
    const expected =
      '8e6d339ff6096080a4d91c291b297d3814ff9daa34e0f5562d4e7d442cafecdc0100000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d657461646174610003209a2c5e9515410f90502fedbbb2ee2deb6eb51571d295ead093dcea8588c66ddb200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01080a00000000000000102700000000000064000000000000000399f36200000000870020312a81c872aad3a910157ca7b05e70fe2e62aed55b4a14ad033db4556c1547dc4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    expect(tx).toBe(expected);
  });

  test('fungible asset transfer test', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'fungible_asset_transfer',
      base: {
        sequenceNumber: '35',
        chainId: 2,
        maxGasAmount: '200000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1722643868',
      },
      data: {
        fungibleAssetMetadataAddress:
          '0x56bb65b28d8bd323d7fc538109bfad5a0be55568d834415022d9e3cae8428791',
        recipientAddress:
          '0xda29ba63f2a675e7e18180f175bc8c982b9c02ecb7248b8afbe496c2f4bb96a7',
        amount: 12,
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };
    let tx = await wallet.signTransaction(signParams);
    const expected =
      '986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922300000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d6574616461746100032056bb65b28d8bd323d7fc538109bfad5a0be55568d834415022d9e3cae842879120da29ba63f2a675e7e18180f175bc8c982b9c02ecb7248b8afbe496c2f4bb96a7080c00000000000000400d03000000000064000000000000009c75ad6600000000020020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b0540ba4ae92cc8db364d2dbef18924f6b4cf8607162098e06e2c72b31206420d6c1a7f27dfa8da49d7229b923c149fdb544bb560db312110c82880c08bcd231b730b';
    expect(tx).toBe(expected);
  });

  // test("simulate function call by a transaction abiv2", async () => {
  //     let wallet = new AptosWallet()
  //     const param: AptosParam = {
  //         type: "simulate",
  //         base: {
  //             sequenceNumber: "21",
  //             chainId: 1,
  //             maxGasAmount: "2000",
  //             gasUnitPrice: "100",
  //             // reserveFeeRatio: "1.1",
  //             expirationTimestampSecs: "1734434012",
  //         },
  //         data: {
  //             // abi: "[{\"bytecode\":\"0xa11ceb0b060000000b010002020208030a7d058701a50107ac02e7010893042006b3045f1092059f020ab1071e0ccf07f4190dc32118000000010700000207000003000100000401020000050103000006000100000700010000080403000009000100000a050600000b000100000c070800000d020100000e030100000f09030000100a03000011030600001200010000130b0c0000140b0c0000150d0e0000160f0e00001710010000181001000019020b00001a000100001b0e010002080108010108010104010301060801020608010608010102010800020801010206080103020608000302030302030103070801030300030708000303020801020a03030303010101030308010101020101040303030801030303030801030303020308010305010101080101070303030303030304020302021501030303030303030303030303030101010301080108000503010404040303010307030303030308010304753235360544553235360455323536036164640761735f753132380661735f75363406626974616e64056269746f72046269747306626974786f7207636f6d70617265036469760d64753235365f746f5f753235360966726f6d5f753132380866726f6d5f75363403676574056765745f64116c656164696e675f7a65726f735f753634036d756c0f6f766572666c6f77696e675f6164640f6f766572666c6f77696e675f73756203707574057075745f640373686c037368720a73706c69745f7531323803737562047a65726f02763002763102763202763302763402763502763602763765c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607030800000000000000000308030000000000000003080200000000000000020100030801000000000000000201020201010410ffffffffffffffffffffffffffffffff0410ffffffffffffffff000000000000000003080400000000000000126170746f733a3a6d657461646174615f76318a020400000000000000000e45434153545f4f564552464c4f57395768656e2063616e277420636173742060553235366020746f206075313238602028652e672e206e756d62657220746f6f206c61726765292e01000000000000000f45574f5244535f4f564552464c4f573f5768656e20747279696e6720746f20676574206f722070757420776f726420696e746f2055323536206275742069742773206f7574206f6620696e6465782e020000000000000009454f564552464c4f57145768656e206d617468206f766572666c6f77732e03000000000000000c454449565f42595f5a45524f215768656e20617474656d7074656420746f20646976696465206279207a65726f2e00000002081c031d031e031f0320032103220323030102041c031d031e031f0300010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311100c070b0411100c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311100c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b020101000012200e0010001406000000000000000021040d0e00100114060000000000000000210c01050f090c010b01041205140700270e001002143531402f0e001003143516020201000013230e0010021406000000000000000021040d0e00100014060000000000000000210c01050f090c010b0104180e00100114060000000000000000210c02051a090c020b02041d051f0700270e001003140203000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031c11120b04060100000000000000160c0405040b050204000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031b11120b04060100000000000000160c0405040b050205000000152e0601000000000000000c030a03070923042405070a0007090a0317110c0c010a0106000000000000000024041f0b000106400000000000000007090b031706010000000000000016180b01110e3417020b03060100000000000000160c0305020b00060000000000000000110c0c020640000000000000000b02110e34170206000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031d11120b04060100000000000000160c0405040b050207010000152a07090c040a0406000000000000000024042405070b04060100000000000000170c040a000a04110c0c020a010a04110c0c030a020a032204230b01010b00010b020b0323042107060207050205020b01010b000107030208010000165711180c080e0011050c030e0111050c040a0406000000000000000022040d050f0701270a030a042304150b08020b030b04170c090b010a093311140c010e000e0111070c060a06070521042a0527080c02052e0b060703210c020b0204470a090640000000000000001a0c070e080a07110c0601000000000000000a0906400000000000000019332f1b0c050d080b070b0511120b000a0111170c000b01310111150c010a0906000000000000000021045005550b09060100000000000000170c09051e0b080209000000173c0e001004140e001005140e001006140e0010071412010c04090c050e00100814060000000000000000220419080c01051f0e00100914060000000000000000220c010b010424080c02052a0e00100a14060000000000000000220c020b02042f080c0305350e00100b14060000000000000000220c030b030439080c050b040b05020a0100000b0a0b0011160c010c020b010b020600000000000000000600000000000000001201020b0100000e040b0035110a020c010000152e0a010600000000000000002104090b001003140c04052c0a010601000000000000002104120b001002140c03052a0a0106020000000000000021041b0b001000140c0205280b0106030000000000000021042005240b00010704270b001001140c020b020c030b030c040b04020d000000185a0a010600000000000000002104090b001004140c0805580a010601000000000000002104120b001005140c0705560a0106020000000000000021041b0b001006140c0605540a010603000000000000002104240b001007140c0505520a0106040000000000000021042d0b001008140c0405500a010605000000000000002104360b001009140c03054e0a0106060000000000000021043f0b00100a140c02054c0b0106070000000000000021044405480b00010704270b00100b140c020b020c030b030c040b040c050b050c060b060c070b070c080b08020e000000194d0a000600000000000000002104063140020a0006ffffffff000000001c0c020a0031203006000000000000000021042e31200c030a03310126044b05170a020a03310117300601000000000000001c06000000000000000022042205270b033101170c03051231200b03173120160c01054931400c040a04310126044c05350a000a04310117300601000000000000001c06000000000000000022044005450b043101170c04053031400b04170c010b0102052705450f0100001a8c0106000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000012000c160600000000000000000c0c0a0c07092304800105110600000000000000000c070e010a0c110c0c060600000000000000000c0d0a0d070923047b051e0e000a0d110c0c050a05060000000000000000220429080c02052d0a07060000000000000000220c020b0204760b05350a06351811160c0e0c0a0e160a0c0a0d16110d0c090b0e0b0911100c100c0f0d160a0c0a0d160b0f11130b10044d0601000000000000000c03054f0600000000000000000c030b030c130e160a0c0a0d1606010000000000000016110d0c080b0a0b13160b0711100c110b0811100c120c0b0d160a0c0a0d16060100000000000000160b0b11130b110b121e04720601000000000000000c0405740600000000000000000c040b040c070b0d060100000000000000160c0d05190b0c060100000000000000160c0c050c0b1611090c140c150b1420048801058a010702270b1502100000001b220b00350c040b01350c050a040a05160c060a0607082404180b0607081732010000000000000000000000000000001734080c030c02051f0b040b051634090c030c020b020b0302110000001c1b0a000a012304120b010b00170c040708340b041706010000000000000016080c030c0205180b000b0117090c030c020b020b0302120000000e290a010600000000000000002104090b020b000f031505280a010601000000000000002104120b020b000f021505280a0106020000000000000021041b0b020b000f001505280b0106030000000000000021042005240b00010704270b020b000f011502130000000e4d0a010600000000000000002104090b020b000f0415054c0a010601000000000000002104120b020b000f0515054c0a0106020000000000000021041b0b020b000f0615054c0a010603000000000000002104240b020b000f0715054c0a0106040000000000000021042d0b020b000f0815054c0a010605000000000000002104360b020b000f0915054c0a0106060000000000000021043f0b020b000f0a15054c0b0106070000000000000021044405480b00010704270b020b000f0b1502140100001d4e11180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a030a0817110c0a02332f0c050d070a030b0511120b03060100000000000000160c03050e0a0206000000000000000024044c0a08060100000000000000160c040a04070923044c05320e070a04110c0e000a04060100000000000000170a0817110c31400a02331730160c060d070a040b0611120b04060100000000000000160c04052d0b0702150100001d5211180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a03110c0a0233300c050d070a030a08170b0511120b03060100000000000000160c03050e0a020600000000000000002404500a08060100000000000000160c040a04070923045005320e070a040a081706010000000000000017110c0e000a04110c31400a0233172f160c060d070a040a0817060100000000000000170b0611120b04060100000000000000160c04052d0b0702160000000b0d0a00314030340c010b0032ffffffffffffffff00000000000000001c340c020b010b020217010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311110c070b0411110c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311110c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b02180100000e0606000000000000000006000000000000000006000000000000000006000000000000000012010201020103010101000000000100020003000400050006000700\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"u256\",\"friends\":[],\"exposed_functions\":[{\"name\":\"add\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"as_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u128\"]},{\"name\":\"as_u64\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u64\"]},{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u8\"]},{\"name\":\"div\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"from_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"from_u64\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"get\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"shl\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u8\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"shr\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u8\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"sub\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"zero\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]}],\"structs\":[{\"name\":\"DU256\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v0\",\"type\":\"u64\"},{\"name\":\"v1\",\"type\":\"u64\"},{\"name\":\"v2\",\"type\":\"u64\"},{\"name\":\"v3\",\"type\":\"u64\"},{\"name\":\"v4\",\"type\":\"u64\"},{\"name\":\"v5\",\"type\":\"u64\"},{\"name\":\"v6\",\"type\":\"u64\"},{\"name\":\"v7\",\"type\":\"u64\"}]},{\"name\":\"U256\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v0\",\"type\":\"u64\"},{\"name\":\"v1\",\"type\":\"u64\"},{\"name\":\"v2\",\"type\":\"u64\"},{\"name\":\"v3\",\"type\":\"u64\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000b010002020204030628052e1e074c490895012006b5012510da01780ad202050cd702d5010dac0402000000010700000200010000030203000004040200000503020000060502000007060700000804020000090208000206080006080001020108000103020800030203030106080001010104000775713634783634075551363478363407636f6d70617265066465636f64650364697606656e636f6465086672616374696f6e0769735f7a65726f036d756c07746f5f75313238017665c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607020100030864000000000000000201020201010410ffffffffffffffff0000000000000000126170746f733a3a6d657461646174615f76316402000000000000000005455155414c185768656e206120616e6420622061726520657175616c732e6400000000000000124552525f4449564944455f42595f5a45524f1e5768656e20646976696465206279207a65726f20617474656d707465642e00000002010a0400010000091a0a001000140a0110001421040e0b01010b00010700020b001000140b011000142304180703020702020101000009070e0010001407041a340202010000090f0a0106000000000000000022040505070701270e001000140b01351a1200020301000009060b00350704181200020401000009100a0106000000000000000022040505070701270b00350704180b01351a1200020501000009060b00100014320000000000000000000000000000000021020601000009080e001000140b0135181200020701000009040e0010001402000000\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"uq64x64\",\"friends\":[],\"exposed_functions\":[{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u8\"]},{\"name\":\"decode\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u64\"]},{\"name\":\"div\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"encode\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"fraction\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"is_zero\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"bool\"]},{\"name\":\"mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"to_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u128\"]}],\"structs\":[{\"name\":\"UQ64x64\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v\",\"type\":\"u128\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000e0100180218910103a901ce0404f7059a01059107e10607f20da21108941f4006d41fe10210b522f7070aac2aeb010b972c140cab2cb7200de24c300e924d280000010101020103010401050106010701080009000a000b000c0800000d060200010001000e080200010001000f00020001000100100602000100010011080200010001001208020001000100130602000100010014060200010001001508000016070000170602000100010018060200010001021f04010001023405010001014b0600035704010601026a05010001026c05010001087107000a8001070006890107000ba001070000190001020000001a0001020000001b020100001c0101020000001d010100001e010100002003040200000021050602000000220107020000002308010000240101020000002506090200000026010a0000270b0b02000000280b0b0300000000290b0b0400000000002a0b0b020000002b0b0b03000000002c0b0b0400000000002d010c020000002e010d00002f010e020000003001060200000031010f00003208010000330403020000003510010200000036110702000000370801000038090102000000391204020000003a1301020000003b140100003c150100003d140100003e160100003f17040200000040181902000000411a010300000000421a01040000000000431a0102000000441a010300000000451a01040000000000461a01020000004708010000481b0102000000490801020000097a0107020000027b16180100057c082000027d20070100027e08010100027f220101000981012507000a82012627000a83012827000a7a292a000284012c0b0100098501012601000286012d18010002202e01010003870130010106098801320b00068a01353600028b0101360100068c01370100068d01380100068e01390b00028f013a3b01000990010801010002910101180100019201083d0106099301050b00099401050b00089501014901000196014b0f00049701144d000298014f010100099901060b00099a01060b00023350180100099b01260b000a9c012827000a9d01270b00029e0118010100079f01010b000ba1010662000ba20162260009a30125260002a401200b010002a501640101002f1d071d301e301f191d3221332134210a1d001d0a230023031d3921391e391f1b1d3a213b1e3b1f3c212d1d3d2f401e401f44214521461e461f151d473c473e472f473f474047413d3c161d164416464a1e4a1f4a214d1e4d1f1a1d50213d3e3d41061d30211e1d30551e23341e341f3d3f241d2423541e0e59251d2544455a345a0f5c2546455d345d0d1d451f395a395d3d402e2359215a2105060c030303030006030303030303010b0d010b050209000901020b0d0109000b0d0109010403030303020303010101060c030b0d0109000b0d0109010b0302090009010403020101010303040403010a080a01080a010c03060c03060b0e010b05020900090102070b060209000901060800030b0d010b050209000901030304060c03030302060c0502060c0202060c03040b0d010900030b0d01090103010b0d010900010b0d01090103060c030305070b06020900090103030303060503030b0d0109000b0d0109010b0d010b05020900090102090009010109000109010105010b05020900090102050b0d01090002090109000801040814081404040403020404010401081402081408140206081406081401020e01060800030303030103070b0602090009010303040b0d0109000b0d01090101060b0d01090002070b0d01090003020b0d010900060b12010900010b01020900090102070b1001090009000a01030303030303060b06020900090103030303030301070800090b0202090009010b12010b0502090009010b11010b0502090009010b0e010b050209000901081508150815080a0c010a02010815020708150815020708150a020106081505060c081508150201030b120109000b110109000b0e010900010b080209000901010b10010900010b070209000901010b0b0209000901010b0c0209000901010b0402090009010501010b0d0109000b0d010901070b060209000901010608000209010902050303030303020902090305040403060b060209000901060b06020901090003081308130813010813040303060b060209000901060b0602090109000106080f020c080f01080f0f0c0608000303030303030b0d010b0502090009010103070b06020900090103030402070b0d0109000b0d0109000203060b0e01090002050b0d010b050209000901100c0c040814040104030308140403030303040a01030303030303070b060209000901030303050b0d0109000b0d010901010b0502090109000b0101030303030b0d0109000b0d010901070b06020900090103030703030b0d0109010303030b0d01090002030b0d0109020309000901090201090202030b0d01090304090009010902090301090302030b0d010901010b0d010902010b0d01090306010104040304010816040c050608000303060c05030d52617a6f7253776170506f6f6c076163636f756e7404636f696e056576656e74107265736f757263655f6163636f756e74067369676e657206737472696e670974696d657374616d7009747970655f696e666f1052617a6f72506f6f6c4c696272617279047532353607757136347836340941646d696e44617461094275726e4576656e74064576656e747309466c617368537761700e466c617368537761704576656e74064c50436f696e0d4c6971756964697479506f6f6c094d696e744576656e741050616972437265617465644576656e740850616972496e666f08506169724d65746109537761704576656e740953796e634576656e740d6164645f6c6971756964697479136164645f6c69717569646974795f656e747279116173736572745f6b5f696e637265617365126173736572745f6c705f756e6c6f636b6564116173736572745f6e6f745f7061757365640d6173736572745f70617573656404436f696e046275726e1863616c635f6f7074696d616c5f636f696e5f76616c75657310636865636b5f706169725f65786973740b636c61696d5f61646d696e0b6372656174655f706169720a666c6173685f737761700e6765745f61646d696e5f64617461156765745f616d6f756e74735f696e5f315f70616972156765745f616d6f756e74735f696e5f325f70616972156765745f616d6f756e74735f696e5f335f70616972166765745f616d6f756e74735f6f75745f315f70616972166765745f616d6f756e74735f6f75745f325f70616972166765745f616d6f756e74735f6f75745f335f70616972196765745f6c6173745f70726963655f63756d756c61746976650d6765745f706169725f6c6973740d6765745f706169725f6d657461116765745f72657365727665735f73697a651b6765745f7265736f757263655f6163636f756e745f7369676e65720b696e69745f6d6f64756c65046d696e740e4d696e744361706162696c697479096d696e745f636f696e116d696e745f6665655f696e74657276616c0570617573650e7061795f666c6173685f737761701072656d6f76655f6c69717569646974791672656d6f76655f6c69717569646974795f656e747279117365745f61646d696e5f616464726573730b7365745f64616f5f6665650e7365745f64616f5f6665655f746f0c7365745f737761705f666565047377617014737761705f636f696e735f666f725f636f696e7327737761705f636f696e735f666f725f65786163745f636f696e735f325f706169725f656e74727927737761705f636f696e735f666f725f65786163745f636f696e735f335f706169725f656e74727920737761705f636f696e735f666f725f65786163745f636f696e735f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f335f706169725f656e74727920737761705f65786163745f636f696e735f666f725f636f696e735f656e74727907756e70617573650f7570646174655f696e7465726e616c1077697468647261775f64616f5f6665650a7369676e65725f636170105369676e65724361706162696c6974790a64616f5f6665655f746f0d63757272656e745f61646d696e0d70656e64696e675f61646d696e0764616f5f66656508737761705f6665650a64616f5f6665655f6f6e0869735f706175736508616d6f756e745f7808616d6f756e745f79096c697175696469747912706169725f637265617465645f6576656e740b4576656e7448616e646c650a6d696e745f6576656e740a6275726e5f6576656e740a737761705f6576656e740a73796e635f6576656e7410666c6173685f737761705f6576656e740b6c6f616e5f636f696e5f780b6c6f616e5f636f696e5f790c72657061795f636f696e5f780c72657061795f636f696e5f790b64756d6d795f6669656c640e636f696e5f785f726573657276650e636f696e5f795f72657365727665146c6173745f626c6f636b5f74696d657374616d70176c6173745f70726963655f785f63756d756c6174697665176c6173745f70726963655f795f63756d756c6174697665066b5f6c6173740b6c705f6d696e745f6361700d6c705f667265657a655f63617010467265657a654361706162696c6974790b6c705f6275726e5f6361700e4275726e4361706162696c697479066c6f636b6564046d65746109706169725f6c69737406636f696e5f780854797065496e666f06636f696e5f79076c705f636f696e0b616d6f756e745f785f696e0b616d6f756e745f795f696e0c616d6f756e745f785f6f75740c616d6f756e745f795f6f757409726573657276655f7809726573657276655f7907636f6d706172650877697468647261770a616464726573735f6f661569735f6163636f756e745f72656769737465726564087265676973746572076465706f73697404553235360f69735f6f766572666c6f775f6d756c0966726f6d5f75313238036d756c0576616c7565176765745f6c70636f696e5f746f74616c5f737570706c7907657874726163740a656d69745f6576656e740571756f746506537472696e6704757466380673796d626f6c06617070656e640b617070656e645f75746638066c656e6774680a696e697469616c697a650d72656769737465725f636f696e047a65726f106e65775f6576656e745f68616e646c650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f757407747970655f6f661d6372656174655f7369676e65725f776974685f6361706162696c6974791d72657472696576655f7265736f757263655f6163636f756e745f636170056d657267650473717274036d696e08737172745f313238036469760661735f7536340c64657374726f795f7a65726f0b6e6f775f7365636f6e64730755513634783634086672616374696f6e07746f5f753132380c6f766572666c6f775f6164640762616c616e6365087472616e7366657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010520cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2030867000000000000000308680000000000000003086e000000000000000308690000000000000003086b0000000000000003086a0000000000000003086f0000000000000003086c0000000000000003086d000000000000000308660000000000000003087000000000000000030875000000000000000308760000000000000003087300000000000000030874000000000000000308770000000000000003087800000000000000030820000000000000000308ffffffffffffffff0308e803000000000000052065c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607052000000000000000000000000000000000000000000000000000000000000000000a02070652617a6f722d0a0202012d0a0204032d4c500a020e0d52617a6f7220444558204c50730a02090852617a6f722d4c50126170746f733a3a6d657461646174615f7631e207116600000000000000124552525f494e5445524e414c5f4552524f52135768656e20636f6e7472616374206572726f7267000000000000000d4552525f464f5242494444454e165768656e2075736572206973206e6f742061646d696e6800000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6c69000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e746a000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4d494e54205768656e206e6f7420656e6f756768206c6971756964697479206d696e7465646b000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4255524e205768656e206e6f7420656e6f756768206c6971756964697479206275726e65646c00000000000000194552525f494e53554646494349454e545f585f414d4f554e54185768656e206e6f7420656e6f756768205820616d6f756e746d00000000000000194552525f494e53554646494349454e545f595f414d4f554e54185768656e206e6f7420656e6f756768205920616d6f756e746e000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e746f000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e7470000000000000000b4552525f4b5f4552524f52155768656e20636f6e7472616374204b206572726f727300000000000000164552525f504149525f414c52454144595f45584953541e5768656e20616c726561647920657869737473206f6e206163636f756e747400000000000000124552525f504149525f4e4f545f45584953541a5768656e206e6f7420657869737473206f6e206163636f756e7475000000000000000e4552525f4c4f414e5f4552524f52165768656e206572726f72206c6f616e20616d6f756e7476000000000000000e4552525f4c4f434b5f4552524f521e5768656e20636f6e7472616374206973206e6f74207265656e7472616e747700000000000000144552525f504149525f4f524445525f4552524f521c5768656e2070616972206861732077726f6e67206f72646572696e677800000000000000124552525f5041555341424c455f4552524f52175768656e20636f6e74726163742069732070617573656400000002084a080f4c054d054e054f02500351015201010203530354035503020206560b10010b080209000901580b10010b070209000901590b10010b0102090009015a0b10010b0b02090009015b0b10010b0c02090009015c0b10010b0402090009010302025d035e030402045d035e035f036003050201610106020a620b0d010900630b0d0109016403650466046704680b0e010b050209000901690b11010b0502090009016b0b12010b0502090009016d010702035303540355030802016e080a0902016f0a080a0a02037008137208137308130b020474037503760377030c02047803790365046604061d0623021d011d081d031d071d041d0b1d0c1d000100030002061c323800040305070b000107102707153b00040b050f0b0001070f270b010b020b030b0438010c070c060a000b0638020c080a000b0738030c090b080b0938040c0a0a0011310c050a05380520042c0b003806052e0b00010b050b0a3807020101040400020609011a3800040e07153b0020040738080b000b010b020b030b043809051907153b01200413380a0b000b020b010b040b03380b020200000100245207152b001000140c0d0b00353210270000000000000000000000000000180b02350a0d3518170c070b01353210270000000000000000000000000000180b03350b0d3518170c0b0b04350b0535180c0a3200e1f5050000000000000000000000000c0c0a070a0b1135042a080c06052e0a0a0a0c11350c060b0604460b0711360b0b113611370c080b0a11360b0c113611370c090e080e09113831022104430545070b2705510b070b0b180b0a0b0c1826044f0551070b27020300000106011107153b0004040506070f2707153d003700140921040e0510070d27020400000100010a07152b001002142004070509071127020500000100010907152b001002140406050807112702060100030002062b75380004030505071027380c0e00380d0c0807153c000c090a093701380e0a093702380f0c0b0c0a07152b000c020a090b0238100c0738110c0c0a08350a0a35180a0c1a340c030a08350a0b35180b0c1a340c040a0936010a0338120c0d0a0936020a0438130c0e0a030600000000000000002404420a04060000000000000000240c010544090c010b010447054b0b09010705270a093701380e0a093702380f0c060c050b000a09370338140a090a050a060b0a0b0b38150b0704680b05350b0635180b09360415056a0b090107153c0236050b030b040b08390338160b0d0b0e020701000106315007153d000c0b0a0b3701380e0b0b3702380f0c0d0c0c0a0c0600000000000000002104140a0d060000000000000000210c040516090c040b04041d0b000b010c080c07054d0a000a0c0a0d113e0c0a0a0a0a012504320a0a0b0326042b052d0709270b000b0a0c060c0505490a010b0d0b0c113e0c090a090b0025043c053e070a270a090b0226044305450708270b090b010c060c050b050b060c080c070b070b080208010000070b3800040607153b000c00050907153b010c000b00020901040100331a07152a000c010b0011310a0110081421040b050f0b01010701270a011008140a010f091507160b010f0815020a0100020009346138000403050507102707153b0020040a050c070e27110411170c080717113f0c0438170c0538180c060d040b0511410d04071811420d040b0611410d04071911420e041143071224042a071a113f0c040e080b04071b113f31080838190c030c020c010e08381a0e08381b381c0600000000000000003200000000000000000000000000000000320000000000000000000000000000000032000000000000000000000000000000000b030b020b010939003f00381d0c0707152a090f0a0a07440e0e08381e0e08381f0e0838200e0838210e0838220e08382339020c000d0036060b07390438240e080b003f02020b010002000642443800040305050710270a0006000000000000000024040c080c0205100a01060000000000000000240c020b0204130515070c271104380c07153c000c060a063701380e0a002604270a063702380f0a01260c030529090c030b03042c05300b0601070227080a063600150a0636010a0038120c040b0636020a0138130c050b040b050b000b013905020c01000100431007152b000c000a001000140a00100c140a00100d140b00100214020d0100020006320e07152b001000140c0338250c020c010b000b010b020b031148020e0100020006051707152b001000140c0438260c030c020b000b020b030a0411480c0138250c030c020b010b020b030b041148020f0100020006452007152b001000140c0538270c040c030b000b030b040a0511480c0138260c040c030b010b030b040a0511480c0238250c040c030b020b030b040b05114802100100020006320e07152b001000140c0338250c020c010b000b010b020b03114902110100020006051707152b001000140c0438250c030c020b000b020b030a0411490c0138260c030c020b010b020b030b04114902120100020006452007152b001000140c0538250c040c030b000b030b040a0511490c0138260c040c030b010b030b040a0511490c0238270c040c030b020b030b040b05114902130100010647253800041207153d000c030a033707140a033708140b033709140c020c010c00052107153d010c040a04370a140a04370b140b04370c140c020c010c000b000b010b02021401000109010507152b09100a140215010000480b38280c0038290c01382a0c020b000b010b02120a0216010001064a1c3800040e07153d000c020a023701380e0b023702380f0c010c00051907153d010c030a03370d380e0b03370e380f0c010c000b000b01021700000100010507152b001011114b02180000004c210a0011310715210406050a0b00010701270b000700114c0c020e02114b0c010e010b020700070007163105061e00000000000000080912002d000e01400e000000000000000012092d0902190100030002064e950138000403050507102707153b000409050b070f271104380c0e00380e0c060e01380f0c0707153c000c0d0a0d3701380e0a0d3702380f0c0f0c0e07152b000c030a0d0b0338100c0b0a0d36010b00382b0a0d36020b01382c0a0d3701380e0a0d3702380f0c090c0838110c100a1032000000000000000000000000000000002104540a060a07114e071424044205460b0d010706270a060a07114e0714170c0c11170c020e0207140a0d370f382d056a0a06350a10180a0e351a340c040a07350b10180a0f351a340c050b040b05114f0c0c0a0c06000000000000000024046f05730b0d010706270a0c0a0d370f382e0c0a0a0d0a080a090b0e0b0f38150b0b0489010b08350b0935180b0d360415058b010b0d0107153c0236100b060b070b0c3906382f0b0a021a00000051140a0011310c030a03380520040a0b003806050c0b00010b010b02382e0c040b030b043807021b0000005296010a01100d140c070a003704140c080a070487010a083200000000000000000000000000000000220482010a003701380e0c0d0a003702380f0c0e0b0d0b0e114e0c0f0b0811510c1038110c110a0f0a1024047d0a0f0a1017350c040a110a04113504560b1111360b04113611370c0b0b0f350a01100c1435180b10351611360c050b0b0b05115211530c090a090600000000000000002404510b011011114b0c020e020b090b00370f382d05550b00010b0101057c0b110b04180c0c0b0f350a01100c1435180b1035160c060b0c0b061a340c0a0a0a0600000000000000002404780b011011114b0c030e030b0a0b00370f382d057c0b00010b01010581010b00010b01010586010b00010b01010594010b01010b0832000000000000000000000000000000002204920132000000000000000000000000000000000b003604150594010b00010b07021c010401003315110407152a000c010b0011310a0110091421040c05100b0101070127080b010f0215021d010003000206536438000403050507102707153b000409050b070f2711040b023a050c090c080e00380e0c040e01380f0c050a0406000000000000000024041d080c0305210a05060000000000000000240c030b0304240526070c2707153c000c0a0a0a3701380e0c0b0a0a3702380f0c0c0b0b0a08160c0b0b0c0a09160c0c0a0a36010b00382b0a0a36020b01382c0a0a3701380e0c060a0a3702380f0c070a060a070a040a050a0b0a0c11020a0a0b060b070b0b0b0c3815090b0a36001507153c0236110b080b090b040b0539073830021e010003000206041c3800040305050710270b0038310c040c030e03380e0b0126040f05110708270e04380f0b0226041705190709270b030b04021f010403000206541d3800040b0a000b0138320b020b0338330c060c0505130a000b0138340b030b0238350c050c060b0011310c040a040b0538360b040b063837022001040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f0815022101040100332107152a000c020b0011310a0210091421040b050f0b02010701270a013100210418090b020f0d150520080a020f0d150b010b020f0c15022201040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f1515022301040100331d07152a000c020b0011310a0210091421040b050f0b02010701270a0106e80300000000000025041405180b02010702270b010b020f0015022401000300020656661104380c0e00380e0c060e02380f0c070a0606000000000000000024040f080c0405130a07060000000000000000240c040b04041605180703270a0106000000000000000024041f080c0505230a03060000000000000000240c050b050426052807072707153c000c0c0a0c3701380e0a0c3702380f0c0e0c0d0a0c36010b00382b0a0c36020b02382c0a0c36010a0138120c0a0a0c36020a0338130c0b0a0c3701380e0a0c3702380f0c090c080a080a090a060a070a0d0a0e11020b0c0b080b090b0d0b0e381507153c0236120b060b070b010b03390838380b0a0b0b022501000300020657260e00380e0c0107152b001000140c0638250c050c040b010b040b050b0611490c023800041b0b00060000000000000000381c0b0238390c030c070522381c0b020b00060000000000000000383a0c070c030b07383b0b03022601040300020658190b01383c0c030a030b02250408050c0b00010703270a000b033802383d383e0c040a00383f0b0011310b04384002270104030002065b1a0b0138410c030a030b02250408050c0b00010703270a000b033802383d383e38420c040a0038430b0011310b04384402280104030002065e180b0138450c030a030b02250408050c0b00010703270a000b033802383d0c040a0038460b0011310b04383702290104030002065f170a000b013802383d383e0c030e0338470b0226040c05100b00010707270a00383f0b0011310b033840022a01040300020660180a000b013802383d383e38420c030e0338480b0226040d05110b00010707270a0038430b0011310b033844022b01040300020619160a000b013802383d0c030e03380f0b0226040b050f0b00010707270a0038460b0011310b033837022c010401003315110507152a000c010b0011310a0110091421040c05100b0101070127090b010f0215022d00000102614f11550c090a090a0037091417350c0a0a0a32000000000000000000000000000000002404120a03060000000000000000220c050514090c050b05041b0a04060000000000000000220c06051d090c060b06043d0a040a03115611570a0a180c070a003707140b0711580a003607150b030b04115611570b0a180c080a003708140b0811580a003608150b090a0036091507153c0236130b010b020a003707140b0037081439093849022e01040100632c38002004060b00384a0207152b000c030a0011310c020a020b0310151421041305170b00010701270a02380520041e0b00380605200b00010715384b0714170c0411170c010e010b020b04384c02000506090007060006010608060502020003000209000200000400060603060406020000060602010205000102030204011d031d041d051d061d071d0b1d0e1d0f1d101d0f230e23102304230323121d131d141d161d171d00\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"RazorSwapPool\",\"friends\":[],\"exposed_functions\":[{\"name\":\"add_liquidity\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"add_liquidity_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"burn\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"calc_optimal_coin_values\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\",\"u64\"]},{\"name\":\"check_pair_exist\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"bool\"]},{\"name\":\"claim_admin\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"create_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[]},{\"name\":\"flash_swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>\"]},{\"name\":\"get_admin_data\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"u64\",\"u8\",\"bool\",\"bool\"]},{\"name\":\"get_amounts_in_1_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_in_2_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_in_3_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_1_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_2_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_3_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_last_price_cumulative\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"u128\",\"u128\",\"u64\"]},{\"name\":\"get_pair_list\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>\"]},{\"name\":\"get_pair_meta\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta\"]},{\"name\":\"get_reserves_size\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"u64\",\"u64\"]},{\"name\":\"mint\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"],\"return\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"]},{\"name\":\"pause\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"pay_flash_swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>\"],\"return\":[]},{\"name\":\"remove_liquidity\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\",\"u64\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"remove_liquidity_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"set_admin_address\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"address\"],\"return\":[]},{\"name\":\"set_dao_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"u8\"],\"return\":[]},{\"name\":\"set_dao_fee_to\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"address\"],\"return\":[]},{\"name\":\"set_swap_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"u64\"],\"return\":[]},{\"name\":\"swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"u64\",\"0x1::coin::Coin<T1>\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"swap_coins_for_coins\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\"],\"return\":[\"0x1::coin::Coin<T1>\"]},{\"name\":\"swap_coins_for_exact_coins_2_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_coins_for_exact_coins_3_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_coins_for_exact_coins_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_2_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_3_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"unpause\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"withdraw_dao_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\"],\"return\":[]}],\"structs\":[{\"name\":\"AdminData\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"signer_cap\",\"type\":\"0x1::account::SignerCapability\"},{\"name\":\"dao_fee_to\",\"type\":\"address\"},{\"name\":\"current_admin\",\"type\":\"address\"},{\"name\":\"pending_admin\",\"type\":\"address\"},{\"name\":\"dao_fee\",\"type\":\"u8\"},{\"name\":\"swap_fee\",\"type\":\"u64\"},{\"name\":\"dao_fee_on\",\"type\":\"bool\"},{\"name\":\"is_pause\",\"type\":\"bool\"}]},{\"name\":\"BurnEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x\",\"type\":\"u64\"},{\"name\":\"amount_y\",\"type\":\"u64\"},{\"name\":\"liquidity\",\"type\":\"u64\"}]},{\"name\":\"Events\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"pair_created_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairCreatedEvent<T0, T1>>\"},{\"name\":\"mint_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::MintEvent<T0, T1>>\"},{\"name\":\"burn_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::BurnEvent<T0, T1>>\"},{\"name\":\"swap_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SwapEvent<T0, T1>>\"},{\"name\":\"sync_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SyncEvent<T0, T1>>\"},{\"name\":\"flash_swap_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwapEvent<T0, T1>>\"}]},{\"name\":\"FlashSwap\",\"is_native\":false,\"abilities\":[],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"loan_coin_x\",\"type\":\"u64\"},{\"name\":\"loan_coin_y\",\"type\":\"u64\"}]},{\"name\":\"FlashSwapEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"loan_coin_x\",\"type\":\"u64\"},{\"name\":\"loan_coin_y\",\"type\":\"u64\"},{\"name\":\"repay_coin_x\",\"type\":\"u64\"},{\"name\":\"repay_coin_y\",\"type\":\"u64\"}]},{\"name\":\"LPCoin\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"dummy_field\",\"type\":\"bool\"}]},{\"name\":\"LiquidityPool\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"coin_x_reserve\",\"type\":\"0x1::coin::Coin<T0>\"},{\"name\":\"coin_y_reserve\",\"type\":\"0x1::coin::Coin<T1>\"},{\"name\":\"last_block_timestamp\",\"type\":\"u64\"},{\"name\":\"last_price_x_cumulative\",\"type\":\"u128\"},{\"name\":\"last_price_y_cumulative\",\"type\":\"u128\"},{\"name\":\"k_last\",\"type\":\"u128\"},{\"name\":\"lp_mint_cap\",\"type\":\"0x1::coin::MintCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"lp_freeze_cap\",\"type\":\"0x1::coin::FreezeCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"lp_burn_cap\",\"type\":\"0x1::coin::BurnCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"locked\",\"type\":\"bool\"}]},{\"name\":\"MintEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x\",\"type\":\"u64\"},{\"name\":\"amount_y\",\"type\":\"u64\"},{\"name\":\"liquidity\",\"type\":\"u64\"}]},{\"name\":\"PairCreatedEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"meta\",\"type\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta\"}]},{\"name\":\"PairInfo\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"pair_list\",\"type\":\"vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>\"}]},{\"name\":\"PairMeta\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"coin_x\",\"type\":\"0x1::type_info::TypeInfo\"},{\"name\":\"coin_y\",\"type\":\"0x1::type_info::TypeInfo\"},{\"name\":\"lp_coin\",\"type\":\"0x1::type_info::TypeInfo\"}]},{\"name\":\"SwapEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x_in\",\"type\":\"u64\"},{\"name\":\"amount_y_in\",\"type\":\"u64\"},{\"name\":\"amount_x_out\",\"type\":\"u64\"},{\"name\":\"amount_y_out\",\"type\":\"u64\"}]},{\"name\":\"SyncEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"reserve_x\",\"type\":\"u64\"},{\"name\":\"reserve_y\",\"type\":\"u64\"},{\"name\":\"last_price_x_cumulative\",\"type\":\"u128\"},{\"name\":\"last_price_y_cumulative\",\"type\":\"u128\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000a01000e020e0e031c6e048a010e0598015707ef01af02089e044006de044410a205e4020c8608fe05000001010102010301040105010602120200051307000317070100000007000102000000080203000009020300000a00040100000b050100000c060300000d050400000e070300000f08000100001006030000110403000614000b010005150d030002070e0f010002161001000118001301000319140a0100041a081500011b15010100011c080001000b0a0b0c0d0b0f0a1004120a130a0001010403030303010301040204040203030303030301060c03080008010801010900010801010901010608010206090006090001080001060800030104040401040404010b02010401070b02010900010504030304041052617a6f72506f6f6c4c69627261727904636f696e0a636f6d70617261746f72066f7074696f6e067369676e657206737472696e6709747970655f696e666f07636f6d706172650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f7574176765745f6c70636f696e5f746f74616c5f737570706c790f69735f6f766572666c6f775f6d756c036d696e0c6f766572666c6f775f6164640571756f74650d72656769737465725f636f696e047371727408737172745f31323806526573756c7406537472696e6709747970655f6e616d65066c656e6774680f69735f736d616c6c65725f7468616e064f7074696f6e06737570706c7907657874726163740a616464726573735f6f661569735f6163636f756e745f7265676973746572656408726567697374657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010308cd000000000000000308c9000000000000000308cb000000000000000308ca000000000000000308cc000000000000000410ffffffffffffffffffffffffffffffff126170746f733a3a6d657461646174615f7631cf0205c900000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6cca000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e74cb000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e74cc000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e74cd00000000000000184552525f434f494e5f545950455f53414d455f4552524f521e5768656e2074776f20636f696e2074797065206973207468652073616d65000000010000092238000c0138010c020a010a02220409050b0700270e01110c0e02110c23041308020e01110c0e02110c24041b09020e010e0238020c000e00110e020101000011300a0006000000000000000024040505070704270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b01350a0035183210270000000000000000000000000000180c060b020b0017350610270000000000000b031735180c050b060b051a32010000000000000000000000000000001634020201000012300a0006000000000000000024040505070702270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b00350610270000000000000b031735180c050a050b0235180c070b01353210270000000000000000000000000000180b05160c060b070b061a340203010000130538030c000d0038040204010000000607050b011a0b0025020501000000080a000a012304060b00020b010206010000042007050a01170c020a020a0023040e0b000b02173201000000000000000000000000000000170207050a00170c020a020a0123041c0b010b0217320100000000000000000000000000000017020b000b0116020701000001210a0006000000000000000024040505070701270a010600000000000000002404100a02060000000000000000240c030512090c030b03041505170703270b00350b0235180b01351a340208010000000b0a00111138052004080b003806050a0b0001020901000000070b00350b013518110a020a010000162d0a0032040000000000000000000000000000002304100b00320000000000000000000000000000000021040b0600000000000000000c01050d0601000000000000000c010b010c02052b0a000c040a0032020000000000000000000000000000001a3201000000000000000000000000000000160c030a030a04230428051d0a030c040a000a031a0b031632020000000000000000000000000000001a0c0305180b04340c020b020200\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"RazorPoolLibrary\",\"friends\":[],\"exposed_functions\":[{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"bool\"]},{\"name\":\"get_amount_in\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amount_out\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_lpcoin_total_supply\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]}],\"params\":[],\"return\":[\"u128\"]},{\"name\":\"is_overflow_mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\",\"u128\"],\"return\":[\"bool\"]},{\"name\":\"min\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"overflow_add\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\",\"u128\"],\"return\":[\"u128\"]},{\"name\":\"quote\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"register_coin\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]}],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"sqrt\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"sqrt_128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\"],\"return\":[\"u64\"]}],\"structs\":[]}}]",
  //             abi:data.abi,
  //             data:data.data
  //             // data: "{\"function\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::swap_exact_coins_for_coins_2_pair_entry\",\"typeArguments\":[\"0x1::aptos_coin::AptosCoin\",\"0xcab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2::razor_token::Razor\",\"0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::USDC\"],\"functionArguments\":[\"3200000000\",\"48605237\"]}"
  //         }
  //     }
  //     let signParams: SignTxParams = {
  //         privateKey: "0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618",
  //         data: param
  //     };
  //     let tx = await wallet.signTransaction(signParams);
  //     console.log(tx)
  //     // const expected = "986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9223000000000000000265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f546070d52617a6f7253776170506f6f6c27737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e747279030700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0007cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f20b72617a6f725f746f6b656e0552617a6f720007275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f06746f6b656e7304555344430002080020bcbe000000000835a8e50200000000400d030000000000640000000000000033615fcd000000001b0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b054000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  //     // expect(tx).toBe(expected)
  // });
  test('simulate function call by a transaction abiv2', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'simulate',
      base: {
        sequenceNumber: '21',
        chainId: 1,
        maxGasAmount: '2000',
        gasUnitPrice: '100',
        // reserveFeeRatio: "1.1",
        expirationTimestampSecs: '1739938036',
      },
      data: {
        abi: '[{"abi":{"address":"0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c","name":"panora_swap","friends":[],"exposed_functions":[{"name":"init_resources_and_events","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"multisig_router_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","address","u64","u8","vector<u8>","vector<vector<vector<u8>>>","vector<vector<vector<u64>>>","vector<vector<vector<bool>>>","vector<vector<u8>>","vector<vector<vector<address>>>","vector<vector<address>>","vector<vector<address>>","0x1::option::Option<vector<vector<vector<vector<vector<u8>>>>>>","vector<vector<vector<u64>>>","0x1::option::Option<vector<vector<vector<u8>>>>","address","vector<u64>","u64","u64","address"],"return":[]},{"name":"router","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["address","0x1::option::Option<0x1::coin::Coin<T0>>","0x1::option::Option<0x1::fungible_asset::FungibleAsset>","u64","u8","vector<u8>","vector<vector<vector<u8>>>","vector<vector<vector<u64>>>","vector<vector<vector<bool>>>","vector<vector<u8>>","vector<vector<vector<address>>>","vector<vector<address>>","vector<vector<address>>","0x1::option::Option<vector<vector<vector<vector<vector<u8>>>>>>","vector<vector<vector<u64>>>","0x1::option::Option<vector<vector<vector<u8>>>>","address","vector<u64>","u64","u64","address"],"return":["0x1::option::Option<0x1::coin::Coin<T0>>","0x1::option::Option<0x1::fungible_asset::FungibleAsset>","0x1::option::Option<0x1::coin::Coin<T31>>","0x1::option::Option<0x1::fungible_asset::FungibleAsset>"]},{"name":"router_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","0x1::option::Option<signer>","address","u64","u8","vector<u8>","vector<vector<vector<u8>>>","vector<vector<vector<u64>>>","vector<vector<vector<bool>>>","vector<vector<u8>>","vector<vector<vector<address>>>","vector<vector<address>>","vector<vector<address>>","0x1::option::Option<vector<vector<vector<vector<vector<u8>>>>>>","vector<vector<vector<u64>>>","0x1::option::Option<vector<vector<vector<u8>>>>","address","vector<u64>","u64","u64","address"],"return":[]},{"name":"swap_exact_in","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["address","0x1::option::Option<0x1::coin::Coin<T0>>","0x1::option::Option<0x1::fungible_asset::FungibleAsset>","u64","u8","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","address","vector<u64>","vector<vector<u64>>","vector<vector<u64>>","vector<vector<u64>>","u64","u64","address"],"return":["0x1::option::Option<0x1::coin::Coin<T31>>","0x1::option::Option<0x1::fungible_asset::FungibleAsset>"]},{"name":"swap_exact_in_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","address","u64","u8","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","vector<vector<u8>>","vector<vector<u64>>","vector<vector<bool>>","vector<u8>","vector<address>","address","vector<u64>","vector<vector<u64>>","vector<vector<u64>>","vector<vector<u64>>","u64","u64","address"],"return":[]}],"structs":[{"name":"EventStore1","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"swap_step_events","type":"0x1::event::EventHandle<0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c::panora_swap::PanoraSwapSummaryEvent>"}]},{"name":"PanoraSwapSummaryEvent","is_native":false,"is_event":false,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"input_token_address","type":"0x1::string::String"},{"name":"output_token_address","type":"0x1::string::String"},{"name":"input_token_amount","type":"u64"},{"name":"output_token_amount","type":"u64"},{"name":"time_stamp","type":"u64"},{"name":"integrator_address","type":"address"},{"name":"user_address","type":"address"},{"name":"function_id","type":"u64"},{"name":"platform_id","type":"u64"}]}]}}]',
        data: '{"arguments":[null,"0x53aed9413aa7a4aa64305191875df907b9fcf323cba8621a4fe48573dbd18a3e","1","1",["3","0"],[[["40"]],[["11"]],[["11"]]],[[["162"]],[["0"]],[["0"]]],[[["true"]],[["true"]],[["true"]]],[["2"],["4"],["4"]],[[["0x0"]]],[["0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"],["0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"],["0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"]],[["0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"],["0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"],["0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"]],null,[[["10000"]],[["10000"]],[["10000"]]],[["0xa086010000000000"]],"0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",["1000"],"18305","0","0xd0b17bea776bb87b70b2fb2ca631014f0ca94fc1acde4b8ff1a763f4172aa6c4"],"function":"0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c::panora_swap::router_entry","type":"entry_function_payload","type_arguments":["0x1::string::String","0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL","0x7605bf03a2add65594ad813a7cea6b30b1ec7092e296b6f606ab1adf821318cc::coin::T","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::string::String","0x1::aptos_coin::AptosCoin"]}',
        // abi:data.abi,
        // data:data.data
        // abi: "[{\"bytecode\":\"0xa11ceb0b060000000b010002020208030a7d058701a50107ac02e7010893042006b3045f1092059f020ab1071e0ccf07f4190dc32118000000010700000207000003000100000401020000050103000006000100000700010000080403000009000100000a050600000b000100000c070800000d020100000e030100000f09030000100a03000011030600001200010000130b0c0000140b0c0000150d0e0000160f0e00001710010000181001000019020b00001a000100001b0e010002080108010108010104010301060801020608010608010102010800020801010206080103020608000302030302030103070801030300030708000303020801020a03030303010101030308010101020101040303030801030303030801030303020308010305010101080101070303030303030304020302021501030303030303030303030303030101010301080108000503010404040303010307030303030308010304753235360544553235360455323536036164640761735f753132380661735f75363406626974616e64056269746f72046269747306626974786f7207636f6d70617265036469760d64753235365f746f5f753235360966726f6d5f753132380866726f6d5f75363403676574056765745f64116c656164696e675f7a65726f735f753634036d756c0f6f766572666c6f77696e675f6164640f6f766572666c6f77696e675f73756203707574057075745f640373686c037368720a73706c69745f7531323803737562047a65726f02763002763102763202763302763402763502763602763765c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607030800000000000000000308030000000000000003080200000000000000020100030801000000000000000201020201010410ffffffffffffffffffffffffffffffff0410ffffffffffffffff000000000000000003080400000000000000126170746f733a3a6d657461646174615f76318a020400000000000000000e45434153545f4f564552464c4f57395768656e2063616e277420636173742060553235366020746f206075313238602028652e672e206e756d62657220746f6f206c61726765292e01000000000000000f45574f5244535f4f564552464c4f573f5768656e20747279696e6720746f20676574206f722070757420776f726420696e746f2055323536206275742069742773206f7574206f6620696e6465782e020000000000000009454f564552464c4f57145768656e206d617468206f766572666c6f77732e03000000000000000c454449565f42595f5a45524f215768656e20617474656d7074656420746f20646976696465206279207a65726f2e00000002081c031d031e031f0320032103220323030102041c031d031e031f0300010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311100c070b0411100c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311100c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b020101000012200e0010001406000000000000000021040d0e00100114060000000000000000210c01050f090c010b01041205140700270e001002143531402f0e001003143516020201000013230e0010021406000000000000000021040d0e00100014060000000000000000210c01050f090c010b0104180e00100114060000000000000000210c02051a090c020b02041d051f0700270e001003140203000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031c11120b04060100000000000000160c0405040b050204000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031b11120b04060100000000000000160c0405040b050205000000152e0601000000000000000c030a03070923042405070a0007090a0317110c0c010a0106000000000000000024041f0b000106400000000000000007090b031706010000000000000016180b01110e3417020b03060100000000000000160c0305020b00060000000000000000110c0c020640000000000000000b02110e34170206000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031d11120b04060100000000000000160c0405040b050207010000152a07090c040a0406000000000000000024042405070b04060100000000000000170c040a000a04110c0c020a010a04110c0c030a020a032204230b01010b00010b020b0323042107060207050205020b01010b000107030208010000165711180c080e0011050c030e0111050c040a0406000000000000000022040d050f0701270a030a042304150b08020b030b04170c090b010a093311140c010e000e0111070c060a06070521042a0527080c02052e0b060703210c020b0204470a090640000000000000001a0c070e080a07110c0601000000000000000a0906400000000000000019332f1b0c050d080b070b0511120b000a0111170c000b01310111150c010a0906000000000000000021045005550b09060100000000000000170c09051e0b080209000000173c0e001004140e001005140e001006140e0010071412010c04090c050e00100814060000000000000000220419080c01051f0e00100914060000000000000000220c010b010424080c02052a0e00100a14060000000000000000220c020b02042f080c0305350e00100b14060000000000000000220c030b030439080c050b040b05020a0100000b0a0b0011160c010c020b010b020600000000000000000600000000000000001201020b0100000e040b0035110a020c010000152e0a010600000000000000002104090b001003140c04052c0a010601000000000000002104120b001002140c03052a0a0106020000000000000021041b0b001000140c0205280b0106030000000000000021042005240b00010704270b001001140c020b020c030b030c040b04020d000000185a0a010600000000000000002104090b001004140c0805580a010601000000000000002104120b001005140c0705560a0106020000000000000021041b0b001006140c0605540a010603000000000000002104240b001007140c0505520a0106040000000000000021042d0b001008140c0405500a010605000000000000002104360b001009140c03054e0a0106060000000000000021043f0b00100a140c02054c0b0106070000000000000021044405480b00010704270b00100b140c020b020c030b030c040b040c050b050c060b060c070b070c080b08020e000000194d0a000600000000000000002104063140020a0006ffffffff000000001c0c020a0031203006000000000000000021042e31200c030a03310126044b05170a020a03310117300601000000000000001c06000000000000000022042205270b033101170c03051231200b03173120160c01054931400c040a04310126044c05350a000a04310117300601000000000000001c06000000000000000022044005450b043101170c04053031400b04170c010b0102052705450f0100001a8c0106000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000012000c160600000000000000000c0c0a0c07092304800105110600000000000000000c070e010a0c110c0c060600000000000000000c0d0a0d070923047b051e0e000a0d110c0c050a05060000000000000000220429080c02052d0a07060000000000000000220c020b0204760b05350a06351811160c0e0c0a0e160a0c0a0d16110d0c090b0e0b0911100c100c0f0d160a0c0a0d160b0f11130b10044d0601000000000000000c03054f0600000000000000000c030b030c130e160a0c0a0d1606010000000000000016110d0c080b0a0b13160b0711100c110b0811100c120c0b0d160a0c0a0d16060100000000000000160b0b11130b110b121e04720601000000000000000c0405740600000000000000000c040b040c070b0d060100000000000000160c0d05190b0c060100000000000000160c0c050c0b1611090c140c150b1420048801058a010702270b1502100000001b220b00350c040b01350c050a040a05160c060a0607082404180b0607081732010000000000000000000000000000001734080c030c02051f0b040b051634090c030c020b020b0302110000001c1b0a000a012304120b010b00170c040708340b041706010000000000000016080c030c0205180b000b0117090c030c020b020b0302120000000e290a010600000000000000002104090b020b000f031505280a010601000000000000002104120b020b000f021505280a0106020000000000000021041b0b020b000f001505280b0106030000000000000021042005240b00010704270b020b000f011502130000000e4d0a010600000000000000002104090b020b000f0415054c0a010601000000000000002104120b020b000f0515054c0a0106020000000000000021041b0b020b000f0615054c0a010603000000000000002104240b020b000f0715054c0a0106040000000000000021042d0b020b000f0815054c0a010605000000000000002104360b020b000f0915054c0a0106060000000000000021043f0b020b000f0a15054c0b0106070000000000000021044405480b00010704270b020b000f0b1502140100001d4e11180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a030a0817110c0a02332f0c050d070a030b0511120b03060100000000000000160c03050e0a0206000000000000000024044c0a08060100000000000000160c040a04070923044c05320e070a04110c0e000a04060100000000000000170a0817110c31400a02331730160c060d070a040b0611120b04060100000000000000160c04052d0b0702150100001d5211180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a03110c0a0233300c050d070a030a08170b0511120b03060100000000000000160c03050e0a020600000000000000002404500a08060100000000000000160c040a04070923045005320e070a040a081706010000000000000017110c0e000a04110c31400a0233172f160c060d070a040a0817060100000000000000170b0611120b04060100000000000000160c04052d0b0702160000000b0d0a00314030340c010b0032ffffffffffffffff00000000000000001c340c020b010b020217010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311110c070b0411110c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311110c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b02180100000e0606000000000000000006000000000000000006000000000000000006000000000000000012010201020103010101000000000100020003000400050006000700\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"u256\",\"friends\":[],\"exposed_functions\":[{\"name\":\"add\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"as_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u128\"]},{\"name\":\"as_u64\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u64\"]},{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"u8\"]},{\"name\":\"div\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"from_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"from_u64\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"get\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"shl\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u8\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"shr\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"u8\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"sub\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]},{\"name\":\"zero\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256\"]}],\"structs\":[{\"name\":\"DU256\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v0\",\"type\":\"u64\"},{\"name\":\"v1\",\"type\":\"u64\"},{\"name\":\"v2\",\"type\":\"u64\"},{\"name\":\"v3\",\"type\":\"u64\"},{\"name\":\"v4\",\"type\":\"u64\"},{\"name\":\"v5\",\"type\":\"u64\"},{\"name\":\"v6\",\"type\":\"u64\"},{\"name\":\"v7\",\"type\":\"u64\"}]},{\"name\":\"U256\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v0\",\"type\":\"u64\"},{\"name\":\"v1\",\"type\":\"u64\"},{\"name\":\"v2\",\"type\":\"u64\"},{\"name\":\"v3\",\"type\":\"u64\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000b010002020204030628052e1e074c490895012006b5012510da01780ad202050cd702d5010dac0402000000010700000200010000030203000004040200000503020000060502000007060700000804020000090208000206080006080001020108000103020800030203030106080001010104000775713634783634075551363478363407636f6d70617265066465636f64650364697606656e636f6465086672616374696f6e0769735f7a65726f036d756c07746f5f75313238017665c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607020100030864000000000000000201020201010410ffffffffffffffff0000000000000000126170746f733a3a6d657461646174615f76316402000000000000000005455155414c185768656e206120616e6420622061726520657175616c732e6400000000000000124552525f4449564944455f42595f5a45524f1e5768656e20646976696465206279207a65726f20617474656d707465642e00000002010a0400010000091a0a001000140a0110001421040e0b01010b00010700020b001000140b011000142304180703020702020101000009070e0010001407041a340202010000090f0a0106000000000000000022040505070701270e001000140b01351a1200020301000009060b00350704181200020401000009100a0106000000000000000022040505070701270b00350704180b01351a1200020501000009060b00100014320000000000000000000000000000000021020601000009080e001000140b0135181200020701000009040e0010001402000000\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"uq64x64\",\"friends\":[],\"exposed_functions\":[{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u8\"]},{\"name\":\"decode\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u64\"]},{\"name\":\"div\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"encode\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"fraction\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"is_zero\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"bool\"]},{\"name\":\"mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\",\"u64\"],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"]},{\"name\":\"to_u128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64\"],\"return\":[\"u128\"]}],\"structs\":[{\"name\":\"UQ64x64\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"v\",\"type\":\"u128\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000e0100180218910103a901ce0404f7059a01059107e10607f20da21108941f4006d41fe10210b522f7070aac2aeb010b972c140cab2cb7200de24c300e924d280000010101020103010401050106010701080009000a000b000c0800000d060200010001000e080200010001000f00020001000100100602000100010011080200010001001208020001000100130602000100010014060200010001001508000016070000170602000100010018060200010001021f04010001023405010001014b0600035704010601026a05010001026c05010001087107000a8001070006890107000ba001070000190001020000001a0001020000001b020100001c0101020000001d010100001e010100002003040200000021050602000000220107020000002308010000240101020000002506090200000026010a0000270b0b02000000280b0b0300000000290b0b0400000000002a0b0b020000002b0b0b03000000002c0b0b0400000000002d010c020000002e010d00002f010e020000003001060200000031010f00003208010000330403020000003510010200000036110702000000370801000038090102000000391204020000003a1301020000003b140100003c150100003d140100003e160100003f17040200000040181902000000411a010300000000421a01040000000000431a0102000000441a010300000000451a01040000000000461a01020000004708010000481b0102000000490801020000097a0107020000027b16180100057c082000027d20070100027e08010100027f220101000981012507000a82012627000a83012827000a7a292a000284012c0b0100098501012601000286012d18010002202e01010003870130010106098801320b00068a01353600028b0101360100068c01370100068d01380100068e01390b00028f013a3b01000990010801010002910101180100019201083d0106099301050b00099401050b00089501014901000196014b0f00049701144d000298014f010100099901060b00099a01060b00023350180100099b01260b000a9c012827000a9d01270b00029e0118010100079f01010b000ba1010662000ba20162260009a30125260002a401200b010002a501640101002f1d071d301e301f191d3221332134210a1d001d0a230023031d3921391e391f1b1d3a213b1e3b1f3c212d1d3d2f401e401f44214521461e461f151d473c473e472f473f474047413d3c161d164416464a1e4a1f4a214d1e4d1f1a1d50213d3e3d41061d30211e1d30551e23341e341f3d3f241d2423541e0e59251d2544455a345a0f5c2546455d345d0d1d451f395a395d3d402e2359215a2105060c030303030006030303030303010b0d010b050209000901020b0d0109000b0d0109010403030303020303010101060c030b0d0109000b0d0109010b0302090009010403020101010303040403010a080a01080a010c03060c03060b0e010b05020900090102070b060209000901060800030b0d010b050209000901030304060c03030302060c0502060c0202060c03040b0d010900030b0d01090103010b0d010900010b0d01090103060c030305070b06020900090103030303060503030b0d0109000b0d0109010b0d010b05020900090102090009010109000109010105010b05020900090102050b0d01090002090109000801040814081404040403020404010401081402081408140206081406081401020e01060800030303030103070b0602090009010303040b0d0109000b0d01090101060b0d01090002070b0d01090003020b0d010900060b12010900010b01020900090102070b1001090009000a01030303030303060b06020900090103030303030301070800090b0202090009010b12010b0502090009010b11010b0502090009010b0e010b050209000901081508150815080a0c010a02010815020708150815020708150a020106081505060c081508150201030b120109000b110109000b0e010900010b080209000901010b10010900010b070209000901010b0b0209000901010b0c0209000901010b0402090009010501010b0d0109000b0d010901070b060209000901010608000209010902050303030303020902090305040403060b060209000901060b06020901090003081308130813010813040303060b060209000901060b0602090109000106080f020c080f01080f0f0c0608000303030303030b0d010b0502090009010103070b06020900090103030402070b0d0109000b0d0109000203060b0e01090002050b0d010b050209000901100c0c040814040104030308140403030303040a01030303030303070b060209000901030303050b0d0109000b0d010901010b0502090109000b0101030303030b0d0109000b0d010901070b06020900090103030703030b0d0109010303030b0d01090002030b0d0109020309000901090201090202030b0d01090304090009010902090301090302030b0d010901010b0d010902010b0d01090306010104040304010816040c050608000303060c05030d52617a6f7253776170506f6f6c076163636f756e7404636f696e056576656e74107265736f757263655f6163636f756e74067369676e657206737472696e670974696d657374616d7009747970655f696e666f1052617a6f72506f6f6c4c696272617279047532353607757136347836340941646d696e44617461094275726e4576656e74064576656e747309466c617368537761700e466c617368537761704576656e74064c50436f696e0d4c6971756964697479506f6f6c094d696e744576656e741050616972437265617465644576656e740850616972496e666f08506169724d65746109537761704576656e740953796e634576656e740d6164645f6c6971756964697479136164645f6c69717569646974795f656e747279116173736572745f6b5f696e637265617365126173736572745f6c705f756e6c6f636b6564116173736572745f6e6f745f7061757365640d6173736572745f70617573656404436f696e046275726e1863616c635f6f7074696d616c5f636f696e5f76616c75657310636865636b5f706169725f65786973740b636c61696d5f61646d696e0b6372656174655f706169720a666c6173685f737761700e6765745f61646d696e5f64617461156765745f616d6f756e74735f696e5f315f70616972156765745f616d6f756e74735f696e5f325f70616972156765745f616d6f756e74735f696e5f335f70616972166765745f616d6f756e74735f6f75745f315f70616972166765745f616d6f756e74735f6f75745f325f70616972166765745f616d6f756e74735f6f75745f335f70616972196765745f6c6173745f70726963655f63756d756c61746976650d6765745f706169725f6c6973740d6765745f706169725f6d657461116765745f72657365727665735f73697a651b6765745f7265736f757263655f6163636f756e745f7369676e65720b696e69745f6d6f64756c65046d696e740e4d696e744361706162696c697479096d696e745f636f696e116d696e745f6665655f696e74657276616c0570617573650e7061795f666c6173685f737761701072656d6f76655f6c69717569646974791672656d6f76655f6c69717569646974795f656e747279117365745f61646d696e5f616464726573730b7365745f64616f5f6665650e7365745f64616f5f6665655f746f0c7365745f737761705f666565047377617014737761705f636f696e735f666f725f636f696e7327737761705f636f696e735f666f725f65786163745f636f696e735f325f706169725f656e74727927737761705f636f696e735f666f725f65786163745f636f696e735f335f706169725f656e74727920737761705f636f696e735f666f725f65786163745f636f696e735f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f335f706169725f656e74727920737761705f65786163745f636f696e735f666f725f636f696e735f656e74727907756e70617573650f7570646174655f696e7465726e616c1077697468647261775f64616f5f6665650a7369676e65725f636170105369676e65724361706162696c6974790a64616f5f6665655f746f0d63757272656e745f61646d696e0d70656e64696e675f61646d696e0764616f5f66656508737761705f6665650a64616f5f6665655f6f6e0869735f706175736508616d6f756e745f7808616d6f756e745f79096c697175696469747912706169725f637265617465645f6576656e740b4576656e7448616e646c650a6d696e745f6576656e740a6275726e5f6576656e740a737761705f6576656e740a73796e635f6576656e7410666c6173685f737761705f6576656e740b6c6f616e5f636f696e5f780b6c6f616e5f636f696e5f790c72657061795f636f696e5f780c72657061795f636f696e5f790b64756d6d795f6669656c640e636f696e5f785f726573657276650e636f696e5f795f72657365727665146c6173745f626c6f636b5f74696d657374616d70176c6173745f70726963655f785f63756d756c6174697665176c6173745f70726963655f795f63756d756c6174697665066b5f6c6173740b6c705f6d696e745f6361700d6c705f667265657a655f63617010467265657a654361706162696c6974790b6c705f6275726e5f6361700e4275726e4361706162696c697479066c6f636b6564046d65746109706169725f6c69737406636f696e5f780854797065496e666f06636f696e5f79076c705f636f696e0b616d6f756e745f785f696e0b616d6f756e745f795f696e0c616d6f756e745f785f6f75740c616d6f756e745f795f6f757409726573657276655f7809726573657276655f7907636f6d706172650877697468647261770a616464726573735f6f661569735f6163636f756e745f72656769737465726564087265676973746572076465706f73697404553235360f69735f6f766572666c6f775f6d756c0966726f6d5f75313238036d756c0576616c7565176765745f6c70636f696e5f746f74616c5f737570706c7907657874726163740a656d69745f6576656e740571756f746506537472696e6704757466380673796d626f6c06617070656e640b617070656e645f75746638066c656e6774680a696e697469616c697a650d72656769737465725f636f696e047a65726f106e65775f6576656e745f68616e646c650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f757407747970655f6f661d6372656174655f7369676e65725f776974685f6361706162696c6974791d72657472696576655f7265736f757263655f6163636f756e745f636170056d657267650473717274036d696e08737172745f313238036469760661735f7536340c64657374726f795f7a65726f0b6e6f775f7365636f6e64730755513634783634086672616374696f6e07746f5f753132380c6f766572666c6f775f6164640762616c616e6365087472616e7366657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010520cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2030867000000000000000308680000000000000003086e000000000000000308690000000000000003086b0000000000000003086a0000000000000003086f0000000000000003086c0000000000000003086d000000000000000308660000000000000003087000000000000000030875000000000000000308760000000000000003087300000000000000030874000000000000000308770000000000000003087800000000000000030820000000000000000308ffffffffffffffff0308e803000000000000052065c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607052000000000000000000000000000000000000000000000000000000000000000000a02070652617a6f722d0a0202012d0a0204032d4c500a020e0d52617a6f7220444558204c50730a02090852617a6f722d4c50126170746f733a3a6d657461646174615f7631e207116600000000000000124552525f494e5445524e414c5f4552524f52135768656e20636f6e7472616374206572726f7267000000000000000d4552525f464f5242494444454e165768656e2075736572206973206e6f742061646d696e6800000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6c69000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e746a000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4d494e54205768656e206e6f7420656e6f756768206c6971756964697479206d696e7465646b000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4255524e205768656e206e6f7420656e6f756768206c6971756964697479206275726e65646c00000000000000194552525f494e53554646494349454e545f585f414d4f554e54185768656e206e6f7420656e6f756768205820616d6f756e746d00000000000000194552525f494e53554646494349454e545f595f414d4f554e54185768656e206e6f7420656e6f756768205920616d6f756e746e000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e746f000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e7470000000000000000b4552525f4b5f4552524f52155768656e20636f6e7472616374204b206572726f727300000000000000164552525f504149525f414c52454144595f45584953541e5768656e20616c726561647920657869737473206f6e206163636f756e747400000000000000124552525f504149525f4e4f545f45584953541a5768656e206e6f7420657869737473206f6e206163636f756e7475000000000000000e4552525f4c4f414e5f4552524f52165768656e206572726f72206c6f616e20616d6f756e7476000000000000000e4552525f4c4f434b5f4552524f521e5768656e20636f6e7472616374206973206e6f74207265656e7472616e747700000000000000144552525f504149525f4f524445525f4552524f521c5768656e2070616972206861732077726f6e67206f72646572696e677800000000000000124552525f5041555341424c455f4552524f52175768656e20636f6e74726163742069732070617573656400000002084a080f4c054d054e054f02500351015201010203530354035503020206560b10010b080209000901580b10010b070209000901590b10010b0102090009015a0b10010b0b02090009015b0b10010b0c02090009015c0b10010b0402090009010302025d035e030402045d035e035f036003050201610106020a620b0d010900630b0d0109016403650466046704680b0e010b050209000901690b11010b0502090009016b0b12010b0502090009016d010702035303540355030802016e080a0902016f0a080a0a02037008137208137308130b020474037503760377030c02047803790365046604061d0623021d011d081d031d071d041d0b1d0c1d000100030002061c323800040305070b000107102707153b00040b050f0b0001070f270b010b020b030b0438010c070c060a000b0638020c080a000b0738030c090b080b0938040c0a0a0011310c050a05380520042c0b003806052e0b00010b050b0a3807020101040400020609011a3800040e07153b0020040738080b000b010b020b030b043809051907153b01200413380a0b000b020b010b040b03380b020200000100245207152b001000140c0d0b00353210270000000000000000000000000000180b02350a0d3518170c070b01353210270000000000000000000000000000180b03350b0d3518170c0b0b04350b0535180c0a3200e1f5050000000000000000000000000c0c0a070a0b1135042a080c06052e0a0a0a0c11350c060b0604460b0711360b0b113611370c080b0a11360b0c113611370c090e080e09113831022104430545070b2705510b070b0b180b0a0b0c1826044f0551070b27020300000106011107153b0004040506070f2707153d003700140921040e0510070d27020400000100010a07152b001002142004070509071127020500000100010907152b001002140406050807112702060100030002062b75380004030505071027380c0e00380d0c0807153c000c090a093701380e0a093702380f0c0b0c0a07152b000c020a090b0238100c0738110c0c0a08350a0a35180a0c1a340c030a08350a0b35180b0c1a340c040a0936010a0338120c0d0a0936020a0438130c0e0a030600000000000000002404420a04060000000000000000240c010544090c010b010447054b0b09010705270a093701380e0a093702380f0c060c050b000a09370338140a090a050a060b0a0b0b38150b0704680b05350b0635180b09360415056a0b090107153c0236050b030b040b08390338160b0d0b0e020701000106315007153d000c0b0a0b3701380e0b0b3702380f0c0d0c0c0a0c0600000000000000002104140a0d060000000000000000210c040516090c040b04041d0b000b010c080c07054d0a000a0c0a0d113e0c0a0a0a0a012504320a0a0b0326042b052d0709270b000b0a0c060c0505490a010b0d0b0c113e0c090a090b0025043c053e070a270a090b0226044305450708270b090b010c060c050b050b060c080c070b070b080208010000070b3800040607153b000c00050907153b010c000b00020901040100331a07152a000c010b0011310a0110081421040b050f0b01010701270a011008140a010f091507160b010f0815020a0100020009346138000403050507102707153b0020040a050c070e27110411170c080717113f0c0438170c0538180c060d040b0511410d04071811420d040b0611410d04071911420e041143071224042a071a113f0c040e080b04071b113f31080838190c030c020c010e08381a0e08381b381c0600000000000000003200000000000000000000000000000000320000000000000000000000000000000032000000000000000000000000000000000b030b020b010939003f00381d0c0707152a090f0a0a07440e0e08381e0e08381f0e0838200e0838210e0838220e08382339020c000d0036060b07390438240e080b003f02020b010002000642443800040305050710270a0006000000000000000024040c080c0205100a01060000000000000000240c020b0204130515070c271104380c07153c000c060a063701380e0a002604270a063702380f0a01260c030529090c030b03042c05300b0601070227080a063600150a0636010a0038120c040b0636020a0138130c050b040b050b000b013905020c01000100431007152b000c000a001000140a00100c140a00100d140b00100214020d0100020006320e07152b001000140c0338250c020c010b000b010b020b031148020e0100020006051707152b001000140c0438260c030c020b000b020b030a0411480c0138250c030c020b010b020b030b041148020f0100020006452007152b001000140c0538270c040c030b000b030b040a0511480c0138260c040c030b010b030b040a0511480c0238250c040c030b020b030b040b05114802100100020006320e07152b001000140c0338250c020c010b000b010b020b03114902110100020006051707152b001000140c0438250c030c020b000b020b030a0411490c0138260c030c020b010b020b030b04114902120100020006452007152b001000140c0538250c040c030b000b030b040a0511490c0138260c040c030b010b030b040a0511490c0238270c040c030b020b030b040b05114902130100010647253800041207153d000c030a033707140a033708140b033709140c020c010c00052107153d010c040a04370a140a04370b140b04370c140c020c010c000b000b010b02021401000109010507152b09100a140215010000480b38280c0038290c01382a0c020b000b010b02120a0216010001064a1c3800040e07153d000c020a023701380e0b023702380f0c010c00051907153d010c030a03370d380e0b03370e380f0c010c000b000b01021700000100010507152b001011114b02180000004c210a0011310715210406050a0b00010701270b000700114c0c020e02114b0c010e010b020700070007163105061e00000000000000080912002d000e01400e000000000000000012092d0902190100030002064e950138000403050507102707153b000409050b070f271104380c0e00380e0c060e01380f0c0707153c000c0d0a0d3701380e0a0d3702380f0c0f0c0e07152b000c030a0d0b0338100c0b0a0d36010b00382b0a0d36020b01382c0a0d3701380e0a0d3702380f0c090c0838110c100a1032000000000000000000000000000000002104540a060a07114e071424044205460b0d010706270a060a07114e0714170c0c11170c020e0207140a0d370f382d056a0a06350a10180a0e351a340c040a07350b10180a0f351a340c050b040b05114f0c0c0a0c06000000000000000024046f05730b0d010706270a0c0a0d370f382e0c0a0a0d0a080a090b0e0b0f38150b0b0489010b08350b0935180b0d360415058b010b0d0107153c0236100b060b070b0c3906382f0b0a021a00000051140a0011310c030a03380520040a0b003806050c0b00010b010b02382e0c040b030b043807021b0000005296010a01100d140c070a003704140c080a070487010a083200000000000000000000000000000000220482010a003701380e0c0d0a003702380f0c0e0b0d0b0e114e0c0f0b0811510c1038110c110a0f0a1024047d0a0f0a1017350c040a110a04113504560b1111360b04113611370c0b0b0f350a01100c1435180b10351611360c050b0b0b05115211530c090a090600000000000000002404510b011011114b0c020e020b090b00370f382d05550b00010b0101057c0b110b04180c0c0b0f350a01100c1435180b1035160c060b0c0b061a340c0a0a0a0600000000000000002404780b011011114b0c030e030b0a0b00370f382d057c0b00010b01010581010b00010b01010586010b00010b01010594010b01010b0832000000000000000000000000000000002204920132000000000000000000000000000000000b003604150594010b00010b07021c010401003315110407152a000c010b0011310a0110091421040c05100b0101070127080b010f0215021d010003000206536438000403050507102707153b000409050b070f2711040b023a050c090c080e00380e0c040e01380f0c050a0406000000000000000024041d080c0305210a05060000000000000000240c030b0304240526070c2707153c000c0a0a0a3701380e0c0b0a0a3702380f0c0c0b0b0a08160c0b0b0c0a09160c0c0a0a36010b00382b0a0a36020b01382c0a0a3701380e0c060a0a3702380f0c070a060a070a040a050a0b0a0c11020a0a0b060b070b0b0b0c3815090b0a36001507153c0236110b080b090b040b0539073830021e010003000206041c3800040305050710270b0038310c040c030e03380e0b0126040f05110708270e04380f0b0226041705190709270b030b04021f010403000206541d3800040b0a000b0138320b020b0338330c060c0505130a000b0138340b030b0238350c050c060b0011310c040a040b0538360b040b063837022001040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f0815022101040100332107152a000c020b0011310a0210091421040b050f0b02010701270a013100210418090b020f0d150520080a020f0d150b010b020f0c15022201040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f1515022301040100331d07152a000c020b0011310a0210091421040b050f0b02010701270a0106e80300000000000025041405180b02010702270b010b020f0015022401000300020656661104380c0e00380e0c060e02380f0c070a0606000000000000000024040f080c0405130a07060000000000000000240c040b04041605180703270a0106000000000000000024041f080c0505230a03060000000000000000240c050b050426052807072707153c000c0c0a0c3701380e0a0c3702380f0c0e0c0d0a0c36010b00382b0a0c36020b02382c0a0c36010a0138120c0a0a0c36020a0338130c0b0a0c3701380e0a0c3702380f0c090c080a080a090a060a070a0d0a0e11020b0c0b080b090b0d0b0e381507153c0236120b060b070b010b03390838380b0a0b0b022501000300020657260e00380e0c0107152b001000140c0638250c050c040b010b040b050b0611490c023800041b0b00060000000000000000381c0b0238390c030c070522381c0b020b00060000000000000000383a0c070c030b07383b0b03022601040300020658190b01383c0c030a030b02250408050c0b00010703270a000b033802383d383e0c040a00383f0b0011310b04384002270104030002065b1a0b0138410c030a030b02250408050c0b00010703270a000b033802383d383e38420c040a0038430b0011310b04384402280104030002065e180b0138450c030a030b02250408050c0b00010703270a000b033802383d0c040a0038460b0011310b04383702290104030002065f170a000b013802383d383e0c030e0338470b0226040c05100b00010707270a00383f0b0011310b033840022a01040300020660180a000b013802383d383e38420c030e0338480b0226040d05110b00010707270a0038430b0011310b033844022b01040300020619160a000b013802383d0c030e03380f0b0226040b050f0b00010707270a0038460b0011310b033837022c010401003315110507152a000c010b0011310a0110091421040c05100b0101070127090b010f0215022d00000102614f11550c090a090a0037091417350c0a0a0a32000000000000000000000000000000002404120a03060000000000000000220c050514090c050b05041b0a04060000000000000000220c06051d090c060b06043d0a040a03115611570a0a180c070a003707140b0711580a003607150b030b04115611570b0a180c080a003708140b0811580a003608150b090a0036091507153c0236130b010b020a003707140b0037081439093849022e01040100632c38002004060b00384a0207152b000c030a0011310c020a020b0310151421041305170b00010701270a02380520041e0b00380605200b00010715384b0714170c0411170c010e010b020b04384c02000506090007060006010608060502020003000209000200000400060603060406020000060602010205000102030204011d031d041d051d061d071d0b1d0e1d0f1d101d0f230e23102304230323121d131d141d161d171d00\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"RazorSwapPool\",\"friends\":[],\"exposed_functions\":[{\"name\":\"add_liquidity\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"add_liquidity_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"burn\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"calc_optimal_coin_values\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\",\"u64\"]},{\"name\":\"check_pair_exist\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"bool\"]},{\"name\":\"claim_admin\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"create_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[]},{\"name\":\"flash_swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>\"]},{\"name\":\"get_admin_data\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"u64\",\"u8\",\"bool\",\"bool\"]},{\"name\":\"get_amounts_in_1_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_in_2_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_in_3_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_1_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_2_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amounts_out_3_pair\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_last_price_cumulative\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"u128\",\"u128\",\"u64\"]},{\"name\":\"get_pair_list\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[],\"return\":[\"vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>\"]},{\"name\":\"get_pair_meta\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta\"]},{\"name\":\"get_reserves_size\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"u64\",\"u64\"]},{\"name\":\"mint\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"],\"return\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"]},{\"name\":\"pause\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"pay_flash_swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\",\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>\"],\"return\":[]},{\"name\":\"remove_liquidity\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\",\"u64\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"remove_liquidity_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"set_admin_address\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"address\"],\"return\":[]},{\"name\":\"set_dao_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"u8\"],\"return\":[]},{\"name\":\"set_dao_fee_to\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"address\"],\"return\":[]},{\"name\":\"set_swap_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\",\"u64\"],\"return\":[]},{\"name\":\"swap\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\",\"u64\",\"0x1::coin::Coin<T1>\",\"u64\"],\"return\":[\"0x1::coin::Coin<T0>\",\"0x1::coin::Coin<T1>\"]},{\"name\":\"swap_coins_for_coins\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"0x1::coin::Coin<T0>\"],\"return\":[\"0x1::coin::Coin<T1>\"]},{\"name\":\"swap_coins_for_exact_coins_2_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_coins_for_exact_coins_3_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_coins_for_exact_coins_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_2_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_3_pair_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"swap_exact_coins_for_coins_entry\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\",\"u64\",\"u64\"],\"return\":[]},{\"name\":\"unpause\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"withdraw_dao_fee\",\"visibility\":\"public\",\"is_entry\":true,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[\"&signer\"],\"return\":[]}],\"structs\":[{\"name\":\"AdminData\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"signer_cap\",\"type\":\"0x1::account::SignerCapability\"},{\"name\":\"dao_fee_to\",\"type\":\"address\"},{\"name\":\"current_admin\",\"type\":\"address\"},{\"name\":\"pending_admin\",\"type\":\"address\"},{\"name\":\"dao_fee\",\"type\":\"u8\"},{\"name\":\"swap_fee\",\"type\":\"u64\"},{\"name\":\"dao_fee_on\",\"type\":\"bool\"},{\"name\":\"is_pause\",\"type\":\"bool\"}]},{\"name\":\"BurnEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x\",\"type\":\"u64\"},{\"name\":\"amount_y\",\"type\":\"u64\"},{\"name\":\"liquidity\",\"type\":\"u64\"}]},{\"name\":\"Events\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"pair_created_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairCreatedEvent<T0, T1>>\"},{\"name\":\"mint_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::MintEvent<T0, T1>>\"},{\"name\":\"burn_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::BurnEvent<T0, T1>>\"},{\"name\":\"swap_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SwapEvent<T0, T1>>\"},{\"name\":\"sync_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SyncEvent<T0, T1>>\"},{\"name\":\"flash_swap_event\",\"type\":\"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwapEvent<T0, T1>>\"}]},{\"name\":\"FlashSwap\",\"is_native\":false,\"abilities\":[],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"loan_coin_x\",\"type\":\"u64\"},{\"name\":\"loan_coin_y\",\"type\":\"u64\"}]},{\"name\":\"FlashSwapEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"loan_coin_x\",\"type\":\"u64\"},{\"name\":\"loan_coin_y\",\"type\":\"u64\"},{\"name\":\"repay_coin_x\",\"type\":\"u64\"},{\"name\":\"repay_coin_y\",\"type\":\"u64\"}]},{\"name\":\"LPCoin\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"dummy_field\",\"type\":\"bool\"}]},{\"name\":\"LiquidityPool\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"coin_x_reserve\",\"type\":\"0x1::coin::Coin<T0>\"},{\"name\":\"coin_y_reserve\",\"type\":\"0x1::coin::Coin<T1>\"},{\"name\":\"last_block_timestamp\",\"type\":\"u64\"},{\"name\":\"last_price_x_cumulative\",\"type\":\"u128\"},{\"name\":\"last_price_y_cumulative\",\"type\":\"u128\"},{\"name\":\"k_last\",\"type\":\"u128\"},{\"name\":\"lp_mint_cap\",\"type\":\"0x1::coin::MintCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"lp_freeze_cap\",\"type\":\"0x1::coin::FreezeCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"lp_burn_cap\",\"type\":\"0x1::coin::BurnCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>\"},{\"name\":\"locked\",\"type\":\"bool\"}]},{\"name\":\"MintEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x\",\"type\":\"u64\"},{\"name\":\"amount_y\",\"type\":\"u64\"},{\"name\":\"liquidity\",\"type\":\"u64\"}]},{\"name\":\"PairCreatedEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"meta\",\"type\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta\"}]},{\"name\":\"PairInfo\",\"is_native\":false,\"abilities\":[\"key\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"pair_list\",\"type\":\"vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>\"}]},{\"name\":\"PairMeta\",\"is_native\":false,\"abilities\":[\"copy\",\"drop\",\"store\"],\"generic_type_params\":[],\"fields\":[{\"name\":\"coin_x\",\"type\":\"0x1::type_info::TypeInfo\"},{\"name\":\"coin_y\",\"type\":\"0x1::type_info::TypeInfo\"},{\"name\":\"lp_coin\",\"type\":\"0x1::type_info::TypeInfo\"}]},{\"name\":\"SwapEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"amount_x_in\",\"type\":\"u64\"},{\"name\":\"amount_y_in\",\"type\":\"u64\"},{\"name\":\"amount_x_out\",\"type\":\"u64\"},{\"name\":\"amount_y_out\",\"type\":\"u64\"}]},{\"name\":\"SyncEvent\",\"is_native\":false,\"abilities\":[\"drop\",\"store\"],\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"fields\":[{\"name\":\"reserve_x\",\"type\":\"u64\"},{\"name\":\"reserve_y\",\"type\":\"u64\"},{\"name\":\"last_price_x_cumulative\",\"type\":\"u128\"},{\"name\":\"last_price_y_cumulative\",\"type\":\"u128\"}]}]}},{\"bytecode\":\"0xa11ceb0b060000000a01000e020e0e031c6e048a010e0598015707ef01af02089e044006de044410a205e4020c8608fe05000001010102010301040105010602120200051307000317070100000007000102000000080203000009020300000a00040100000b050100000c060300000d050400000e070300000f08000100001006030000110403000614000b010005150d030002070e0f010002161001000118001301000319140a0100041a081500011b15010100011c080001000b0a0b0c0d0b0f0a1004120a130a0001010403030303010301040204040203030303030301060c03080008010801010900010801010901010608010206090006090001080001060800030104040401040404010b02010401070b02010900010504030304041052617a6f72506f6f6c4c69627261727904636f696e0a636f6d70617261746f72066f7074696f6e067369676e657206737472696e6709747970655f696e666f07636f6d706172650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f7574176765745f6c70636f696e5f746f74616c5f737570706c790f69735f6f766572666c6f775f6d756c036d696e0c6f766572666c6f775f6164640571756f74650d72656769737465725f636f696e047371727408737172745f31323806526573756c7406537472696e6709747970655f6e616d65066c656e6774680f69735f736d616c6c65725f7468616e064f7074696f6e06737570706c7907657874726163740a616464726573735f6f661569735f6163636f756e745f7265676973746572656408726567697374657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010308cd000000000000000308c9000000000000000308cb000000000000000308ca000000000000000308cc000000000000000410ffffffffffffffffffffffffffffffff126170746f733a3a6d657461646174615f7631cf0205c900000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6cca000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e74cb000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e74cc000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e74cd00000000000000184552525f434f494e5f545950455f53414d455f4552524f521e5768656e2074776f20636f696e2074797065206973207468652073616d65000000010000092238000c0138010c020a010a02220409050b0700270e01110c0e02110c23041308020e01110c0e02110c24041b09020e010e0238020c000e00110e020101000011300a0006000000000000000024040505070704270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b01350a0035183210270000000000000000000000000000180c060b020b0017350610270000000000000b031735180c050b060b051a32010000000000000000000000000000001634020201000012300a0006000000000000000024040505070702270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b00350610270000000000000b031735180c050a050b0235180c070b01353210270000000000000000000000000000180b05160c060b070b061a340203010000130538030c000d0038040204010000000607050b011a0b0025020501000000080a000a012304060b00020b010206010000042007050a01170c020a020a0023040e0b000b02173201000000000000000000000000000000170207050a00170c020a020a0123041c0b010b0217320100000000000000000000000000000017020b000b0116020701000001210a0006000000000000000024040505070701270a010600000000000000002404100a02060000000000000000240c030512090c030b03041505170703270b00350b0235180b01351a340208010000000b0a00111138052004080b003806050a0b0001020901000000070b00350b013518110a020a010000162d0a0032040000000000000000000000000000002304100b00320000000000000000000000000000000021040b0600000000000000000c01050d0601000000000000000c010b010c02052b0a000c040a0032020000000000000000000000000000001a3201000000000000000000000000000000160c030a030a04230428051d0a030c040a000a031a0b031632020000000000000000000000000000001a0c0305180b04340c020b020200\",\"abi\":{\"address\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607\",\"name\":\"RazorPoolLibrary\",\"friends\":[],\"exposed_functions\":[{\"name\":\"compare\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]},{\"constraints\":[]}],\"params\":[],\"return\":[\"bool\"]},{\"name\":\"get_amount_in\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_amount_out\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"get_lpcoin_total_supply\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]}],\"params\":[],\"return\":[\"u128\"]},{\"name\":\"is_overflow_mul\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\",\"u128\"],\"return\":[\"bool\"]},{\"name\":\"min\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"overflow_add\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\",\"u128\"],\"return\":[\"u128\"]},{\"name\":\"quote\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"register_coin\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[{\"constraints\":[]}],\"params\":[\"&signer\"],\"return\":[]},{\"name\":\"sqrt\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u64\",\"u64\"],\"return\":[\"u64\"]},{\"name\":\"sqrt_128\",\"visibility\":\"public\",\"is_entry\":false,\"is_view\":false,\"generic_type_params\":[],\"params\":[\"u128\"],\"return\":[\"u64\"]}],\"structs\":[]}}]",
        // data: "{\"function\":\"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::swap_exact_coins_for_coins_2_pair_entry\",\"typeArguments\":[\"0x1::aptos_coin::AptosCoin\",\"0xcab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2::razor_token::Razor\",\"0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::USDC\"],\"functionArguments\":[\"3200000000\",\"48605237\"]}"
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      data: param,
    };
    let tx = await wallet.signTransaction(signParams);
    console.log(tx);
    // const expected = "986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9223000000000000000265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f546070d52617a6f7253776170506f6f6c27737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e747279030700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0007cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f20b72617a6f725f746f6b656e0552617a6f720007275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f06746f6b656e7304555344430002080020bcbe000000000835a8e50200000000400d030000000000640000000000000033615fcd000000001b0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b054000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    // expect(tx).toBe(expected)
  });

  test('simulate function call by a transaction', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'simulate',
      base: {
        sequenceNumber: '35',
        chainId: 27,
        maxGasAmount: '200000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1722643868',
      },
      data: {
        abi: '[{"bytecode":"0xa11ceb0b060000000b010002020208030a7d058701a50107ac02e7010893042006b3045f1092059f020ab1071e0ccf07f4190dc32118000000010700000207000003000100000401020000050103000006000100000700010000080403000009000100000a050600000b000100000c070800000d020100000e030100000f09030000100a03000011030600001200010000130b0c0000140b0c0000150d0e0000160f0e00001710010000181001000019020b00001a000100001b0e010002080108010108010104010301060801020608010608010102010800020801010206080103020608000302030302030103070801030300030708000303020801020a03030303010101030308010101020101040303030801030303030801030303020308010305010101080101070303030303030304020302021501030303030303030303030303030101010301080108000503010404040303010307030303030308010304753235360544553235360455323536036164640761735f753132380661735f75363406626974616e64056269746f72046269747306626974786f7207636f6d70617265036469760d64753235365f746f5f753235360966726f6d5f753132380866726f6d5f75363403676574056765745f64116c656164696e675f7a65726f735f753634036d756c0f6f766572666c6f77696e675f6164640f6f766572666c6f77696e675f73756203707574057075745f640373686c037368720a73706c69745f7531323803737562047a65726f02763002763102763202763302763402763502763602763765c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607030800000000000000000308030000000000000003080200000000000000020100030801000000000000000201020201010410ffffffffffffffffffffffffffffffff0410ffffffffffffffff000000000000000003080400000000000000126170746f733a3a6d657461646174615f76318a020400000000000000000e45434153545f4f564552464c4f57395768656e2063616e277420636173742060553235366020746f206075313238602028652e672e206e756d62657220746f6f206c61726765292e01000000000000000f45574f5244535f4f564552464c4f573f5768656e20747279696e6720746f20676574206f722070757420776f726420696e746f2055323536206275742069742773206f7574206f6620696e6465782e020000000000000009454f564552464c4f57145768656e206d617468206f766572666c6f77732e03000000000000000c454449565f42595f5a45524f215768656e20617474656d7074656420746f20646976696465206279207a65726f2e00000002081c031d031e031f0320032103220323030102041c031d031e031f0300010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311100c070b0411100c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311100c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b020101000012200e0010001406000000000000000021040d0e00100114060000000000000000210c01050f090c010b01041205140700270e001002143531402f0e001003143516020201000013230e0010021406000000000000000021040d0e00100014060000000000000000210c01050f090c010b0104180e00100114060000000000000000210c02051a090c020b02041d051f0700270e001003140203000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031c11120b04060100000000000000160c0405040b050204000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031b11120b04060100000000000000160c0405040b050205000000152e0601000000000000000c030a03070923042405070a0007090a0317110c0c010a0106000000000000000024041f0b000106400000000000000007090b031706010000000000000016180b01110e3417020b03060100000000000000160c0305020b00060000000000000000110c0c020640000000000000000b02110e34170206000000141e11180c050600000000000000000c040a04070923041c05090e000a04110c0c020e010a04110c0c030d050a040b020b031d11120b04060100000000000000160c0405040b050207010000152a07090c040a0406000000000000000024042405070b04060100000000000000170c040a000a04110c0c020a010a04110c0c030a020a032204230b01010b00010b020b0323042107060207050205020b01010b000107030208010000165711180c080e0011050c030e0111050c040a0406000000000000000022040d050f0701270a030a042304150b08020b030b04170c090b010a093311140c010e000e0111070c060a06070521042a0527080c02052e0b060703210c020b0204470a090640000000000000001a0c070e080a07110c0601000000000000000a0906400000000000000019332f1b0c050d080b070b0511120b000a0111170c000b01310111150c010a0906000000000000000021045005550b09060100000000000000170c09051e0b080209000000173c0e001004140e001005140e001006140e0010071412010c04090c050e00100814060000000000000000220419080c01051f0e00100914060000000000000000220c010b010424080c02052a0e00100a14060000000000000000220c020b02042f080c0305350e00100b14060000000000000000220c030b030439080c050b040b05020a0100000b0a0b0011160c010c020b010b020600000000000000000600000000000000001201020b0100000e040b0035110a020c010000152e0a010600000000000000002104090b001003140c04052c0a010601000000000000002104120b001002140c03052a0a0106020000000000000021041b0b001000140c0205280b0106030000000000000021042005240b00010704270b001001140c020b020c030b030c040b04020d000000185a0a010600000000000000002104090b001004140c0805580a010601000000000000002104120b001005140c0705560a0106020000000000000021041b0b001006140c0605540a010603000000000000002104240b001007140c0505520a0106040000000000000021042d0b001008140c0405500a010605000000000000002104360b001009140c03054e0a0106060000000000000021043f0b00100a140c02054c0b0106070000000000000021044405480b00010704270b00100b140c020b020c030b030c040b040c050b050c060b060c070b070c080b08020e000000194d0a000600000000000000002104063140020a0006ffffffff000000001c0c020a0031203006000000000000000021042e31200c030a03310126044b05170a020a03310117300601000000000000001c06000000000000000022042205270b033101170c03051231200b03173120160c01054931400c040a04310126044c05350a000a04310117300601000000000000001c06000000000000000022044005450b043101170c04053031400b04170c010b0102052705450f0100001a8c0106000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000006000000000000000012000c160600000000000000000c0c0a0c07092304800105110600000000000000000c070e010a0c110c0c060600000000000000000c0d0a0d070923047b051e0e000a0d110c0c050a05060000000000000000220429080c02052d0a07060000000000000000220c020b0204760b05350a06351811160c0e0c0a0e160a0c0a0d16110d0c090b0e0b0911100c100c0f0d160a0c0a0d160b0f11130b10044d0601000000000000000c03054f0600000000000000000c030b030c130e160a0c0a0d1606010000000000000016110d0c080b0a0b13160b0711100c110b0811100c120c0b0d160a0c0a0d16060100000000000000160b0b11130b110b121e04720601000000000000000c0405740600000000000000000c040b040c070b0d060100000000000000160c0d05190b0c060100000000000000160c0c050c0b1611090c140c150b1420048801058a010702270b1502100000001b220b00350c040b01350c050a040a05160c060a0607082404180b0607081732010000000000000000000000000000001734080c030c02051f0b040b051634090c030c020b020b0302110000001c1b0a000a012304120b010b00170c040708340b041706010000000000000016080c030c0205180b000b0117090c030c020b020b0302120000000e290a010600000000000000002104090b020b000f031505280a010601000000000000002104120b020b000f021505280a0106020000000000000021041b0b020b000f001505280b0106030000000000000021042005240b00010704270b020b000f011502130000000e4d0a010600000000000000002104090b020b000f0415054c0a010601000000000000002104120b020b000f0515054c0a0106020000000000000021041b0b020b000f0615054c0a010603000000000000002104240b020b000f0715054c0a0106040000000000000021042d0b020b000f0815054c0a010605000000000000002104360b020b000f0915054c0a0106060000000000000021043f0b020b000f0a15054c0b0106070000000000000021044405480b00010704270b020b000f0b1502140100001d4e11180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a030a0817110c0a02332f0c050d070a030b0511120b03060100000000000000160c03050e0a0206000000000000000024044c0a08060100000000000000160c040a04070923044c05320e070a04110c0e000a04060100000000000000170a0817110c31400a02331730160c060d070a040b0611120b04060100000000000000160c04052d0b0702150100001d5211180c070a01340640000000000000001a0c080b0134064000000000000000190c020a080c030a03070923042505130e000a03110c0a0233300c050d070a030a08170b0511120b03060100000000000000160c03050e0a020600000000000000002404500a08060100000000000000160c040a04070923045005320e070a040a081706010000000000000017110c0e000a04110c31400a0233172f160c060d070a040a0817060100000000000000170b0611120b04060100000000000000160c04052d0b0702160000000b0d0a00314030340c010b0032ffffffffffffffff00000000000000001c340c020b010b020217010000114f11180c0b0600000000000000000c040600000000000000000c050a050709230446050b0e000a05110c0c020e010a05110c0c030a040600000000000000002204320b020b0311110c070b0411110c080c0a0d0b0a050b0a11120600000000000000000c040b07042b0b04060100000000000000160c040b0804310b04060100000000000000160c0405410b020b0311110c060c090d0b0a050b0911120600000000000000000c040b0604410601000000000000000c040b05060100000000000000160c0505060b0406000000000000000021044b054d0702270b0b02180100000e0606000000000000000006000000000000000006000000000000000006000000000000000012010201020103010101000000000100020003000400050006000700","abi":{"address":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607","name":"u256","friends":[],"exposed_functions":[{"name":"add","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"as_u128","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["u128"]},{"name":"as_u64","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["u64"]},{"name":"compare","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["u8"]},{"name":"div","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"from_u128","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"from_u64","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"get","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","u64"],"return":["u64"]},{"name":"mul","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"shl","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","u8"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"shr","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","u8"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"sub","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]},{"name":"zero","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::u256::U256"]}],"structs":[{"name":"DU256","is_native":false,"abilities":["copy","drop","store"],"generic_type_params":[],"fields":[{"name":"v0","type":"u64"},{"name":"v1","type":"u64"},{"name":"v2","type":"u64"},{"name":"v3","type":"u64"},{"name":"v4","type":"u64"},{"name":"v5","type":"u64"},{"name":"v6","type":"u64"},{"name":"v7","type":"u64"}]},{"name":"U256","is_native":false,"abilities":["copy","drop","store"],"generic_type_params":[],"fields":[{"name":"v0","type":"u64"},{"name":"v1","type":"u64"},{"name":"v2","type":"u64"},{"name":"v3","type":"u64"}]}]}},{"bytecode":"0xa11ceb0b060000000b010002020204030628052e1e074c490895012006b5012510da01780ad202050cd702d5010dac0402000000010700000200010000030203000004040200000503020000060502000007060700000804020000090208000206080006080001020108000103020800030203030106080001010104000775713634783634075551363478363407636f6d70617265066465636f64650364697606656e636f6465086672616374696f6e0769735f7a65726f036d756c07746f5f75313238017665c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607020100030864000000000000000201020201010410ffffffffffffffff0000000000000000126170746f733a3a6d657461646174615f76316402000000000000000005455155414c185768656e206120616e6420622061726520657175616c732e6400000000000000124552525f4449564944455f42595f5a45524f1e5768656e20646976696465206279207a65726f20617474656d707465642e00000002010a0400010000091a0a001000140a0110001421040e0b01010b00010700020b001000140b011000142304180703020702020101000009070e0010001407041a340202010000090f0a0106000000000000000022040505070701270e001000140b01351a1200020301000009060b00350704181200020401000009100a0106000000000000000022040505070701270b00350704180b01351a1200020501000009060b00100014320000000000000000000000000000000021020601000009080e001000140b0135181200020701000009040e0010001402000000","abi":{"address":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607","name":"uq64x64","friends":[],"exposed_functions":[{"name":"compare","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64","&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"],"return":["u8"]},{"name":"decode","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"],"return":["u64"]},{"name":"div","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64","u64"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"]},{"name":"encode","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"]},{"name":"fraction","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"]},{"name":"is_zero","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"],"return":["bool"]},{"name":"mul","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64","u64"],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"]},{"name":"to_u128","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::uq64x64::UQ64x64"],"return":["u128"]}],"structs":[{"name":"UQ64x64","is_native":false,"abilities":["copy","drop","store"],"generic_type_params":[],"fields":[{"name":"v","type":"u128"}]}]}},{"bytecode":"0xa11ceb0b060000000e0100180218910103a901ce0404f7059a01059107e10607f20da21108941f4006d41fe10210b522f7070aac2aeb010b972c140cab2cb7200de24c300e924d280000010101020103010401050106010701080009000a000b000c0800000d060200010001000e080200010001000f00020001000100100602000100010011080200010001001208020001000100130602000100010014060200010001001508000016070000170602000100010018060200010001021f04010001023405010001014b0600035704010601026a05010001026c05010001087107000a8001070006890107000ba001070000190001020000001a0001020000001b020100001c0101020000001d010100001e010100002003040200000021050602000000220107020000002308010000240101020000002506090200000026010a0000270b0b02000000280b0b0300000000290b0b0400000000002a0b0b020000002b0b0b03000000002c0b0b0400000000002d010c020000002e010d00002f010e020000003001060200000031010f00003208010000330403020000003510010200000036110702000000370801000038090102000000391204020000003a1301020000003b140100003c150100003d140100003e160100003f17040200000040181902000000411a010300000000421a01040000000000431a0102000000441a010300000000451a01040000000000461a01020000004708010000481b0102000000490801020000097a0107020000027b16180100057c082000027d20070100027e08010100027f220101000981012507000a82012627000a83012827000a7a292a000284012c0b0100098501012601000286012d18010002202e01010003870130010106098801320b00068a01353600028b0101360100068c01370100068d01380100068e01390b00028f013a3b01000990010801010002910101180100019201083d0106099301050b00099401050b00089501014901000196014b0f00049701144d000298014f010100099901060b00099a01060b00023350180100099b01260b000a9c012827000a9d01270b00029e0118010100079f01010b000ba1010662000ba20162260009a30125260002a401200b010002a501640101002f1d071d301e301f191d3221332134210a1d001d0a230023031d3921391e391f1b1d3a213b1e3b1f3c212d1d3d2f401e401f44214521461e461f151d473c473e472f473f474047413d3c161d164416464a1e4a1f4a214d1e4d1f1a1d50213d3e3d41061d30211e1d30551e23341e341f3d3f241d2423541e0e59251d2544455a345a0f5c2546455d345d0d1d451f395a395d3d402e2359215a2105060c030303030006030303030303010b0d010b050209000901020b0d0109000b0d0109010403030303020303010101060c030b0d0109000b0d0109010b0302090009010403020101010303040403010a080a01080a010c03060c03060b0e010b05020900090102070b060209000901060800030b0d010b050209000901030304060c03030302060c0502060c0202060c03040b0d010900030b0d01090103010b0d010900010b0d01090103060c030305070b06020900090103030303060503030b0d0109000b0d0109010b0d010b05020900090102090009010109000109010105010b05020900090102050b0d01090002090109000801040814081404040403020404010401081402081408140206081406081401020e01060800030303030103070b0602090009010303040b0d0109000b0d01090101060b0d01090002070b0d01090003020b0d010900060b12010900010b01020900090102070b1001090009000a01030303030303060b06020900090103030303030301070800090b0202090009010b12010b0502090009010b11010b0502090009010b0e010b050209000901081508150815080a0c010a02010815020708150815020708150a020106081505060c081508150201030b120109000b110109000b0e010900010b080209000901010b10010900010b070209000901010b0b0209000901010b0c0209000901010b0402090009010501010b0d0109000b0d010901070b060209000901010608000209010902050303030303020902090305040403060b060209000901060b06020901090003081308130813010813040303060b060209000901060b0602090109000106080f020c080f01080f0f0c0608000303030303030b0d010b0502090009010103070b06020900090103030402070b0d0109000b0d0109000203060b0e01090002050b0d010b050209000901100c0c040814040104030308140403030303040a01030303030303070b060209000901030303050b0d0109000b0d010901010b0502090109000b0101030303030b0d0109000b0d010901070b06020900090103030703030b0d0109010303030b0d01090002030b0d0109020309000901090201090202030b0d01090304090009010902090301090302030b0d010901010b0d010902010b0d01090306010104040304010816040c050608000303060c05030d52617a6f7253776170506f6f6c076163636f756e7404636f696e056576656e74107265736f757263655f6163636f756e74067369676e657206737472696e670974696d657374616d7009747970655f696e666f1052617a6f72506f6f6c4c696272617279047532353607757136347836340941646d696e44617461094275726e4576656e74064576656e747309466c617368537761700e466c617368537761704576656e74064c50436f696e0d4c6971756964697479506f6f6c094d696e744576656e741050616972437265617465644576656e740850616972496e666f08506169724d65746109537761704576656e740953796e634576656e740d6164645f6c6971756964697479136164645f6c69717569646974795f656e747279116173736572745f6b5f696e637265617365126173736572745f6c705f756e6c6f636b6564116173736572745f6e6f745f7061757365640d6173736572745f70617573656404436f696e046275726e1863616c635f6f7074696d616c5f636f696e5f76616c75657310636865636b5f706169725f65786973740b636c61696d5f61646d696e0b6372656174655f706169720a666c6173685f737761700e6765745f61646d696e5f64617461156765745f616d6f756e74735f696e5f315f70616972156765745f616d6f756e74735f696e5f325f70616972156765745f616d6f756e74735f696e5f335f70616972166765745f616d6f756e74735f6f75745f315f70616972166765745f616d6f756e74735f6f75745f325f70616972166765745f616d6f756e74735f6f75745f335f70616972196765745f6c6173745f70726963655f63756d756c61746976650d6765745f706169725f6c6973740d6765745f706169725f6d657461116765745f72657365727665735f73697a651b6765745f7265736f757263655f6163636f756e745f7369676e65720b696e69745f6d6f64756c65046d696e740e4d696e744361706162696c697479096d696e745f636f696e116d696e745f6665655f696e74657276616c0570617573650e7061795f666c6173685f737761701072656d6f76655f6c69717569646974791672656d6f76655f6c69717569646974795f656e747279117365745f61646d696e5f616464726573730b7365745f64616f5f6665650e7365745f64616f5f6665655f746f0c7365745f737761705f666565047377617014737761705f636f696e735f666f725f636f696e7327737761705f636f696e735f666f725f65786163745f636f696e735f325f706169725f656e74727927737761705f636f696e735f666f725f65786163745f636f696e735f335f706169725f656e74727920737761705f636f696e735f666f725f65786163745f636f696e735f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e74727927737761705f65786163745f636f696e735f666f725f636f696e735f335f706169725f656e74727920737761705f65786163745f636f696e735f666f725f636f696e735f656e74727907756e70617573650f7570646174655f696e7465726e616c1077697468647261775f64616f5f6665650a7369676e65725f636170105369676e65724361706162696c6974790a64616f5f6665655f746f0d63757272656e745f61646d696e0d70656e64696e675f61646d696e0764616f5f66656508737761705f6665650a64616f5f6665655f6f6e0869735f706175736508616d6f756e745f7808616d6f756e745f79096c697175696469747912706169725f637265617465645f6576656e740b4576656e7448616e646c650a6d696e745f6576656e740a6275726e5f6576656e740a737761705f6576656e740a73796e635f6576656e7410666c6173685f737761705f6576656e740b6c6f616e5f636f696e5f780b6c6f616e5f636f696e5f790c72657061795f636f696e5f780c72657061795f636f696e5f790b64756d6d795f6669656c640e636f696e5f785f726573657276650e636f696e5f795f72657365727665146c6173745f626c6f636b5f74696d657374616d70176c6173745f70726963655f785f63756d756c6174697665176c6173745f70726963655f795f63756d756c6174697665066b5f6c6173740b6c705f6d696e745f6361700d6c705f667265657a655f63617010467265657a654361706162696c6974790b6c705f6275726e5f6361700e4275726e4361706162696c697479066c6f636b6564046d65746109706169725f6c69737406636f696e5f780854797065496e666f06636f696e5f79076c705f636f696e0b616d6f756e745f785f696e0b616d6f756e745f795f696e0c616d6f756e745f785f6f75740c616d6f756e745f795f6f757409726573657276655f7809726573657276655f7907636f6d706172650877697468647261770a616464726573735f6f661569735f6163636f756e745f72656769737465726564087265676973746572076465706f73697404553235360f69735f6f766572666c6f775f6d756c0966726f6d5f75313238036d756c0576616c7565176765745f6c70636f696e5f746f74616c5f737570706c7907657874726163740a656d69745f6576656e740571756f746506537472696e6704757466380673796d626f6c06617070656e640b617070656e645f75746638066c656e6774680a696e697469616c697a650d72656769737465725f636f696e047a65726f106e65775f6576656e745f68616e646c650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f757407747970655f6f661d6372656174655f7369676e65725f776974685f6361706162696c6974791d72657472696576655f7265736f757263655f6163636f756e745f636170056d657267650473717274036d696e08737172745f313238036469760661735f7536340c64657374726f795f7a65726f0b6e6f775f7365636f6e64730755513634783634086672616374696f6e07746f5f753132380c6f766572666c6f775f6164640762616c616e6365087472616e7366657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010520cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2030867000000000000000308680000000000000003086e000000000000000308690000000000000003086b0000000000000003086a0000000000000003086f0000000000000003086c0000000000000003086d000000000000000308660000000000000003087000000000000000030875000000000000000308760000000000000003087300000000000000030874000000000000000308770000000000000003087800000000000000030820000000000000000308ffffffffffffffff0308e803000000000000052065c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607052000000000000000000000000000000000000000000000000000000000000000000a02070652617a6f722d0a0202012d0a0204032d4c500a020e0d52617a6f7220444558204c50730a02090852617a6f722d4c50126170746f733a3a6d657461646174615f7631e207116600000000000000124552525f494e5445524e414c5f4552524f52135768656e20636f6e7472616374206572726f7267000000000000000d4552525f464f5242494444454e165768656e2075736572206973206e6f742061646d696e6800000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6c69000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e746a000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4d494e54205768656e206e6f7420656e6f756768206c6971756964697479206d696e7465646b000000000000001f4552525f494e53554646494349454e545f4c49515549444954595f4255524e205768656e206e6f7420656e6f756768206c6971756964697479206275726e65646c00000000000000194552525f494e53554646494349454e545f585f414d4f554e54185768656e206e6f7420656e6f756768205820616d6f756e746d00000000000000194552525f494e53554646494349454e545f595f414d4f554e54185768656e206e6f7420656e6f756768205920616d6f756e746e000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e746f000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e7470000000000000000b4552525f4b5f4552524f52155768656e20636f6e7472616374204b206572726f727300000000000000164552525f504149525f414c52454144595f45584953541e5768656e20616c726561647920657869737473206f6e206163636f756e747400000000000000124552525f504149525f4e4f545f45584953541a5768656e206e6f7420657869737473206f6e206163636f756e7475000000000000000e4552525f4c4f414e5f4552524f52165768656e206572726f72206c6f616e20616d6f756e7476000000000000000e4552525f4c4f434b5f4552524f521e5768656e20636f6e7472616374206973206e6f74207265656e7472616e747700000000000000144552525f504149525f4f524445525f4552524f521c5768656e2070616972206861732077726f6e67206f72646572696e677800000000000000124552525f5041555341424c455f4552524f52175768656e20636f6e74726163742069732070617573656400000002084a080f4c054d054e054f02500351015201010203530354035503020206560b10010b080209000901580b10010b070209000901590b10010b0102090009015a0b10010b0b02090009015b0b10010b0c02090009015c0b10010b0402090009010302025d035e030402045d035e035f036003050201610106020a620b0d010900630b0d0109016403650466046704680b0e010b050209000901690b11010b0502090009016b0b12010b0502090009016d010702035303540355030802016e080a0902016f0a080a0a02037008137208137308130b020474037503760377030c02047803790365046604061d0623021d011d081d031d071d041d0b1d0c1d000100030002061c323800040305070b000107102707153b00040b050f0b0001070f270b010b020b030b0438010c070c060a000b0638020c080a000b0738030c090b080b0938040c0a0a0011310c050a05380520042c0b003806052e0b00010b050b0a3807020101040400020609011a3800040e07153b0020040738080b000b010b020b030b043809051907153b01200413380a0b000b020b010b040b03380b020200000100245207152b001000140c0d0b00353210270000000000000000000000000000180b02350a0d3518170c070b01353210270000000000000000000000000000180b03350b0d3518170c0b0b04350b0535180c0a3200e1f5050000000000000000000000000c0c0a070a0b1135042a080c06052e0a0a0a0c11350c060b0604460b0711360b0b113611370c080b0a11360b0c113611370c090e080e09113831022104430545070b2705510b070b0b180b0a0b0c1826044f0551070b27020300000106011107153b0004040506070f2707153d003700140921040e0510070d27020400000100010a07152b001002142004070509071127020500000100010907152b001002140406050807112702060100030002062b75380004030505071027380c0e00380d0c0807153c000c090a093701380e0a093702380f0c0b0c0a07152b000c020a090b0238100c0738110c0c0a08350a0a35180a0c1a340c030a08350a0b35180b0c1a340c040a0936010a0338120c0d0a0936020a0438130c0e0a030600000000000000002404420a04060000000000000000240c010544090c010b010447054b0b09010705270a093701380e0a093702380f0c060c050b000a09370338140a090a050a060b0a0b0b38150b0704680b05350b0635180b09360415056a0b090107153c0236050b030b040b08390338160b0d0b0e020701000106315007153d000c0b0a0b3701380e0b0b3702380f0c0d0c0c0a0c0600000000000000002104140a0d060000000000000000210c040516090c040b04041d0b000b010c080c07054d0a000a0c0a0d113e0c0a0a0a0a012504320a0a0b0326042b052d0709270b000b0a0c060c0505490a010b0d0b0c113e0c090a090b0025043c053e070a270a090b0226044305450708270b090b010c060c050b050b060c080c070b070b080208010000070b3800040607153b000c00050907153b010c000b00020901040100331a07152a000c010b0011310a0110081421040b050f0b01010701270a011008140a010f091507160b010f0815020a0100020009346138000403050507102707153b0020040a050c070e27110411170c080717113f0c0438170c0538180c060d040b0511410d04071811420d040b0611410d04071911420e041143071224042a071a113f0c040e080b04071b113f31080838190c030c020c010e08381a0e08381b381c0600000000000000003200000000000000000000000000000000320000000000000000000000000000000032000000000000000000000000000000000b030b020b010939003f00381d0c0707152a090f0a0a07440e0e08381e0e08381f0e0838200e0838210e0838220e08382339020c000d0036060b07390438240e080b003f02020b010002000642443800040305050710270a0006000000000000000024040c080c0205100a01060000000000000000240c020b0204130515070c271104380c07153c000c060a063701380e0a002604270a063702380f0a01260c030529090c030b03042c05300b0601070227080a063600150a0636010a0038120c040b0636020a0138130c050b040b050b000b013905020c01000100431007152b000c000a001000140a00100c140a00100d140b00100214020d0100020006320e07152b001000140c0338250c020c010b000b010b020b031148020e0100020006051707152b001000140c0438260c030c020b000b020b030a0411480c0138250c030c020b010b020b030b041148020f0100020006452007152b001000140c0538270c040c030b000b030b040a0511480c0138260c040c030b010b030b040a0511480c0238250c040c030b020b030b040b05114802100100020006320e07152b001000140c0338250c020c010b000b010b020b03114902110100020006051707152b001000140c0438250c030c020b000b020b030a0411490c0138260c030c020b010b020b030b04114902120100020006452007152b001000140c0538250c040c030b000b030b040a0511490c0138260c040c030b010b030b040a0511490c0238270c040c030b020b030b040b05114902130100010647253800041207153d000c030a033707140a033708140b033709140c020c010c00052107153d010c040a04370a140a04370b140b04370c140c020c010c000b000b010b02021401000109010507152b09100a140215010000480b38280c0038290c01382a0c020b000b010b02120a0216010001064a1c3800040e07153d000c020a023701380e0b023702380f0c010c00051907153d010c030a03370d380e0b03370e380f0c010c000b000b01021700000100010507152b001011114b02180000004c210a0011310715210406050a0b00010701270b000700114c0c020e02114b0c010e010b020700070007163105061e00000000000000080912002d000e01400e000000000000000012092d0902190100030002064e950138000403050507102707153b000409050b070f271104380c0e00380e0c060e01380f0c0707153c000c0d0a0d3701380e0a0d3702380f0c0f0c0e07152b000c030a0d0b0338100c0b0a0d36010b00382b0a0d36020b01382c0a0d3701380e0a0d3702380f0c090c0838110c100a1032000000000000000000000000000000002104540a060a07114e071424044205460b0d010706270a060a07114e0714170c0c11170c020e0207140a0d370f382d056a0a06350a10180a0e351a340c040a07350b10180a0f351a340c050b040b05114f0c0c0a0c06000000000000000024046f05730b0d010706270a0c0a0d370f382e0c0a0a0d0a080a090b0e0b0f38150b0b0489010b08350b0935180b0d360415058b010b0d0107153c0236100b060b070b0c3906382f0b0a021a00000051140a0011310c030a03380520040a0b003806050c0b00010b010b02382e0c040b030b043807021b0000005296010a01100d140c070a003704140c080a070487010a083200000000000000000000000000000000220482010a003701380e0c0d0a003702380f0c0e0b0d0b0e114e0c0f0b0811510c1038110c110a0f0a1024047d0a0f0a1017350c040a110a04113504560b1111360b04113611370c0b0b0f350a01100c1435180b10351611360c050b0b0b05115211530c090a090600000000000000002404510b011011114b0c020e020b090b00370f382d05550b00010b0101057c0b110b04180c0c0b0f350a01100c1435180b1035160c060b0c0b061a340c0a0a0a0600000000000000002404780b011011114b0c030e030b0a0b00370f382d057c0b00010b01010581010b00010b01010586010b00010b01010594010b01010b0832000000000000000000000000000000002204920132000000000000000000000000000000000b003604150594010b00010b07021c010401003315110407152a000c010b0011310a0110091421040c05100b0101070127080b010f0215021d010003000206536438000403050507102707153b000409050b070f2711040b023a050c090c080e00380e0c040e01380f0c050a0406000000000000000024041d080c0305210a05060000000000000000240c030b0304240526070c2707153c000c0a0a0a3701380e0c0b0a0a3702380f0c0c0b0b0a08160c0b0b0c0a09160c0c0a0a36010b00382b0a0a36020b01382c0a0a3701380e0c060a0a3702380f0c070a060a070a040a050a0b0a0c11020a0a0b060b070b0b0b0c3815090b0a36001507153c0236110b080b090b040b0539073830021e010003000206041c3800040305050710270b0038310c040c030e03380e0b0126040f05110708270e04380f0b0226041705190709270b030b04021f010403000206541d3800040b0a000b0138320b020b0338330c060c0505130a000b0138340b030b0238350c050c060b0011310c040a040b0538360b040b063837022001040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f0815022101040100332107152a000c020b0011310a0210091421040b050f0b02010701270a013100210418090b020f0d150520080a020f0d150b010b020f0c15022201040100331407152a000c020b0011310a0210091421040b050f0b02010701270b010b020f1515022301040100331d07152a000c020b0011310a0210091421040b050f0b02010701270a0106e80300000000000025041405180b02010702270b010b020f0015022401000300020656661104380c0e00380e0c060e02380f0c070a0606000000000000000024040f080c0405130a07060000000000000000240c040b04041605180703270a0106000000000000000024041f080c0505230a03060000000000000000240c050b050426052807072707153c000c0c0a0c3701380e0a0c3702380f0c0e0c0d0a0c36010b00382b0a0c36020b02382c0a0c36010a0138120c0a0a0c36020a0338130c0b0a0c3701380e0a0c3702380f0c090c080a080a090a060a070a0d0a0e11020b0c0b080b090b0d0b0e381507153c0236120b060b070b010b03390838380b0a0b0b022501000300020657260e00380e0c0107152b001000140c0638250c050c040b010b040b050b0611490c023800041b0b00060000000000000000381c0b0238390c030c070522381c0b020b00060000000000000000383a0c070c030b07383b0b03022601040300020658190b01383c0c030a030b02250408050c0b00010703270a000b033802383d383e0c040a00383f0b0011310b04384002270104030002065b1a0b0138410c030a030b02250408050c0b00010703270a000b033802383d383e38420c040a0038430b0011310b04384402280104030002065e180b0138450c030a030b02250408050c0b00010703270a000b033802383d0c040a0038460b0011310b04383702290104030002065f170a000b013802383d383e0c030e0338470b0226040c05100b00010707270a00383f0b0011310b033840022a01040300020660180a000b013802383d383e38420c030e0338480b0226040d05110b00010707270a0038430b0011310b033844022b01040300020619160a000b013802383d0c030e03380f0b0226040b050f0b00010707270a0038460b0011310b033837022c010401003315110507152a000c010b0011310a0110091421040c05100b0101070127090b010f0215022d00000102614f11550c090a090a0037091417350c0a0a0a32000000000000000000000000000000002404120a03060000000000000000220c050514090c050b05041b0a04060000000000000000220c06051d090c060b06043d0a040a03115611570a0a180c070a003707140b0711580a003607150b030b04115611570b0a180c080a003708140b0811580a003608150b090a0036091507153c0236130b010b020a003707140b0037081439093849022e01040100632c38002004060b00384a0207152b000c030a0011310c020a020b0310151421041305170b00010701270a02380520041e0b00380605200b00010715384b0714170c0411170c010e010b020b04384c02000506090007060006010608060502020003000209000200000400060603060406020000060602010205000102030204011d031d041d051d061d071d0b1d0e1d0f1d101d0f230e23102304230323121d131d141d161d171d00","abi":{"address":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607","name":"RazorSwapPool","friends":[],"exposed_functions":[{"name":"add_liquidity","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64","u64"],"return":[]},{"name":"add_liquidity_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64","u64"],"return":[]},{"name":"burn","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>"],"return":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>"]},{"name":"calc_optimal_coin_values","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["u64","u64","u64","u64"],"return":["u64","u64"]},{"name":"check_pair_exist","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":["bool"]},{"name":"claim_admin","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"create_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":[]},{"name":"flash_swap","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["u64","u64"],"return":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>"]},{"name":"get_admin_data","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["u64","u8","bool","bool"]},{"name":"get_amounts_in_1_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_amounts_in_2_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_amounts_in_3_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_amounts_out_1_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_amounts_out_2_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_amounts_out_3_pair","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64"],"return":["u64"]},{"name":"get_last_price_cumulative","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":["u128","u128","u64"]},{"name":"get_pair_list","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>"]},{"name":"get_pair_meta","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":["0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta"]},{"name":"get_reserves_size","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":["u64","u64"]},{"name":"mint","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>"],"return":["0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>"]},{"name":"pause","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"pay_flash_swap","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>","0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwap<T0, T1>"],"return":[]},{"name":"remove_liquidity","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>","u64","u64"],"return":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>"]},{"name":"remove_liquidity_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64"],"return":[]},{"name":"set_admin_address","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address"],"return":[]},{"name":"set_dao_fee","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","u8"],"return":[]},{"name":"set_dao_fee_to","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address"],"return":[]},{"name":"set_swap_fee","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","u64"],"return":[]},{"name":"swap","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<T0>","u64","0x1::coin::Coin<T1>","u64"],"return":["0x1::coin::Coin<T0>","0x1::coin::Coin<T1>"]},{"name":"swap_coins_for_coins","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["0x1::coin::Coin<T0>"],"return":["0x1::coin::Coin<T1>"]},{"name":"swap_coins_for_exact_coins_2_pair_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"swap_coins_for_exact_coins_3_pair_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"swap_coins_for_exact_coins_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"swap_exact_coins_for_coins_2_pair_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"swap_exact_coins_for_coins_3_pair_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"swap_exact_coins_for_coins_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64"],"return":[]},{"name":"unpause","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"withdraw_dao_fee","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":["&signer"],"return":[]}],"structs":[{"name":"AdminData","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"signer_cap","type":"0x1::account::SignerCapability"},{"name":"dao_fee_to","type":"address"},{"name":"current_admin","type":"address"},{"name":"pending_admin","type":"address"},{"name":"dao_fee","type":"u8"},{"name":"swap_fee","type":"u64"},{"name":"dao_fee_on","type":"bool"},{"name":"is_pause","type":"bool"}]},{"name":"BurnEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"amount_x","type":"u64"},{"name":"amount_y","type":"u64"},{"name":"liquidity","type":"u64"}]},{"name":"Events","is_native":false,"abilities":["key"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"pair_created_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairCreatedEvent<T0, T1>>"},{"name":"mint_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::MintEvent<T0, T1>>"},{"name":"burn_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::BurnEvent<T0, T1>>"},{"name":"swap_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SwapEvent<T0, T1>>"},{"name":"sync_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::SyncEvent<T0, T1>>"},{"name":"flash_swap_event","type":"0x1::event::EventHandle<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::FlashSwapEvent<T0, T1>>"}]},{"name":"FlashSwap","is_native":false,"abilities":[],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"loan_coin_x","type":"u64"},{"name":"loan_coin_y","type":"u64"}]},{"name":"FlashSwapEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"loan_coin_x","type":"u64"},{"name":"loan_coin_y","type":"u64"},{"name":"repay_coin_x","type":"u64"},{"name":"repay_coin_y","type":"u64"}]},{"name":"LPCoin","is_native":false,"abilities":["key"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"dummy_field","type":"bool"}]},{"name":"LiquidityPool","is_native":false,"abilities":["key"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"coin_x_reserve","type":"0x1::coin::Coin<T0>"},{"name":"coin_y_reserve","type":"0x1::coin::Coin<T1>"},{"name":"last_block_timestamp","type":"u64"},{"name":"last_price_x_cumulative","type":"u128"},{"name":"last_price_y_cumulative","type":"u128"},{"name":"k_last","type":"u128"},{"name":"lp_mint_cap","type":"0x1::coin::MintCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>"},{"name":"lp_freeze_cap","type":"0x1::coin::FreezeCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>"},{"name":"lp_burn_cap","type":"0x1::coin::BurnCapability<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::LPCoin<T0, T1>>"},{"name":"locked","type":"bool"}]},{"name":"MintEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"amount_x","type":"u64"},{"name":"amount_y","type":"u64"},{"name":"liquidity","type":"u64"}]},{"name":"PairCreatedEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"meta","type":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta"}]},{"name":"PairInfo","is_native":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"pair_list","type":"vector<0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::PairMeta>"}]},{"name":"PairMeta","is_native":false,"abilities":["copy","drop","store"],"generic_type_params":[],"fields":[{"name":"coin_x","type":"0x1::type_info::TypeInfo"},{"name":"coin_y","type":"0x1::type_info::TypeInfo"},{"name":"lp_coin","type":"0x1::type_info::TypeInfo"}]},{"name":"SwapEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"amount_x_in","type":"u64"},{"name":"amount_y_in","type":"u64"},{"name":"amount_x_out","type":"u64"},{"name":"amount_y_out","type":"u64"}]},{"name":"SyncEvent","is_native":false,"abilities":["drop","store"],"generic_type_params":[{"constraints":[]},{"constraints":[]}],"fields":[{"name":"reserve_x","type":"u64"},{"name":"reserve_y","type":"u64"},{"name":"last_price_x_cumulative","type":"u128"},{"name":"last_price_y_cumulative","type":"u128"}]}]}},{"bytecode":"0xa11ceb0b060000000a01000e020e0e031c6e048a010e0598015707ef01af02089e044006de044410a205e4020c8608fe05000001010102010301040105010602120200051307000317070100000007000102000000080203000009020300000a00040100000b050100000c060300000d050400000e070300000f08000100001006030000110403000614000b010005150d030002070e0f010002161001000118001301000319140a0100041a081500011b15010100011c080001000b0a0b0c0d0b0f0a1004120a130a0001010403030303010301040204040203030303030301060c03080008010801010900010801010901010608010206090006090001080001060800030104040401040404010b02010401070b02010900010504030304041052617a6f72506f6f6c4c69627261727904636f696e0a636f6d70617261746f72066f7074696f6e067369676e657206737472696e6709747970655f696e666f07636f6d706172650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f7574176765745f6c70636f696e5f746f74616c5f737570706c790f69735f6f766572666c6f775f6d756c036d696e0c6f766572666c6f775f6164640571756f74650d72656769737465725f636f696e047371727408737172745f31323806526573756c7406537472696e6709747970655f6e616d65066c656e6774680f69735f736d616c6c65725f7468616e064f7074696f6e06737570706c7907657874726163740a616464726573735f6f661569735f6163636f756e745f7265676973746572656408726567697374657265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f5460700000000000000000000000000000000000000000000000000000000000000010308cd000000000000000308c9000000000000000308cb000000000000000308ca000000000000000308cc000000000000000410ffffffffffffffffffffffffffffffff126170746f733a3a6d657461646174615f7631cf0205c900000000000000174552525f494e53554646494349454e545f414d4f554e541f5768656e206e6f7420656e6f75676820616d6f756e7420666f7220706f6f6cca000000000000001a4552525f494e53554646494349454e545f4c4951554944495459205768656e206e6f7420656e6f756768206c697175696469747920616d6f756e74cb000000000000001d4552525f494e53554646494349454e545f494e5055545f414d4f554e541c5768656e206e6f7420656e6f75676820696e70757420616d6f756e74cc000000000000001e4552525f494e53554646494349454e545f4f55545055545f414d4f554e541d5768656e206e6f7420656e6f756768206f757470757420616d6f756e74cd00000000000000184552525f434f494e5f545950455f53414d455f4552524f521e5768656e2074776f20636f696e2074797065206973207468652073616d65000000010000092238000c0138010c020a010a02220409050b0700270e01110c0e02110c23041308020e01110c0e02110c24041b09020e010e0238020c000e00110e020101000011300a0006000000000000000024040505070704270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b01350a0035183210270000000000000000000000000000180c060b020b0017350610270000000000000b031735180c050b060b051a32010000000000000000000000000000001634020201000012300a0006000000000000000024040505070702270a010600000000000000002404100a02060000000000000000240c040512090c040b04041505170703270b00350610270000000000000b031735180c050a050b0235180c070b01353210270000000000000000000000000000180b05160c060b070b061a340203010000130538030c000d0038040204010000000607050b011a0b0025020501000000080a000a012304060b00020b010206010000042007050a01170c020a020a0023040e0b000b02173201000000000000000000000000000000170207050a00170c020a020a0123041c0b010b0217320100000000000000000000000000000017020b000b0116020701000001210a0006000000000000000024040505070701270a010600000000000000002404100a02060000000000000000240c030512090c030b03041505170703270b00350b0235180b01351a340208010000000b0a00111138052004080b003806050a0b0001020901000000070b00350b013518110a020a010000162d0a0032040000000000000000000000000000002304100b00320000000000000000000000000000000021040b0600000000000000000c01050d0601000000000000000c010b010c02052b0a000c040a0032020000000000000000000000000000001a3201000000000000000000000000000000160c030a030a04230428051d0a030c040a000a031a0b031632020000000000000000000000000000001a0c0305180b04340c020b020200","abi":{"address":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607","name":"RazorPoolLibrary","friends":[],"exposed_functions":[{"name":"compare","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]}],"params":[],"return":["bool"]},{"name":"get_amount_in","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64","u64","u64"],"return":["u64"]},{"name":"get_amount_out","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64","u64","u64"],"return":["u64"]},{"name":"get_lpcoin_total_supply","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":[],"return":["u128"]},{"name":"is_overflow_mul","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128","u128"],"return":["bool"]},{"name":"min","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64"],"return":["u64"]},{"name":"overflow_add","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128","u128"],"return":["u128"]},{"name":"quote","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64","u64"],"return":["u64"]},{"name":"register_coin","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer"],"return":[]},{"name":"sqrt","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64"],"return":["u64"]},{"name":"sqrt_128","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128"],"return":["u64"]}],"structs":[]}}]',

        data: '{"function":"0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::swap_exact_coins_for_coins_2_pair_entry","typeArguments":["0x1::aptos_coin::AptosCoin","0xcab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2::razor_token::Razor","0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::USDC"],"functionArguments":["3200000000","48605237"]}',
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        '0x4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26',
      data: param,
    };
    let tx = await wallet.signTransaction(signParams);
    console.log(tx);
    const expected =
      '7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c1923000000000000000265c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f546070d52617a6f7253776170506f6f6c27737761705f65786163745f636f696e735f666f725f636f696e735f325f706169725f656e747279030700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0007cab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f20b72617a6f725f746f6b656e0552617a6f720007275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f06746f6b656e7304555344430002080020bcbe000000000835a8e50200000000400d03000000000064000000000000009c75ad66000000001b0020067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26400079d4ad30ac65d95e19b607cb5d18ba1c58582ea0e474372113057bf86607acd1c0bcc1d5949845cba0149d732eb57f4bd798a5581a84cf21a4fbbddbf10504';
    expect(tx).toBe(expected);
  });

  test('dapp with bcs payload', async () => {
    let wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'dapp',
      base: {
        sequenceNumber: '35',
        chainId: 27,
        maxGasAmount: '200000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1722643868',
      },
      data: {
        abi: '',
        data: '024bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd106726f757465721a737761705f726f7574655f656e7472795f66726f6d5f636f696e010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000508a08601000000000008660dfa00000000004102beccb00e5082bc3ef9f20e08d46edab77f7b1c7bfc8a21d066a4269abd8258432ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df1203020000207d82a5aa4a6137bdf231cf84e33609aea31f96016d0bfe7911de2ab9cddeb9cb',
        type: 2,
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };
    //0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f92
    let tx = await wallet.signTransaction(signParams);
    const expected =
      '986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922300000000000000024bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd106726f757465721a737761705f726f7574655f656e7472795f66726f6d5f636f696e010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000508a08601000000000008660dfa00000000004102beccb00e5082bc3ef9f20e08d46edab77f7b1c7bfc8a21d066a4269abd8258432ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df1203020000207d82a5aa4a6137bdf231cf84e33609aea31f96016d0bfe7911de2ab9cddeb9cb400d03000000000064000000000000009c75ad66000000001b0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b0540a18f304ee0ed5c79898c352dc69224d5873dd760941ecdb8aedb4dfc8bd3e62769a68be95e3deef09a65a95007a294ede9e4f758a097a75733daa2c241703508';
    expect(tx).toBe(expected);
    //986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922300000000000000024bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd106726f757465721a737761705f726f7574655f656e7472795f66726f6d5f636f696e010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000508a08601000000000008660dfa00000000004102beccb00e5082bc3ef9f20e08d46edab77f7b1c7bfc8a21d066a4269abd8258432ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df1203020000207d82a5aa4a6137bdf231cf84e33609aea31f96016d0bfe7911de2ab9cddeb9cb400d03000000000064000000000000009c75ad66000000001b0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b0540 a18f304ee0ed5c79898c352dc69224d5873dd760941ecdb8aedb4dfc8bd3e62769a68be95e3deef09a65a95007a294ede9e4f758a097a75733daa2c241703508
    //986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922300000000000000024bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd106726f757465721a737761705f726f7574655f656e7472795f66726f6d5f636f696e010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000508a08601000000000008660dfa00000000004102beccb00e5082bc3ef9f20e08d46edab77f7b1c7bfc8a21d066a4269abd8258432ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df1203020000207d82a5aa4a6137bdf231cf84e33609aea31f96016d0bfe7911de2ab9cddeb9cb400d03000000000064000000000000009c75ad66000000001b0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b0540 e21cb723c728ada127c2fc784415664c02fc9a26fd4eae27b64ae9a82afaa25008b8b458116de9e1667fd229c8a4a39a12f6ef8d43f2f343f8e5d06d77b5d90c
  });
  test('buildSimulateTx apt transfer', async () => {
    const wallet = new AptosWallet();
    let param: BuildSimulateTxParams = {
      publicKey:
        '0x16abf23e5f81cddd7882c598e6e63dd8cfcc03a699a6e043dd03023b8b3a0c7d',
      data: {
        type: 'simulate_transfer',
        base: {
          sequenceNumber: '2',
          chainId: 165,
          maxGasAmount: '200000',
          gasUnitPrice: '100',
          expirationTimestampSecs: '1922643868',
        },
        data: {
          recipientAddress:
            '0x86411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b2',
          amount: '1',
        },
      },
    };
    let tx = await wallet.buildSimulateTx(param);
    expect(tx).toEqual(
      '71f08f8cbc1c607999f28a849d9bcaf13a1888e28cc511f69e87097c854b5ea702000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e7366657200022086411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b2080100000000000000400d03000000000064000000000000009c37997200000000a5002016abf23e5f81cddd7882c598e6e63dd8cfcc03a699a6e043dd03023b8b3a0c7d4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('buildSimulateTx token transfer', async () => {
    const wallet = new AptosWallet();
    let param: BuildSimulateTxParams = {
      publicKey:
        '0x82e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d6343',
      data: {
        type: 'simulate_token_transfer',
        base: {
          sequenceNumber: '26',
          chainId: 1,
          maxGasAmount: '80000000',
          gasUnitPrice: '100',
          expirationTimestampSecs: '1936167820',
        },
        data: {
          tyArg:
            '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
          recipientAddress:
            '0x86411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b2',
          amount: '1',
        },
      },
    };
    let tx = await wallet.buildSimulateTx(param);
    expect(tx).toEqual(
      '3ef44e906c78022014e6e3a88ba602b8e643655e43c8424510e9e398342595f21a000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e730107f22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa056173736574045553444300022086411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b208010000000000000000b4c4040000000064000000000000008c9367730000000001002082e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d63434000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('buildSimulateTx fa transfer', async () => {
    const wallet = new AptosWallet();
    let param: BuildSimulateTxParams = {
      publicKey:
        '0x82e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d6343',
      data: {
        type: 'simulate_fungible_asset_transfer',
        base: {
          sequenceNumber: '30',
          chainId: 1,
          maxGasAmount: '80000000',
          gasUnitPrice: '100',
          expirationTimestampSecs: '1936167820',
        },
        data: {
          fungibleAssetMetadataAddress:
            '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
          recipientAddress:
            '0x86411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b2',
          amount: '1',
        },
      },
    };
    let tx = await wallet.buildSimulateTx(param);
    expect(tx).toEqual(
      '3ef44e906c78022014e6e3a88ba602b8e643655e43c8424510e9e398342595f21e00000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d65746164617461000320357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b2086411c96b837b9ace7ae03e816cd2a6885cfe72f548e23aa7498cff93b4058b208010000000000000000b4c4040000000064000000000000008c9367730000000001002082e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d63434000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('buildSimulateTx dapp', async () => {
    const wallet = new AptosWallet();
    let param: BuildSimulateTxParams = {
      publicKey:
        '0x82e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d6343',
      data: {
        type: 'simulate_dapp',
        base: {
          sequenceNumber: '30',
          chainId: 1,
          maxGasAmount: '80000000',
          gasUnitPrice: '100',
          expirationTimestampSecs: '1936167820',
        },
        data: {
          abi: '[{"bytecode":"0xa11ceb0b0700000a0a010018021814032cec020498035a05f203b90107ab05bd0308e808c00106a80a6810900ba5060cb511ad0e000001010202020302040205030604020403040404050506061c00030001000100010b1c0003000100010001000700010300000001000802030001000904030300000001000a04030300000001000b05030300000001000c05030300000001000d06070300000001000e06030300000001000f0601030000000100100601030000000100110603030000000100120601030000000100130401030000000100140601030000000100150608030000000108160b0801000108170b0801000103160b0801000103170b080100010a18101100010518101100010119030300010a1a10110001051a10110001071b0b0802000001090d0b070300000001021b0b0802000001040d0b070300000001090e0b030300000001040e0b030300000001090f0b010300000001040f0b01030000000109100b01030000000104100b01030000000109110b03030000000104110b03030000000109120b01030000000104120b010300000001071d0b11010001021d0b1101000109140b01030000000104140b010300000001091e0b080300000001041e0b0803000000010d0a090a040a050a0b0a0f0f100f110f120f1814190a19151a141b0a1b151c0a1c151d0a1d151e0a1e151f0a1f15200a2015210a2115220a2215230a2315240a2415250a25152619271a280a2815290a29152a0a2a152b0a2b150503030303020203030303030301030203020603030303030201020304040301010501030303030309000901090200020104040303030311030304030403040304030303010104040401090205040303040401041104030304040404040403030301010404040f040404030403040403030304040404020900090103090109000902060303030303030a030303030303030303030c010404040404040403040304010b0003090009010902010b010309000901090203010101057669657773056572726f720b636f696e5f68656c706572066375727665730e6c69717569646974795f706f6f6c0c737461626c655f6375727665076c705f636f696e1863616c635f6f7074696d616c5f636f696e5f76616c7565731a636f6e766572745f776974685f63757272656e745f70726963650d6765745f616d6f756e745f696e0e6765745f616d6f756e745f6f7574156765745f636f696e5f696e5f776974685f66656573166765745f636f696e5f6f75745f776974685f66656573156765745f63756d756c61746976655f7072696365730b6765745f64616f5f666565136765745f64616f5f666565735f636f6e666967136765745f646563696d616c735f7363616c6573076765745f6665650f6765745f666565735f636f6e666967196765745f72657365727665735f666f725f6c705f636f696e73116765745f72657365727665735f73697a650e69735f737761705f6578697374730969735f737461626c650f69735f756e636f7272656c6174656407636f696e5f696e10696e76616c69645f617267756d656e7408636f696e5f6f75740969735f736f72746564024c5006737570706c790e69735f706f6f6c5f6578697374739dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b00000000000000000000000000000000000000000000000000000000000000010163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e1261d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef803088f1300000000000003088c1300000000000003088b1300000000000003088d1300000000000003088e130000000000000308891300000000000003088a13000000000000030888130000000000000201000201050410ffffffffffffffff0000000000000000126170746f733a3a6d657461646174615f76319006088813000000000000114552525f57524f4e475f56455253494f4e0e57726f6e672076657273696f6e2e8913000000000000104552525f57524f4e475f414d4f554e541257726f6e6720616d6f756e7420757365642e8a13000000000000114552525f57524f4e475f524553455256451357726f6e67207265736572766520757365642e8b13000000000000194552525f494e53554646494349454e545f595f414d4f554e5422496e73756666696369656e7420616d6f756e7420696e20592072657365727665732e8c13000000000000194552525f494e53554646494349454e545f585f414d4f554e5422496e73756666696369656e7420616d6f756e7420696e20582072657365727665732e8d130000000000000f4552525f4f5645524c494d49545f581d4f7665726c696d6974206f66205820636f696e7320746f20737761702e8e130000000000000f4552525f554e524541434841424c45234d61726b732074686520756e726561636861626c6520706c61636520696e20636f64658f130000000000001c4552525f434f494e5f434f4e56455253494f4e5f4f564552464c4f575350726f766964656420636f696e7320616d6f756e742063616e6e6f7420626520636f6e76657274656420776974686f757420746865206f766572666c6f77206174207468652063757272656e74207072696365000d076765745f6665650101000b6765745f64616f5f6665650101000d6765745f616d6f756e745f696e0101000e6765745f616d6f756e745f6f75740101000e69735f737761705f6578697374730101000f6765745f666565735f636f6e666967010100116765745f72657365727665735f73697a65010100136765745f64616f5f666565735f636f6e666967010100136765745f646563696d616c735f7363616c6573010100156765745f63756d756c61746976655f7072696365730101001863616c635f6f7074696d616c5f636f696e5f76616c756573010100196765745f72657365727665735f666f725f6c705f636f696e730101001a636f6e766572745f776974685f63757272656e745f707269636501010000010000093d0b0438000c070c060a0606000000000000000021040d0a07060000000000000000210c05050f090c050b0504140b000b01020a000a060a0711010c090a090a012504270a090b0326042205240702270b000b09020a010b070b0611010c080a080b0025043105330703270a080b02260438053a0701270b080b0102010100000c2a0a0006000000000000000024040505070705270a010600000000000000002404100a02060000000000000000240c030512090c030b03041505170706270b00350b0235180b01351a0c040a04070a25042505270700270b043402020100000d100a0138000c030c020a0138010c050c040b000b030b020b050b040b01380202030100000d100a0138000c030c020a0138010c050c040b000b020b030b040b050b01380302040000000e8d010a010a0024040505070702270a0538040c110c100a110b10170c0f0b00350c0e0b02350c150b01350c160a05070821042138050c1238060c13052c0a050709210426052807072738070c1238080c130b1204620b05070821043d0b0e0b030b040b160b15111334060100000000000000160c0d05470b0e0b030b040b160b15111434060100000000000000160c0d0b0d0b110b0f0c0b0c090c070a0b06000000000000000022045205550604000000000000001115270b07350b0935180b0b351a34060100000000000000160c06058b010b13047c0b160a0e170b0f35180c140b0e0b150b1135180b140c0c0c0a0c080a0c3200000000000000000000000000000000220479057e0604000000000000001115270704270b084d0b0a4d180b0c4d1a35320100000000000000000000000000000016340c060b0602050000001285010a0538040c110c100a110b10170c0f0a01350c150b02350c160a05070821041738050c1238060c1305220a05070921041c051e07072738070c1238080c130b1204580b00350b0f35180c0e0a0e0a11351932000000000000000000000000000000002204390b0e0b11351a3201000000000000000000000000000000160c06053e0b0e0b11351a0c060b060c0c0b05070821044d0b0c0b030b040b150b161116340c0705550b0c0b030b040b150b161117340c070b070c080583010b1304760b00350b0f35180c0d0b01350b1135180a0d160c140b0d0b160b140c0b0c0a0c090a0b320000000000000000000000000000000022047305780604000000000000001115270704270b094d0b0a4d180b0b4d1a35340c080b080206010000133e0a00070821041c3809040b380a0c060c050c010515380b0c0a0c0c0c0e0b0c0b0e0b0a0c060c050c010b010b050b060c040c030c02053a0b000709210432380c0427380d0c090c080c070534380e0c0b0c0d0c0f0b0d0b0f0b0b0c090c080c0705340707270b070b080b090c040c030c020b020b030b04020701000002200a00070821040e38090409380f0c01050b38100c010b010c03051e0b00070921041a380c041738110c02051c38120c02051c0707270b020c030b03020801000016290a0007082104123809040a38130c020c01050d38140c020c010b010b020c060c0505260b000709210420380c041c38150c040c03052238160c040c0305220707270b030b040c060c050b050b06020901000017310a0007082104163809040a38170c030c01051138180c070c090b070b090c030c010b010b030c020c06052e0b000709210428380c042038190c050c04052a381a0c080c0a0b080b0a0c050c04052a0707270b040b050c020c060b060b02020a01000002200a00070821040e38090409381b0c01050b381c0c010b010c03051e0b00070921041a380c0417381d0c02051c381e0c02051c0707270b020c030b03020b01000016290a0007082104123809040a381f0c020c01050d38200c020c010b010b020c060c0505260b000709210420380c041c38210c040c03052238220c040c0305220707270b030b040c060c050b050b06020c010000185d0a0138000c0c0c0a0a01070821040b38230c0905140b010709210410051207072738240c090a00350b0a350a090c070c050c030a07320000000000000000000000000000000022042105240604000000000000001115270b034d0b054d180b074d1a350c0b0b00350b0c350b090c080c060c040a08320000000000000000000000000000000022043b053e0604000000000000001115270b044d0b064d180b084d1a350c0d0a0b32000000000000000000000000000000002404510a0d3200000000000000000000000000000000240c020553090c020b02045605580705270b0b340b0d34020d01000017310a0007082104163809040a38250c030c01051138260c070c090b070b090c030c010b010b030c020c06052e0b000709210428380c042038270c050c04052a38280c080c0a0b080b0a0c050c04052a0707270b040b050c020c060b060b02020e0100001b200a00070821040e3809040938290c01050b382a0c010b010c03051e0b00070921041a380c0417382b0c02051c382c0c02051c0707270b020c030b030200","abi":{"address":"0x9dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b","name":"views","friends":[],"exposed_functions":[{"name":"calc_optimal_coin_values","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64","u64","u64","u64","u8"],"return":["u64","u64"]},{"name":"convert_with_current_price","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["u64","u64","u64"],"return":["u64"]},{"name":"get_amount_in","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64","u8"],"return":["u64"]},{"name":"get_amount_out","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64","u8"],"return":["u64"]},{"name":"get_cumulative_prices","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u128","u128","u64"]},{"name":"get_dao_fee","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64"]},{"name":"get_dao_fees_config","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64","u64"]},{"name":"get_decimals_scales","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64","u64"]},{"name":"get_fee","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64"]},{"name":"get_fees_config","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64","u64"]},{"name":"get_reserves_for_lp_coins","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u64","u8"],"return":["u64","u64"]},{"name":"get_reserves_size","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["u64","u64"]},{"name":"is_swap_exists","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["u8"],"return":["bool"]}],"structs":[]}},{"bytecode":"0xa11ceb0b0700000a0b0100220222340356b604048c05e20105ee06840d07f213e00808d21ca00206f21e4f10c11f85040ac6230a0cd023db41000001010102010301040105020603070300040805090507050a060b06000708080c000d0000000e0000022504010001092900030001000100010f29000300010001000106320400033907010000063a0700063b0700000f000103000000010010000103000000010011020103000000010012030104000000000100130301070000000000000001001403010a0000000000000000000001001503010d00000000000000000000000000010016030104000000000100170301070000000000000001001803010a0000000000000000000001001903010d0000000000000000000000000001001a04010300000001001b04010300000001001c05010300000001001d0301040000000001001e0301070000000000000001001f03010a0000000000000000000001002003010d00000000000000000000000000010021030104000000000100220301070000000000000001002303010a0000000000000000000001002403010d00000000000000000000000000010026060704000000000100270607040000000001102a010a010001022b0c0d010001102c0c0d0100010c2d0f100300000001042e11120001022f13010100011030140101000101311301010001082d0f1703000000010e2d1a1b030000000105331d0a01000106341e0100010c35212103000000010835212103000000010d352324030000000102362e2101000102372f0d0100010c38555603000000010838575603000000010d3c595a0300000001033d5c09010001063e5d5e0001063f5f1c00010e38605603000000010c40212103000000010a41010a020000010242010d0100010b430f56030000000102440d0101000108402121030000000107430f5603000000010d450d0703000000010d46070d03000000011809180b19091a09190b1a0b1b0e1d091e091d0b1e0b1f15200e1f18210e221c240e250e2622262517261f0b2422252226282629172a242b252b262c262d270b280b173018311f311e31243325332634263517362437253726382639173a243b253b263c263d27312831173e183f1f3f1e3f24282528264126421743242c252c2644264517462447254726482649174a244b254b264c264d273f283f174e184f1f4f1e4f1626162a16301636163a163e16431646164a164e1915290e1f0919182a0e2b0e2c5b2f0e274f2709300e316a320b330e336b3409350e360e366b3722382505060c03030303000a060c03030a0e0e0e0a030a03030305060c030a030a020a0104060c03030305060c0a0e0a030303040b02010900030201010b020109010a0b020109000b02010901050b020109000b020109000b020109010b0201090101010b02010b0303090009010902010900010101090102060c03010b0201090003090009010902040b02010900030b0201090103030b020109000b020109010b02010b030309000901090201060c010502050b02010900020b02010900060c010b03030900090109020a0b020109000b02010901050b020109000b020109000b020109010b0201090101010b02010b0403090009010902030b020109000b020109010b02010b0403090009010902010b04030900090109020b0b020109000b02010901050b020109000b0201090101010b020109000b0201090108050a0805090b020109000b020109010a0e0e0e0a030a030303030a08050b020109000b0201090101080501060a090002060c08050b0b020109000303030b02010901030302020101010201030309000901090302030103030303030901090009030409000901090209031c0b020109000b020109010505030303030b020109010b02010901030303030b020109010b02010902030303030202020201010101030900090109050309010900090504090009010903090503090109020904030901090209060309020901090601060b0201090002070b02010900030409010902090409060109022c0b020109000b020109020b0201090105050503030303030b02010901030b020109020b020109010b02010902030303030303030b020109010b020109030b020109020303030303030202020202020101010101010309000901090403090009010907030901090009070409000901090409070309010902090503090109020908030902090109080409010902090509080309020903090603090209030909030903090209090409020903090609090109033c0b020109000b020109020b020109030b02010901050505050303030303030b02010901030b02010902030b020109030b020109010b020109020b02010903030303030303030303030b020109010b020109030b020109040b0201090203030303030303030202020202020202010101010101010103090009010909030901090009090409000901090509090309010902090a0309020901090a04090109020906090a030902090309070309020903090b0309030902090b04090209030907090b030903090409080309030904090c0309040903090c04090309040908090c010904060b020109000b020109000b020109010302010a0b020109000b020109000b020109010b020109020303020201010e0b020109000b020109000b020109010b020109020b02010903030303020202010101120b020109000b020109000b020109010b020109040b020109020b0201090303030303020202020101010103050b020109000b02010901030b02010b03030900090109020303020b020109000b02010901030b02010b040309000901090203030b05030e0b020109000b0201090103030a08050b0601080708050808010e0303030b06010807010807010b060109000208070301080803060c080803030a080503030b050303030b020109010303020201011b0b020109010505030303030b020109010b02010901030303030b020109010b020109020303030302020202010101012b0b020109020b0201090105050503030303030b02010901030b020109020b020109010b02010902030303030303030b020109010b020109030b020109020303030303030202020202020101010101013b0b020109020b020109030b02010901050505050303030303030b02010901030b02010902030b020109030b020109010b020109020b02010903030303030303030303030b020109010b020109030b020109040b0201090203030303030303030202020202020202010101010101010106050b020109000b020109010302010a050b020109000b020109010b020109020303020201010e050b020109000b020109010b020109020b0201090303030302020201010112050b020109000b020109010b020109040b020109020b020109030303030302020202010101010f0b020109010b020109010b020109010b020109000b020109000b02010900030b0201090103030303010b020109000b020109000209000901030901090009020c0b020109010b020109010b020109010b020109000b020109000b020109000b020109010303010b020109000b0201090006726f757465720d6170746f735f6163636f756e7404636f696e066f7074696f6e067369676e657206766563746f7205746f6b656e0e6c69717569646974795f706f6f6c076c705f636f696e0b636f696e5f68656c70657209726f757465725f763204706f6f6c1266615f746f5f636f696e5f777261707065720c42696e5374657056305630350743757276655631106164645f6c69717569646974795f7630116164645f6c69717569646974795f763035106164645f6c69717569646974795f76311e66615f737761705f636f696e5f666f725f65786163745f636f696e5f78311e66615f737761705f636f696e5f666f725f65786163745f636f696e5f78321e66615f737761705f636f696e5f666f725f65786163745f636f696e5f78331e66615f737761705f636f696e5f666f725f65786163745f636f696e5f78341e66615f737761705f65786163745f636f696e5f666f725f636f696e5f78311e66615f737761705f65786163745f636f696e5f666f725f636f696e5f78321e66615f737761705f65786163745f636f696e5f666f725f636f696e5f78331e66615f737761705f65786163745f636f696e5f666f725f636f696e5f78341372656d6f76655f6c69717569646974795f76301472656d6f76655f6c69717569646974795f7630351372656d6f76655f6c69717569646974795f76311b737761705f636f696e5f666f725f65786163745f636f696e5f78311b737761705f636f696e5f666f725f65786163745f636f696e5f78321b737761705f636f696e5f666f725f65786163745f636f696e5f78331b737761705f636f696e5f666f725f65786163745f636f696e5f78341b737761705f65786163745f636f696e5f666f725f636f696e5f78311b737761705f65786163745f636f696e5f666f725f636f696e5f78321b737761705f65786163745f636f696e5f666f725f636f696e5f78331b737761705f65786163745f636f696e5f666f725f636f696e5f783404436f696e13737761705f65786163745f696e5f696e6e657214737761705f65786163745f6f75745f696e6e65720b64756d6d795f6669656c64024c501269735f66615f777261707065645f636f696e0877697468647261770a66615f746f5f636f696e0d6164645f6c69717569646974790a616464726573735f6f66076465706f7369740a636f696e5f746f5f66610d6465706f7369745f636f696e7305546f6b656e0869735f656d7074790d6465706f7369745f746f6b656e0d6765745f616d6f756e745f696e0576616c756507657874726163741072656d6f76655f6c6971756964697479064f7074696f6e0b546f6b656e44617461496407546f6b656e49640e6765745f62696e5f6669656c64730c64657374726f795f736f6d650f6372656174655f746f6b656e5f69640e77697468647261775f746f6b656e0e6765745f616d6f756e745f6f75740969735f736f72746564047a65726f04737761700c64657374726f795f7a65726f0c737761705f785f666f725f790c737761705f795f666f725f789dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e1254cb0bb2c18564b86e34539b9f89cfe1186e39d89fce54e1cd007b8e61673a8561d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef89770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da30308a00f0000000000000308a30f0000000000000308a40f0000000000000308a50f0000000000000308a60f0000000000000308a20f0000000000000308a10f00000000000002010002010502010a126170746f733a3a6d657461646174615f7631f00307a00f000000000000174552525f494e53554646494349454e545f414d4f554e5414496e73756666696369656e7420616d6f756e742ea10f0000000000001e4552525f57524f4e475f56455253494f4e5f41525241595f4c454e4754481c57726f6e672076657273696f6e73206172726179206c656e6774682ea20f000000000000114552525f57524f4e475f56455253494f4e0e57726f6e672076657273696f6e2ea30f0000000000002b4552525f4e4f545f454e4f5547485f4f55545055545f434f494e535f544f5f504552464f524d5f53574150384e6f7420656e6f756768206f757470757420636f696e7320696e20706f6f6c20746f20706572666f726d207377617020284c53205631292ea40f0000000000001f4552525f57524f4e475f434f494e5f4d494e5f41525241595f4c454e4754482557726f6e6720636f696e5f6f75745f6d696e5f76616c73206172726179206c656e6774682ea50f0000000000001f4552525f57524f4e475f434f494e5f4f55545f41525241595f4c454e4754482157726f6e6720636f696e5f6f75745f76616c73206172726179206c656e6774682ea60f0000000000001b4552525f57524f4e475f535741505f41525241595f4c454e4754482157726f6e672073776170735f785f666f725f79206172726179206c656e6774682e00000002012801010201280100010400084538000c0c38010c0d0a0c20040c0a000b0138020c0505100a000b0138030c050b050c080a0d20041a0a000b0338040c06051e0a000b0338050c060b060c0a0b080b020b0a0b0438060c0e0c0b0c090a00111c0c070b0c2004320a070b09380705350b090a0038080b0d20043e0b00010a070b0b380905410b0b0b00380a0b070b0e380b0201010400164538000c0c38010c0d0a0c20040c0a000b0138020c0505100a000b0138030c050b050c080a0d20041a0a000b0338040c06051e0a000b0338050c060b060c0a0b080b020b0a0b04380c0c0e0c0b0c090a00111c0c070b0c2004320a070b09380705350b090a0038080b0d20043e0b00010a070b0b380905410b0b0b00380a0b070b0e380d0202010400195538000c0f38010c100a0f20040c0a000b0138020c0a05100a000b0138030c0a0b0a0c0d0a1020041a0a000b0238040c0b051e0a000b0238050c0b0b0b0c0e0b0d0b0e0b030b040b050b060b070b080b09380e0c120c110c140e14380f20043905320d14451c0c130a000b131123052d0b14461c00000000000000000a00111c0c0c0b0f2004450a0c0b11380705480b110a0038080b102004510b00010b0c0b12380905540b120b00380a02030104001f7a0e034120060100000000000000210406050a0b00010706270e020600000000000000004221140c0a0e030600000000000000004220140c0c0e04060000000000000000420a140c0e0a0a0a0c0a0e0c0f0c0d0c0b0a0d07072104270b0b38100c0705510a0d070821042f0b0b38110c0705510b0d070921044d0a0f043d0b0b0b0f203812010c060c0705440b0b0b0f203813010c060c070b0606000000000000000021044905510b00010701270b00010705270b070c080a080b01250458055c0b000107002738002004640a000b0838020c0505680a000b0838030c050b050b0a0b0c0b0e38140c0938012004760b00111c0b09381505790b090b00380a020401040027f0010e034120060200000000000000210406050a0b00010706270a00111c0c070e020600000000000000004221140c150e030600000000000000004220140c190e04060000000000000000420a140c1d0a150a190a1d0c1f0c1b0c170a1b070721042a0b1738160c0b05540a1b07082104320b1738170c0b05540b1b07092104500a1f04400b170b1f203818010c090c0b05470b170b1f203819010c090c0b0b0906000000000000000021044c05540b00010701270b00010705270b0b0c0f0a0f0b0125045b055f0b000107002738002004670a000b0f38020c05056b0a000b0f38030c050b050b150b190b1d381a0c130e020601000000000000004221140c160e030601000000000000004220140c1a0e04060100000000000000420a140c1e0a160a1a0a1e0c200c1c0c180a1c070721048e010b18381b0c0c05b8010a1c0708210496010b18381c0c0c05b8010b1c07092104b4010a2004a4010b180b2020381d010c0a0c0c05ab010b180b2020381e010c0a0c0c0b0a0600000000000000002104b00105b8010b00010701270b00010705270b0c0c100b130b100b070c080c110c0d0e0d381f0c120a110a122504c80105cc010b00010700270a110a122104d3010b0d0c0605de010d0d0b120b111738200c0e0b080b0e38150b0d0c060b060b160b1a0b1e38210c1438222004ec010b00111c0b14382305ef010b140b003824020501040032e3020e034120060300000000000000210406050a0b00010706270a00111c0c080e020600000000000000004221140c1f0e030600000000000000004220140c250e04060000000000000000420a140c2b0a1f0a250a2b0c2e0c280c220a28070721042a0b2238250c0e05540a2807082104320b2238260c0e05540b2807092104500a2e04400b220b2e203827010c0b0c0e05470b220b2e203828010c0b0c0e0b0b06000000000000000021044c05540b00010701270b00010705270b0e0c150a150b0125045b055f0b000107002738002004670a000b1538020c05056b0a000b1538030c050b050b1f0b250b2b38290c1c0e020601000000000000004221140c200e030601000000000000004220140c260e04060100000000000000420a140c2d0a200a260a2d0c2f0c290c230a29070721048e010b23382a0c0f05b8010a290708210496010b23382b0c0f05b8010b2907092104b4010a2f04a4010b230b2f20382c010c0c0c0f05ab010b230b2f20382d010c0c0c0f0b0c0600000000000000002104b00105b8010b00010701270b00010705270b0f0c170b1c0b170a080c090c180c100e10381f0c1a0a180a1a2504c80105cc010b00010700270a180a1a2104d3010b100c0705de010d100b1a0b181738200c130b090b1338150b100c070b070b200b260b2d382e0c1e0e020602000000000000004221140c210e030602000000000000004220140c270e04060200000000000000420a140c2c0a210a270a2c0c300c2a0c240a2a0707210481020b24382f0c1105ab020a2a0708210489020b2438300c1105ab020b2a07092104a7020a300497020b240b30203831010c0d0c11059e020b240b30203832010c0d0c110b0d0600000000000000002104a30205ab020b00010701270b00010705270b110c160b1e0b160b080c0a0c190c120e1238330c1b0a190a1b2504bb0205bf020b00010700270a190a1b2104c6020b120c0605d1020d120b1b0b191738340c140b0a0b1438230b120c060b060b210b270b2c38350c1d38362004df020b00111c0b1d383705e2020b1d0b003838020601040040d6030e034120060400000000000000210406050a0b00010706270a00111c0c090e020600000000000000004221140c290e030600000000000000004220140c310e04060000000000000000420a140c390a290a310a390c3b0c320c300a32070721042a0b3038390c1105540a3207082104320b30383a0c1105540b3207092104500a3b04400b300b3b20383b010c0d0c1105470b300b3b20383c010c0d0c110b0d06000000000000000021044c05540b00010701270b00010705270b110c1b0a1b0b0125045b055f0b000107002738002004670a000b1b38020c05056b0a000b1b38030c050b050b290b310b39383d0c250e020601000000000000004221140c2e0e030601000000000000004220140c370e04060100000000000000420a140c400a2e0a370a400c3c0c330c2a0a33070721048e010b2a383e0c1205b8010a330708210496010b2a383f0c1205b8010b3307092104b4010a3c04a4010b2a0b3c203840010c0e0c1205ab010b2a0b3c203841010c0e0c120b0e0600000000000000002104b00105b8010b00010701270b00010705270b120c210b250b210a090c0a0c1c0c130e13381f0c220a1c0a222504c80105cc010b00010700270a1c0a222104d3010b130c0805de010d130b220b1c1738200c180b0a0b1838150b130c080b080b2e0b370b4038420c280e020602000000000000004221140c2f0e030602000000000000004220140c380e04060200000000000000420a140c3a0a2f0a380a3a0c3d0c340c2b0a340707210481020b2b38430c1405ab020a340708210489020b2b38440c1405ab020b3407092104a7020a3d0497020b2b0b3d203845010c0f0c14059e020b2b0b3d203846010c0f0c140b0f0600000000000000002104a30205ab020b00010701270b00010705270b140c1f0b280b1f0a090c0b0c1d0c150e1538330c230a1d0a232504bb0205bf020b00010700270a1d0a232104c6020b150c0605d1020d150b230b1d1738340c190b0b0b1938230b150c060b060b2f0b380b3a38470c260e020603000000000000004221140c2d0e030603000000000000004220140c360e04060300000000000000420a140c3f0a2d0a360a3f0c3e0c350c2c0a3507072104f4020b2c38480c16059e030a3507082104fc020b2c38490c16059e030b35070921049a030a3e048a030b2c0b3e20384a010c100c160591030b2c0b3e20384b010c100c160b1006000000000000000021049603059e030b00010701270b00010705270b160c200b260b200b090c0c0c1e0c170e17384c0c240a1e0a242504ae0305b2030b00010700270a1e0a242104b9030b170c0705c4030d170b240b1e17384d0c1a0b0c0b1a38370b170c070b070b2d0b360b3f384e0c27384f2004d2030b00111c0b27385005d5030b270b003851020701040050390e034120060100000000000000210406050a0b000107062738002004120a000b0138020c0505160a000b0138030c050b050c060e030600000000000000004220140c090e020600000000000000004221140c080e04060000000000000000420a140c0a0b060b080b090b0a38520c0738012004350b00111c0b07381505380b070b00380a0208010400514e0e034120060200000000000000210406050a0b000107062738002004120a000b0138020c0505160a000b0138030c050b050c060e030600000000000000004220140c0b0e020600000000000000004221140c090e04060000000000000000420a140c0d0b060b090b0b0b0d38530c070e030601000000000000004220140c0c0e020601000000000000004221140c0a0e04060100000000000000420a140c0e0b070b0a0b0c0b0e38540c08382220044a0b00111c0b083823054d0b080b003824020901040052630e034120060300000000000000210406050a0b000107062738002004120a000b0138020c0505160a000b0138030c050b050c060e030600000000000000004220140c0d0e020600000000000000004221140c0a0e04060000000000000000420a140c100b060b0a0b0d0b1038550c070e030601000000000000004220140c0e0e020601000000000000004221140c0b0e04060100000000000000420a140c110b070b0b0b0e0b1138560c080e030602000000000000004220140c0f0e020602000000000000004221140c0c0e04060200000000000000420a140c120b080b0c0b0f0b1238570c09383620045f0b00111c0b09383705620b090b003838020a01040053780e034120060400000000000000210406050a0b000107062738002004120a000b0138020c0505160a000b0138030c050b050c060e030600000000000000004220140c0f0e020600000000000000004221140c0b0e04060000000000000000420a140c130b060b0b0b0f0b1338580c070e030601000000000000004220140c110e020601000000000000004221140c0d0e04060100000000000000420a140c150b070b0d0b110b1538590c090e030602000000000000004220140c120e020602000000000000004221140c0e0e04060200000000000000420a140c160b090b0e0b120b16385a0c0a0e030603000000000000004220140c100e020603000000000000004221140c0c0e04060300000000000000420a140c140b0a0b0c0b100b14385b0c08384f2004740b00111c0b08385005770b080b003851020b01040054220a000b01385c0b020b03385d0c060c050a00111c0c0438002004120a040b05385e05150b050a003808380120041e0b00010b040b06381505210b060b00380a020c01040054220a000b01385f0b020b0338600c060c050a00111c0c0438002004120a040b05385e05150b050a003808380120041e0b00010b040b06381505210b060b00380a020d010400584d401c00000000000000000c0c0e0141590c0b0600000000000000000c0a0a0a0a0b23042d050c0e010a0a4259140c070e020a0a4221140c060b0738610c0d01010b0d3862060000000000000000112d0c0f0a000b0f0b06112e0c0e0d0c0b0e441c0b0a060100000000000000160c0a05070b0c0b030b0438630c090c080a00111c0c05380020043d0a050b08385e05400b080a00380838012004490b00010b050b093815054c0b090b00380a020e0104006187010e024121060100000000000000210406050a0b00010703270e03412006010000000000000021041005140b00010706270e04410a06010000000000000021041a051e0b00010704270a00111c0c050e020600000000000000004221140c0a0e030600000000000000004220140c0c0e04060000000000000000420a140c0e0a0a0a0c0a0e0c0f0c0d0c0b0a0d070721043e0b0b38100c0705680a0d07082104460b0b38110c0705680b0d07092104640a0f04540b0b0b0f203812010c060c07055b0b0b0b0f203813010c060c070b0606000000000000000021046005680b00010701270b00010705270b070c080a080b0125046f05730b00010700270b000b0838020a0a0b0c0b0e38140c090e09381f0b0a260481010583010700270b050b093815020f01040062f4010e024121060200000000000000210406050a0b00010703270e03412006020000000000000021041005140b00010706270e04410a06020000000000000021041a051e0b00010704270a00111c0c060e020600000000000000004221140c140e030600000000000000004220140c180e04060000000000000000420a140c1c0a140a180a1c0c1d0c190c160a19070721043e0b1638160c0a05680a1907082104460b1638170c0a05680b1907092104640a1d04540b160b1d203818010c080c0a055b0b160b1d203819010c080c0a0b0806000000000000000021046005680b00010701270b00010705270b0a0c0e0a0e0b0125046f05730b00010700270b000b0e38020b140b180b1c381a0c120e020601000000000000004221140c150e030601000000000000004220140c1b0e04060100000000000000420a140c1f0a150a1b0a1f0c1e0c1a0c170a1a0707210498010b17381b0c0b05be010a1a07082104a0010b17381c0c0b05be010b1a07092104bc010a1e04ae010b170b1e20381d010c090c0b05b5010b170b1e20381e010c090c0b0b090600000000000000002104ba0105be010701270705270b0b0c100b120b100a060c070c0f0c0c0e0c381f0c110a0f0a112504ce0105d0010700270a0f0a112104d7010b0c0c0505e2010d0c0b110b0f1738200c0d0b070b0d38150b0c0c050b050a150b1b0b1f38210c130e1338330b152604ee0105f0010700270b060b133823021001040063e1020e024121060300000000000000210406050a0b00010703270e03412006030000000000000021041005140b00010706270e04410a06030000000000000021041a051e0b00010704270a00111c0c070e020600000000000000004221140c1e0e030600000000000000004220140c240e04060000000000000000420a140c2a0a1e0a240a2a0c2b0c250c200a25070721043e0b2038250c0d05680a2507082104460b2038260c0d05680b2507092104640a2b04540b200b2b203827010c0a0c0d055b0b200b2b203828010c0a0c0d0b0a06000000000000000021046005680b00010701270b00010705270b0d0c140a140b0125046f05730b00010700270b000b1438020b1e0b240b2a38290c1b0e020601000000000000004221140c1f0e030601000000000000004220140c280e04060100000000000000420a140c2e0a1f0a280a2e0c2c0c260c210a260707210498010b21382a0c0e05be010a2607082104a0010b21382b0c0e05be010b2607092104bc010a2c04ae010b210b2c20382c010c0b0c0e05b5010b210b2c20382d010c0b0c0e0b0b0600000000000000002104ba0105be010701270705270b0e0c180b1b0b180a070c080c160c0f0e0f381f0c190a160a192504ce0105d0010700270a160a192104d7010b0f0c0605e2010d0f0b190b161738200c120b080b1238150b0f0c060b060b1f0b280b2e382e0c1d0e020602000000000000004221140c230e030602000000000000004220140c290e04060200000000000000420a140c2f0a230a290a2f0c2d0c270c220a270707210485020b22382f0c1005ab020a27070821048d020b2238300c1005ab020b2707092104a9020a2d049b020b220b2d203831010c0c0c1005a2020b220b2d203832010c0c0c100b0c0600000000000000002104a70205ab020701270705270b100c150b1d0b150a070c090c170c110e1138330c1a0a170a1a2504bb0205bd020700270a170a1a2104c4020b110c0505cf020d110b1a0b171738340c130b090b1338230b110c050b050a230b290b2f38350c1c0e1c384c0b232604db0205dd020700270b070b1c3837021101040064ce030e024121060400000000000000210406050a0b00010703270e03412006040000000000000021041005140b00010706270e04410a06040000000000000021041a051e0b00010704270a00111c0c080e020600000000000000004221140c280e030600000000000000004220140c300e04060000000000000000420a140c380a280a300a380c390c310c2a0a31070721043e0b2a38390c1005680a3107082104460b2a383a0c1005680b3107092104640a3904540b2a0b3920383b010c0c0c10055b0b2a0b3920383c010c0c0c100b0c06000000000000000021046005680b00010701270b00010705270b100c1a0a1a0b0125046f05730b00010700270b000b1a38020b280b300b38383d0c240e020601000000000000004221140c290e030601000000000000004220140c360e04060100000000000000420a140c3e0a290a360a3e0c3a0c320c2b0a320707210498010b2b383e0c1105be010a3207082104a0010b2b383f0c1105be010b3207092104bc010a3a04ae010b2b0b3a203840010c0d0c1105b5010b2b0b3a203841010c0d0c110b0d0600000000000000002104ba0105be010701270705270b110c200b240b200a080c090c1c0c120e12381f0c210a1c0a212504ce0105d0010700270a1c0a212104d7010b120c0705e2010d120b210b1c1738200c170b090b1738150b120c070b070b290b360b3e38420c270e020602000000000000004221140c2f0e030602000000000000004220140c370e04060200000000000000420a140c3f0a2f0a370a3f0c3b0c330c2c0a330707210485020b2c38430c1305ab020a33070821048d020b2c38440c1305ab020b3307092104a9020a3b049b020b2c0b3b203845010c0e0c1305a2020b2c0b3b203846010c0e0c130b0e0600000000000000002104a70205ab020701270705270b130c1b0b270b1b0a080c0a0c1d0c140e1438330c220a1d0a222504bb0205bd020700270a1d0a222104c4020b140c0505cf020d140b220b1d1738340c180b0a0b1838230b140c050b050b2f0b370b3f38470c250e020603000000000000004221140c2e0e030603000000000000004220140c350e04060300000000000000420a140c3d0a2e0a350a3d0c3c0c340c2d0a3407072104f2020b2d38480c150598030a3407082104fa020b2d38490c150598030b340709210496030a3c0488030b2d0b3c20384a010c0f0c15058f030b2d0b3c20384b010c0f0c150b0f060000000000000000210494030598030701270705270b150c1f0b250b1f0a080c0b0c1e0c160e16384c0c230a1e0a232504a80305aa030700270a1e0a232104b1030b160c0605bc030d160b230b1e17384d0c190b0b0b1938370b160c060b060a2e0b350b3d384e0c260e2638640b2e2604c80305ca030700270b080b263850021201040065460e024121060100000000000000210406050a0b00010702270e03412006010000000000000021041005140b00010706270e04410a06010000000000000021041a051e0b00010704270a00111c0c050b000b0138020c060e030600000000000000004220140c090e020600000000000000004221140c080e04060000000000000000420a140c0a0b060a080b090b0a38520c070e07381f0b0826044005420700270b050b0738150213010400665b0e024121060200000000000000210406050a0b00010702270e03412006020000000000000021041005140b00010706270e04410a06020000000000000021041a051e0b00010704270a00111c0c050b000b0138020c060e030600000000000000004220140c0b0e020600000000000000004221140c090e04060000000000000000420a140c0d0b060b090b0b0b0d38530c070e030601000000000000004220140c0c0e020601000000000000004221140c0a0e04060100000000000000420a140c0e0b070a0a0b0c0b0e38540c080e0838330b0a26045505570700270b050b083823021401040067700e024121060300000000000000210406050a0b00010702270e03412006030000000000000021041005140b00010706270e04410a06030000000000000021041a051e0b00010704270a00111c0c050b000b0138020c060e030600000000000000004220140c0d0e020600000000000000004221140c0a0e04060000000000000000420a140c100b060b0a0b0d0b1038550c070e030601000000000000004220140c0e0e020601000000000000004221140c0b0e04060100000000000000420a140c110b070b0b0b0e0b1138560c080e030602000000000000004220140c0f0e020602000000000000004221140c0c0e04060200000000000000420a140c120b080a0c0b0f0b1238570c090e09384c0b0c26046a056c0700270b050b09383702150104006885010e024121060400000000000000210406050a0b00010702270e03412006040000000000000021041005140b00010706270e04410a06040000000000000021041a051e0b00010704270a00111c0c050b000b0138020c060e030600000000000000004220140c0f0e020600000000000000004221140c0b0e04060000000000000000420a140c130b060b0b0b0f0b1338580c070e030601000000000000004220140c100e020601000000000000004221140c0d0e04060100000000000000420a140c150b070b0d0b100b1538590c090e030602000000000000004220140c110e020602000000000000004221140c0e0e04060200000000000000420a140c160b090b0e0b110b16385a0c0a0e030603000000000000004220140c120e020603000000000000004221140c0c0e04060300000000000000420a140c140b0a0a0c0b120b14385b0c080e0838640b0c26047f0581010700270b050b083850021600000069720e0038650c0a0a02070721042b0b0a38660c0c0a0c0b0126040f05110700270b000b0c0c0e0c073867041f0b0706000000000000000038680b0e38690c050c11052638680b0e0b07060000000000000000386a0c110c050b11386b0b050c0b05700a0207082104530b0a386c0c0d0a0d0b0126043705390700270b000b0d0c0f0c08386704470b0806000000000000000038680b0f386d0c060c12054e38680b0f0b08060000000000000000386e0c120c060b12386b0b060c0b05700b02070921046e0b000b030c100c090b1004610b09386f0c0405640b0938700c040b040c0b0e0b381f0b0126046c05700700270705270b0b02170000006c540a02070721041e0b000b010c0b0c07386704120b0706000000000000000038680b0b38690c050c0e051938680b0b0b07060000000000000000386a0c0e0c050b0e386b0b050c0a05520a02070821043c0b000b010c0c0c08386704300b0806000000000000000038680b0c386d0c060c0f053738680b0c0b08060000000000000000386e0c0f0c060b0f386b0b060c0a05520b02070921044e0b000b030c0d0c090b0d044a0b09386f0c0405500b0938700c0405500705270b040c0a0b0a0200","abi":{"address":"0x9dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b","name":"router","friends":[],"exposed_functions":[{"name":"add_liquidity_v0","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64","u64"],"return":[]},{"name":"add_liquidity_v05","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64","u64"],"return":[]},{"name":"add_liquidity_v1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","vector<u32>","u32","u32","vector<u64>","vector<u64>","u64","u64"],"return":[]},{"name":"fa_swap_coin_for_exact_coin_x1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_coin_for_exact_coin_x2","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_coin_for_exact_coin_x3","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_coin_for_exact_coin_x4","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_exact_coin_for_coin_x1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_exact_coin_for_coin_x2","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_exact_coin_for_coin_x3","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"fa_swap_exact_coin_for_coin_x4","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"remove_liquidity_v0","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64"],"return":[]},{"name":"remove_liquidity_v05","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","u64","u64"],"return":[]},{"name":"remove_liquidity_v1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","vector<u32>","vector<u64>","u64","u64"],"return":[]},{"name":"swap_coin_for_exact_coin_x1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_coin_for_exact_coin_x2","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_coin_for_exact_coin_x3","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_coin_for_exact_coin_x4","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_exact_coin_for_coin_x1","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_exact_coin_for_coin_x2","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_exact_coin_for_coin_x3","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]},{"name":"swap_exact_coin_for_coin_x4","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","u64","vector<u64>","vector<u8>","vector<bool>"],"return":[]}],"structs":[{"name":"BinStepV0V05","is_native":false,"is_event":false,"abilities":[],"generic_type_params":[],"fields":[{"name":"dummy_field","type":"bool"}]},{"name":"CurveV1","is_native":false,"is_event":false,"abilities":[],"generic_type_params":[],"fields":[{"name":"dummy_field","type":"bool"}]}]}}]',
          data: '{"type":"entry_function_payload","function":"0x9dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b::router::swap_exact_coin_for_coin_x1","type_arguments":["0x1::aptos_coin::AptosCoin","0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC","0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated","0x9dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b::router::BinStepV0V05"],"arguments":["100",["134"],["0"],[false]]}',
        },
      },
    };
    let tx = await wallet.buildSimulateTx(param);
    expect(tx).toEqual(
      '3ef44e906c78022014e6e3a88ba602b8e643655e43c8424510e9e398342595f21e00000000000000029dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b06726f757465721b737761705f65786163745f636f696e5f666f725f636f696e5f7831040700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0007f22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa05617373657404555344430007190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12066375727665730c556e636f7272656c6174656400079dd974aea0f927ead664b9e1c295e4215bd441a9fb4e53e5ea0bf22f356c8a2b06726f757465720c42696e53746570563056303500040864000000000000000901860000000000000002010002010000b4c4040000000064000000000000008c9367730000000001002082e41609813847aec1dd3ba866f9acba88eef4c83278300a5c6b8ed2a63d63434000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );

    // 调用方法
    let res3 = await wallet.buildSimulateTx({
      publicKey:
        '0xc887bfe29073c3071719d78e55b81deabfb07d4e510de06ccd56835537eb5b58',
      data: {
        type: 'simulate_dapp',
        base: {
          expirationTimestampSecs: 1743755245,
          sequenceNumber: '650',
          chainId: 1,
          gasUnitPrice: '100',
          maxGasAmount: '2000',
          reserveFeeRatio: '1.1',
          sender:
            '0x2acddad65c27c6e5b568b398f0d1d01ebb8b55466461bbd51c1e42763a92fdfe',
        },
        data: {
          abi: '[{"bytecode":"0xa11ceb0b0700000a0c0100490249c001038902ea0d04f30f92010585118b14079025d02e08e053e00106c055d101109157c41d0ad574ca030c9f78b885010dd7fd0156000001040108011502170140015a036a006c016e017001740138017f018701018d01009a0101a00101a90104af0104b60105b90101ee0101f90101fc0106ff01018102068302019f02000108000103060001060701000102070b00020d0600020f0600021106000012080003140402000000000416070000190600001f000000200600002108000025060000270800002a060000310e0000390200003b0600003d0800053f0700004306000044060000480600004c0200004e0600004f0800005102000055060000560800065904010000005d0600005e0600005f0800026900000d7e07020000000004850107000f8f010200019601020015b801070016f0010701000018fb0107000061000100010662010401040103630106020704010064070800010065090a000101660c0801080101670d08000100680f100001076b00110001086d01080001096f12110100010a7114150108010872011600010a7317100108010b75000800010776181100010077021a000100780211000103791c1d020200010c7a01150001047b1e1a0001007c021f0001037d2021020200010013012200010080010111000103810123240207050100820100010001036f20110202000100830125010001048401262700010463281f00010386012901020302010e88012b010106010089012d010001058a010a2e0001008b0115110001008c01320100010f8e0133340100010f90013511000100910103110001009201033600010093010711000101940137160001019501383900010197013a1600010198013a3c010801009901073f0001109b013f1a0001009c0141420001002401110001099d014301010001005c01150001009e0136450001029f013c4601080111a1014715000111a2014715000100a301494a000100a4010001000100a5010111000100230111000100a6014201000102494c02000100a7010315000102a8014c15000112aa0115150001001e0345000100ab010311000100ac014145000100ad010315000100ae010345000113b0014d4e000102b1014f10000100b201100100010ab3015001000100b4010311000100b5010345000114b7015253000115ba015411000100bb010311000100bc015859000100bd015859000100be014101000100bf013201000100c0012d01000100c1015c01000100c2015c01000100c3015c01000100220111000100c4015e11000100c5015e0a000100c6010760000100580162000106c701636401050100c8016510000100c9016667000102ca016810000100cb016b01000100cc016c59000100cd01676e000100ce016510000100cf016667000100d0016b01000100d101656f000100d2016667000100d3017071000100d4016b01000100d5017415000109d601127501000102d7014c02000100d8017715000100d9017715000100da010315000100db01416e000114dc01796e000100dd01477b0001005b0115000100de01477b000100df017a15000100e0017f45000100e10181018201000100e201830115000100e30181018201000100e401830115000113e50184011a000100e601860115000114e701870115000100e80181018201000100e90181018201000113ea0184011a000100eb01860115000114ec01870115000100ed018b018c01000116ef01018d010100010af1018e0101000102f2013a8f01000102f3013a9001000102f4013a9101000101f5013a9201000100090346000100f601940158000100f701950111000100f8015e11000117fa01029601000116fd0198011101000116b10199012b01000100fe0197012e00011980022e1100011a82029a012e0100011b84022e530001158502531a00011586021a5300011587029b01530001158802531500010089025e0a0001068a029c0101010401008b029f01010001008c02a101580001008d029f01010001008e02a301580001008f02a401110001009002a4010a0001009102a6010100010092020301000115930215530001159402a7015300011595025315000100960202150001005701360001009702a8014a0001189802aa01080001059902ab01150001059a02ac012e0001059b02ad01010001189c02aa010a0001189d02aa010a0001049e02af01010001099b02b101010100011ca0029a010a01000100a102034a000100a202034e000100a3020302000102a402b50102000102a5023cb60101080116a602b7012b01030100a7020315000100a80203a801000100a902034a000100aa020315000100ab02b80101000100ac02b901ba01000100ad02b90101000100ae02bb01bc01000100af02bd017b000100b002bb01bc01000100b102bb01bc01000100b202bb01bc01000100b302bb01bc01000100b402bb01bc01000100b502c10101000100b602c20159000102b702c40101000100b802ba0145000100b9020811000100ba0201c701000100bb025c01000100bc02c80101000100bd02cb0101000100be02cd0110000116bf022b8d0101000100c002d00101000100c102cd0110000100c202d20101000100c302d00101000100c402cd0110000100c502d00101000100c602d301d101000100c702d00101000100c802d301d101000100c902d00101000100ca02d301d101000100cb02d00101000100cc02bc01d501000100cd020515000110ce027b15000100cf020815000103d002d901210203000100d102da0101000100d202db0101000100d302000100010ad402dc010101080100d502de0101000100d602df0101000109d702e0012b01000115d8023f53000101d902083c010801167d98019a0101000102da023c1001080101030205050b0a020b130d13121b161b191b021b1b1b1f1b202a202f25022d3b203d32153202351332102051205b5c0320696b0284011a2d0b8f019701900197010513930108322e321a9a0103209d01b00146b10102b10115b60113b7011a20c50120c90132081f05d0010820ce0120d6011b051605e10105e501130a086b08e80108ea013b20e2018f0108eb0108ec011301060c00010b02010803010b02010800010b1f010900020503010b080209000901030b020108000b020108030b020108030105020b020108030b02010803010a0201080001060b020109000206050a02030a020b020108000502060c0b02010803010823010102060a090006090001080302050b020109000103010c03060c0b020109000302050a020301030c0104020b02010803080902070b080209000901090001070901020708090301080902060b080209000901090001060901010b24020b02010803080901060b080209000901010b24020900090104060c0b0201080304030203040108250208250303070b08020900090109000901010818010900040b02010803070b08020b0201080308090825080902060c030108150108200307081e0307030301010104060c0b020108000b020108030b020108030206090006090001082601060826010a0b020108030106080102060c0a0201082701060827010811010b020109000108130808260b020108000a0b020108030b020108000c08270608270c0204040206081104020b020108000a03020a0823080b01070a09001e0b020108000b0201080006080005010a030a030303010a0b020108030a030a0b020108030a030b020108030a030a0b020108030b020108000b020108000c0a030a0b020108030a08230a030a0b020108030a030a0b02010803030b02010800070800010a03010202030308030a0b020108030a0b02010803030b020108030a030a0b020108030a0b02010803020a030a03010a0407060a030a04060a030303060306030106082302060a0403010f02070823030205082301080c02060a03060a0301082802060828060828310a030b020108000b020108000b02010800060800060a08230a0b0201080303030608230a0b020108030a0303070a03030a030a030a030a03030a030a030a030a030a030a030a030a030a030a030a03010a030a040a04060a04060a040f050a08230a030a08230a0308230b020108000708000a0308280828020b0201080001070b02010800050a030a0b020108030a0b02010803030b02010803020b020108000823010a0823070a0823060a08230a0303030608230a0301081a02060c010407080d03030701020a0b0201080303020a020505040404040301060811010a0b0201080001060b1f010900010a0900020b020108000a0823030b020108000a0b020108030a03010812020608040301080a11060a08230a0b0201080303030608230a0b020108030a030a0308120b02010800060800050a0b020108030a08230a0b020108030a0823082304060c0b020108000a030303060c0a0b020108030a03030b020108000a0823082302030a030208230a0823020a08230a03020a08230a082311060a08230a0b0201080303030608230a0b020108030a030a0308120a08230a08230a03050a08230a082308230b02010800060b020108000a082308230a08230a08230823020a0b020108030b02010803020103020b0201080307081e030b020108000a030a0311030a030a040f0a030a030a030a030a030a030a030303070a03030a040f03060a03060a0303030a030a0303030303030703030303030303080303030303030303020a040f020b02010800030b030a03060a030a030303070a0303030303050b020108000303030a0303040403030b0201080003030503030304060a04060a030303040a0404040b0201080003030305030303060a03060a03040a030b020108000a030a030a0b02010800030a030a030a04060a0403030404050b02010800030a030a030a03050a082303030a0202030c0b020108000823010b29010900070608270b290104081508150208150815010804010805010806010801120c08270c05060a08230a0b0201080303030608230a0b020108030a08230a0823082308040805080608230b0201080004060c0a08230303020a0b0201080302010b2901082a01082a01060b2901090001070b29010900010609000208280402070b1f010900090001081626060a08230a0b0201080303030608230a0b02010803010a08150a0b020108030a0b02010803070a08150b020108030b2901082a08150815050a08150a030a030a030a030a040a08150a08150a040a030a040a030a030a040a030a04040a030a0208230b020108000c05060c0a0b020108030a030303020a08230823030a0823030310060a08230a0b0201080303030608230a0b020108030a030a03010a030a030a030a0208230b020108000c030a08230a0303030a0b020108030a030311060a08230a0b0201080303030608230a0b02010803060a030a030a03030a030a03060a030a0208230b020108000c05060c0a0b020108030a030a03030208280828010a0815050a040a08150a08150308150106082a01060815030608150303020708150815030508150815030708090303070a0b020108030a030a0b020108030a03030b020108030302070a09000a0900050a020a0b020108030a0b02010803030b020108030a0a020a0b020108030a030a0b020108030a0303030b020108030b0201080303040b02010800010a030a0401060804010b29010402060b290109000900040b020108000a0b020108030a0302030b020108000b0201080303010819050b020108000b020108030b02010803030b29010501081c050b020108000b020108030b020108030b290105020b030303030303030404030a03090303030a0303040403030603030303030305060c0b020108000b02010803030a0303060c0b02010800082309060a0308230a0823060a0823030306030a08230a082302060806082301080e130b020108030308190a030a0b020108030b020108000b020108000c0a030a0b020108030a08230a030a0b020108030a030a0b0201080303030b02010800060800010a0503060c0b020108000301081707010b02010800010b0201080007080f03070303060c0a050a030807081b0a050a030a050a0303050304060c0b0201080008230b02010803010810090b0201080303081c08230b020108000b02010803030b020108000c06060c0b020108000b02010803030b02010803030208230823050b020108000b020108030b02010803040405060c0b0201080008230b02010803030a0b0201080303081c08230b020108000b02010803030b020108000c08230a0303030404030303030301081d010708140106081b03060b080209000901090006090102060c05020a0b020108030504060c0b020109000503060a0b020108030a0b02010803030b02010803030c03060c050a0b0201080303060c0a050a0502070a090003090a050a0503050708070a050a0505030108210a08260b020108030b02010803040405070811030407030a0a030a040a030a030a040a030a04030304060b020108000b020108000608000a030a03030b0301010103060b02010803060b020108030826010201030b020108000b02010800060800060b020108000b02010800060800030303090a08230a0b020108030a030a0b020108030a03030b0201080303082304706f6f6c04506f6f6c0a657874656e645f72656609457874656e64526566066f626a6563740f6173736574735f6d65746164617461064f626a656374084d657461646174610e66756e6769626c655f617373657409706f6f6c5f747970650c737761705f6665655f627073066c6f636b6564116c705f746f6b656e5f6d696e745f726566074d696e74526566156c705f746f6b656e5f7472616e736665725f7265660b5472616e73666572526566116c705f746f6b656e5f6275726e5f726566074275726e52656609526174654c696d69741361737365745f726174655f6c696d69746572730a536d6172745461626c650b736d6172745f7461626c650b526174654c696d697465720c726174655f6c696d697465721177686974656c69737465645f7573657273114164644c69717569646974794576656e7408706f6f6c5f6f626a086d6574616461746107616d6f756e7473166d696e7465645f6c705f746f6b656e5f616d6f756e740d706f6f6c5f62616c616e63657309466c6173686c6f616e0e466c6173686c6f616e4576656e74095061757365466c61670b737761705f706175736564106c69717569646974795f70617573656410666c6173686c6f616e5f7061757365641452656d6f76654c69717569646974794576656e74166275726e65645f6c705f746f6b656e5f616d6f756e740a537461626c65506f6f6c0a616d705f666163746f7215707265636973696f6e5f6d756c7469706c6965727309537761704576656e74066964785f696e076964785f6f757409616d6f756e745f696e0a616d6f756e745f6f757410746f74616c5f6665655f616d6f756e741370726f746f636f6c5f6665655f616d6f756e740a547761704f7261636c650a6d657461646174615f780a6d657461646174615f791263756d756c61746976655f70726963655f781263756d756c61746976655f70726963655f790c73706f745f70726963655f780c73706f745f70726963655f790974696d657374616d70134164644c6971756964697479507265766965770e726566756e645f616d6f756e747315437265617465547761704f7261636c654576656e740a6f7261636c655f6f626a0e4d657461537461626c65506f6f6c0c6f7261636c655f6e616d657306537472696e6706737472696e670572617465730c6c6173745f7570646174656411506f6f6c4372656174696f6e4576656e7414506f6f6c506172616d4368616e67654576656e74046e616d650a707265765f76616c7565096e65775f76616c756514526174654c696d69745570646174654576656e740e61737365745f6d657461646174610e77696e646f775f6d61785f7174791777696e646f775f6475726174696f6e5f7365636f6e64731652656d6f76654c6971756964697479507265766965771177697468647261776e5f616d6f756e74731552656d6f7665547761704f7261636c654576656e7412537761704665654d756c7469706c6965727307747261646572730b537761705072657669657712616d6f756e745f696e5f706f73745f66656514616d6f756e745f6e6f726d616c697a65645f696e15616d6f756e745f6e6f726d616c697a65645f6f75740e53796e6352617465734576656e74095468616c61537761700d666565735f6d6574616461746105706f6f6c730b536d617274566563746f720c736d6172745f766563746f7220737761705f6665655f70726f746f636f6c5f616c6c6f636174696f6e5f62707311666c6173686c6f616e5f6665655f627073195468616c6153776170506172616d4368616e67654576656e7415557064617465547761704f7261636c654576656e740c5765696768746564506f6f6c07776569676874730b696e69745f6d6f64756c6505656d707479036e65770e6f7261636c655f616464726573730b6f7261636c655f736565640e6f626a6563745f61646472657373156372656174655f6f626a6563745f616464726573730c77697468647261775f6665650d46756e6769626c654173736574076d616e616765720d69735f617574686f72697a6564077061636b6167650f7061636b6167655f6164647265737306766563746f7208636f6e7461696e73167072696d6172795f66756e6769626c655f73746f72650762616c616e63650e7061636b6167655f7369676e6572087769746864726177067369676e65720a616464726573735f6f660e69735f726f6c655f6d656d6265721c61737365745f726174655f6c696d697465725f72656d61696e696e67196578697374735f61737365745f726174655f6c696d697465720a626f72726f775f6d75740b6e6f775f7365636f6e64730972656d61696e696e671761737365745f726174655f6c696d697465725f7669657706626f72726f770953696d706c654d61700a73696d706c655f6d61701a656e61626c65645f726174655f6c696d69745f666561747572650d746f5f73696d706c655f6d617019656e61626c655f726174655f6c696d69745f66656174757265147365745f61737365745f726174655f6c696d69740a6e65775f636f6e66696711526174654c696d69746572436f6e66696706757073657274056576656e7404656d6974247365745f737761705f6665655f70726f746f636f6c5f616c6c6f636174696f6e5f62707304757466381176616c69646174655f737761705f6665650d6372656174655f6f7261636c650a636f6d70617261746f7207636f6d7061726506526573756c740f69735f736d616c6c65725f7468616e0e706f6f6c5f69735f737461626c6514706f6f6c5f6173736574735f6d657461646174610d6f7261636c655f6578697374731d67656e65726174655f7369676e65725f666f725f657874656e64696e67136372656174655f6e616d65645f6f626a6563740e436f6e7374727563746f725265660f67656e65726174655f7369676e65721b6f626a6563745f66726f6d5f636f6e7374727563746f725f7265661963757272656e745f63756d756c61746976655f7072696365730b6d6174685f68656c70657208777261705f61646409666c6173686c6f616e0772657665727365196765745f707265636973696f6e5f6d756c7469706c6965727308646563696d616c73066d6174683634036d617803706f77066765745f78700f696e69745f70617573655f666c616716696e697469616c697a65645f70617573655f666c61670d7061795f666c6173686c6f616e11706f6f6c5f737761705f6665655f62707306616d6f756e74056572726f7210696e76616c69645f617267756d656e7412706f6f6c5f69735f6d657461737461626c651a75707363616c655f6d657461737461626c655f616d6f756e74730f706f6f6c5f616d705f666163746f721a706f6f6c5f707265636973696f6e5f6d756c7469706c696572730b737461626c655f6d61746811636f6d707574655f696e76617269616e7407657874726163740b636f6c6c6563745f666565076465706f73697410706f6f6c5f69735f77656967687465640c706f6f6c5f776569676874730d77656967687465645f6d6174681d636f6d707574655f696e76617269616e745f776569676874735f7536340c4669786564506f696e7436340d66697865645f706f696e743634036774650b706f6f6c5f6c6f636b65641072656d6f76655f6c69717569646974791972656d6f76655f6c69717569646974795f696e7465726e616c1c696e6372656d656e745f726174655f6c696d69745f616d6f756e74730d72656d6f76655f6f7261636c65157365745f666c6173686c6f616e5f6665655f627073137365745f70617573655f666c6173686c6f616e137365745f70617573655f6c69717569646974790e7365745f70617573655f7377617012737461626c655f706f6f6c5f6578697374730e6c705f736565645f737461626c6512747761705f6f7261636c655f73746174757309746f5f766563746f72186164645f6c69717569646974795f6d657461737461626c6520707265766965775f6164645f6c69717569646974795f6d657461737461626c65046d696e741e6164645f6c69717569646974795f6d657461737461626c655f656e7472791477697468647261775f757365725f6173736574731a6164645f6c69717569646974795f707265766965775f696e666f146164645f6c69717569646974795f737461626c651c707265766965775f6164645f6c69717569646974795f737461626c651a6164645f6c69717569646974795f737461626c655f656e747279166164645f6c69717569646974795f77656967687465641e707265766965775f6164645f6c69717569646974795f776569676874656414657874726163745f6d756c74695f6173736574731c6164645f6c69717569646974795f77656967687465645f656e747279166173736572745f6d657461646174615f65786973747308696e6465785f6f66136d657461646174615f66726f6d5f617373657420636f6d707574655f6164645f6c69717569646974795f6d657461737461626c651c636f6d707574655f6164645f6c69717569646974795f737461626c6514706f6f6c5f6c705f746f6b656e5f737570706c791e636f6d707574655f6164645f6c69717569646974795f77656967687465641a636f6d707574655f706f6f6c5f746f6b656e735f6973737565641c636f6d707574655f666565735f676976656e5f616d6f756e745f696e25636f6d707574655f666565735f676976656e5f616d6f756e745f696e5f706f73745f66656520636f6d707574655f696e697469616c5f737461626c655f6c705f616d6f756e7418636f6d707574655f72656d6f76655f6c697175696469747920636f6d707574655f737761705f65786163745f696e5f6d657461737461626c651975707363616c655f6d657461737461626c655f616d6f756e741c636f6d707574655f737761705f65786163745f696e5f737461626c651b646f776e7363616c655f6d657461737461626c655f616d6f756e741163616c635f6f75745f676976656e5f696e1e636f6d707574655f737761705f65786163745f696e5f77656967687465641d63616c635f6f75745f676976656e5f696e5f776569676874735f75363421636f6d707574655f737761705f65786163745f6f75745f6d657461737461626c651d636f6d707574655f737761705f65786163745f6f75745f737461626c651163616c635f696e5f676976656e5f6f75741f636f6d707574655f737761705f65786163745f6f75745f77656967687465641d63616c635f696e5f676976656e5f6f75745f776569676874735f753634146372656174655f706f6f6c5f696e7465726e616c066f7074696f6e046e6f6e65064f7074696f6e2b6372656174655f7072696d6172795f73746f72655f656e61626c65645f66756e6769626c655f61737365741167656e65726174655f6d696e745f7265661567656e65726174655f7472616e736665725f7265661167656e65726174655f6275726e5f7265661367656e65726174655f657874656e645f726566166372656174655f706f6f6c5f6d657461737461626c651876616c69646174655f6173736574735f6d65746164617461166d657461737461626c655f706f6f6c5f65786973747304636f696e0b7061697265645f636f696e0854797065496e666f09747970655f696e666f0769735f736f6d650d6765745f747970655f6e616d650d7469657265645f6f7261636c6519696e697469616c697a65645f7469657265645f6f7261636c650c737472696e675f7574696c7309746f5f737472696e67066f7261636c651c6765745f616e645f7570646174655f70726963655f62795f6e616d6507746f5f753132380966726f6d5f75313238086d756c5f75313238116465636f64655f726f756e645f646f776e126c705f736565645f6d657461737461626c6509707573685f6261636b1c6372656174655f706f6f6c5f6d657461737461626c655f656e747279126372656174655f706f6f6c5f737461626c65186372656174655f706f6f6c5f737461626c655f656e747279146372656174655f706f6f6c5f77656967687465641477656967687465645f706f6f6c5f657869737473106c705f736565645f77656967687465641a6372656174655f706f6f6c5f77656967687465645f656e7472790a73796e635f726174657306656e636f6465066469765f6670066465636f64650b6665655f62616c616e6365096765745f72617465730f6163636f756e745f61646472657373066c656e6774680a7375625f737472696e6706617070656e640b6d6f64756c655f6e616d650b7374727563745f6e616d6507616371756972650362637308746f5f627974657318706f6f6c5f62616c616e6365735f6e6f726d616c697a65640e706f6f6c5f696e76617269616e7416706f6f6c5f6c705f746f6b656e5f6d65746164617461116d696e745f7265665f6d6574616461746106737570706c79106765745f776974685f64656661756c741c706f6f6c5f6d657461737461626c655f6c6173745f757064617465641c706f6f6c5f6d657461737461626c655f6f7261636c655f6e616d657315706f6f6c5f6d657461737461626c655f726174657309706f6f6c5f73697a651b76616c69646174655f6164645f6c69717569646974795f6461746118707265766965775f72656d6f76655f6c69717569646974791e76616c69646174655f72656d6f76655f6c69717569646974795f6461746120707265766965775f737761705f65786163745f696e5f6d657461737461626c651276616c69646174655f737761705f646174611c707265766965775f737761705f65786163745f696e5f737461626c651e707265766965775f737761705f65786163745f696e5f776569676874656421707265766965775f737761705f65786163745f6f75745f6d657461737461626c651d707265766965775f737761705f65786163745f6f75745f737461626c651f707265766965775f737761705f65786163745f6f75745f77656967687465641672656d6f76655f6c69717569646974795f656e7472792472656d6f76655f6c69717569646974795f77686974656c6973745f6f7665727269646573046275726e1d72656d6f76655f6c69717569646974795f707265766965775f696e666f21757365725f72656d6f76655f6c69717569646974795f77686974656c69737465642272656d6f76655f6c69717569646974795f77686974656c69737465645f7573657273137365745f70617573655f7468616c61737761701a7365745f737461626c655f706f6f6c5f616d705f666163746f72187365745f737761705f6665655f6d756c7469706c6965727318737761705f65786163745f696e5f6d657461737461626c6504736f6d651e737761705f65786163745f696e5f6d657461737461626c655f656e74727914737761705f65786163745f696e5f737461626c65127570646174655f747761705f6f7261636c651a737761705f65786163745f696e5f737461626c655f656e74727916737761705f65786163745f696e5f77656967687465641c737761705f65786163745f696e5f77656967687465645f656e74727919737761705f65786163745f6f75745f6d657461737461626c651f737761705f65786163745f6f75745f6d657461737461626c655f656e74727915737761705f65786163745f6f75745f737461626c651b737761705f65786163745f6f75745f737461626c655f656e74727917737761705f65786163745f6f75745f77656967687465641d737761705f65786163745f6f75745f77656967687465645f656e74727911737761705f707265766965775f696e666f137472616465725f737761705f6665655f627073106d756c5f6469765f726f756e645f75701a7472616465725f737761705f6665655f6d756c7469706c69657213626f72726f775f776974685f64656661756c74117472616e736665725f616c6c5f666565730d7472616e736665725f666565731c7472616e736665725f616c6c5f666565735f746f5f6d616e61676572087472616e73666572127472616e736665725f666565735f6c697374217570646174655f726174655f6c696d69745f77686974656c6973745f75736572730b737761705f72656d6f76650d6672616374696f6e5f7531323811616464726573735f746f5f6f626a656374047a65726f007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5000000000000000000000000000000000000000000000000000000000000000187978b35bf1eb73ae6cf04cfedcaa1f48254a683ebd00a21e7516a991edae3ac93aa044a65a27bd89b163f8b3be3777b160b09a25c336643dcc2878dfd8f2a8da69815e15324d29acef976ac5b7ef4caa30e16632a139275d634df72ec4e277c4dcae85fc5559071906cd5c76b7420fcbb4b0a92f00ab40ffc394aadbbff5ee9092e95ed77b5ac815d3fbc2227e76db238339e9ca43ace45031ec2589bea5b8c0a020c0b6665655f6d616e616765720a022120737761705f6665655f70726f746f636f6c5f616c6c6f636174696f6e5f6270730a02151470617573655f666c6173686c6f616e5f626f6f6c0a02151470617573655f6c69717569646974795f626f6f6c0a02100f70617573655f737761705f626f6f6c0a020f0e5468616c61204c5020546f6b656e0a0209085448414c412d4c500a0201000a0203023a3a0a0205044d53503a0a02040353503a0a02040357503a0a020c0b545741504f5241434c453a0a020b0a616d705f666163746f7214636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31126170746f733a3a6d657461646174615f7631901d2c2d01000000000000214552525f504f4f4c5f464c4153484c4f414e5f494e56414c49445f414d4f554e54002e01000000000000214552525f504f4f4c5f464c4153484c4f414e5f494e56414c49445f415353455453002f01000000000000294552525f504f4f4c5f464c4153484c4f414e5f4e4f545f494e4352454153455f494e56415249414e540030010000000000001e4552525f504f4f4c5f464c4153484c4f414e5f494e56414c49445f4645450058020000000000001f4552525f504f4f4c5f524154455f4c494d495445525f554e454e41424c4544005902000000000000254552525f504f4f4c5f524154455f4c494d495445525f414c52454144595f454e41424c4544005a02000000000000204552525f504f4f4c5f494e56414c49445f57494e444f575f4455524154494f4e005b02000000000000224552525f504f4f4c5f4e4f5f524154455f4c494d495445525f464f525f4153534554009001000000000000164552525f504f4f4c5f4f5241434c455f4558495354530091010000000000001a4552525f504f4f4c5f4f5241434c455f4e4f545f4558495354530092010000000000001e4552525f504f4f4c5f4f5241434c455f494e56414c49445f41535345545300bc020000000000002d4552525f504f4f4c5f4d455441535441424c455f504f4f4c5f41535345545f4d495353494e475f4f5241434c4500c800000000000000154552525f504f4f4c5f554e415554484f52495a454400c9000000000000000f4552525f504f4f4c5f45584953545300ca00000000000000134552525f504f4f4c5f4e4f545f45584953545300cb000000000000000f4552525f504f4f4c5f4c4f434b454400cc00000000000000134552525f504f4f4c5f4e4f545f4c4f434b454400cd00000000000000164552525f504f4f4c5f545950455f4d49534d4154434800ce000000000000001b4552525f504f4f4c5f494e5055545f524154494f5f47545f4f4e4500cf000000000000001e4552525f504f4f4c5f41525241595f4c454e4754485f4d49534d4154434800d0000000000000001b4552525f504f4f4c5f494e53554646494349454e545f494e50555400d1000000000000001c4552525f504f4f4c5f494e53554646494349454e545f4f555450555400d200000000000000224552525f504f4f4c5f494e53554646494349454e545f555345525f42414c414e434500d300000000000000224552525f504f4f4c5f494e53554646494349454e545f504f4f4c5f42414c414e434500d4000000000000002d4552525f504f4f4c5f4144445f4c49515549444954595f4e4f545f494e4352454153455f494e56415249414e5400d500000000000000264552525f504f4f4c5f4144445f4c49515549444954595f524543454956455f5a45524f5f4c5000d6000000000000002f4552525f504f4f4c5f4144445f52454d4f56455f4c49515549444954595f4d455441444154415f4d49534d4154434800d7000000000000001b4552525f504f4f4c5f535741505f494e56414c49445f415353455400d800000000000000274552525f504f4f4c5f535741505f45584143545f4f55545f494e53554646494349454e545f494e00d900000000000000214552525f504f4f4c5f4352454154455f504f4f4c5f5a45524f5f42414c414e434500da00000000000000204552525f504f4f4c5f4352454154455f504f4f4c5f5a45524f5f57454947485400db00000000000000274552525f504f4f4c5f4352454154455f504f4f4c5f494e56414c49445f5745494748545f53554d00dc00000000000000254552525f504f4f4c5f4352454154455f504f4f4c5f494e56414c49445f4d4554414441544100dd000000000000002a4552525f504f4f4c5f4352454154455f504f4f4c5f494e56414c49445f504f4f4c5f535741505f46454500de000000000000002c4552525f504f4f4c5f4352454154455f504f4f4c5f414d505f464143544f525f4f55545f4f465f424f554e4400df000000000000002e4552525f504f4f4c5f4352454154455f504f4f4c5f4d494e494d554d5f4c49515549444954595f4e4f545f4d455400e000000000000000244552525f504f4f4c5f57495448445241575f464545535f494e56414c49445f415353455400e1000000000000002f4552525f504f4f4c5f4352454154455f504f4f4c5f4f564552464c4f575f494e495449414c5f4c505f414d4f554e5400e2000000000000000e4552525f4445505245434154454400f401000000000000214552525f504f4f4c5f50415553455f464c41475f554e494e495449414c495a454400f501000000000000274552525f504f4f4c5f50415553455f464c41475f414c52454144595f494e495449414c495a454400f601000000000000194552525f504f4f4c5f4c49515549444954595f50415553454400f701000000000000144552525f504f4f4c5f535741505f50415553454400f801000000000000194552525f504f4f4c5f464c4153484c4f414e5f504155534544001204506f6f6c010301183078313a3a6f626a6563743a3a4f626a65637447726f7570095061757365466c6167010301183078313a3a6f626a6563743a3a4f626a65637447726f757009526174654c696d6974010301183078313a3a6f626a6563743a3a4f626a65637447726f757009537761704576656e740104000a537461626c65506f6f6c010301183078313a3a6f626a6563743a3a4f626a65637447726f75700c5765696768746564506f6f6c010301183078313a3a6f626a6563743a3a4f626a65637447726f75700e466c6173686c6f616e4576656e740104000e4d657461537461626c65506f6f6c010301183078313a3a6f626a6563743a3a4f626a65637447726f75700e53796e6352617465734576656e74010400114164644c69717569646974794576656e7401040011506f6f6c4372656174696f6e4576656e7401040014506f6f6c506172616d4368616e67654576656e7401040014526174654c696d69745570646174654576656e740104001452656d6f76654c69717569646974794576656e7401040015437265617465547761704f7261636c654576656e740104001552656d6f7665547761704f7261636c654576656e7401040015557064617465547761704f7261636c654576656e74010400195468616c6153776170506172616d4368616e67654576656e740104003805706f6f6c7301010009706f6f6c5f73697a6501010009706f6f6c5f747970650101000b6665655f62616c616e63650101000b706f6f6c5f6c6f636b65640101000b737761705f7061757365640101000c706f6f6c5f776569676874730101000d666565735f6d657461646174610101000d6f7261636c655f6578697374730101000d706f6f6c5f62616c616e6365730101000e6c705f736565645f737461626c650101000e6f7261636c655f616464726573730101000e706f6f6c5f696e76617269616e740101000e706f6f6c5f69735f737461626c650101000f706f6f6c5f616d705f666163746f7201010010666c6173686c6f616e5f706175736564010100106c69717569646974795f706175736564010100106c705f736565645f776569676874656401010010706f6f6c5f69735f776569676874656401010011666c6173686c6f616e5f6665655f62707301010011706f6f6c5f737761705f6665655f627073010100126c705f736565645f6d657461737461626c6501010012706f6f6c5f69735f6d657461737461626c6501010012737461626c655f706f6f6c5f65786973747301010012747761705f6f7261636c655f7374617475730101001361737365745f726174655f6c696d697465727301010014706f6f6c5f6173736574735f6d6574616461746101010014706f6f6c5f6c705f746f6b656e5f737570706c790101001477656967687465645f706f6f6c5f65786973747301010015706f6f6c5f6d657461737461626c655f726174657301010016696e697469616c697a65645f70617573655f666c6167010100166d657461737461626c655f706f6f6c5f65786973747301010016706f6f6c5f6c705f746f6b656e5f6d657461646174610101001761737365745f726174655f6c696d697465725f7669657701010018706f6f6c5f62616c616e6365735f6e6f726d616c697a656401010018707265766965775f72656d6f76655f6c69717569646974790101001963757272656e745f63756d756c61746976655f707269636573010100196578697374735f61737365745f726174655f6c696d697465720101001a656e61626c65645f726174655f6c696d69745f666561747572650101001a706f6f6c5f707265636973696f6e5f6d756c7469706c696572730101001a7472616465725f737761705f6665655f6d756c7469706c6965720101001c61737365745f726174655f6c696d697465725f72656d61696e696e670101001c706f6f6c5f6d657461737461626c655f6c6173745f757064617465640101001c706f6f6c5f6d657461737461626c655f6f7261636c655f6e616d65730101001c707265766965775f6164645f6c69717569646974795f737461626c650101001c707265766965775f737761705f65786163745f696e5f737461626c650101001d707265766965775f737761705f65786163745f6f75745f737461626c650101001e707265766965775f6164645f6c69717569646974795f77656967687465640101001e707265766965775f737761705f65786163745f696e5f77656967687465640101001f707265766965775f737761705f65786163745f6f75745f776569676874656401010020707265766965775f6164645f6c69717569646974795f6d657461737461626c6501010020707265766965775f737761705f65786163745f696e5f6d657461737461626c6501010020737761705f6665655f70726f746f636f6c5f616c6c6f636174696f6e5f62707301010021707265766965775f737761705f65786163745f6f75745f6d657461737461626c6501010021757365725f72656d6f76655f6c69717569646974795f77686974656c69737465640101002272656d6f76655f6c69717569646974795f77686974656c69737465645f7573657273010100000208020801050a0b0201080309020a030b010c08040e0805100806070202130b08020b020108030809180a050a02051a0b020108001b0a0b020108031c0a031d031e0a030b02021a0b020108001c0a030c02041a0b020108001e0a031b0a0b020108031c0a030d02032201230124010e02051a0b020108001b0a0b020108031c0a0326031e0a030f02022803290a031002091a0b020108001b0a0b020108032b032c032d032e032f0330031e0a031102081a0b02010800320b02010803330b02010803340435043604370438031202021d033a0a031302043c0b020108111a0b02010800320b02010803330b020108031402033e0a0815410a0442031602051a0b020108001b0a0b020108031c0a031d030a031702041a0b0201080045081546034703180203490b020108034a044b031902014d0a031a02031a0b02010800320b02010803330b020108031b0201500b080205031c020a2d0352032e03530454042f0330032b032c030a031d02041a0b020108003e0a0815410a0442031e0204570a0b02010803580b1f010b020108005b035c03200203450815460347032102093c0b020108111a0b02010800320b02010803330b0201080334043504360437043803220201600a0300000000010c0a0040020000000000000000380006d00700000000000006010000000000000012152d150b00380112122d1202030100000e0d0b010b0211040c030b000c040e0438020c050e050b03110602070100011519240a001108041e0b0001080c020b02041c11092a1510000e013803041a11090a0138040c03110c0c040e040b010b0338050206e0000000000000002706c800000000000000270b00110e0700110f0c0205071000000101010d0a001111040b11092a010f010b0038061113111402065b02000000000000271501000101010c0a001111040a11092b0110010b0038071402065b0200000000000027170100010101091118040711092b011001380802065802000000000000271a01040016110b001108040f1118030d110c0c010e0138094008000000000000000012012d01020659020000000000002706c8000000000000002718010000010311092901021101000101010a1118040811092b0110010b00380a02065802000000000000271c010401012c1f0b001108041d1118041b0a030a02111d11092a010f010a010c040c051113111e0c070b050b040b07380b0b010b020b03120f380c020658020000000000002706c800000000000000272101040115301f0b001108041d0a0106102700000000000025041b11092a150c020a021002140c030b020f020c040a010b0415070111220b030b011216380d0206ce000000000000002706c8000000000000002723000000311f0a0006010000000000000021041a080c010b010415080c020b020410080c030b03020b00066400000000000000210c03050e0a00061e00000000000000210c02050a0a00060500000000000000210c01050624010401003e570b00110804550e020e03380e0c040e04112604530a010c050e053802290004510a011127044f0a0111280c060e060e023803044d0e060e033803044b0a010a020a03112903490a010c070e0738022b001003112a0c080e080a020a031104112b0c090e090c0a0a0a112c0c0b0e0b0a010a020a033200000000000000000000000000000000320000000000000000000000000000000032000000000000000000000000000000003200000000000000000000000000000000111312092d090b0a380f0b010b020b03120b38100206900100000000000027069201000000000000270692010000000000002706cd000000000000002706ca00000000000000270692010000000000002706c800000000000000272e0100010940270a000a010a02112904250b000b010b0211032b090c0311130a0310041417350c040a031005140a031006140a0418112f0a031007140b031008140b0418112f020691010000000000002730010002000544e3010a000c020e023802290004e101113103df010a000c030e0338022b000c040a0410091403db010e0038020c050e0141150a04100a41022104d7010a01090c060c070d0738110b070c080e0841150c090a0906000000000000000024043e0d0845150c0a0b060439080c0b0b0b0c060b09060100000000000000170c0905270b0a060000000000000000240c0b05320b08461500000000000000000b0604d3010a04100a140c0c0a010c0d0d0c38120d0d38110b0c0c0e0b0d0c0f0e0e41020c090a090e0f41152104cf0105590a090600000000000000002404700d0e45020c100d0f45150a050b10380423046c0b09060100000000000000170c0905590b0401062d01000000000000270b0e460200000000000000000b0f461500000000000000000a000b04100a140a010c110c120c140e1438022b001003112a0c150b110c160b120c170e1641150e1741022104cd01401000000000000000000c180b160c190b170c1a0d1938110d1a38120b190c1b0b1a0c1c0e1b41150c0a0a0a0e1c41022104cb0105a3010a0a0600000000000000002404b8010d1b45150c1d0d1c45020c100d180e150b100b1d380544100b0a060100000000000000170c0a05a3010b1b461500000000000000000b1c460200000000000000000b180a000c1e0e1e38022a000c1f080b1f0f09150b000b0112030206020002000000000027060200020000000000270b0401060200020000000000270b0401062d01000000000000270b040106cf00000000000000270b040106cb000000000000002706f8010000000000002706ca000000000000002733010000010206e200000000000000273101000105010a110929050305090211092b05100b14023400000048430a000600000000000000000c010c020d0238120b020c030e0341020c040a0406000000000000000024041d0d0345020c050b010b0538133411360c010b04060100000000000000170c04050b0b0346020000000000000000401500000000000000000c060b000c070d0738120b070c080e0841020c040a0406000000000000000024043f0d0845020c050d06060a000000000000000a010b0538133417113744150b04060100000000000000170c04052a0b08460200000000000000000b0602380000004b3e0e0041150e01411521043c401a00000000000000000c030e000c020e010c040a0241150c050a050a0441152104360600000000000000000c060a060a052304300a020a0642150c070a040a0642150c080d030b0714350b08143518441a0b06060100000000000000160c0605160b02010b04010b03020b02010b04010602000200000000002706cf00000000000000273901040016120b0011080410113a030e110c0c010e0109090912052d050206f5010000000000002706c800000000000000273a010000010311092905023b01000105010a110929050305090211092b05100c14022901000001060b000b010b0211032909023c0100060005070c1518558d030b0113030c020c030a030c040e0438022900048b0311310389030a030c050e0538022b000c060a061009140485030e000c07400200000000000000000c080600000000000000000c090a0741100c0a0a090a0a2304300a070a0942100c0b0d080b0b113d44020b09060100000000000000160c09051f0b07010b080c0c0a0c0b06100a14210483030a03113e0c090e000c07401500000000000000000c0d0600000000000000000c0a0a0741100c0e0a0a0a0e23045b0a070a0a42100c0b0d0d0c0f0b0b113f0c100b0f0b1044150b0a060100000000000000160c0a05460b07010b0d0c110a11401500000000000000000c120c130d1338110b130c140e1441150c0a0a0a06000000000000000024048b010d1445150c0e0d120c0f0a090c100b0e350b10351832102700000000000000000000000000001a340c150b0f0b1544150b0a060100000000000000170c0a056a0b0f010604000000000000001140270b14461500000000000000000b120c160a0311410c170a170c180b020c190e1841150e19411521048103401500000000000000000c1a0b180c1b0b190c1c0d1b38110d1c38110b1b0c1d0b1c0c1e0e1d41150c090a090e1e41152104ff0205b3010a090600000000000000002404c7010d1d45150d1e45150d1a0c0f160c0a0b0f0b0a44150b09060100000000000000170c0905b3010b1d461500000000000000000b1e461500000000000000000b1a0c1f401500000000000000000c200600000000000000000c0a0e0041100c0e0a0a0a0e2304ef010e170a0a4215140e110a0a421514160e160a0a421514170c100d200b1044150b0a060100000000000000160c0a05d4010a03114203f30105fb010a030b1f11430c1f0a030b2011430c200a03112704fb02080c210b2104e5020a0311440c0a0a0311450c220b1f0a2211380c230e230b200b2211380c240e240c250a0a11460c270b250b0a11460b272604e302059d020e0338020c280b000c290b160c2a0d2938140d2a38110b290c2b0b2a0c2c0e2b41100c0a0a0a0e2c41152104e10205b5020a0a0600000000000000002404cb020d2b45100d2c45150c0e0c2d0d2d0b0e114711480a280b2d11490b0a060100000000000000170c0a05b5020b2b461000000000000000000b2c461500000000000000000a030c2e0e2e38022a000c2f090b2f0f09150a030b0311410b0c0b11120438150206020002000000000027062f01000000000000270a03114a03e902059d020a03114b0c300e1f0e30114c0c310e200e30114c0c320e320e31114d04f902059d02062f01000000000000270a0311420c210580020602000200000000002706020002000000000027062e01000000000000270b060106cc000000000000002706f8010000000000002706ca0000000000000027440100020007561b0a000c010e013802290004190a0011270415080c020b0204130e0038022b07100d140206cd00000000000000270a0011420c02050b06ca0000000000000027410100010057290a000c010e0138022b000e0038020c02100a14401500000000000000000c030c040d0438120b040c050e0541020c060a060600000000000000002404250d0545020c070d030a020b07380444150b06060100000000000000170c0605140b05460200000000000000000b03024e0100010003080b000c010e0138022b00100914024f0100030001055a270a000b0111500c020e020c03401500000000000000000c040600000000000000000c050a0341100c060a050a0623041e0a030a0542100c070d040b07113f44150b05060100000000000000160c05050d0b03010b040c080b000b0811510b0202520104010903200b001108041e0a010c040e0438022900041c0a010a020a031129041a0a010a020a0311032c09010b010b020b0312113816020691010000000000002706ca000000000000002706c8000000000000002753010400010406e2000000000000000b00012754010401055d290b0011080427113a042511092a050c020a02100b1404220601000000000000000c030a01041f0601000000000000000c040b020f0b0c050b010b0515070211220b030b041216380d020600000000000000000c0405120600000000000000000c03050e06f4010000000000002706c8000000000000002755010401055d290b0011080427113a042511092a050c020a02100c1404220601000000000000000c030a01041f0601000000000000000c040b020f0c0c050b010b0515070311220b030b041216380d020600000000000000000c0405120600000000000000000c03050e06f4010000000000002706c8000000000000002756010401055d290b0011080427113a042511092a050c020a02100e1404220601000000000000000c030a01041f0601000000000000000c040b020f0e0c050b010b0515070411220b030b041216380d020600000000000000000c0405120600000000000000000c03050e06f4010000000000002706c800000000000000275701000105010a110929050305090211092b05100e1402580100005f0b0b000b0111590c0211090c030e030b0211062900025a01000109611d0a000a010a021129041b0b000b010b0211032b090c030a031005140a031007140a031006140a031008140b0310041402069101000000000000275b01000115010511092b15100f3817025d0100040005070c6a9001113b038e010e010c02400200000000000000000c030600000000000000000c040a0241100c050a040a0523041c0a020a0442100c060d030b06113d44020b04060100000000000000160c04050b0b02010b030c070e010c02401500000000000000000c080600000000000000000c040a0241100c050a040a0523043a0a020a0442100c060d080b06113f44150b04060100000000000000160c0405290b02010b080c090a000a070a09115e0c0a0a000c0b0e0b38022b000c0c0e0038020c0d0a0c100a140c0e0b010c0f0d0e38120d0f38140b0e0c100b0f0c110e1041020c040a040e11411021048a0105630a040600000000000000002404750d104502010d1145100c120a0d0b1211490b04060100000000000000170c0405630b10460200000000000000000b11461000000000000000000b0c10100e0a101114115f0a000b070b090e0a1011140b00114112023818020b0c010602000200000000002706f60100000000000027600104040005070c6d1d0a000a010c040e0438022b00100a140b0211610c050b010b05115d0c060e06113f0b032604190b00110e0b061149020b000106d100000000000000276201000001070e001011140e0010121402630100030005076a9001113b038e010e010c02400200000000000000000c030600000000000000000c040a0241100c050a040a0523041c0a020a0442100c060d030b06113d44020b04060100000000000000160c04050b0b02010b030c070e010c02401500000000000000000c080600000000000000000c040a0241100c050a040a0523043a0a020a0442100c060d080b06113f44150b04060100000000000000160c0405290b02010b080c090a000a070a0911640c0a0a000c0b0e0b38022b000c0c0e0038020c0d0a0c100a140c0e0b010c0f0d0e38120d0f38140b0e0c100b0f0c110e1041020c040a040e11411021048a0105630a040600000000000000002404750d104502010d1145100c120a0d0b1211490b04060100000000000000170c0405630b10460200000000000000000b11461000000000000000000b0c10100e0a101114115f0a000b070b090e0a1011140b00114112023818020b0c010602000200000000002706f60100000000000027650104030005076d1d0a000a010c040e0438022b00100a140b0211610c050b010b0511630c060e06113f0b032604190b00110e0b061149020b000106d10000000000000027660100020005729d01113b039b010e010c02400200000000000000000c030600000000000000000c040a0241100c050a040a0523041c0a020a0442100c060d030b06113d44020b04060100000000000000160c04050b0b02010b030c070e010c02401500000000000000000c080600000000000000000c040a0241100c050a040a0523043a0a020a0442100c060d080b06113f44150b04060100000000000000160c0405290b02010b080c090a000a070b0911670c0a0b010e0a10121411680c0b0c0c0e0c0c02401500000000000000000c0d0600000000000000000c040a0241100c050a040a052304640a020a0442100c060d0d0b06113f44150b04060100000000000000160c0405530b02010b0d0c090e0038020c0e0b0c0c0f0d0f38140b0f0c100e1041100c040a04060000000000000000240483010d1045100c110a0e0b1111490b04060100000000000000170c0405740b10461000000000000000000a000c120e1238022b0010100e0a101114115f0a000b070b090e0a1011140b001141120238180b0b0206f60100000000000027690104020005733b0a000a010c040e0438022b00100a140b0211610c050b010b0511660c050c060e06113f0b032604370a00110e0b0611490b050c070d0738140b070c080e0841100c030a030600000000000000002404320d0845100c090a00110e0b0911490b03060100000000000000170c0305220b00010b0846100000000000000000020b000106d100000000000000276a00000015090e000e0138190c0204070b020206d70000000000000027480000011576160e00116c0c0111092a150c020a0210000e01380303130b020f000b01440211090b001149020b0201050f6d00000300070c01090a000a000b0111430b000b021143116e026e000002000778670a0011440c030a0011450c040a020b0411380c050e050a0311460c060b010c070b020c080e0741150e084115210465401500000000000000000c090b070c0a0b080c0b0d0a38110d0b38110b0a0c0c0b0b0c0d0e0c41150c0e0a0e0e0d4115210463052f0a0e0600000000000000002404450d0c45150c0f0d0d45150d090c100b0f160c0f0b100b0f44150b0e060100000000000000170c0e052f0b0c461500000000000000000b0d461500000000000000000b090a00114511380c120e120b0311460c130a130a062404610b00116f4d0b130a0617180b061a340206d40000000000000027060200020000000000270602000200000000002770000001007a130e010a0011410c020e020b00116f11710c030c040a040600000000000000002404110b040b030206d5000000000000002772000001157c240a010c020b00350b02351832102700000000000000000000000000001a340c030a030c0411730c050b04350b05351832102700000000000000000000000000001a340c060b010a03170b030b060206040000000000000011402706040000000000000011402774000001157d2e0a010c020610270000000000000b00170c000a0006000000000000000022042b0b02353210270000000000000000000000000000180b00351a340c030a030b01170c0411730c050a040c060b05350b06351832102700000000000000000000000000001a340c070b030b040b0702060400000000000000114027060400000000000000114027750000007e110b000b0111380c030e030b0211460c040a044affffffffffffffff00000000000000000000000000000000000000000000000025040f0b04340206e10000000000000027760000010080013f0a00116f0c020b0011410c030e030c04401500000000000000000c050600000000000000000c060a0441150c070a060a0723043b0a040a0642150d050c08140c090a010c0a0a020c0b0a0b0600000000000000002204340b09350b0a35180b0b351a340c0c0b080b0c44150b06060100000000000000160c06050f0b04010b08010604000000000000001140270b04010b05027700000300070c3f110a000a010a020a000b030b0111780a000b04114311790c010b000b010b02117a027900000200078501290a0011440b0011450c050e050a014215140c060e050a024215140c070b03350b0635180c080b010b020a080b040b0511380c090e09117b0c0a0a0a0b07351a340c010b080b0a0b01027c00000200188801200a0011410c040a000c050e0538022b181013140c060b010a020b030e040e06117d0c010a010b0011410c070e070b0242151423041e0b010206d300000000000000277e00000300070c3f110a000a010a020a000b030b0211780a000b041143117f0c020b000b020b01117a027f000002000789013b0a000c050a020c060a030b0511410c070e070b064215142304390a0011440b0011450c080b040a0811380c090e090c0a0e080a014215140c0b0e080a024215140c0c0b03350b0c35180c0d0b010b020a0d0b0a1180010c0e0a0e0b0b351a340c060b0e0b0d0b060206d30000000000000027810100000200188a01200a000c040a020c050a030b0411410c060e060b0542151423041e0e0038022b181013140c070b0011410c080b010b020b030e080e071182010206d30000000000000027830100000093017d0a0206640000000000000024047b110c0c050e050b03112b0c060e06112c0c070e07110e0c080e000c09400200000000000000000c0a0600000000000000000c0b0a0941100c0c0a0b0a0c23042a0a090a0b42100c0d0d0a0b0d113d44020b0b060100000000000000160c0b05190b09010b0a0c0e0b000c0f0d0f38140b0f0c100e1041100c0b0a0b0600000000000000002404460d1045100c110a080b1111490b0b060100000000000000170c0b05370b10461000000000000000000e06381a0705112207061122310807071122070711221185010e061186010c120e061187010c130e061188010c140e120b02115f0c150d1506640000000000000011470c110b080b1111490e070e061189010b0e0b040b01090b120b130b1412002d000e06381b0c160b070b160b150206df00000000000000278a010100010003080b000c010e0138022b00101414028b01010001159e01c6020b00110804c4020e010c04400200000000000000000c050600000000000000000c060a0441100c070a060a0723041d0a040a0642100c080d050b08113d44020b06060100000000000000160c06050c0b04010b050c090a02112304c2020a093166118c0104c0020a030600000000000000002404bd020a03061027000000000000250c0a0b0a04bb020a090a02118d0103b9020a09402e00000000000000000c0b0c0c0d0c38120b0c0c0d0e0d41020c060a0606000000000000000024046c0d0d45020d0b0c0e0c0f0a0f118e010c100e10381c04650d10381d1191010c110a1111920104610b110c120b0e0b12442e0b06060100000000000000170c0605410b0e0106bc02000000000000270e0f381e0c130e13381f0c1105540b0d460200000000000000000b0b0c140e010c04401500000000000000000c150600000000000000000c060a0441100c070a060a0723048a010a040a0642100c080d150b08113f44150b06060100000000000000160c0605790b04010b150c160a160c170d1738110b170c180e1841150c060a060600000000000000002404a7010d1845150600000000000000002404a5010b06060100000000000000170c0605970106d900000000000000270b18461500000000000000000a14401a00000000000000000c190c1a0d1a38200b1a0c1b0e1b412e0c060a060600000000000000002404c5010d1b452e0c120d190b12119401119501441a0b06060100000000000000170c0605b4010b1b462e00000000000000000b190c1c0a160c1d0a1c0c1e0e1d41150e1e411a2104b702401500000000000000000c1f0b1d0c200b1e0c210d2038110d2138210b200c220b210c230e2241150c060a060e23411a2104b50205ea010a06060000000000000000240481020d2245150c070d23451a0c240d1f0b241196010b073511970111980144150b06060100000000000000170c0605ea010b22461500000000000000000b23461a00000000000000000b1f0a0911340c250a250a0311750c070a090a021199010c260b010a020b070b2631661183010c270c280c290e290b140b1c1113120c2d0c0e290b030b2512072d0711092a150f0f0a2838220a280b090b160e27113f0b02120d38230b280b2702060200020000000000270602000200000000002706c9000000000000002706de0000000000000027090c0a053006dc000000000000002706dd000000000000002706c800000000000000279b0101040115a001110a000b010b0211610c050a000b050b030b04118b010c06010b00110e0b061149029c0101000115a201a1010e000c03400200000000000000000c040600000000000000000c050a0341100c060a050a0623041a0a030a0542100c070d040b07113d44020b05060100000000000000160c0505090b03010b040c080e000c03401500000000000000000c090600000000000000000c050a0341100c060a050a062304380a030a0542100c070d090b07113f44150b05060100000000000000160c0505270b03010b090c0a0a011123049f010a083164118c01049d010a0206000000000000000024049a010a02061027000000000000250c0b0b0b0498010a080a0111580396010a0a0c0c0d0c38110b0c0c0d0e0d41150c050a0506000000000000000024046a0d0d45150600000000000000002404680b05060100000000000000170c05055a06d900000000000000270b0d461500000000000000000a0811340c0e0a0a0a0e0a0211750c050a080a0111590c0f0b000a010b050b0f31641183010c100c110c120e120b020b0e12072d0711092a150f0f0a1138220a110b080b0a0e10113f0b01120d38230b110b100206c9000000000000002706de0000000000000027090c0b054b06dc000000000000002706dd00000000000000279d0101040115100e0a000b010b0211610b030b04119c010c05010b00110e0b051149029e0101000115a501d6010a02112304d4010e000c03400200000000000000000c040600000000000000000c050a0341100c060a050a0623041d0a030a0542100c070d040b07113d44020b05060100000000000000160c05050c0b03010b040c080a083165118c0104d2010a080a010a02119f0103d0010e010c090600000000000000000c050a0941150c060a050a062304450a090a054215140600000000000000002404410b05060100000000000000160c0505310b090106da00000000000000270b09010a010600000000000000000c050c0a0d0a38110b0a0c0b0e0b41150c060a060600000000000000002404620d0b45150c0c0b050b0c160c050b06060100000000000000170c0605520b0b461500000000000000000b050664000000000000002104ce010e000c03401500000000000000000c0d0600000000000000000c050a0341100c060a050a06230482010a030a0542100c070d0d0b07113f44150b05060100000000000000160c0505710b03010b0d0c0e0e0e0c090600000000000000000c050a0941150c060a050a062304a1010a090a0542151406000000000000000024049d010b05060100000000000000160c05058d010b090106d900000000000000270b09010e0e0c090e010c0f0b090b0f114c1198010c050a080a010a0211a0010c100b000a020b050b1031651183010c110c120c130e130b0112182d1811092a150f0f0a1238220a120b080b0e0e11113f0b02120d38230b120b110206db000000000000002706c9000000000000002706dc000000000000002706dd0000000000000027a10101040115100e0a000b010b0211610b030b04119e010c05010b00110e0b051149027a000002000c1a160a00114204140a0011a2010e0038022a0c10150b02421a140c030b0111a3010b0311960111a40111a5010206cd000000000000002768000000a1011d401000000000000000000c020600000000000000000c030e0041100c040a030a0423041a0d020d000a0343100e010a03421514114744100b03060100000000000000160c0305070b000b0202a601010000010411090b00380402a70101000115010511092b1510001402a801000000a90120401a00000000000000000c010b000c020d0238200b020c030e03412e0c040a0406000000000000000024041c0d03452e0c050d010b05119401119501441a0b04060100000000000000170c04050b0b03462e00000000000000000b01029101000000ae01200e0011a9010c010e01381f0c020e020601000000000000000e0211aa0111ab010c030d030708112211ac010d030e0011ad01112211ac010d030708112211ac010d030e0011ae01112211ac010b0302510000020001b001380b0011280c020b010c030d0238120d0338110b020c040b030c050e0441020c060a060e05411521043605160a060600000000000000002404310d0445020c070d0545150c080a0711110324052c11092a010f010b07380611130b0811af010b06060100000000000000170c0605160b04460200000000000000000b054615000000000000000002060200020000000000279901010000b20126404600000000000000000c020d02070938240b000c030d0338120b030c040e0441020c050a0506000000000000000024041e0d0445020c060d020e06382538240b05060100000000000000170c05050e0b04460200000000000000000d020e01382638240b020259010000b20126404600000000000000000c020d02070a38240b000c030d0338120b030c040e0441020c050a0506000000000000000024041e0d0445020c060d020e06382538240b05060100000000000000170c05050e0b04460200000000000000000d020e01382638240b0202a001010000b301470e0041020e014115210445404600000000000000000c030d03070b38240b000c040b010c050d0438120d0538110b040c060b050c070e0641020c080a080e07411521044305200a080600000000000000002404390d0645020d0745150c090c0b0b090c0c0d030e0b382538240d030e0c382638240b08060100000000000000170c0805200b06460200000000000000000b07461500000000000000000d030e02382638240b03020602000200000000002706cf00000000000000278d010100005f0b0b000b011199010c0211090c030e030b021106290002040000000a0f404600000000000000000c020d02070c38240d020e00382538240d020e01382538240b0202280100010003080b000c010e0138022b00100a1402b2010100020007561b0a000c010e013802290004190a0011270415080c020b0204130a0011410b00114511380206cd00000000000000270a0011420c02050b06ca0000000000000027b30101000300070cb4012b0a000c010e013802290004290a0011270425080c020b0204230a001127041d0a0011410c030b030a00114511380c040e040b0011441146020a000a00114111430c03051306cd00000000000000270a0011420c02050b06ca0000000000000027420100010001050b00118a0131662102270100010001050b00118a01316421024a0100010001050b00118a0131652102b4010100010003080b000c010e0138022b00101011b501026f01000100b601090b0011b40138270c010e01320000000000000000000000000000000038283402b801010002000c03130a000c010e013802290004110a001142040f0e0038022b0c1016140206cd000000000000002706ca0000000000000027b9010100010c01060e0038022b0c10171402ba010100010c01070e0038022b0c10171411a80102450100020007561b0a000c010e013802290004190a0011270415080c020b0204130e0038022b071018140206cd00000000000000270a0011420c02050b06ca0000000000000027bb010100010003080b000c010e0138022b00100a4102023e0100010003080b000c010e0138022b00101914024b010002001803130a000c010e013802290004110a00114a040f0e0038022b181013140206cd000000000000002706ca00000000000000275e01000300070c010d0a000b010a02316611bc010a000b020b001141116d40150000000000000000120a02640100020007010d0a000b010a02316411bc010a000b020b001141116e40150000000000000000120a026701000100150a0a000b010a02316511bc010b000b021170120a02bd010100010001090a000b010a0211be010b000b021176121002bf0101000500070c1215be01330a000b010b020b04316611c0010c050c060c070a050a0311720c080c090c0a0a000a070a060a0a0a00114111770c0b0c0c0c0d0a060c0e0a0b0b0011410c0f0e0f0b0e4215142304310b030b0a0b0b0b0d0b0c0b090b080b070b060b0512130206d30000000000000027c10101000400071215be01330a000b010b020b04316411c0010c050c060c070a050a0311720c080c090c0a0a000a070a060a0a0a00114111790c0b0c0c0c0d0a060c0e0a0b0b0011410c0f0e0f0b0e4215142304310b030b0a0b0b0b0d0b0c0b090b080b070b060b0512130206d30000000000000027c201010004001215187c210a000b010b020b04316511c0010c050c060c070a050a0311720c080c090c0a0b000a070a060a0a117c0c0b0b030b0a0b0b320000000000000000000000000000000032000000000000000000000000000000000b090b080b070b060b05121302c30101000500070c1215bf01250a000b010b020b04316611c0010c050c060c070a0011410c080b000a070a060a030b08117e0c090c0a0c0b0a050a0911740c0c0c0d0b090b030b0b0b0a0b0d0b0c0b070b060b05121302c40101000400071215bf01250a000b010b020b04316411c0010c050c060c070a0011410c080b000a070a060a030b08117f0c090c0a0c0b0a050a0911740c0c0c0d0b090b030b0b0b0a0b0d0b0c0b070b060b05121302c50101000400121518c0011f0a000b010b020b04316511c0010c050c060c070b000a070a060a031181010c080a050a0811740c090c0a0b080b03320000000000000000000000000000000032000000000000000000000000000000000b0a0b090b070b060b05121302c601010403000105c3017c0a030600000000000000002404780a00110e0a0238040a032604740e0441150a0111bb012104700a000b020b0338050c060a000b010b0611c7010c070e070c080e040c050a0841100c090a090a0541152104680600000000000000000c0a0a0a0a092304460a080a0a42100a050a0a42150c0b113f0b0b1426043e0b0a060100000000000000160c0a05290b00010b08010b050106d100000000000000270b08010b05010b070c0c0d0c38140b0c0c0d0e0d41100c0a0a0a0600000000000000002404630d0d45100c060a00110e0b0611490b0a060100000000000000170c0a05530b00010b0d46100000000000000000020b00010b08010b0501060200020000000000270b000106cf00000000000000270b000106d200000000000000270b000106d00000000000000027500000020005c60174113b03720e01113d0c020e01113f0c030a000b020a0311bd010c040a000a0011280e04101a140c050c060c080e0838022b001003112a0c090b050c0a0b060c0b0e0a41150e0b4102210470401000000000000000000c0c0b0a0c0d0b0b0c0e0d0d38110d0e38120b0d0c0f0b0e0c100e0f41150c110a110e10410221046e053d0a110600000000000000002404520d0f45150c120d1045020c020d0c0e090b020b12380544100b11060100000000000000170c11053d0b0f461500000000000000000b10460200000000000000000b0c0a000c130e1338022b000c140a14101b0b0111c8010a000b14100a140e04101a140b030b0011411206382902060200020000000000270602000200000000002706f60100000000000027c90101000001040e00101a1402c7010100030001055a321118042e0a010b0211500c030e030c04401500000000000000000c050600000000000000000c060a0441100c070a060a072304200a040a0642100c080d050b08113f44150b06060100000000000000160c06050f0b04010b050c090b00110e11ca010429052c0b010b0911510b03020b000106580200000000000027cb0101000101010511092b01101c1402cc0101040105010f113a040305050a0011390a000a0111550a000a0111560b000b01115402cd010104020007ca01410b001108043f0a0206000000000000000024043c0a02061027000000000000250c030b03043a0a010c040e043802290004380a0111270434080c050b0504320a010c060e0638022a070c070a07100d140c080b070f0d0c090a020b09150b01070d11220b080b02120e382a0206cd00000000000000270a0111420c05051806ca000000000000002706de0000000000000027090c03050b06c80000000000000027ce0101040112cc014c0b001108044a0e0141080e02411521044811092a120c030b010c040b020c050d04382b0d0538110b040c060b050c070e0641080c080a080e07411521044405210a0806000000000000000024043d0d0645080c090d0745150c0a0a0a0610270000000000002504390a030f1d0b090b0a382c0b08060100000000000000170c0805210b030106ce00000000000000270b03010b06460800000000000000000b0746150000000000000000020b03010602000200000000002706cf000000000000002706c800000000000000277301000115010511092b1510021402cf010100060005070c1215cf0157115703530e02113d0c040e02113f0c050a0506000000000000000024044f0a010b040a030b050b00110e382d11bf010c060d020e06101e14114711480a010b020c070c080e0838020b0711490a010b030c090e06101f140c0a0c0b0e0b38022b001003112a0c0c0e0c0b090b0a38050a010a0111280e061020140e061021140e061022140e06101f140e061023140e06101e140b0111411208382e020b000106d000000000000000270b000106f70100000000000027d1010104060005070c1215d1012c0a030600000000000000002404280a00110e0a0238040a032604240a000b020b0338050c060a000b010b060b0411cf010c070e07113f0b052604200b00110e0b071149020b000106d100000000000000270b000106d200000000000000270b000106d00000000000000027d201010006000507091215cf01611157035d0e02113d0c040e02113f0c050a050600000000000000002404590a010a040a030b050b00110e382d11c1010c060d020e06101e14114711480a010b020c070c080e0838020b0711490a010a030c090e06101f140c0a0c0b0e0b38022b001003112a0c0c0e0c0b090b0a38050a010b040b030e061024140e0610251411d3010a010a0111280e061020140e061021140e061022140e06101f140e061023140e06101e140b0111411208382e020b000106d000000000000000270b000106f70100000000000027d401010406000507091215d1012c0a030600000000000000002404280a00110e0a0238040a032604240a000b020b0338050c060a000b010b060b0411d2010c070e07113f0b052604200b00110e0b071149020b000106d100000000000000270b000106d200000000000000270b000106d00000000000000027d5010100050005121518cf0155115703510e02113d0c040e02113f0c050a0506000000000000000024044d0a010b040a030a050b00110e382d11c2010c060d020e06101e14114711480a010b020c070c080e0838020b0711490a010b030c090e06101f140c0a0c0b0e0b38022b001003112a0c0c0e0c0b090b0a38050a010a0111280e061020140e061021140b050e06101f140e061023140e06101e140b0111411208382e020b000106d000000000000000270b000106f70100000000000027d6010104050005121518d1012c0a030600000000000000002404280a00110e0a0238040a032604240a000b020b0338050c060a000b010b060b0411d5010c070e07113f0b052604200b00110e0b071149020b000106d100000000000000270b000106d200000000000000270b000106d00000000000000027d7010100060005070c1215d4016e1157036a0a040600000000000000002404660e02113d0c050e02113f0c060a060600000000000000002404620a010b050a030b040b00110e382d11c3010c070e071022140a062504600d020b060e071022141711470d020e07101e14114711480a010b020c080c090e0938020b0811490a010b030c0a0e07101f140c0b0c0c0e0c38022b001003112a0c0d0e0d0b0a0b0b38050a010a0111280e071020140e071021140e071022140e07101f140e071023140e07101e140b0111411208382e0206d800000000000000270b000106d000000000000000270b000106d000000000000000270b000106f70100000000000027d8010104060005070c1215d101290a050600000000000000002404250a00110e0a0238040a032604210a000b020b0338050c060a000b010b060b040b0511d7010c070c060a00110e0b0611490b00110e0b071149020b000106d200000000000000270b000106d00000000000000027d901010006000507091215d40178115703740a040600000000000000002404700e02113d0c050e02113f0c060a0606000000000000000024046c0a010a050a030b040b00110e382d11c4010c070e071022140a0625046a0d020b060e071022141711470d020e07101e14114711480a010b020c080c090e0938020b0811490a010a030c0a0e07101f140c0b0c0c0e0c38022b001003112a0c0d0e0d0b0a0b0b38050a010b050b030e071024140e0710251411d3010a010a0111280e071020140e071021140e071022140e07101f140e071023140e07101e140b0111411208382e0206d800000000000000270b000106d000000000000000270b000106d000000000000000270b000106f70100000000000027da01010406000507091215d101290a050600000000000000002404250a00110e0a0238040a032604210a000b020b0338050c060a000b010b060b040b0511d9010c070c060a00110e0b0611490b00110e0b071149020b000106d200000000000000270b000106d00000000000000027db010100050005121518d4016c115703680a040600000000000000002404640e02113d0c050e02113f0c060a060600000000000000002404600a010b050a030a040b00110e382d11c5010c070e071022140a0625045e0d020b060e071022141711470d020e07101e14114711480a010b020c080c090e0938020b0811490a010b030c0a0e07101f140c0b0c0c0e0c38022b001003112a0c0d0e0d0b0a0b0b38050a010a0111280e071020140e071021140e071022140b040e071023140e07101e140b0111411208382e0206d800000000000000270b000106d000000000000000270b000106d000000000000000270b000106f70100000000000027dc010104050005121518d101290a050600000000000000002404250a00110e0a0238040a032604210a000b020b0338050c060a000b010b060b040b0511db010c070c060a00110e0b0611490b00110e0b071149020b000106d200000000000000270b000106d00000000000000027dd01010000011f0e001022140e001026140e00101f140e001024140e001025140e001023140e00101e140e001020140e001021140e0010271402a2010000010cd701250e0038022a0c0c0111130a0110161421040d0b01010211130a010f16150a0110171411a8010a010f15150b000a011017140a011015140b011016141214382f02de0100000112d8011511092b120c020a02101d0a00383004110b02101d0b003831140b0106102700000000000011df01020b02010b0102e00101000112150a11092b12101d0b000610270000000000000c010e0138321402e2010104011511150a001108040f0b0001080c020b02040d11a7010b0111e3010206c800000000000000270b00110e0700110f0c020507e4010104011501050a000b00110e11e20102e301000000dd01280b000c020d0238120b020c030e0341020c040a040600000000000000002404250d0345020c0511090a0538040c060a060600000000000000002403190520110c0c070e070b050a010b0638330b04060100000000000000170c0405090b034602000000000000000002e60101040011150a001108040f0b0001080c030b03040d0b020b0111e3010206c800000000000000270b00110e0700110f0c030507e70101040101e101580b0011080456111804540b010c030d03382b0b030c040e0441080c050a050600000000000000002404290d0445080c0611092a010c070a07101c0e06383403260b070f1c0b0644080b05060100000000000000170c05050e0b070105210b04460800000000000000000b020c080d08382b0b080c090e0941080c050a050600000000000000002404510d0945080c0a11092a010c070a07101c0e0a38350c0b044e0b070f1c0b0b3836010b05060100000000000000170c0505340b070105490b0946080000000000000000020658020000000000002706c80000000000000027d30100000109e301780e010e02380e0c050e051126046f0b010c060b020c070b030c080b040c090a000a060a0711290315020a080a0911e9010b090b0811e9010b000b060b0711030c0a0a0a2a090c0b11130c0c0a0c0a0b10041417350c0d0a0b1005140a0b1006140a0d18112f0a0b0f05150a0b1007140a0b1008140b0d18112f0a0b0f07151195010a0b0f06151195010a0b0f08150a0b0f040c0e0b0c0b0e150b0a38370a0b1028140a0b1029140a0b102a140a0b1005140a0b1007140a0b1006140a0b1008140b0b10041412173838020b020c060b010c070b040c080b030c09050f78000002000c01140a00114204120a0011a2010e0038022b0c10150b02421a141196010b013511970111a5010206cd000000000000002743000002000ce4014d0a001142044b0a0011a2010e0038022b0c0b010c021015140c030e0241150e03411a210449401500000000000000000c040b020c050b030c060d0538110d0638210b050c070b060c080e0741150c090a090e08411a210447052a0a090600000000000000002404410d0745150c0a0d08451a0c0b0d040b0b1196010b0a3511970111a50144150b09060100000000000000170c09052a0b07461500000000000000000b08461a00000000000000000b0402060200020000000000270602000200000000002706cd0000000000000027ca0101000101010611092b01101c0e00383402bc0100000100e501490a000c040e043802290004470b000c050e0538022b000c060a0610091403430a061014140a0321043f0b010b06100a1421043d0b033165210321053c0b020c070d0738110b070c080e0841150c090a0906000000000000000024043a0d0845150600000000000000002404380b09060100000000000000170c09052a06d000000000000000270b08461500000000000000000206d600000000000000270b060106cd00000000000000270b060106cb000000000000002706ca00000000000000278c01000000e60185010e0041020c020a0206020000000000000023040909020a013164210482010a02060600000000000000240c030b030476080c040b04046a080c050b05041d09020600000000000000000c060a060a02060100000000000000172304390e000a0642020e000a06060100000000000000164202380e0c090e091126033409020b06060100000000000000160c06051f0a013164210465080c0a0b0a034205630600000000000000000c060a060a0223034905630e000a0642021438130c0b0a0b310c24045e080c0c0b0c045909020b06060100000000000000160c0605440b0b3106230c0c055508020b013166210c0a053f0a0131652104730a02060400000000000000240c050519090c0505190a01316621047f0a02060400000000000000240c040515090c040515090c030511be0100000100e701250a000c030e033802290004230b000c040e0438022b000c050a05100914031f0b010b05101011b50121041d0b0206000000000000000024041b0206d0000000000000002706d600000000000000270b050106cb000000000000002706ca0000000000000027c0010000020012e801480a000c050e053802290004460b000c060e0638022b000c070a0710091403420a071014140b0421043e0a010a0222043a0a07100a140b01116a0c080a07100a140b02116a0c090e03383904350e03383a140b0710191411de010c0a0b080b090b0a020b071019140c0a05310b070106d700000000000000270b070106cd00000000000000270b070106cb000000000000002706ca00000000000000279f010100005f0c0b000b010b0211a0010c0311090c040e040b03110629000261000000e9014e401000000000000000000c030b010c040b020c050d0438120d0538110b040c060b050c070e0641020c080a080e07411521044a05170a080600000000000000002404420d0645020c090d0745150c0a0a0a06000000000000000022043d0a00110e0a0938040a0a2604390a000b090b0a38050c0b0d030b0b44100b08060100000000000000170c0805170b000106d200000000000000270d030b09383b441005340b00010b06460200000000000000000b07461500000000000000000b03020b000106020002000000000027150001001502000009070903090509040906000400010502050107000500150100050a000a01180000020c010c020c00070100031000000701011200130613021307130813001305130313041301130909000901090200","abi":{"address":"0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5","name":"pool","friends":[],"exposed_functions":[{"name":"oracle_address","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["address"]},{"name":"withdraw_fee","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"asset_rate_limiter_view","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["0x87978b35bf1eb73ae6cf04cfedcaa1f48254a683ebd00a21e7516a991edae3ac::rate_limiter::RateLimiter"]},{"name":"asset_rate_limiters","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["0x1::simple_map::SimpleMap<0x1::object::Object<0x1::fungible_asset::Metadata>, 0x87978b35bf1eb73ae6cf04cfedcaa1f48254a683ebd00a21e7516a991edae3ac::rate_limiter::RateLimiter>"]},{"name":"enable_rate_limit_feature","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"enabled_rate_limit_feature","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"exists_asset_rate_limiter","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["bool"]},{"name":"set_asset_rate_limit","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x1::fungible_asset::Metadata>","u128","u64"],"return":[]},{"name":"set_swap_fee_protocol_allocation_bps","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","u64"],"return":[]},{"name":"create_oracle","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":[]},{"name":"current_cumulative_prices","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["u128","u128"]},{"name":"flashloan","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>"],"return":["vector<0x1::fungible_asset::FungibleAsset>","0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Flashloan"]},{"name":"flashloan_fee_bps","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["u64"]},{"name":"flashloan_paused","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"init_pause_flag","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"initialized_pause_flag","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"liquidity_paused","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"oracle_exists","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["bool"]},{"name":"pay_flashloan","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["vector<0x1::fungible_asset::FungibleAsset>","0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Flashloan"],"return":[]},{"name":"pool_amp_factor","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u64"]},{"name":"pool_balances","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<u64>"]},{"name":"pool_locked","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["bool"]},{"name":"remove_liquidity","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset"],"return":["vector<0x1::fungible_asset::FungibleAsset>"]},{"name":"remove_oracle","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":[]},{"name":"set_flashloan_fee_bps","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","u64"],"return":[]},{"name":"set_pause_flashloan","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"set_pause_liquidity","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"set_pause_swap","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"swap_paused","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"stable_pool_exists","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","u64"],"return":["bool"]},{"name":"twap_oracle_status","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["u128","u128","u128","u128","u64"]},{"name":"pools","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["vector<0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>>"]},{"name":"add_liquidity_metastable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::fungible_asset::FungibleAsset>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"add_liquidity_metastable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"add_liquidity_preview_info","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::AddLiquidityPreview"],"return":["u64","vector<u64>"]},{"name":"add_liquidity_stable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::fungible_asset::FungibleAsset>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"add_liquidity_stable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"add_liquidity_weighted","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::fungible_asset::FungibleAsset>"],"return":["0x1::fungible_asset::FungibleAsset","vector<0x1::fungible_asset::FungibleAsset>"]},{"name":"add_liquidity_weighted_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"pool_type","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u8"]},{"name":"create_pool_metastable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","vector<0x1::fungible_asset::FungibleAsset>","u64","u64"],"return":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset"]},{"name":"create_pool_metastable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64","u64"],"return":[]},{"name":"create_pool_stable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["vector<0x1::fungible_asset::FungibleAsset>","u64","u64"],"return":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset"]},{"name":"create_pool_stable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64","u64"],"return":[]},{"name":"create_pool_weighted","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["vector<0x1::fungible_asset::FungibleAsset>","vector<u64>","u64"],"return":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset"]},{"name":"create_pool_weighted_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","vector<u64>","u64"],"return":[]},{"name":"fee_balance","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["u64"]},{"name":"fees_metadata","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"]},{"name":"lp_seed_metastable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","u64"],"return":["vector<u8>"]},{"name":"lp_seed_stable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","u64"],"return":["vector<u8>"]},{"name":"lp_seed_weighted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64"],"return":["vector<u8>"]},{"name":"metastable_pool_exists","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","u64"],"return":["bool"]},{"name":"pool_assets_metadata","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"]},{"name":"pool_balances_normalized","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<u128>"]},{"name":"pool_invariant","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u256"]},{"name":"pool_is_metastable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["bool"]},{"name":"pool_is_stable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["bool"]},{"name":"pool_is_weighted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["bool"]},{"name":"pool_lp_token_metadata","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["0x1::object::Object<0x1::fungible_asset::Metadata>"]},{"name":"pool_lp_token_supply","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u64"]},{"name":"pool_metastable_last_updated","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u64"]},{"name":"pool_metastable_oracle_names","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<0x1::string::String>"]},{"name":"pool_metastable_rates","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<u128>"]},{"name":"pool_precision_multipliers","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<u64>"]},{"name":"pool_size","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u64"]},{"name":"pool_swap_fee_bps","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["u64"]},{"name":"pool_weights","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"],"return":["vector<u64>"]},{"name":"preview_add_liquidity_metastable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::AddLiquidityPreview"]},{"name":"preview_add_liquidity_stable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::AddLiquidityPreview"]},{"name":"preview_add_liquidity_weighted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::AddLiquidityPreview"]},{"name":"preview_remove_liquidity","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::RemoveLiquidityPreview"]},{"name":"preview_swap_exact_in_metastable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"preview_swap_exact_in_stable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"preview_swap_exact_in_weighted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"preview_swap_exact_out_metastable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"preview_swap_exact_out_stable","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"preview_swap_exact_out_weighted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::option::Option<address>"],"return":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"]},{"name":"remove_liquidity_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","vector<u64>"],"return":[]},{"name":"remove_liquidity_preview_info","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::RemoveLiquidityPreview"],"return":["vector<u64>"]},{"name":"remove_liquidity_whitelist_overrides","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset"],"return":["vector<0x1::fungible_asset::FungibleAsset>"]},{"name":"remove_liquidity_whitelisted_users","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["vector<address>"]},{"name":"set_pause_thalaswap","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","bool"],"return":[]},{"name":"set_stable_pool_amp_factor","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","u64"],"return":[]},{"name":"set_swap_fee_multipliers","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<u64>"],"return":[]},{"name":"swap_fee_protocol_allocation_bps","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":[],"return":["u64"]},{"name":"swap_exact_in_metastable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_in_metastable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_in_stable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_in_stable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_in_weighted","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>"],"return":["0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_in_weighted_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_metastable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":["0x1::fungible_asset::FungibleAsset","0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_out_metastable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_stable","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":["0x1::fungible_asset::FungibleAsset","0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_out_stable_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_weighted","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::fungible_asset::FungibleAsset","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":["0x1::fungible_asset::FungibleAsset","0x1::fungible_asset::FungibleAsset"]},{"name":"swap_exact_out_weighted_entry","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_preview_info","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::SwapPreview"],"return":["u64","u64","u64","u128","u128","u64","u64","u64","u64","u64"]},{"name":"trader_swap_fee_multiplier","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["u64"]},{"name":"transfer_all_fees","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address"],"return":[]},{"name":"transfer_all_fees_to_manager","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer"],"return":[]},{"name":"transfer_fees_list","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","address","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"],"return":[]},{"name":"update_rate_limit_whitelist_users","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<address>","vector<address>"],"return":[]},{"name":"user_remove_liquidity_whitelisted","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["address"],"return":["bool"]},{"name":"weighted_pool_exists","visibility":"public","is_entry":false,"is_view":true,"generic_type_params":[],"params":["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64"],"return":["bool"]}],"structs":[{"name":"Pool","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"extend_ref","type":"0x1::object::ExtendRef"},{"name":"assets_metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"pool_type","type":"u8"},{"name":"swap_fee_bps","type":"u64"},{"name":"locked","type":"bool"},{"name":"lp_token_mint_ref","type":"0x1::fungible_asset::MintRef"},{"name":"lp_token_transfer_ref","type":"0x1::fungible_asset::TransferRef"},{"name":"lp_token_burn_ref","type":"0x1::fungible_asset::BurnRef"}]},{"name":"RateLimit","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"asset_rate_limiters","type":"0x1::smart_table::SmartTable<0x1::object::Object<0x1::fungible_asset::Metadata>, 0x87978b35bf1eb73ae6cf04cfedcaa1f48254a683ebd00a21e7516a991edae3ac::rate_limiter::RateLimiter>"},{"name":"whitelisted_users","type":"vector<address>"}]},{"name":"AddLiquidityEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"amounts","type":"vector<u64>"},{"name":"minted_lp_token_amount","type":"u64"},{"name":"pool_balances","type":"vector<u64>"}]},{"name":"Flashloan","is_native":false,"is_event":false,"abilities":[],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"amounts","type":"vector<u64>"}]},{"name":"FlashloanEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"pool_balances","type":"vector<u64>"},{"name":"metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"amounts","type":"vector<u64>"}]},{"name":"PauseFlag","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"swap_paused","type":"bool"},{"name":"liquidity_paused","type":"bool"},{"name":"flashloan_paused","type":"bool"}]},{"name":"RemoveLiquidityEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"amounts","type":"vector<u64>"},{"name":"burned_lp_token_amount","type":"u64"},{"name":"pool_balances","type":"vector<u64>"}]},{"name":"StablePool","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"amp_factor","type":"u64"},{"name":"precision_multipliers","type":"vector<u64>"}]},{"name":"SwapEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"idx_in","type":"u64"},{"name":"idx_out","type":"u64"},{"name":"amount_in","type":"u64"},{"name":"amount_out","type":"u64"},{"name":"total_fee_amount","type":"u64"},{"name":"protocol_fee_amount","type":"u64"},{"name":"pool_balances","type":"vector<u64>"}]},{"name":"TwapOracle","is_native":false,"is_event":false,"abilities":["drop","store","key"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata_x","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"metadata_y","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"cumulative_price_x","type":"u128"},{"name":"cumulative_price_y","type":"u128"},{"name":"spot_price_x","type":"u128"},{"name":"spot_price_y","type":"u128"},{"name":"timestamp","type":"u64"}]},{"name":"AddLiquidityPreview","is_native":false,"is_event":false,"abilities":["drop"],"generic_type_params":[],"fields":[{"name":"minted_lp_token_amount","type":"u64"},{"name":"refund_amounts","type":"vector<u64>"}]},{"name":"CreateTwapOracleEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"oracle_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::TwapOracle>"},{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata_x","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"metadata_y","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"}]},{"name":"MetaStablePool","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"oracle_names","type":"vector<0x1::string::String>"},{"name":"rates","type":"vector<u128>"},{"name":"last_updated","type":"u64"}]},{"name":"PoolCreationEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"amounts","type":"vector<u64>"},{"name":"minted_lp_token_amount","type":"u64"},{"name":"swap_fee_bps","type":"u64"}]},{"name":"PoolParamChangeEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"name","type":"0x1::string::String"},{"name":"prev_value","type":"u64"},{"name":"new_value","type":"u64"}]},{"name":"RateLimitUpdateEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"asset_metadata","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"window_max_qty","type":"u128"},{"name":"window_duration_seconds","type":"u64"}]},{"name":"RemoveLiquidityPreview","is_native":false,"is_event":false,"abilities":["drop"],"generic_type_params":[],"fields":[{"name":"withdrawn_amounts","type":"vector<u64>"}]},{"name":"RemoveTwapOracleEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata_x","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"metadata_y","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"}]},{"name":"SwapFeeMultipliers","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"traders","type":"0x1::smart_table::SmartTable<address, u64>"}]},{"name":"SwapPreview","is_native":false,"is_event":false,"abilities":["drop"],"generic_type_params":[],"fields":[{"name":"amount_in","type":"u64"},{"name":"amount_in_post_fee","type":"u64"},{"name":"amount_out","type":"u64"},{"name":"amount_normalized_in","type":"u128"},{"name":"amount_normalized_out","type":"u128"},{"name":"total_fee_amount","type":"u64"},{"name":"protocol_fee_amount","type":"u64"},{"name":"idx_in","type":"u64"},{"name":"idx_out","type":"u64"},{"name":"swap_fee_bps","type":"u64"}]},{"name":"SyncRatesEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"oracle_names","type":"vector<0x1::string::String>"},{"name":"rates","type":"vector<u128>"},{"name":"last_updated","type":"u64"}]},{"name":"ThalaSwap","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"fees_metadata","type":"vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"},{"name":"pools","type":"0x1::smart_vector::SmartVector<0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>>"},{"name":"swap_fee_protocol_allocation_bps","type":"u64"},{"name":"flashloan_fee_bps","type":"u64"}]},{"name":"ThalaSwapParamChangeEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"name","type":"0x1::string::String"},{"name":"prev_value","type":"u64"},{"name":"new_value","type":"u64"}]},{"name":"UpdateTwapOracleEvent","is_native":false,"is_event":true,"abilities":["drop","store"],"generic_type_params":[],"fields":[{"name":"oracle_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::TwapOracle>"},{"name":"pool_obj","type":"0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>"},{"name":"metadata_x","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"metadata_y","type":"0x1::object::Object<0x1::fungible_asset::Metadata>"},{"name":"cumulative_price_x","type":"u128"},{"name":"cumulative_price_y","type":"u128"},{"name":"spot_price_x","type":"u128"},{"name":"spot_price_y","type":"u128"},{"name":"timestamp","type":"u64"}]},{"name":"WeightedPool","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"weights","type":"vector<u64>"}]}]}},{"bytecode":"0xa11ceb0b0700000a0c01000c020c0803144e056226078801d80208e0036006c00454109405ce010ae206060ce806c8010db008020fb208020000010402060109010e01110001080001030600000500010001020702030001000801040001030a00010001000b01050001010c06050001000d02010001040f0205000100100105000105120708000100130103000100140105000101150a04000103060c0a020a0a020001060c0101010c01050206050a0202060c050108010205080101060801077061636b616765075061636b6167650a7369676e65725f636170105369676e65724361706162696c697479076163636f756e740f7075626c6973685f7061636b616765076d616e616765720d69735f617574686f72697a65640e7061636b6167655f7369676e657204636f6465137075626c6973685f7061636b6167655f74786e20646572697665645f7265736f757263655f6163636f756e745f61646472657373176372656174655f7265736f757263655f616464726573730b696e69745f6d6f64756c65067369676e65720a616464726573735f6f660f7061636b6167655f61646472657373107265736f757263655f6163636f756e741d72657472696576655f7265736f757263655f6163636f756e745f6361700b696e697469616c697a6564106465706c6f7965725f616464726573731d6372656174655f7369676e65725f776974685f6361706162696c69747904706f6f6c007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5000000000000000000000000000000000000000000000000000000000000000193aa044a65a27bd89b163f8b3be3777b160b09a25c336643dcc2878dfd8f2a8d05201bf23f0881f8fa149500ff6b7a047f608967c028a8ad7a2100caa84833ce851d0a020d0c7468616c61737761705f76320520007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb514636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31126170746f733a3a6d657461646174615f76319a01040000000000000000184552525f5041434b4147455f554e415554484f52495a45440b4572726f7220436f6465730100000000000000174552525f5041434b4147455f494e495449414c495a4544000200000000000000194552525f5041434b4147455f554e494e495449414c495a45440003000000000000001c4552525f5041434b4147455f414444524553535f4d49534d415443480000000002010208010001040100040c0b001101040a11020c030e030b010b021103020600000000000000002704000000050607000c000e0007011105020600000009230a0011070c010a012900031f0a01110421041b0b0111082104170a00070011090c020b000b0212002d00020b0001060300000000000000270b0001060300000000000000270b0001060100000000000000270a010000010311082900020b010000010207000208010000010207020202030001000109110a040711082b001000110c02060200000000000000270000001600","abi":{"address":"0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5","name":"package","friends":["0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool"],"exposed_functions":[{"name":"publish_package","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[],"params":["&signer","vector<u8>","vector<vector<u8>>"],"return":[]},{"name":"initialized","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["bool"]},{"name":"deployer_address","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["address"]},{"name":"package_address","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["address"]},{"name":"package_signer","visibility":"friend","is_entry":false,"is_view":false,"generic_type_params":[],"params":[],"return":["signer"]}],"structs":[{"name":"Package","is_native":false,"is_event":false,"abilities":["key"],"generic_type_params":[],"fields":[{"name":"signer_cap","type":"0x1::account::SignerCapability"}]}]}},{"bytecode":"0xa11ceb0b0700000a0701000203021205140b071f2f084e20106e520cc001ff01000000010001000100020001000100030203000102040401040303030301030b6d6174685f68656c70657208777261705f61646408777261705f737562106d756c5f6469765f726f756e645f7570007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb514636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31126170746f733a3a6d657461646174615f76311f010100000000000000124552525f4449564944455f42595f5a45524f0000000001000001150a0032ffffffffffffffffffffffffffffffff0a01172404100b0032ffffffffffffffffffffffffffffffff0b0117173201000000000000000000000000000000170c020b02020b000b01160c02050e0101000001130a000a0123040e32ffffffffffffffffffffffffffffffff0b010b0017173201000000000000000000000000000000160c020b02020b000b01170c02050c0201000000200a0206000000000000000022041e0b00350b0135180c030a030a02351a0c040b030b0235193200000000000000000000000000000000220317051b0b043201000000000000000000000000000000160c040b0434020601000000000000002700","abi":{"address":"0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5","name":"math_helper","friends":[],"exposed_functions":[{"name":"wrap_add","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128","u128"],"return":["u128"]},{"name":"wrap_sub","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u128","u128"],"return":["u128"]},{"name":"mul_div_round_up","visibility":"public","is_entry":false,"is_view":false,"generic_type_params":[],"params":["u64","u64","u64"],"return":["u64"]}],"structs":[]}},{"bytecode":"0xa11ceb0b0700000a0a0100120212200332950204c7022205e902a302078c05940608a00b4010e00bac020a8c0e050c910e8908000001050007010a010e011001140127012c000100000104070100010206080003090b00030c000007290700082d0401000100030001040000000001020802030001000b05060600000000000001020307080001030d090a0001040f0b0c000105110d0100010012000106000000000000010212070800010013000104000000000102130710000106151101010001001613010400000000010216141500010017130106000000000000010217171500010018180104000000000102181915000100191a01010001001a1c01010001021b1a010001001c1a01010001021d1a010001001e1a01010001021f1a01000100201a0101000102211a01000100221a0101000102231a01000100241a0101000102251a01000100261c080100010728011d010001052a200a010801052b2108010801082a0c0a010001082b2223010001082e23080100010204020f0b08131b201b201e211f221f231b241b251b1f1b1f251f261f271f281f2904060c0b010108020a030300010b01010802010a0b010108030609000901090209030800080003060c0a0b010108030a03010a0804020b010108020a080401080401060804010301060c010502050804030a0b010108030a08040804060900090109020903090409050208040a080401070a0900060a0b010108030a080408040a08040a0804080405060c0a0b010108030a03030304060c0a08040303020b010108020804020a08040804030a0804030305060c0a0b010108030a030a0303030a08040a030306060c0b010108020b01010803030b010108030301090003060c0b010108030301080501080001080302050b0101090003060c0b010109000302060c03010b06010900010b0101080301090101090201090301090401090502010a08040c636f696e5f77726170706572084e6f7461636f696e0b64756d6d795f6669656c64186164645f6c69717569646974795f6d657461737461626c65064f626a656374066f626a65637404506f6f6c04706f6f6c14706f6f6c5f6173736574735f6d65746164617461084d657461646174610e66756e6769626c655f61737365741477697468647261775f636f696e735f61735f66610d46756e6769626c65417373657406616d6f756e74067369676e65720a616464726573735f6f66167072696d6172795f66756e6769626c655f73746f7265076465706f736974146164645f6c69717569646974795f737461626c65166164645f6c69717569646974795f776569676874656406766563746f720772657665727365166372656174655f706f6f6c5f6d657461737461626c65126372656174655f706f6f6c5f737461626c65146372656174655f706f6f6c5f776569676874656418737761705f65786163745f696e5f6d657461737461626c651f77697468647261775f636f696e5f61735f66615f616e645f6465706f7369741e737761705f65786163745f696e5f6d657461737461626c655f656e74727914737761705f65786163745f696e5f737461626c651a737761705f65786163745f696e5f737461626c655f656e74727916737761705f65786163745f696e5f77656967687465641c737761705f65786163745f696e5f77656967687465645f656e74727919737761705f65786163745f6f75745f6d657461737461626c651f737761705f65786163745f6f75745f6d657461737461626c655f656e74727915737761705f65786163745f6f75745f737461626c651b737761705f65786163745f6f75745f737461626c655f656e74727917737761705f65786163745f6f75745f77656967687465641d737761705f65786163745f6f75745f77656967687465645f656e7472791377697468647261775f636f696e5f61735f666109747970655f696e666f07747970655f6f660854797065496e666f0762616c616e636508776974686472617704636f696e04436f696e16636f696e5f746f5f66756e6769626c655f6173736574007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5000000000000000000000000000000000000000000000000000000000000000114636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e31126170746f733a3a6d657461646174615f7631f801050000000000000000214552525f434f494e5f575241505045525f434f494e5f46415f4d49534d415443480a4465707265636174656401000000000000002a4552525f434f494e5f575241505045525f494e53554646494349454e545f555345525f42414c414e4345000200000000000000244552525f434f494e5f575241505045525f494e53554646494349454e545f4f5554505554000300000000000000264552525f434f494e5f575241505045525f41525241595f4c454e4754485f4d49534d41544348000400000000000000244552525f434f494e5f575241505045525f415247554d454e54535f544f4f5f53484f52540000000002010201000104000e1a0a0111010c040a000b040b0238000c050b010b0511030c060e0611040b032604160b0011050b061106020b000106020000000000000027070104000e1a0a0111010c040a000b040b0238010c050b010b0511080c060e0611040b032604160b0011050b061106020b0001060200000000000000270901040012380a0111010c040a000b040b0238000c050b010b05110a0c050c060e0611040b032604340a0011050b0611060b050c070d0738020b070c080e0841080c030a0306000000000000000024042f0d0845080c090a0011050b0911060b03060100000000000000170c03051f0b00010b0846080000000000000000020b0001060200000000000000270c01040016110a000b010b0238000c050a000b050b030b04110d0c06010b0011050b061106020e010400080e0a000b010b0238010b030b04110f0c05010b0011050b0511060210010400080e0a000b010b0238000b030b0411110c05010b0011050b0511060212010400010c0a000a020a0338030b000b010b020b030b040b0511140215010400010c0a000a020a0338030b000b010b020b030b040b0511160217010400010c0a000a020a0338030b000b010b020b030b040b0511180219010400010c0a000a020a0338030b000b010b020b030b040b05111a021b010400010c0a000a020a0338030b000b010b020b030b040b05111c021d010400010c0a000a020a0338030b000b010b020b030b040b05111e021f0000000826380438052104160a0011050a0138060a022604120b000b010b0238070c030b03020b0001060100000000000000270a00110538080a022604220b000b023809380a0c0305100b00010601000000000000002713000000080a0a000b010b02380b0c030b0011050b03110602020000002a7f0e01412406020000000000000026047c0e02410a060200000000000000260c030b0304780e0141240e02410a2104740a000e010600000000000000004224140e02060000000000000000420a14380b0a000e010601000000000000004224140e02060100000000000000420a14380c400802000000000000000c040e01412406030000000000000026032e053a0d040a000e010602000000000000004224140e02060200000000000000420a14380d44080e014124060400000000000000260340054c0d040a000e010603000000000000004224140e02060300000000000000420a14380e44080e014124060500000000000000260352055e0d040a000e010604000000000000004224140e02060400000000000000420a14380f44080e0141240606000000000000002604710d040b000e010605000000000000004224140e02060500000000000000420a14381044080b04020b0001056f0b0001060300000000000000270b000106040000000000000027090c03050a00","abi":{"address":"0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5","name":"coin_wrapper","friends":[],"exposed_functions":[{"name":"add_liquidity_metastable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"add_liquidity_stable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"add_liquidity_weighted","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","vector<u64>","u64"],"return":[]},{"name":"create_pool_metastable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64","u64"],"return":[]},{"name":"create_pool_stable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","u64","u64"],"return":[]},{"name":"create_pool_weighted","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]},{"constraints":[]},{"constraints":[]},{"constraints":[]}],"params":["&signer","vector<0x1::object::Object<0x1::fungible_asset::Metadata>>","vector<u64>","vector<u64>","u64"],"return":[]},{"name":"swap_exact_in_metastable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_in_stable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_in_weighted","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_metastable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_stable","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]},{"name":"swap_exact_out_weighted","visibility":"public","is_entry":true,"is_view":false,"generic_type_params":[{"constraints":[]}],"params":["&signer","0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>","0x1::object::Object<0x1::fungible_asset::Metadata>","u64","0x1::object::Object<0x1::fungible_asset::Metadata>","u64"],"return":[]}],"structs":[{"name":"Notacoin","is_native":false,"is_event":false,"abilities":[],"generic_type_params":[],"fields":[{"name":"dummy_field","type":"bool"}]}]}}]',
          data: '{"arguments":["0x99d34f16193e251af236d5a5c3114fa54e22ca512280317eda2f8faf1514c395",[100000,5032],"164"],"function":"0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::coin_wrapper::add_liquidity_weighted","type":"entry_function_payload","type_arguments":["0x1::aptos_coin::AptosCoin","0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::coin_wrapper::Notacoin","0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::coin_wrapper::Notacoin","0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::coin_wrapper::Notacoin"]}',
          type: 1,
        },
      },
    });

    expect(res3).toEqual(
      '2acddad65c27c6e5b568b398f0d1d01ebb8b55466461bbd51c1e42763a92fdfe8a0200000000000002007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb50c636f696e5f77726170706572166164645f6c69717569646974795f7765696768746564040700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0007007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb50c636f696e5f77726170706572084e6f7461636f696e0007007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb50c636f696e5f77726170706572084e6f7461636f696e0007007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb50c636f696e5f77726170706572084e6f7461636f696e00032099d34f16193e251af236d5a5c3114fa54e22ca512280317eda2f8faf1514c3951102a086010000000000a81300000000000008a400000000000000d0070000000000006400000000000000ed97ef6700000000010020c887bfe29073c3071719d78e55b81deabfb07d4e510de06ccd56835537eb5b584000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('payload tx', async () => {
    const wallet = new AptosWallet();
    let param: BuildSimulateTxParams = {
      publicKey:
        'c94a2450f585ba3c8dfe34c62061f90eaaee65d42557ae59697aa6df8ec69f76',
      data: {
        type: 'simulate_dapp',
        base: {
          sequenceNumber: '1',
          chainId: 1,
          maxGasAmount: '1',
          gasUnitPrice: '1',
          expirationTimestampSecs: '1',
        },
        data: {
          type: 2,
          data: '0x00a302a11ceb0b060000000701000402040a030e18042608052e4307713e08af01200000000101020401000100030800010403040100010505060100010607040100010708060100000201020202030207060c060c0303050503030b000108010b000108010b0001080101080102060c03010b0001090002070b000109000b000109000002070b000109000302050b000109000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177056d657267650765787472616374076465706f73697400000000000000000000000000000000000000000000000000000000000000010000011a0b000a0238000c070b010a0338000c080d070b0838010d070b020b03160b061738020c090b040b0738030b050b09380302000501640000000000000001c80000000000000003c17456e5007df63a733e7bd8e12e932f9e317cb8bb1c5a4a7ca714175c3d1fba0398c7251440317a1d9ec2ccfe001660dbbcc528faae17bb81ba48d6e5538381db013200000000000000',
        },
      },
    };
    let tx = await wallet.buildSimulateTx(param);
    expect(tx).toEqual(
      '85ff3c4cdb935fbdcfa78b786d20614d74020aaca648357cbfdc2631b45dc775010000000000000000a302a11ceb0b060000000701000402040a030e18042608052e4307713e08af01200000000101020401000100030800010403040100010505060100010607040100010708060100000201020202030207060c060c0303050503030b000108010b000108010b0001080101080102060c03010b0001090002070b000109000b000109000002070b000109000302050b000109000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177056d657267650765787472616374076465706f73697400000000000000000000000000000000000000000000000000000000000000010000011a0b000a0238000c070b010a0338000c080d070b0838010d070b020b03160b061738020c090b040b0738030b050b09380302000501640000000000000001c80000000000000003c17456e5007df63a733e7bd8e12e932f9e317cb8bb1c5a4a7ca714175c3d1fba0398c7251440317a1d9ec2ccfe001660dbbcc528faae17bb81ba48d6e5538381db013200000000000000010000000000000001000000000000000100000000000000010020c94a2450f585ba3c8dfe34c62061f90eaaee65d42557ae59697aa6df8ec69f764000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('transfer with feePayer', async () => {
    const wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'transfer',
      base: {
        sequenceNumber: '40',
        chainId: 2,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1860131587',
        withFeePayer: true,
      },
      data: {
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 1000,
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };

    console.log(
      await wallet.getNewAddress({
        privateKey:
          '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      })
    );
    let tx = await wallet.signTransaction(signParams);
    let signedTx = await wallet.signTransaction({
      privateKey:
        '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      data: {
        type: 'signAsFeePayer',
        data: {
          rawTxn: tx.rawTxn,
          type: '1',
        },
      },
    });
    const expected = {
      accAuthenticator:
        '0x00205c8c683ba086152c9d0d18a7f14411773e0d0e21a5a0dd6b8742b57f204124a5401d871d73975d7d443a527785cf78f55af5ee7180cc5988923c39f91d141a556a8b262115ac02931c5e9b91a4110d51fac46edfefb121facb2bd364440b65870a',
      rawTxn:
        '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9228000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd0108e80300000000000010270000000000006400000000000000035bdf6e0000000002010e0b96a300ba50c10777901fb7437391b5d5ddb627f482b33b47d29202d0e0ff',
    };
    expect(signedTx.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(signedTx.rawTxn).toEqual(expected.rawTxn);
  });

  test('tokenTransfer with feePayer', async () => {
    const wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'tokenTransfer',
      base: {
        sequenceNumber: '41',
        chainId: 2,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1860131587',
        withFeePayer: true,
      },
      data: {
        tyArg: '0x1::aptos_coin::AptosCoin',
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 1000,
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };
    let tx = await wallet.signTransaction(signParams);
    let signedTx = await wallet.signTransaction({
      privateKey:
        '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      data: {
        type: 'signAsFeePayer',
        data: {
          rawTxn: tx.rawTxn,
          type: '1',
        },
      },
    });
    const expected = {
      accAuthenticator:
        '0x00205c8c683ba086152c9d0d18a7f14411773e0d0e21a5a0dd6b8742b57f204124a5402e6c7b99a1bb3e7e08c43d25f8479f7e9e2353cb0c4d9ad0be9c5e8700d6fc8dad69ad6a16b685eb08265f904a48a27e090dc55096fff9cf0698509c78669c07',
      rawTxn:
        '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9229000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0002200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd0108e80300000000000010270000000000006400000000000000035bdf6e0000000002010e0b96a300ba50c10777901fb7437391b5d5ddb627f482b33b47d29202d0e0ff',
    };
    expect(signedTx.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(signedTx.rawTxn).toEqual(expected.rawTxn);
  });

  test('tokenTransferV2 with feePayer', async () => {
    const wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'tokenTransferV2',
      base: {
        sequenceNumber: '41',
        chainId: 2,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1860131587',
        withFeePayer: true,
      },
      data: {
        tyArg: '0x1::aptos_coin::AptosCoin',
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 1000,
      },
    };
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };
    console.log(
      await wallet.getNewAddress({
        privateKey:
          'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      })
    );
    let tx = await wallet.signTransaction(signParams);
    let signedTx = await wallet.signTransaction({
      privateKey:
        '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      data: {
        type: 'signAsFeePayer',
        data: {
          rawTxn: tx.rawTxn,
          type: '1',
        },
      },
    });

    console.log(
      'eree',
      await wallet.getNewAddress({
        privateKey:
          'a4d06f3f5a1585cf171b4982003306b4eef0670a2eb5d5483427e2c22b602c9e',
      })
    );
    const expected = {
      accAuthenticator:
        '0x00205c8c683ba086152c9d0d18a7f14411773e0d0e21a5a0dd6b8742b57f204124a5402e6c7b99a1bb3e7e08c43d25f8479f7e9e2353cb0c4d9ad0be9c5e8700d6fc8dad69ad6a16b685eb08265f904a48a27e090dc55096fff9cf0698509c78669c07',
      rawTxn:
        '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9229000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0002200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd0108e80300000000000010270000000000006400000000000000035bdf6e0000000002010e0b96a300ba50c10777901fb7437391b5d5ddb627f482b33b47d29202d0e0ff',
    };
    expect(signedTx.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(signedTx.rawTxn).toEqual(expected.rawTxn);
  });

  test('tokenMint with feePayer', async () => {
    const wallet = new AptosWallet();
    const param: AptosParam = {
      type: 'tokenMint',
      base: {
        sequenceNumber: '41',
        chainId: 2,
        maxGasAmount: '10000',
        gasUnitPrice: '100',
        expirationTimestampSecs: '1860131587',
        withFeePayer: true,
      },
      data: {
        tyArg: '0x1::aptos_coin::AptosCoin',
        recipientAddress:
          '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01',
        amount: 1000,
      },
    };
    //0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f92
    let signParams: SignTxParams = {
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: param,
    };
    let tx = await wallet.signTransaction(signParams);
    let signedTx = await wallet.signTransaction({
      privateKey:
        '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      data: {
        type: 'signAsFeePayer',
        data: {
          rawTxn: tx.rawTxn,
          type: '1',
        },
      },
    });
    const expected = {
      accAuthenticator:
        '0x00205c8c683ba086152c9d0d18a7f14411773e0d0e21a5a0dd6b8742b57f204124a54082a44ae70c22b335a222401b9dae17955046f250d349c37b2c47f467bedbc00e8ee1fb9ee9fca75ae144af47fd5f18e428db8461c5884d12cf18ab807e920e04',
      rawTxn:
        '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f9229000000000000000200000000000000000000000000000000000000000000000000000000000000010c6d616e616765645f636f696e046d696e74010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e0002200163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd0108e80300000000000010270000000000006400000000000000035bdf6e0000000002010e0b96a300ba50c10777901fb7437391b5d5ddb627f482b33b47d29202d0e0ff',
    };
    expect(signedTx.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(signedTx.rawTxn).toEqual(expected.rawTxn);
  });

  test('script tx', async () => {
    const singleSignerScriptBytecode =
      // eslint-disable-next-line max-len
      'a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102';

    let funcParam = [
      new U64(1),
      AccountAddress.fromString(
        '0x0163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01'
      ),
    ].map((item) => {
      let ser = new Serializer();
      item.serializeForScriptFunction(ser);
      return base.toHex(ser.toUint8Array());
    });

    const wallet = new AptosWallet();
    let res = await wallet.signTransaction({
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: {
        type: 'dapp',
        base: {
          expirationTimestampSecs: 1841258177,
          sequenceNumber: '42',
          chainId: 2,
          gasUnitPrice: '100',
          maxGasAmount: '8000',
          reserveFeeRatio: '1.1',
          sender:
            '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f92',
        },
        data: {
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: funcParam,
          },
          type: 3,
        },
      },
    });
    const expected =
      '986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922a0000000000000000bf01a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b033801020002010100000000000000030163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01401f0000000000006400000000000000c15ebf6d00000000020020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b0540432f9d9f80404e73e163667bbf409e2dd6baab7029e80dfe1597baf62bfe75f95020da0bd4e546b3ac41ff7f6dacc0e8ae0a61dd755fac8c6a27d7bc2095310c';
    expect(res).toEqual(expected);

    let res2 = await wallet.buildSimulateTx({
      publicKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: {
        type: 'simulate_dapp',
        base: {
          expirationTimestampSecs: 1841258177,
          sequenceNumber: '42',
          chainId: 2,
          gasUnitPrice: '100',
          maxGasAmount: '8000',
          reserveFeeRatio: '1.1',
          sender:
            '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f92',
        },
        data: {
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: funcParam,
          },
          type: 3,
        },
      },
    });

    expect(res2).toEqual(
      '46530c75f0d95d0f6c57c0c78afcb41745314aacfc42ea61642c6d20899a36132a0000000000000000bf01a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b033801020002010100000000000000030163f9f9f773f3b0e788559d9efcbe547889500d0891fe024e782c7224defd01401f0000000000006400000000000000c15ebf6d00000000020020fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed74000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('sign simple tx', async () => {
    const wallet = new AptosWallet();
    let res = await wallet.signTransaction({
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: {
        type: 'signTx',
        data: {
          rawTxn:
            '0x0552e93408c5536749bbb2c494d6063010564950bda2cb7ca7914cf54383f870010000000000000000bf01a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102000201010000000000000003005081ec35e92c741f52150098985ba1f9464382c69a4cfa440195cdc28f88890100000000000000010000000000000001000000000000000200',
          type: '1', //1 simple tx, 2 multi agent tx
        },
      },
    });
    const expected = {
      accAuthenticator:
        '0x0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b05405b33d54ca18f498b7a83a946c2dfe94e306413154f12a9abca2a6c86ebfc902068234ab661dd7900c32396d942b993329eee936d2653fa88e324e8202e14520a',
      rawTxn:
        '0x0552e93408c5536749bbb2c494d6063010564950bda2cb7ca7914cf54383f870010000000000000000bf01a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102000201010000000000000003005081ec35e92c741f52150098985ba1f9464382c69a4cfa440195cdc28f88890100000000000000010000000000000001000000000000000200',
    };
    expect(res.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(res.rawTxn).toEqual(expected.rawTxn);
  });

  test('sign multiTx tx', async () => {
    const wallet = new AptosWallet();
    console.log(
      await wallet.getNewAddress({
        privateKey:
          'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed8',
      })
    );
    console.log(
      await wallet.getNewAddress({
        privateKey:
          '0xc8c57b624a07f298b62ee55b7cb4186129b45d22746b03fb4b8522514cbb7618',
      })
    );

    let acc1 = AccountAddress.fromString(
      '0x79b2d1f85c5d644b2f1c24e435ea80d72ae8c800a4ed5e0b01a7f40445c37b2d'
    );
    let acc2 = AccountAddress.fromString(
      '0x318717be403fefbed1e1cd2567a215514c524d0f315b743d664abb137d9ed8ae'
    );
    let funcParam = [
      new U64(BigInt(100)),
      new U64(BigInt(200)),
      acc1,
      acc2,
      new U64(BigInt(50)),
    ].map((item) => {
      let ser = new Serializer();
      item.serializeForScriptFunction(ser);
      return base.toHex(ser.toUint8Array());
    });
    let res = await wallet.signTransaction({
      privateKey:
        'fbfdf86582998a7cf3b56f4a9026d3190e539d74fa27ddec23698f13a27c9ed7',
      data: {
        type: 'dapp',
        base: {
          expirationTimestampSecs: 1841258177,
          sequenceNumber: '42',
          chainId: 2,
          gasUnitPrice: '100',
          maxGasAmount: '8000',
          reserveFeeRatio: '1.1',
          sender:
            '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f92',
          secondarySignerAddresses: [
            '0x79b2d1f85c5d644b2f1c24e435ea80d72ae8c800a4ed5e0b01a7f40445c37b2d',
            '0x318717be403fefbed1e1cd2567a215514c524d0f315b743d664abb137d9ed8ae',
          ],
        },
        data: {
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: funcParam,
          },
          type: '3',
        },
      },
    });
    const expected = {
      accAuthenticator:
        '0x0020a6084a32f84d8da8851aa2503222b8a6f5ea8d6d907f68d9a3e146da83725b054051d0be4e4acdaf82decdd165be1b7dea63d8571cf8b1db86c1ab202238b079813f9650f0ea7d4d2db6b7ec25e0025a213d27f347460ef03d51de134011dc8306',
      rawTxn:
        '0x986d10e6ffde60518ab0664f70339196f914f96255f31a1c6b226670c73d3f922a0000000000000000a302a11ceb0b060000000701000402040a030e18042608052e4307713e08af01200000000101020401000100030800010403040100010505060100010607040100010708060100000201020202030207060c060c0303050503030b000108010b000108010b0001080101080102060c03010b0001090002070b000109000b000109000002070b000109000302050b000109000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177056d657267650765787472616374076465706f73697400000000000000000000000000000000000000000000000000000000000000010000011a0b000a0238000c070b010a0338000c080d070b0838010d070b020b03160b061738020c090b040b0738030b050b09380302000501640000000000000001c8000000000000000379b2d1f85c5d644b2f1c24e435ea80d72ae8c800a4ed5e0b01a7f40445c37b2d03318717be403fefbed1e1cd2567a215514c524d0f315b743d664abb137d9ed8ae013200000000000000401f0000000000006400000000000000c15ebf6d00000000020279b2d1f85c5d644b2f1c24e435ea80d72ae8c800a4ed5e0b01a7f40445c37b2d318717be403fefbed1e1cd2567a215514c524d0f315b743d664abb137d9ed8ae00',
    };
    expect(res.accAuthenticator).toEqual(expected.accAuthenticator);
    expect(res.rawTxn).toEqual(expected.rawTxn);
  });
  describe('Version', () => {
    test('should export VERSION constant', () => {
      expect(VERSION).toBe('1.4.0');
      expect(typeof VERSION).toBe('string');
    });
  });

  describe('Account Static Methods', () => {
    test('should generate account with SingleKey scheme', () => {
      const account = Account.generate({
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
        legacy: false,
      });
      expect(account).toBeInstanceOf(SingleKeyAccount);
      expect(account.signingScheme).toBe(SigningScheme.SingleKey);
    });

    test('should generate Ed25519Account with legacy=true', () => {
      const account = Account.generate({
        scheme: SigningSchemeInput.Ed25519,
        legacy: true,
      });
      expect(account).toBeInstanceOf(Ed25519Account);
    });

    test('should create account from Ed25519PrivateKey with legacy=true', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const account = Account.fromPrivateKey({
        privateKey,
        legacy: true,
      });
      expect(account).toBeInstanceOf(Ed25519Account);
    });

    test('should create SingleKeyAccount from non-Ed25519 private key', () => {
      const privateKey = Secp256k1PrivateKey.generate();
      const account = Account.fromPrivateKey({
        privateKey,
        legacy: false,
      });
      expect(account).toBeInstanceOf(SingleKeyAccount);
    });

    test('should create account from private key with address', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const address = AccountAddress.from('0x1');
      const account = Account.fromPrivateKey({
        privateKey,
        address,
        legacy: true,
      });
      expect(account.accountAddress.toString()).toBe(address.toString());
    });

    test('should use deprecated fromPrivateKeyAndAddress method', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const address = AccountAddress.from('0x1');
      const account = Account.fromPrivateKeyAndAddress({
        privateKey,
        address,
      });
      expect(account.accountAddress.toString()).toBe(address.toString());
    });

    test('should derive account from path with Ed25519 legacy', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0'/0'";
      const account = Account.fromDerivationPath({
        scheme: SigningSchemeInput.Ed25519,
        mnemonic,
        path,
        legacy: true,
      });
      expect(account).toBeInstanceOf(Ed25519Account);
    });

    test('should derive SingleKeyAccount from path with Secp256k1', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0/0";
      const account = Account.fromDerivationPath({
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
        mnemonic,
        path,
        legacy: false,
      });
      expect(account).toBeInstanceOf(SingleKeyAccount);
    });

    test('should get authentication key from public key (deprecated method)', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const publicKey = privateKey.publicKey();
      const authKey = Account.authKey({ publicKey });
      expect(authKey).toBeDefined();
      expect(authKey.toString()).toBe(publicKey.authKey().toString());
    });
  });

  describe('Ed25519Account', () => {
    let testAccount: Ed25519Account;
    let testMessage: Uint8Array;

    beforeEach(() => {
      testAccount = Ed25519Account.generate();
      testMessage = new Uint8Array([1, 2, 3, 4, 5]);
    });

    test('should derive Ed25519Account from path', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0'/0'";
      const account = Ed25519Account.fromDerivationPath({ mnemonic, path });
      expect(account).toBeInstanceOf(Ed25519Account);
      expect(account.publicKey).toBeInstanceOf(Ed25519PublicKey);
    });

    test('should verify signature', () => {
      const signature = testAccount.privateKey.sign(testMessage);
      const isValid = testAccount.verifySignature({
        message: testMessage,
        signature,
      });
      expect(isValid).toBe(true);
    });

    test('should sign with authenticator', () => {
      const authenticator = testAccount.signWithAuthenticator(testMessage);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorEd25519);
      expect(authenticator.public_key).toBe(testAccount.publicKey);
    });

    test('should sign transaction with authenticator', () => {
      const transaction = createTestRawTransaction();
      const authenticator =
        testAccount.signTransactionWithAuthenticator(transaction);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorEd25519);
      expect(authenticator.public_key).toBe(testAccount.publicKey);
    });
  });

  describe('SingleKeyAccount', () => {
    test('should create SingleKeyAccount with Ed25519 private key', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const account = new SingleKeyAccount({ privateKey });
      expect(account.privateKey).toBe(privateKey);
      expect(account.publicKey).toBeInstanceOf(AnyPublicKey);
      expect(account.signingScheme).toBe(SigningScheme.SingleKey);
    });

    test('should create SingleKeyAccount with custom address', () => {
      const privateKey = Ed25519PrivateKey.generate();
      const address = AccountAddress.from('0x1');
      const account = new SingleKeyAccount({ privateKey, address });
      expect(account.accountAddress.toString()).toBe(address.toString());
    });

    test('should generate SingleKeyAccount with Ed25519 scheme', () => {
      const account = SingleKeyAccount.generate({
        scheme: SigningSchemeInput.Ed25519,
      });
      expect(account).toBeInstanceOf(SingleKeyAccount);
      expect(account.privateKey).toBeInstanceOf(Ed25519PrivateKey);
    });

    test('should generate SingleKeyAccount with Secp256k1 scheme', () => {
      const account = SingleKeyAccount.generate({
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
      });
      expect(account).toBeInstanceOf(SingleKeyAccount);
      expect(account.privateKey).toBeInstanceOf(Secp256k1PrivateKey);
    });

    test('should throw error for unsupported signature scheme in generate', () => {
      expect(() => {
        SingleKeyAccount.generate({
          scheme: 'UnsupportedScheme' as any,
        });
      }).toThrow('Unsupported signature scheme');
    });

    test('should derive from path with Ed25519', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0'/0'";
      const account = SingleKeyAccount.fromDerivationPath({
        scheme: SigningSchemeInput.Ed25519,
        mnemonic,
        path,
      });
      expect(account.privateKey).toBeInstanceOf(Ed25519PrivateKey);
    });

    test('should derive from path with Secp256k1', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0/0";
      const account = SingleKeyAccount.fromDerivationPath({
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
        mnemonic,
        path,
      });
      expect(account.privateKey).toBeInstanceOf(Secp256k1PrivateKey);
    });

    test('should throw error for unsupported signature scheme in fromDerivationPath', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const path = "m/44'/637'/0'/0'/0'";
      expect(() => {
        SingleKeyAccount.fromDerivationPath({
          scheme: 'UnsupportedScheme' as any,
          mnemonic,
          path,
        });
      }).toThrow('Unsupported signature scheme');
    });

    test('should verify signature', () => {
      const account = SingleKeyAccount.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = account.sign(message);
      const isValid = account.verifySignature({ message, signature });
      expect(isValid).toBe(true);
    });

    test('should sign with authenticator', () => {
      const account = SingleKeyAccount.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const authenticator = account.signWithAuthenticator(message);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorSingleKey);
    });

    test('should sign transaction with authenticator', () => {
      const account = SingleKeyAccount.generate();
      const transaction = createTestRawTransaction();
      const authenticator =
        account.signTransactionWithAuthenticator(transaction);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorSingleKey);
    });

    test('should sign message', () => {
      const account = SingleKeyAccount.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = account.sign(message);
      expect(signature).toBeInstanceOf(AnySignature);
    });

    test('should sign transaction', () => {
      const account = SingleKeyAccount.generate();
      const transaction = createTestRawTransaction();
      const signature = account.signTransaction(transaction);
      expect(signature).toBeInstanceOf(AnySignature);
    });
  });

  describe('MultiKeyAccount', () => {
    let signer1: Ed25519Account;
    let signer2: Ed25519Account;
    let signer3: Ed25519Account;
    let publicKeys: Ed25519PublicKey[];
    let multiKey: MultiKey;

    beforeEach(() => {
      signer1 = Ed25519Account.generate();
      signer2 = Ed25519Account.generate();
      signer3 = Ed25519Account.generate();
      publicKeys = [signer1.publicKey, signer2.publicKey, signer3.publicKey];
      multiKey = new MultiKey({
        publicKeys,
        signaturesRequired: 2,
      });
    });

    test('should create MultiKeyAccount with constructor', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });

      expect(account.publicKey).toBe(multiKey);
      expect(account.signingScheme).toBe(SigningScheme.MultiKey);
      expect(account.signers).toHaveLength(2);
      expect(account.accountAddress).toBeDefined();
    });

    test('should sort signers by bit positions', () => {
      // Create signers in reverse order to test sorting
      const signers = [signer3, signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });

      // Verify that signers are sorted by their bit positions
      expect(account.signers[0]).toBe(signer1); // First public key
      expect(account.signers[1]).toBe(signer2); // Second public key
      expect(account.signers[2]).toBe(signer3); // Third public key
    });

    test('should create from public keys and signers', () => {
      const signers = [signer1, signer2];
      const account = MultiKeyAccount.fromPublicKeysAndSigners({
        publicKeys,
        signaturesRequired: 2,
        signers,
      });

      expect(account).toBeInstanceOf(MultiKeyAccount);
      expect(account.signers).toHaveLength(2);
    });

    test('should identify MultiKeyAccount with isMultiKeySigner', () => {
      const signers = [signer1, signer2];
      const multiKeyAccount = new MultiKeyAccount({ multiKey, signers });
      const regularAccount = Ed25519Account.generate();

      expect(MultiKeyAccount.isMultiKeySigner(multiKeyAccount)).toBe(true);
      expect(MultiKeyAccount.isMultiKeySigner(regularAccount)).toBe(false);
    });

    test('should sign with authenticator', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const authenticator = account.signWithAuthenticator(message);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorMultiKey);
    });

    test('should sign transaction with authenticator', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const transaction = createTestRawTransaction();

      const authenticator =
        account.signTransactionWithAuthenticator(transaction);
      expect(authenticator).toBeInstanceOf(AccountAuthenticatorMultiKey);
    });

    test('should sign message', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = account.sign(message);
      expect(signature).toBeInstanceOf(MultiKeySignature);
      expect(signature.signatures).toHaveLength(2);
    });

    test('should sign transaction', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const transaction = createTestRawTransaction();

      const signature = account.signTransaction(transaction);
      expect(signature).toBeInstanceOf(MultiKeySignature);
      expect(signature.signatures).toHaveLength(2);
    });

    test('should verify signature', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = account.sign(message);
      const isValid = account.verifySignature({ message, signature });
      expect(isValid).toBe(true);
    });

    test('should fail verification if signer indices are not sorted', () => {
      // Create account with unsorted signers manually
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });

      // Manually set unsorted indices to test the validation
      (account as any).signerIndicies = [1, 0]; // Reverse order

      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = account.sign(message);
      const isValid = account.verifySignature({ message, signature });
      expect(isValid).toBe(false);
    });

    test('should fail verification with invalid signature', () => {
      const signers = [signer1, signer2];
      const account = new MultiKeyAccount({ multiKey, signers });
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      // Create invalid signature
      const invalidSig1 = signer1.sign(new Uint8Array([9, 9, 9]));
      const invalidSig2 = signer2.sign(message);
      const invalidSignature = new MultiKeySignature({
        signatures: [invalidSig1, invalidSig2],
        bitmap: account.signaturesBitmap,
      });

      const isValid = account.verifySignature({
        message,
        signature: invalidSignature,
      });
      expect(isValid).toBe(false);
    });
  });

  describe('Transaction Builder Helpers', () => {
    test('convertNumber should return undefined for invalid input', () => {
      expect(convertNumber('')).toBeUndefined();
      expect(convertNumber('abc')).toBeNaN();
      expect(convertNumber(null as any)).toBeUndefined();
    });

    test('isLargeNumber should identify large number types', () => {
      expect(isLargeNumber(123)).toBe(true);
      expect(isLargeNumber(BigInt(123))).toBe(true);
      expect(isLargeNumber('123')).toBe(true);
      expect(isLargeNumber(true)).toBe(false);
      expect(isLargeNumber(null)).toBe(false);
    });

    test('isEmptyOption should identify null/undefined values', () => {
      expect(isEmptyOption(null)).toBe(true);
      expect(isEmptyOption(undefined)).toBe(true);
      expect(isEmptyOption('')).toBe(false);
      expect(isEmptyOption(0)).toBe(false);
    });

    test('throwTypeMismatch should throw descriptive error', () => {
      expect(() => throwTypeMismatch('U64', 1)).toThrow(
        "Type mismatch for argument 1, expected 'U64'"
      );
    });

    test('findFirstNonSignerArg should find correct index', () => {
      const functionAbi = {
        params: ['signer', '&signer', 'address', 'u64'],
      } as any;
      expect(findFirstNonSignerArg(functionAbi)).toBe(2);

      const allSignerAbi = {
        params: ['signer', '&signer'],
      } as any;
      expect(findFirstNonSignerArg(allSignerAbi)).toBe(2);

      const noSignerAbi = {
        params: ['address', 'u64'],
      } as any;
      expect(findFirstNonSignerArg(noSignerAbi)).toBe(0);
    });
  });

  describe('Signing Message', () => {
    test('generateSigningMessage should throw for invalid domain separator', () => {
      const bytes = new Uint8Array([1, 2, 3]);
      expect(() => generateSigningMessage(bytes, 'INVALID::')).toThrow(
        "Domain separator needs to start with 'APTOS::'"
      );
    });

    test('generateSigningMessage should work with valid domain separator', () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const result = generateSigningMessage(bytes, 'APTOS::Test');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(bytes.length);
    });

    test('generateSigningMessageForSerializable should work', () => {
      const transaction = createTestRawTransaction();
      const result = generateSigningMessageForSerializable(transaction);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Transaction Builder', () => {
    test('generateSignedTransaction should handle fee payer transactions', () => {
      const account = Ed25519Account.generate();
      const feePayerAccount = Ed25519Account.generate();
      const transaction = createTestRawTransactionWithFeePayer(
        feePayerAccount.accountAddress
      );

      const senderAuth = account.signTransactionWithAuthenticator(transaction);
      const feePayerAuth =
        feePayerAccount.signTransactionWithAuthenticator(transaction);

      const result = generateSignedTransaction({
        transaction,
        senderAuthenticator: senderAuth,
        feePayerAuthenticator: feePayerAuth,
      });

      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('generateSignedTransaction should handle multi agent transactions', () => {
      const primaryAccount = Ed25519Account.generate();
      const secondaryAccount = Ed25519Account.generate();

      const transaction = createMultiAgentTransaction([
        secondaryAccount.accountAddress,
      ]);

      const senderAuth =
        primaryAccount.signTransactionWithAuthenticator(transaction);
      const secondaryAuth =
        secondaryAccount.signTransactionWithAuthenticator(transaction);

      const result = generateSignedTransaction({
        transaction,
        senderAuthenticator: senderAuth,
        additionalSignersAuthenticators: [secondaryAuth],
      });

      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('generateSignedTransaction should throw for missing fee payer authenticator', () => {
      const account = Ed25519Account.generate();
      const feePayerAddress = AccountAddress.from('0x2');
      const transaction = createTestRawTransactionWithFeePayer(feePayerAddress);

      const senderAuth = account.signTransactionWithAuthenticator(transaction);

      expect(() =>
        generateSignedTransaction({
          transaction,
          senderAuthenticator: senderAuth,
          // Missing feePayerAuthenticator
        })
      ).toThrow('Must provide a feePayerAuthenticator argument');
    });

    test('generateSignedTransaction should throw for missing additional signers', () => {
      const account = Ed25519Account.generate();
      const transaction = createMultiAgentTransaction([
        AccountAddress.from('0x2'),
      ]);

      const senderAuth = account.signTransactionWithAuthenticator(transaction);

      expect(() =>
        generateSignedTransaction({
          transaction,
          senderAuthenticator: senderAuth,
          // Missing additionalSignersAuthenticators
        })
      ).toThrow('Must provide a additionalSignersAuthenticators argument');
    });

    test('generateSignedTransactionForSimulation should handle Secp256k1 correctly', () => {
      const transaction = createTestRawTransaction();

      // Test with SingleKey account with Secp256k1
      const secp256k1Account = SingleKeyAccount.generate({
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
      });

      // This should work since the function handles AnyPublicKey with Secp256k1
      const result = generateSignedTransactionForSimulation({
        transaction,
        signerPublicKey: secp256k1Account.publicKey,
      });
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('TypeTag Parser', () => {
    test('parseTypeTag should handle vector types', () => {
      const vectorType = parseTypeTag('vector<u64>');
      expect(vectorType).toBeInstanceOf(TypeTagVector);
    });

    test('parseTypeTag should handle reference types', () => {
      const refType = parseTypeTag('&u64');
      expect(refType).toBeInstanceOf(TypeTagReference);
    });

    test('parseTypeTag should handle generic types when allowed', () => {
      const genericType = parseTypeTag('T0', { allowGenerics: true });
      expect(genericType).toBeInstanceOf(TypeTagGeneric);
    });

    test('parseTypeTag should throw for generic types when not allowed', () => {
      expect(() => parseTypeTag('T0', { allowGenerics: false })).toThrow();
    });

    test('parseTypeTag should throw for invalid type tags', () => {
      expect(() => parseTypeTag('invalid')).toThrow();
    });

    test('parseTypeTag should throw for unexpected struct format', () => {
      expect(() => parseTypeTag('0x1::invalid')).toThrow();
      expect(() => parseTypeTag('0x1::module::struct::extra')).toThrow();
    });

    test('parseTypeTag should throw for invalid address in struct', () => {
      expect(() => parseTypeTag('invalid_address::module::struct')).toThrow();
    });

    test('parseTypeTag should throw for invalid identifier characters', () => {
      expect(() => parseTypeTag('0x1::module-name::struct')).toThrow();
      expect(() => parseTypeTag('0x1::module::struct-name')).toThrow();
    });

    test('parseTypeTag should throw for unexpected vector type argument count', () => {
      expect(() => parseTypeTag('vector<u64, u32>')).toThrow();
      expect(() => parseTypeTag('vector<>')).toThrow();
    });

    test('parseTypeTag should handle valid struct types', () => {
      const structType = parseTypeTag('0x1::coin::Coin');
      expect(structType).toBeInstanceOf(TypeTagStruct);
    });
  });

  describe('BCS Type Validation', () => {
    test('should validate U8 types', () => {
      const u8Value = new U8(42);
      expect(u8Value.value).toBe(42);
    });

    test('should validate U64 types', () => {
      const u64Value = new U64(BigInt(123456));
      expect(u64Value.value).toBe(BigInt(123456));
    });

    test('should validate U128 types', () => {
      const u128Value = new U128(BigInt(123456789));
      expect(u128Value.value).toBe(BigInt(123456789));
    });

    test('should validate U256 types', () => {
      const u256Value = new U256(BigInt(123456789));
      expect(u256Value.value).toBe(BigInt(123456789));
    });

    test('should validate MoveVector types', () => {
      const vector = new MoveVector([new U8(1), new U8(2), new U8(3)]);
      expect(vector.values).toHaveLength(3);
    });

    test('should validate MoveString types', () => {
      const moveString = new MoveString('Hello, Aptos!');
      expect(moveString.value).toBe('Hello, Aptos!');
    });

    test('should validate Bool types', () => {
      const boolValue = new Bool(true);
      expect(boolValue.value).toBe(true);
    });
  });

  describe('V2 Crypto Module Tests', () => {
    // Test data
    const testMessage = 'Hello, Aptos!';
    const testHexMessage = '0x48656c6c6f2c204170746f7321';
    const testPrivateKeyHex =
      '0x4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5';
    const testPublicKeyHex =
      '0x067aec3603bdca82e52a172ec69b2505a979f1d935a59409bacae5c7f268fc26';

    describe('Utils Tests', () => {
      test('convertSigningMessage with string message', () => {
        const result = convertSigningMessage(testMessage);
        expect(result).toBeInstanceOf(Buffer);
        expect(Buffer.from(result as Uint8Array).toString('utf8')).toBe(
          testMessage
        );
      });

      test('convertSigningMessage with valid hex string', () => {
        const result = convertSigningMessage(testHexMessage);
        expect(result).toBe(testHexMessage);
      });

      test('convertSigningMessage with Uint8Array', () => {
        const uint8Array = new Uint8Array([72, 101, 108, 108, 111]);
        const result = convertSigningMessage(uint8Array);
        expect(result).toBe(uint8Array);
      });

      test('convertSigningMessage with invalid hex string', () => {
        const invalidHex = 'invalid_hex_string';
        const result = convertSigningMessage(invalidHex);
        expect(result).toBeInstanceOf(Buffer);
        expect(Buffer.from(result as Uint8Array).toString('utf8')).toBe(
          invalidHex
        );
      });
    });

    describe('Ed25519 Tests', () => {
      test('Ed25519PrivateKey generation', () => {
        const privateKey = Ed25519PrivateKey.generate();
        expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
      });

      test('Ed25519PrivateKey from hex', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
        expect(privateKey.toString()).toBe(testPrivateKeyHex);
      });

      test('Ed25519PrivateKey invalid length', () => {
        expect(() => new Ed25519PrivateKey('0x1234')).toThrow(
          'PrivateKey length should be 32'
        );
      });

      test('Ed25519PublicKey from private key', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const publicKey = privateKey.publicKey();
        expect(publicKey).toBeInstanceOf(Ed25519PublicKey);
        expect(publicKey.toUint8Array().length).toBe(32);
      });

      test('Ed25519PublicKey from hex', () => {
        const publicKey = new Ed25519PublicKey(testPublicKeyHex);
        expect(publicKey).toBeInstanceOf(Ed25519PublicKey);
        expect(publicKey.toUint8Array().length).toBe(32);
        expect(publicKey.toString()).toBe(testPublicKeyHex);
      });

      test('Ed25519PublicKey invalid length', () => {
        expect(() => new Ed25519PublicKey('0x1234')).toThrow(
          'PublicKey length should be 32'
        );
      });

      test('Ed25519 signing and verification', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const publicKey = privateKey.publicKey();
        const signature = privateKey.sign(testMessage);

        expect(signature).toBeInstanceOf(Ed25519Signature);
        expect(signature.toUint8Array().length).toBe(64);

        const isValid = publicKey.verifySignature({
          message: testMessage,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });

      test('Ed25519 verification with wrong signature', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();

        const publicKey1 = privateKey1.publicKey();
        const signature2 = privateKey2.sign(testMessage);

        const isValid = publicKey1.verifySignature({
          message: testMessage,
          signature: signature2,
        });
        expect(isValid).toBe(false);
      });

      test('Ed25519 verification with wrong signature type', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const publicKey = privateKey.publicKey();

        // Create a mock signature that's not Ed25519Signature
        const wrongSignature = {
          toUint8Array: () => new Uint8Array(64),
        } as any;

        const isValid = publicKey.verifySignature({
          message: testMessage,
          signature: wrongSignature,
        });
        expect(isValid).toBe(false);
      });

      test('Ed25519Signature invalid length', () => {
        expect(() => new Ed25519Signature('0x1234')).toThrow(
          'Signature length should be 64'
        );
      });

      test('Ed25519Signature canonical signature check', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const signature = privateKey.sign(testMessage);

        // Most signatures should be canonical
        expect(signature.isCanonicalSignature()).toBe(true);
      });

      test('Ed25519 authentication key', () => {
        const publicKey = new Ed25519PublicKey(testPublicKeyHex);
        const authKey = publicKey.authKey();
        expect(authKey).toBeInstanceOf(AuthenticationKey);
      });

      test('Ed25519 serialization/deserialization', () => {
        const publicKey = new Ed25519PublicKey(testPublicKeyHex);
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const signature = privateKey.sign(testMessage);

        // Test public key serialization
        const serializer1 = new Serializer();
        publicKey.serialize(serializer1);
        const deserializer1 = new Deserializer(serializer1.toUint8Array());
        const deserializedPublicKey =
          Ed25519PublicKey.deserialize(deserializer1);
        expect(deserializedPublicKey.toString()).toBe(publicKey.toString());

        // Test private key serialization
        const serializer2 = new Serializer();
        privateKey.serialize(serializer2);
        const deserializer2 = new Deserializer(serializer2.toUint8Array());
        const deserializedPrivateKey =
          Ed25519PrivateKey.deserialize(deserializer2);
        expect(deserializedPrivateKey.toString()).toBe(privateKey.toString());

        // Test signature serialization
        const serializer3 = new Serializer();
        signature.serialize(serializer3);
        const deserializer3 = new Deserializer(serializer3.toUint8Array());
        const deserializedSignature =
          Ed25519Signature.deserialize(deserializer3);
        expect(deserializedSignature.toString()).toBe(signature.toString());
      });

      test('Ed25519PrivateKey from derivation path', () => {
        const mnemonic =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        const path = "m/44'/637'/0'/0'/0'";

        const privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
      });

      test('Ed25519PrivateKey invalid derivation path', () => {
        const mnemonic =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        const invalidPath = "m/44'/637'/0'/0/0"; // Missing hardened marker on last segment

        expect(() =>
          Ed25519PrivateKey.fromDerivationPath(invalidPath, mnemonic)
        ).toThrow('Invalid derivation path');
      });

      test('Ed25519 deprecated isPublicKey method', () => {
        const publicKey = new Ed25519PublicKey(testPublicKeyHex);
        expect(Ed25519PublicKey.isPublicKey(publicKey)).toBe(true);
      });

      test('Ed25519 deprecated isPrivateKey method', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        expect(Ed25519PrivateKey.isPrivateKey(privateKey)).toBe(true);
      });
    });

    describe('AnyPublicKey/AnySignature Tests', () => {
      test('AnyPublicKey with Ed25519PublicKey', () => {
        const ed25519PublicKey = new Ed25519PublicKey(testPublicKeyHex);
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

        expect(anyPublicKey).toBeInstanceOf(AnyPublicKey);
        expect(anyPublicKey.publicKey).toBe(ed25519PublicKey);
        expect(anyPublicKey.variant).toBe(0); // AnyPublicKeyVariant.Ed25519
      });

      test('AnyPublicKey authentication key', () => {
        const ed25519PublicKey = new Ed25519PublicKey(testPublicKeyHex);
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
        const authKey = anyPublicKey.authKey();
        expect(authKey).toBeInstanceOf(AuthenticationKey);
      });

      test('AnyPublicKey signature verification', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const ed25519PublicKey = privateKey.publicKey();
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

        const ed25519Signature = privateKey.sign(testMessage);
        const anySignature = new AnySignature(ed25519Signature);

        const isValid = anyPublicKey.verifySignature({
          message: testMessage,
          signature: anySignature,
        });
        expect(isValid).toBe(true);
      });

      test('AnyPublicKey verification with wrong signature type', () => {
        const ed25519PublicKey = new Ed25519PublicKey(testPublicKeyHex);
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

        const wrongSignature = {
          toUint8Array: () => new Uint8Array(64),
        } as any;

        const isValid = anyPublicKey.verifySignature({
          message: testMessage,
          signature: wrongSignature,
        });
        expect(isValid).toBe(false);
      });

      test('AnySignature with Ed25519Signature', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const ed25519Signature = privateKey.sign(testMessage);
        const anySignature = new AnySignature(ed25519Signature);

        expect(anySignature).toBeInstanceOf(AnySignature);
        expect(anySignature.signature).toBe(ed25519Signature);
      });

      test('AnyPublicKey/AnySignature serialization/deserialization', () => {
        const ed25519PublicKey = new Ed25519PublicKey(testPublicKeyHex);
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

        // Test AnyPublicKey serialization
        const serializer1 = new Serializer();
        anyPublicKey.serialize(serializer1);
        const deserializer1 = new Deserializer(serializer1.toUint8Array());
        const deserializedAnyPublicKey =
          AnyPublicKey.deserialize(deserializer1);
        expect(deserializedAnyPublicKey.toString()).toBe(
          anyPublicKey.toString()
        );

        // Test AnySignature serialization
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const ed25519Signature = privateKey.sign(testMessage);
        const anySignature = new AnySignature(ed25519Signature);

        const serializer2 = new Serializer();
        anySignature.serialize(serializer2);
        const deserializer2 = new Deserializer(serializer2.toUint8Array());
        const deserializedAnySignature =
          AnySignature.deserialize(deserializer2);
        expect(deserializedAnySignature.toString()).toBe(
          anySignature.toString()
        );
      });

      test('AnyPublicKey with unsupported key type', () => {
        const unsupportedKey = {
          toUint8Array: () => new Uint8Array(32),
          serialize: () => {},
          toString: () => 'unsupported',
        } as any;

        expect(() => new AnyPublicKey(unsupportedKey)).toThrow(
          'Unsupported public key type'
        );
      });

      test('AnySignature with unsupported signature type', () => {
        const unsupportedSignature = {
          toUint8Array: () => new Uint8Array(64),
          serialize: () => {},
          toString: () => 'unsupported',
        } as any;

        expect(() => new AnySignature(unsupportedSignature)).toThrow(
          'Unsupported signature type'
        );
      });

      test('AnyPublicKey deserialization with unknown variant', () => {
        const serializer = new Serializer();
        serializer.serializeU32AsUleb128(999); // Unknown variant
        serializer.serializeBytes(new Uint8Array(32));

        const deserializer = new Deserializer(serializer.toUint8Array());
        expect(() => AnyPublicKey.deserialize(deserializer)).toThrow(
          'Unknown variant index for AnyPublicKey: 999'
        );
      });

      test('AnySignature deserialization with unknown variant', () => {
        const serializer = new Serializer();
        serializer.serializeU32AsUleb128(999); // Unknown variant
        serializer.serializeBytes(new Uint8Array(64));

        const deserializer = new Deserializer(serializer.toUint8Array());
        expect(() => AnySignature.deserialize(deserializer)).toThrow(
          'Unknown variant index for AnySignature: 999'
        );
      });

      test('AnyPublicKey deprecated methods', () => {
        const ed25519PublicKey = new Ed25519PublicKey(testPublicKeyHex);
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

        expect(AnyPublicKey.isPublicKey(anyPublicKey)).toBe(true);
        expect(anyPublicKey.isEd25519()).toBe(true);
        expect(anyPublicKey.isSecp256k1PublicKey()).toBe(false);
      });
    });

    describe('Abstract Classes Tests', () => {
      test('PublicKey toString method', () => {
        const publicKey = new Ed25519PublicKey(testPublicKeyHex);
        expect(publicKey.toString()).toBe(testPublicKeyHex);
      });

      test('Signature toString method', () => {
        const privateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const signature = privateKey.sign(testMessage);
        expect(signature.toString()).toMatch(/^0x[0-9a-f]+$/i);
        expect(signature.toString().length).toBe(130); // 0x + 128 hex chars (64 bytes)
      });
    });

    describe('Secp256k1 Comprehensive Tests', () => {
      test('Secp256k1PrivateKey generation', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        expect(privateKey).toBeInstanceOf(Secp256k1PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
      });

      test('Secp256k1PrivateKey from hex', () => {
        const testSecp256k1PrivateKey =
          '0x4646464646464646464646464646464646464646464646464646464646464646';
        const privateKey = new Secp256k1PrivateKey(testSecp256k1PrivateKey);
        expect(privateKey).toBeInstanceOf(Secp256k1PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
        expect(privateKey.toString()).toBe(testSecp256k1PrivateKey);
      });

      test('Secp256k1PrivateKey invalid length', () => {
        expect(() => new Secp256k1PrivateKey('0x1234')).toThrow(
          'PrivateKey length should be 32'
        );
      });

      test('Secp256k1PublicKey from hex', () => {
        const testSecp256k1PublicKey =
          '0x0446464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646';
        const publicKey = new Secp256k1PublicKey(testSecp256k1PublicKey);
        expect(publicKey).toBeInstanceOf(Secp256k1PublicKey);
        expect(publicKey.toUint8Array().length).toBe(65);
        expect(publicKey.toString()).toBe(testSecp256k1PublicKey);
      });

      test('Secp256k1PublicKey invalid length', () => {
        expect(() => new Secp256k1PublicKey('0x1234')).toThrow(
          'PublicKey length should be 65'
        );
      });

      test('Secp256k1 signing and verification', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();
        const signature = privateKey.sign(testMessage);

        expect(signature).toBeInstanceOf(Secp256k1Signature);
        expect(publicKey).toBeInstanceOf(Secp256k1PublicKey);
        expect(signature.toUint8Array().length).toBe(64);

        const isValid = publicKey.verifySignature({
          message: testMessage,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });

      test('Secp256k1 signing with hex message', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();
        const signature = privateKey.sign(testHexMessage);

        const isValid = publicKey.verifySignature({
          message: testHexMessage,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });

      test('Secp256k1 signing with Uint8Array message', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();
        const messageBytes = new Uint8Array([72, 101, 108, 108, 111]);
        const signature = privateKey.sign(messageBytes);

        const isValid = publicKey.verifySignature({
          message: messageBytes,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });

      test('Secp256k1 verification with wrong signature', () => {
        const privateKey1 = Secp256k1PrivateKey.generate();
        const privateKey2 = Secp256k1PrivateKey.generate();

        const publicKey1 = privateKey1.publicKey();
        const signature2 = privateKey2.sign(testMessage);

        const isValid = publicKey1.verifySignature({
          message: testMessage,
          signature: signature2,
        });
        expect(isValid).toBe(false);
      });

      test('Secp256k1 verification with wrong signature type', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();

        // Create a mock signature that's not Secp256k1Signature
        const wrongSignature = {
          toUint8Array: () => new Uint8Array(64),
        } as any;

        const isValid = publicKey.verifySignature({
          message: testMessage,
          signature: wrongSignature,
        });
        expect(isValid).toBe(false);
      });

      test('Secp256k1Signature invalid length', () => {
        expect(() => new Secp256k1Signature('0x1234')).toThrow(
          'Signature length should be 64, received 2'
        );
      });

      test('Secp256k1 serialization/deserialization', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();
        const signature = privateKey.sign(testMessage);

        // Test public key serialization
        const serializer1 = new Serializer();
        publicKey.serialize(serializer1);
        const deserializer1 = new Deserializer(serializer1.toUint8Array());
        const deserializedPublicKey =
          Secp256k1PublicKey.deserialize(deserializer1);
        expect(deserializedPublicKey.toString()).toBe(publicKey.toString());

        // Test private key serialization
        const serializer2 = new Serializer();
        privateKey.serialize(serializer2);
        const deserializer2 = new Deserializer(serializer2.toUint8Array());
        const deserializedPrivateKey =
          Secp256k1PrivateKey.deserialize(deserializer2);
        expect(deserializedPrivateKey.toString()).toBe(privateKey.toString());

        // Test signature serialization
        const serializer3 = new Serializer();
        signature.serialize(serializer3);
        const deserializer3 = new Deserializer(serializer3.toUint8Array());
        const deserializedSignature =
          Secp256k1Signature.deserialize(deserializer3);
        expect(deserializedSignature.toString()).toBe(signature.toString());
      });

      test('Secp256k1PrivateKey from derivation path', () => {
        const mnemonic =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        const path = "m/44'/637'/0'/0/0";

        const privateKey = Secp256k1PrivateKey.fromDerivationPath(
          path,
          mnemonic
        );
        expect(privateKey).toBeInstanceOf(Secp256k1PrivateKey);
        expect(privateKey.toUint8Array().length).toBe(32);
      });

      test('Secp256k1PrivateKey derivation path validation', () => {
        const mnemonic =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        // Test invalid path format
        const invalidPath = 'invalid/path';
        expect(() =>
          Secp256k1PrivateKey.fromDerivationPath(invalidPath, mnemonic)
        ).toThrow('Invalid derivation path');

        // Test another invalid path format
        const invalidPath2 = 'm/44/637/0/0/0'; // Missing apostrophes for hardened keys
        expect(() =>
          Secp256k1PrivateKey.fromDerivationPath(invalidPath2, mnemonic)
        ).toThrow('Invalid derivation path');
      });

      test('Secp256k1 deprecated methods', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();

        expect(Secp256k1PublicKey.isPublicKey(publicKey)).toBe(true);
        expect(Secp256k1PrivateKey.isPrivateKey(privateKey)).toBe(true);

        // Test with wrong types
        const ed25519PrivateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        const ed25519PublicKey = ed25519PrivateKey.publicKey();

        expect(Secp256k1PublicKey.isPublicKey(ed25519PublicKey)).toBe(false);
        expect(Secp256k1PrivateKey.isPrivateKey(ed25519PrivateKey)).toBe(false);
      });

      test('AnyPublicKey with Secp256k1PublicKey', () => {
        const secp256k1PrivateKey = Secp256k1PrivateKey.generate();
        const secp256k1PublicKey = secp256k1PrivateKey.publicKey();
        const anyPublicKey = new AnyPublicKey(secp256k1PublicKey);

        expect(anyPublicKey.variant).toBe(1); // AnyPublicKeyVariant.Secp256k1
        expect(anyPublicKey.publicKey).toBe(secp256k1PublicKey);
      });

      test('AnySignature with Secp256k1Signature', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const secp256k1Signature = privateKey.sign(testMessage);
        const anySignature = new AnySignature(secp256k1Signature);

        expect(anySignature.signature).toBe(secp256k1Signature);
      });

      test('Secp256k1 cross-verification with AnyPublicKey/AnySignature', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const secp256k1PublicKey = privateKey.publicKey();
        const anyPublicKey = new AnyPublicKey(secp256k1PublicKey);

        const secp256k1Signature = privateKey.sign(testMessage);
        const anySignature = new AnySignature(secp256k1Signature);

        const isValid = anyPublicKey.verifySignature({
          message: testMessage,
          signature: anySignature,
        });
        expect(isValid).toBe(true);
      });

      test('Secp256k1 verification with malformed message', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();
        const signature = privateKey.sign(testMessage);

        // Try to verify with a different message
        const differentMessage = 'Different message';
        const isValid = publicKey.verifySignature({
          message: differentMessage,
          signature: signature,
        });
        expect(isValid).toBe(false);
      });

      test('Secp256k1 edge case with empty message', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();

        const emptyMessage = '';
        const signature = privateKey.sign(emptyMessage);

        const isValid = publicKey.verifySignature({
          message: emptyMessage,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });

      test('Secp256k1 with very long message', () => {
        const privateKey = Secp256k1PrivateKey.generate();
        const publicKey = privateKey.publicKey();

        const longMessage = 'A'.repeat(10000); // Very long message
        const signature = privateKey.sign(longMessage);

        const isValid = publicKey.verifySignature({
          message: longMessage,
          signature: signature,
        });
        expect(isValid).toBe(true);
      });
    });

    describe('MultiEd25519 Comprehensive Tests', () => {
      test('MultiEd25519PublicKey creation', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 1,
        });

        expect(multiPublicKey).toBeInstanceOf(MultiEd25519PublicKey);
        expect(multiPublicKey.publicKeys.length).toBe(2);
        expect(multiPublicKey.threshold).toBe(1);
      });

      test('MultiEd25519 threshold validation', () => {
        const publicKey1 = Ed25519PrivateKey.generate().publicKey();
        const publicKey2 = Ed25519PrivateKey.generate().publicKey();

        expect(
          () =>
            new MultiEd25519PublicKey({
              publicKeys: [publicKey1, publicKey2],
              threshold: 33,
            })
        ).toThrow('Threshold must be between 1 and 2, inclusive');
      });

      test('MultiEd25519 empty keys validation', () => {
        expect(
          () =>
            new MultiEd25519PublicKey({
              publicKeys: [],
              threshold: 1,
            })
        ).toThrow('Must have between 2 and 32 public keys, inclusive');
      });

      test('MultiEd25519PublicKey toUint8Array', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 2,
        });

        const bytes = multiPublicKey.toUint8Array();
        // Should be 2 * 32 bytes for keys + 1 byte for threshold
        expect(bytes.length).toBe(65);
        expect(bytes[64]).toBe(2); // threshold at the end
      });

      test('MultiEd25519PublicKey authKey', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 1,
        });

        const authKey = multiPublicKey.authKey();
        expect(authKey).toBeInstanceOf(AuthenticationKey);
      });

      test('MultiEd25519PublicKey serialization/deserialization', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 2,
        });

        const serializer = new Serializer();
        multiPublicKey.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserializedKey = MultiEd25519PublicKey.deserialize(deserializer);

        expect(deserializedKey.publicKeys.length).toBe(2);
        expect(deserializedKey.threshold).toBe(2);
        expect(deserializedKey.toString()).toBe(multiPublicKey.toString());
      });

      test('MultiEd25519Signature creation with bitmap array', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();

        const signature1 = privateKey1.sign(testMessage);
        const signature2 = privateKey2.sign(testMessage);

        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1, signature2],
          bitmap: [0, 1], // First and second signatures
        });

        expect(multiSignature).toBeInstanceOf(MultiEd25519Signature);
        expect(multiSignature.signatures.length).toBe(2);
        expect(multiSignature.bitmap.length).toBe(4);
      });

      test('MultiEd25519Signature creation with Uint8Array bitmap', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const signature1 = privateKey1.sign(testMessage);

        const bitmap = new Uint8Array([128, 0, 0, 0]); // First bit set
        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1],
          bitmap: bitmap,
        });

        expect(multiSignature.signatures.length).toBe(1);
        expect(multiSignature.bitmap).toEqual(bitmap);
      });

      test('MultiEd25519Signature bitmap validation', () => {
        const signature = Ed25519PrivateKey.generate().sign(testMessage);

        // Test invalid bitmap length
        expect(
          () =>
            new MultiEd25519Signature({
              signatures: [signature],
              bitmap: new Uint8Array([128, 0]), // Wrong length
            })
        ).toThrow('"bitmap" length should be 4');

        // Test too many signatures
        const signatures = Array(33).fill(signature);
        expect(
          () =>
            new MultiEd25519Signature({
              signatures: signatures,
              bitmap: [0],
            })
        ).toThrow('The number of signatures cannot be greater than 32');
      });

      test('MultiEd25519Signature.createBitmap basic functionality', () => {
        const bitmap = MultiEd25519Signature.createBitmap({ bits: [0, 2, 31] });
        expect(bitmap.length).toBe(4);
        // First bit (0) should be set in first byte: 128 = 0b10000000
        expect(bitmap[0]).toBe(128 + 32); // First and third bits: 128 + 32 = 160
        // Last bit (31) should be set in last byte: 1 = 0b00000001
        expect(bitmap[3]).toBe(1);
      });

      test('MultiEd25519Signature.createBitmap validation', () => {
        // Test signature index too large
        expect(() =>
          MultiEd25519Signature.createBitmap({ bits: [32] })
        ).toThrow('Cannot have a signature larger than 31');

        // Test duplicate bits
        expect(() =>
          MultiEd25519Signature.createBitmap({ bits: [0, 0] })
        ).toThrow('Duplicate bits detected');

        // Test unsorted bits
        expect(() =>
          MultiEd25519Signature.createBitmap({ bits: [1, 0] })
        ).toThrow('The bits need to be sorted in ascending order');
      });

      test('MultiEd25519Signature toUint8Array', () => {
        const signature1 = Ed25519PrivateKey.generate().sign(testMessage);
        const signature2 = Ed25519PrivateKey.generate().sign(testMessage);

        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1, signature2],
          bitmap: [0, 1],
        });

        const bytes = multiSignature.toUint8Array();
        // Should be 2 * 64 bytes for signatures + 4 bytes for bitmap
        expect(bytes.length).toBe(132);
      });

      test('MultiEd25519Signature serialization/deserialization', () => {
        const signature1 = Ed25519PrivateKey.generate().sign(testMessage);
        const signature2 = Ed25519PrivateKey.generate().sign(testMessage);

        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1, signature2],
          bitmap: [0, 2],
        });

        const serializer = new Serializer();
        multiSignature.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserializedSignature =
          MultiEd25519Signature.deserialize(deserializer);

        expect(deserializedSignature.signatures.length).toBe(2);
        expect(deserializedSignature.bitmap).toEqual(multiSignature.bitmap);
      });

      test('MultiEd25519PublicKey verifySignature success', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 1,
        });

        const signature1 = privateKey1.sign(testMessage);
        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1],
          bitmap: [0], // First signature
        });

        const isValid = multiPublicKey.verifySignature({
          message: testMessage,
          signature: multiSignature,
        });
        expect(isValid).toBe(true);
      });

      test('MultiEd25519PublicKey verifySignature with multiple signatures', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 2,
        });

        const signature1 = privateKey1.sign(testMessage);
        const signature2 = privateKey2.sign(testMessage);
        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1, signature2],
          bitmap: [0, 1], // Both signatures
        });

        const isValid = multiPublicKey.verifySignature({
          message: testMessage,
          signature: multiSignature,
        });
        expect(isValid).toBe(true);
      });

      test('MultiEd25519PublicKey verifySignature with wrong signature type', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 1,
        });

        const wrongSignature = privateKey1.sign(testMessage); // Regular Ed25519Signature

        const isValid = multiPublicKey.verifySignature({
          message: testMessage,
          signature: wrongSignature,
        });
        expect(isValid).toBe(false);
      });

      test('MultiEd25519PublicKey verifySignature error cases', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 2,
        });

        // Test bitmap and signatures length mismatch
        const signature1 = privateKey1.sign(testMessage);
        const multiSignature = new MultiEd25519Signature({
          signatures: [signature1],
          bitmap: new Uint8Array([192, 0, 0, 0]), // Two bits set but only one signature
        });

        expect(() =>
          multiPublicKey.verifySignature({
            message: testMessage,
            signature: multiSignature,
          })
        ).toThrow('Bitmap and signatures length mismatch');

        // Test not enough signatures
        const singleSigMultiSig = new MultiEd25519Signature({
          signatures: [signature1],
          bitmap: [0], // Only one signature but threshold is 2
        });

        expect(() =>
          multiPublicKey.verifySignature({
            message: testMessage,
            signature: singleSigMultiSig,
          })
        ).toThrow('Not enough signatures');
      });

      test('MultiEd25519PublicKey verifySignature with invalid signature', () => {
        const privateKey1 = Ed25519PrivateKey.generate();
        const privateKey2 = Ed25519PrivateKey.generate();
        const privateKey3 = Ed25519PrivateKey.generate(); // Different key
        const publicKey1 = privateKey1.publicKey();
        const publicKey2 = privateKey2.publicKey();

        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [publicKey1, publicKey2],
          threshold: 1,
        });

        // Sign with different private key
        const invalidSignature = privateKey3.sign(testMessage);
        const multiSignature = new MultiEd25519Signature({
          signatures: [invalidSignature],
          bitmap: [0], // First signature position but wrong key
        });

        const isValid = multiPublicKey.verifySignature({
          message: testMessage,
          signature: multiSignature,
        });
        expect(isValid).toBe(false);
      });
    });

    describe('MultiKey Comprehensive Tests', () => {
      test('MultiKey creation', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const secp256k1Key = Secp256k1PrivateKey.generate().publicKey();

        const multiKey = new MultiKey({
          publicKeys: [
            new AnyPublicKey(ed25519Key),
            new AnyPublicKey(secp256k1Key),
          ],
          signaturesRequired: 1,
        });

        expect(multiKey).toBeInstanceOf(MultiKey);
        expect(multiKey.publicKeys.length).toBe(2);
        expect(multiKey.signaturesRequired).toBe(1);
      });

      test('MultiKey creation with mixed key types', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const secp256k1Key = Secp256k1PrivateKey.generate().publicKey();

        // Test with direct PublicKey instances (not wrapped in AnyPublicKey)
        const multiKey = new MultiKey({
          publicKeys: [ed25519Key, secp256k1Key],
          signaturesRequired: 2,
        });

        expect(multiKey.publicKeys[0]).toBeInstanceOf(AnyPublicKey);
        expect(multiKey.publicKeys[1]).toBeInstanceOf(AnyPublicKey);
      });

      test('MultiKey threshold validation', () => {
        const publicKey = new AnyPublicKey(
          Ed25519PrivateKey.generate().publicKey()
        );

        expect(
          () =>
            new MultiKey({
              publicKeys: [publicKey],
              signaturesRequired: 33,
            })
        ).toThrow(
          'Provided 1 public keys is smaller than the 33 required signatures'
        );

        // Test zero signatures required
        expect(
          () =>
            new MultiKey({
              publicKeys: [publicKey],
              signaturesRequired: 0,
            })
        ).toThrow(
          'The number of required signatures needs to be greater than 0'
        );
      });

      test('MultiKey empty keys validation', () => {
        expect(
          () =>
            new MultiKey({
              publicKeys: [],
              signaturesRequired: 1,
            })
        ).toThrow(
          'Provided 0 public keys is smaller than the 1 required signatures'
        );
      });

      test('MultiKey verifySignature throws not implemented', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const multiKey = new MultiKey({
          publicKeys: [ed25519Key],
          signaturesRequired: 1,
        });

        expect(() =>
          multiKey.verifySignature({
            message: testMessage,
            signature: {} as any,
          })
        ).toThrow('not implemented');
      });

      test('MultiKey authKey', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const multiKey = new MultiKey({
          publicKeys: [ed25519Key],
          signaturesRequired: 1,
        });

        const authKey = multiKey.authKey();
        expect(authKey).toBeInstanceOf(AuthenticationKey);
      });

      test('MultiKey toUint8Array', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const multiKey = new MultiKey({
          publicKeys: [ed25519Key],
          signaturesRequired: 1,
        });

        const bytes = multiKey.toUint8Array();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBeGreaterThan(0);
      });

      test('MultiKey serialization/deserialization', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const secp256k1Key = Secp256k1PrivateKey.generate().publicKey();

        const multiKey = new MultiKey({
          publicKeys: [ed25519Key, secp256k1Key],
          signaturesRequired: 2,
        });

        const serializer = new Serializer();
        multiKey.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserializedKey = MultiKey.deserialize(deserializer);

        expect(deserializedKey.publicKeys.length).toBe(2);
        expect(deserializedKey.signaturesRequired).toBe(2);
      });

      test('MultiKey createBitmap', () => {
        const ed25519Key1 = Ed25519PrivateKey.generate().publicKey();
        const ed25519Key2 = Ed25519PrivateKey.generate().publicKey();
        const ed25519Key3 = Ed25519PrivateKey.generate().publicKey();

        const multiKey = new MultiKey({
          publicKeys: [ed25519Key1, ed25519Key2, ed25519Key3],
          signaturesRequired: 2,
        });

        const bitmap = multiKey.createBitmap({ bits: [0, 2] });
        expect(bitmap.length).toBe(4);
        // First bit (0) should be set: 128 = 0b10000000
        // Third bit (2) should be set: 32 = 0b00100000
        expect(bitmap[0]).toBe(128 + 32); // 160
      });

      test('MultiKey createBitmap validation', () => {
        const ed25519Key1 = Ed25519PrivateKey.generate().publicKey();
        const ed25519Key2 = Ed25519PrivateKey.generate().publicKey();
        const ed25519Key3 = Ed25519PrivateKey.generate().publicKey();

        const multiKey = new MultiKey({
          publicKeys: [ed25519Key1, ed25519Key2, ed25519Key3],
          signaturesRequired: 1,
        });

        // Test duplicate bits (now we have enough keys to avoid the range error)
        expect(() => multiKey.createBitmap({ bits: [0, 0] })).toThrow(
          'Duplicate bit 0 detected'
        );

        // Test signature index out of range with a single key multikey
        const singleKeyMultiKey = new MultiKey({
          publicKeys: [ed25519Key1],
          signaturesRequired: 1,
        });

        expect(() => singleKeyMultiKey.createBitmap({ bits: [0, 1] })).toThrow(
          'Signature index 2 is out of public keys range, 1'
        );
      });

      test('MultiKey getIndex', () => {
        const ed25519Key = Ed25519PrivateKey.generate().publicKey();
        const secp256k1Key = Secp256k1PrivateKey.generate().publicKey();

        const multiKey = new MultiKey({
          publicKeys: [ed25519Key, secp256k1Key],
          signaturesRequired: 1,
        });

        // Test with direct PublicKey
        const index1 = multiKey.getIndex(ed25519Key);
        expect(index1).toBe(0);

        // Test with AnyPublicKey
        const anySecp256k1Key = new AnyPublicKey(secp256k1Key);
        const index2 = multiKey.getIndex(anySecp256k1Key);
        expect(index2).toBe(1);

        // Test with non-existent key
        const nonExistentKey = Ed25519PrivateKey.generate().publicKey();
        expect(() => multiKey.getIndex(nonExistentKey)).toThrow(
          'Public key not found in MultiKey'
        );
      });

      test('MultiKeySignature creation with bitmap array', () => {
        const ed25519Signature = Ed25519PrivateKey.generate().sign(testMessage);
        const secp256k1Signature =
          Secp256k1PrivateKey.generate().sign(testMessage);

        const multiKeySignature = new MultiKeySignature({
          signatures: [ed25519Signature, secp256k1Signature],
          bitmap: [0, 1],
        });

        expect(multiKeySignature).toBeInstanceOf(MultiKeySignature);
        expect(multiKeySignature.signatures.length).toBe(2);
        expect(multiKeySignature.signatures[0]).toBeInstanceOf(AnySignature);
      });

      test('MultiKeySignature creation with Uint8Array bitmap', () => {
        const signature = Ed25519PrivateKey.generate().sign(testMessage);
        const bitmap = new Uint8Array([128, 0, 0, 0]); // First bit set

        const multiKeySignature = new MultiKeySignature({
          signatures: [signature],
          bitmap: bitmap,
        });

        expect(multiKeySignature.signatures.length).toBe(1);
        expect(multiKeySignature.bitmap).toEqual(bitmap);
      });

      test('MultiKeySignature validation', () => {
        const signature = Ed25519PrivateKey.generate().sign(testMessage);

        // Test invalid bitmap length
        expect(
          () =>
            new MultiKeySignature({
              signatures: [signature],
              bitmap: new Uint8Array([128, 0]), // Wrong length
            })
        ).toThrow('"bitmap" length should be 4');

        // Test too many signatures
        const signatures = Array(33).fill(signature);
        expect(
          () =>
            new MultiKeySignature({
              signatures: signatures,
              bitmap: [0],
            })
        ).toThrow('The number of signatures cannot be greater than 32');

        // Test bitmap/signatures mismatch
        expect(
          () =>
            new MultiKeySignature({
              signatures: [signature, signature], // 2 signatures
              bitmap: [0], // Only 1 bit set
            })
        ).toThrow('Expecting 1 signatures from the bitmap, but got 2');
      });

      test('MultiKeySignature.createBitmap', () => {
        const bitmap = MultiKeySignature.createBitmap({ bits: [0, 2, 31] });
        expect(bitmap.length).toBe(4);
        // Verify specific bit positions
        expect(bitmap[0]).toBe(128 + 32); // First and third bits: 160
        expect(bitmap[3]).toBe(1); // Last bit
      });

      test('MultiKeySignature.createBitmap validation', () => {
        // Test signature index too large
        expect(() => MultiKeySignature.createBitmap({ bits: [32] })).toThrow(
          'Cannot have a signature larger than 31'
        );

        // Test duplicate bits
        expect(() => MultiKeySignature.createBitmap({ bits: [0, 0] })).toThrow(
          'Duplicate bits detected'
        );
      });

      test('MultiKeySignature toUint8Array', () => {
        const signature1 = Ed25519PrivateKey.generate().sign(testMessage);
        const signature2 = Secp256k1PrivateKey.generate().sign(testMessage);

        const multiKeySignature = new MultiKeySignature({
          signatures: [signature1, signature2],
          bitmap: [0, 1],
        });

        const bytes = multiKeySignature.toUint8Array();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBeGreaterThan(0);
      });

      test('MultiKeySignature serialization/deserialization', () => {
        const signature1 = Ed25519PrivateKey.generate().sign(testMessage);
        const signature2 = Secp256k1PrivateKey.generate().sign(testMessage);

        const multiKeySignature = new MultiKeySignature({
          signatures: [signature1, signature2],
          bitmap: [0, 2],
        });

        const serializer = new Serializer();
        multiKeySignature.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserializedSignature =
          MultiKeySignature.deserialize(deserializer);

        expect(deserializedSignature.signatures.length).toBe(2);
        expect(deserializedSignature.bitmap).toEqual(multiKeySignature.bitmap);
      });

      test('MultiKeySignature with mixed signature types', () => {
        const ed25519Signature = Ed25519PrivateKey.generate().sign(testMessage);
        const secp256k1Signature =
          Secp256k1PrivateKey.generate().sign(testMessage);

        // Test with both direct Signature and AnySignature
        const multiKeySignature = new MultiKeySignature({
          signatures: [ed25519Signature, new AnySignature(secp256k1Signature)],
          bitmap: [0, 1],
        });

        expect(multiKeySignature.signatures[0]).toBeInstanceOf(AnySignature);
        expect(multiKeySignature.signatures[1]).toBeInstanceOf(AnySignature);
      });
    });

    describe('Edge Cases and Error Handling', () => {
      test('Hex input validation in Ed25519', () => {
        // Test with valid hex but wrong length
        expect(() => new Ed25519PublicKey('0x1234')).toThrow();
        expect(() => new Ed25519PrivateKey('0x1234')).toThrow();
        expect(() => new Ed25519Signature('0x1234')).toThrow();
      });

      test('Message conversion edge cases', () => {
        // Empty string
        const emptyResult = convertSigningMessage('');
        expect(emptyResult).toBeInstanceOf(Buffer);
        expect((emptyResult as Buffer).length).toBe(0);

        // Empty Uint8Array
        const emptyArray = new Uint8Array(0);
        const arrayResult = convertSigningMessage(emptyArray);
        expect(arrayResult).toBe(emptyArray);

        // Valid hex string with mixed case
        const mixedCaseHex = '0xaBcDeF';
        const hexResult = convertSigningMessage(mixedCaseHex);
        expect(hexResult).toBe(mixedCaseHex);
      });

      test('Serialization with empty data', () => {
        // Test edge cases in serialization
        const serializer = new Serializer();
        serializer.serializeBytes(new Uint8Array(0));

        const deserializer = new Deserializer(serializer.toUint8Array());
        const result = deserializer.deserializeBytes();
        expect(result.length).toBe(0);
      });
    });
  });

  describe('v2 Transaction Authenticator Tests', () => {
    const {
      AccountAuthenticator,
      AccountAuthenticatorEd25519,
      AccountAuthenticatorMultiEd25519,
      AccountAuthenticatorSingleKey,
      AccountAuthenticatorMultiKey,
      AccountAuthenticatorNoAccountAuthenticator,
      AccountAuthenticatorAbstraction,
    } = require('../src/v2/transactions/authenticator/account');

    const {
      TransactionAuthenticator,
      TransactionAuthenticatorEd25519,
      TransactionAuthenticatorMultiEd25519,
      TransactionAuthenticatorMultiAgent,
      TransactionAuthenticatorFeePayer,
      TransactionAuthenticatorSingleSender,
    } = require('../src/v2/transactions/authenticator/transaction');

    // Test data
    const testPrivateKeyHex =
      '0x4a6d287353203941768551f66446d5d4a85ab685b5b444041801014ae39419b5';
    const testMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const testAddress =
      '0x7eaead7cf02b43db13f948bc3e2704c8885b2aebf0c214ff980b791cbf227c19';

    describe('Account Authenticator Tests', () => {
      let ed25519PrivateKey: Ed25519PrivateKey;
      let ed25519PublicKey: Ed25519PublicKey;
      let ed25519Signature: Ed25519Signature;
      let ed25519PrivateKey2: Ed25519PrivateKey;
      let ed25519PublicKey2: Ed25519PublicKey;

      beforeEach(() => {
        ed25519PrivateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        ed25519PublicKey = ed25519PrivateKey.publicKey();
        ed25519Signature = ed25519PrivateKey.sign(testMessage);
        // Create a second key for MultiEd25519 tests
        ed25519PrivateKey2 = Ed25519PrivateKey.generate();
        ed25519PublicKey2 = ed25519PrivateKey2.publicKey();
      });

      test('AccountAuthenticatorEd25519 creation and methods', () => {
        const authenticator = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        expect(authenticator.public_key).toBe(ed25519PublicKey);
        expect(authenticator.signature).toBe(ed25519Signature);
        expect(authenticator.isEd25519()).toBe(true);
        expect(authenticator.isMultiEd25519()).toBe(false);
        expect(authenticator.isSingleKey()).toBe(false);
        expect(authenticator.isMultiKey()).toBe(false);
      });

      test('AccountAuthenticatorEd25519 serialization/deserialization', () => {
        const authenticator = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(AccountAuthenticatorEd25519);
        expect(deserialized.isEd25519()).toBe(true);
      });

      test('AccountAuthenticatorMultiEd25519 creation and methods', () => {
        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [ed25519PublicKey, ed25519PublicKey2],
          threshold: 1,
        });
        const multiSignature = new MultiEd25519Signature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });

        const authenticator = new AccountAuthenticatorMultiEd25519(
          multiPublicKey,
          multiSignature
        );

        expect(authenticator.public_key).toBe(multiPublicKey);
        expect(authenticator.signature).toBe(multiSignature);
        expect(authenticator.isEd25519()).toBe(false);
        expect(authenticator.isMultiEd25519()).toBe(true);
        expect(authenticator.isSingleKey()).toBe(false);
        expect(authenticator.isMultiKey()).toBe(false);
      });

      test('AccountAuthenticatorMultiEd25519 serialization/deserialization', () => {
        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [ed25519PublicKey, ed25519PublicKey2],
          threshold: 1,
        });
        const multiSignature = new MultiEd25519Signature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });
        const authenticator = new AccountAuthenticatorMultiEd25519(
          multiPublicKey,
          multiSignature
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(AccountAuthenticatorMultiEd25519);
        expect(deserialized.isMultiEd25519()).toBe(true);
      });

      test('AccountAuthenticatorSingleKey creation and methods', () => {
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
        const anySignature = new AnySignature(ed25519Signature);

        const authenticator = new AccountAuthenticatorSingleKey(
          anyPublicKey,
          anySignature
        );

        expect(authenticator.public_key).toBe(anyPublicKey);
        expect(authenticator.signature).toBe(anySignature);
        expect(authenticator.isEd25519()).toBe(false);
        expect(authenticator.isMultiEd25519()).toBe(false);
        expect(authenticator.isSingleKey()).toBe(true);
        expect(authenticator.isMultiKey()).toBe(false);
      });

      test('AccountAuthenticatorSingleKey serialization/deserialization', () => {
        const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
        const anySignature = new AnySignature(ed25519Signature);
        const authenticator = new AccountAuthenticatorSingleKey(
          anyPublicKey,
          anySignature
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(AccountAuthenticatorSingleKey);
        expect(deserialized.isSingleKey()).toBe(true);
      });

      test('AccountAuthenticatorMultiKey creation and methods', () => {
        const multiKey = new MultiKey({
          publicKeys: [ed25519PublicKey],
          signaturesRequired: 1,
        });
        const multiKeySignature = new MultiKeySignature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });

        const authenticator = new AccountAuthenticatorMultiKey(
          multiKey,
          multiKeySignature
        );

        expect(authenticator.public_keys).toBe(multiKey);
        expect(authenticator.signatures).toBe(multiKeySignature);
        expect(authenticator.isEd25519()).toBe(false);
        expect(authenticator.isMultiEd25519()).toBe(false);
        expect(authenticator.isSingleKey()).toBe(false);
        expect(authenticator.isMultiKey()).toBe(true);
      });

      test('AccountAuthenticatorMultiKey serialization/deserialization', () => {
        const multiKey = new MultiKey({
          publicKeys: [ed25519PublicKey],
          signaturesRequired: 1,
        });
        const multiKeySignature = new MultiKeySignature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });
        const authenticator = new AccountAuthenticatorMultiKey(
          multiKey,
          multiKeySignature
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(AccountAuthenticatorMultiKey);
        expect(deserialized.isMultiKey()).toBe(true);
      });

      test('AccountAuthenticatorNoAccountAuthenticator creation and methods', () => {
        const authenticator = new AccountAuthenticatorNoAccountAuthenticator();

        expect(authenticator.isEd25519()).toBe(false);
        expect(authenticator.isMultiEd25519()).toBe(false);
        expect(authenticator.isSingleKey()).toBe(false);
        expect(authenticator.isMultiKey()).toBe(false);
      });

      test('AccountAuthenticatorNoAccountAuthenticator serialization/deserialization', () => {
        const authenticator = new AccountAuthenticatorNoAccountAuthenticator();

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(
          AccountAuthenticatorNoAccountAuthenticator
        );
      });

      test('AccountAuthenticatorAbstraction creation and validation', () => {
        const functionInfo = '0x1::test_module::test_function';
        const signingMessageDigest = '0x123456';
        const authenticatorHex = '0xabcdef';

        const authenticator = new AccountAuthenticatorAbstraction(
          functionInfo,
          signingMessageDigest,
          authenticatorHex
        );

        expect(authenticator.functionInfo).toBe(functionInfo);
        expect(authenticator.signingMessageDigest).toBeInstanceOf(Hex);
        expect(authenticator.authenticator).toBeInstanceOf(Hex);
      });

      test('AccountAuthenticatorAbstraction invalid function info', () => {
        const invalidFunctionInfo = 'invalid_function_info';
        const signingMessageDigest = '0x123456';
        const authenticatorHex = '0xabcdef';

        expect(
          () =>
            new AccountAuthenticatorAbstraction(
              invalidFunctionInfo,
              signingMessageDigest,
              authenticatorHex
            )
        ).toThrow('Invalid function info');
      });

      test('AccountAuthenticatorAbstraction serialization/deserialization', () => {
        const functionInfo = '0x1::test_module::test_function';
        const signingMessageDigest = '0x123456';
        const authenticatorHex = '0xabcdef';

        const authenticator = new AccountAuthenticatorAbstraction(
          functionInfo,
          signingMessageDigest,
          authenticatorHex
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = AccountAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(AccountAuthenticatorAbstraction);
        expect((deserialized as any).functionInfo).toBe(functionInfo);
      });

      test('AccountAuthenticator unknown variant error', () => {
        const invalidData = new Uint8Array([99]); // Invalid variant index
        const deserializer = new Deserializer(invalidData);

        expect(() => AccountAuthenticator.deserialize(deserializer)).toThrow(
          'Unknown variant index for AccountAuthenticator: 99'
        );
      });
    });

    describe('Transaction Authenticator Tests', () => {
      let ed25519PrivateKey: Ed25519PrivateKey;
      let ed25519PublicKey: Ed25519PublicKey;
      let ed25519Signature: Ed25519Signature;
      let ed25519PrivateKey2: Ed25519PrivateKey;
      let ed25519PublicKey2: Ed25519PublicKey;

      beforeEach(() => {
        ed25519PrivateKey = new Ed25519PrivateKey(testPrivateKeyHex);
        ed25519PublicKey = ed25519PrivateKey.publicKey();
        ed25519Signature = ed25519PrivateKey.sign(testMessage);
        // Create a second key for MultiEd25519 tests
        ed25519PrivateKey2 = Ed25519PrivateKey.generate();
        ed25519PublicKey2 = ed25519PrivateKey2.publicKey();
      });

      test('TransactionAuthenticatorEd25519 creation and serialization', () => {
        const authenticator = new TransactionAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        expect(authenticator.public_key).toBe(ed25519PublicKey);
        expect(authenticator.signature).toBe(ed25519Signature);

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorEd25519);
      });

      test('TransactionAuthenticatorMultiEd25519 creation and serialization', () => {
        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [ed25519PublicKey, ed25519PublicKey2],
          threshold: 1,
        });
        const multiSignature = new MultiEd25519Signature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });

        const authenticator = new TransactionAuthenticatorMultiEd25519(
          multiPublicKey,
          multiSignature
        );

        expect(authenticator.public_key).toBe(multiPublicKey);
        expect(authenticator.signature).toBe(multiSignature);

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(
          TransactionAuthenticatorMultiEd25519
        );
      });

      test('TransactionAuthenticatorMultiAgent creation and serialization', () => {
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const secondaryAddresses = [AccountAddress.fromString(testAddress)];
        const secondarySigners = [
          new AccountAuthenticatorEd25519(ed25519PublicKey, ed25519Signature),
        ];

        const authenticator = new TransactionAuthenticatorMultiAgent(
          sender,
          secondaryAddresses,
          secondarySigners
        );

        expect(authenticator.sender).toBe(sender);
        expect(authenticator.secondary_signer_addresses).toBe(
          secondaryAddresses
        );
        expect(authenticator.secondary_signers).toBe(secondarySigners);

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorMultiAgent);
      });

      test('TransactionAuthenticatorFeePayer creation and serialization', () => {
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const secondaryAddresses = [AccountAddress.fromString(testAddress)];
        const secondarySigners = [
          new AccountAuthenticatorEd25519(ed25519PublicKey, ed25519Signature),
        ];
        const feePayerAddress = AccountAddress.fromString('0x2');
        const feePayerAuth = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        const authenticator = new TransactionAuthenticatorFeePayer(
          sender,
          secondaryAddresses,
          secondarySigners,
          { address: feePayerAddress, authenticator: feePayerAuth }
        );

        expect(authenticator.sender).toBe(sender);
        expect(authenticator.secondary_signer_addresses).toBe(
          secondaryAddresses
        );
        expect(authenticator.secondary_signers).toBe(secondarySigners);
        expect(authenticator.fee_payer.address).toBe(feePayerAddress);
        expect(authenticator.fee_payer.authenticator).toBe(feePayerAuth);

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorFeePayer);
      });

      test('TransactionAuthenticatorSingleSender creation and serialization', () => {
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        const authenticator = new TransactionAuthenticatorSingleSender(sender);

        expect(authenticator.sender).toBe(sender);

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(
          TransactionAuthenticatorSingleSender
        );
      });

      test('TransactionAuthenticator unknown variant error', () => {
        const invalidData = new Uint8Array([99]); // Invalid variant index
        const deserializer = new Deserializer(invalidData);

        expect(() =>
          TransactionAuthenticator.deserialize(deserializer)
        ).toThrow('Unknown variant index for TransactionAuthenticator: 99');
      });

      test('TransactionAuthenticatorMultiAgent with empty secondary signers', () => {
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const secondaryAddresses: any[] = [];
        const secondarySigners: any[] = [];

        const authenticator = new TransactionAuthenticatorMultiAgent(
          sender,
          secondaryAddresses,
          secondarySigners
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorMultiAgent);
        expect((deserialized as any).secondary_signer_addresses.length).toBe(0);
        expect((deserialized as any).secondary_signers.length).toBe(0);
      });

      test('TransactionAuthenticatorFeePayer with empty secondary signers', () => {
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const secondaryAddresses: any[] = [];
        const secondarySigners: any[] = [];
        const feePayerAddress = AccountAddress.fromString('0x2');
        const feePayerAuth = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );

        const authenticator = new TransactionAuthenticatorFeePayer(
          sender,
          secondaryAddresses,
          secondarySigners,
          { address: feePayerAddress, authenticator: feePayerAuth }
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorFeePayer);
        expect((deserialized as any).secondary_signer_addresses.length).toBe(0);
        expect((deserialized as any).secondary_signers.length).toBe(0);
      });

      test('All authenticator load methods', () => {
        // Test direct load methods
        const serializer1 = new Serializer();
        ed25519PublicKey.serialize(serializer1);
        ed25519Signature.serialize(serializer1);

        const deserializer1 = new Deserializer(serializer1.toUint8Array());
        const loaded1 = TransactionAuthenticatorEd25519.load(deserializer1);
        expect(loaded1).toBeInstanceOf(TransactionAuthenticatorEd25519);

        // Test MultiEd25519 load
        const multiPublicKey = new MultiEd25519PublicKey({
          publicKeys: [ed25519PublicKey, ed25519PublicKey2],
          threshold: 1,
        });
        const multiSignature = new MultiEd25519Signature({
          signatures: [ed25519Signature],
          bitmap: [0],
        });

        const serializer2 = new Serializer();
        multiPublicKey.serialize(serializer2);
        multiSignature.serialize(serializer2);

        const deserializer2 = new Deserializer(serializer2.toUint8Array());
        const loaded2 =
          TransactionAuthenticatorMultiEd25519.load(deserializer2);
        expect(loaded2).toBeInstanceOf(TransactionAuthenticatorMultiEd25519);

        // Test MultiAgent load
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const serializer3 = new Serializer();
        sender.serialize(serializer3);
        serializer3.serializeVector([]);
        serializer3.serializeVector([]);

        const deserializer3 = new Deserializer(serializer3.toUint8Array());
        const loaded3 = TransactionAuthenticatorMultiAgent.load(deserializer3);
        expect(loaded3).toBeInstanceOf(TransactionAuthenticatorMultiAgent);

        // Test SingleSender load
        const serializer4 = new Serializer();
        sender.serialize(serializer4);

        const deserializer4 = new Deserializer(serializer4.toUint8Array());
        const loaded4 =
          TransactionAuthenticatorSingleSender.load(deserializer4);
        expect(loaded4).toBeInstanceOf(TransactionAuthenticatorSingleSender);
      });

      test('Complex multi-signature scenarios', () => {
        // Test with multiple secondary signers
        const sender = new AccountAuthenticatorEd25519(
          ed25519PublicKey,
          ed25519Signature
        );
        const secondaryAddresses = [
          AccountAddress.fromString('0x2'),
          AccountAddress.fromString('0x3'),
          AccountAddress.fromString('0x4'),
        ];
        const secondarySigners = [
          new AccountAuthenticatorEd25519(ed25519PublicKey, ed25519Signature),
          new AccountAuthenticatorSingleKey(
            new AnyPublicKey(ed25519PublicKey),
            new AnySignature(ed25519Signature)
          ),
          new AccountAuthenticatorMultiEd25519(
            new MultiEd25519PublicKey({
              publicKeys: [ed25519PublicKey, ed25519PublicKey2],
              threshold: 1,
            }),
            new MultiEd25519Signature({
              signatures: [ed25519Signature],
              bitmap: [0],
            })
          ),
        ];

        const authenticator = new TransactionAuthenticatorMultiAgent(
          sender,
          secondaryAddresses,
          secondarySigners
        );

        const serializer = new Serializer();
        authenticator.serialize(serializer);
        const serialized = serializer.toUint8Array();

        const deserializer = new Deserializer(serialized);
        const deserialized = TransactionAuthenticator.deserialize(deserializer);

        expect(deserialized).toBeInstanceOf(TransactionAuthenticatorMultiAgent);
        expect((deserialized as any).secondary_signer_addresses.length).toBe(3);
        expect((deserialized as any).secondary_signers.length).toBe(3);
      });
    });
  });
});

// Helper functions to create test transactions
function createTestRawTransactionWithFeePayer(
  feePayerAddress: AccountAddress
): SimpleTransaction {
  const sender = AccountAddress.from('0x1');
  const moduleId = new ModuleId(sender, new Identifier('test_module'));
  const payload = new TransactionPayloadEntryFunction(
    new EntryFunction(moduleId, new Identifier('test_function'), [], [])
  );

  const rawTxn = new RawTransaction(
    sender,
    BigInt(1),
    payload,
    BigInt(1000),
    BigInt(100),
    BigInt(Math.floor(Date.now() / 1000) + 3600),
    new ChainId(1)
  );

  return new SimpleTransaction(rawTxn, feePayerAddress);
}

function createMultiAgentTransaction(
  secondarySignerAddresses: AccountAddress[]
): MultiAgentTransaction {
  const sender = AccountAddress.from('0x1');
  const moduleId = new ModuleId(sender, new Identifier('test_module'));
  const payload = new TransactionPayloadEntryFunction(
    new EntryFunction(moduleId, new Identifier('test_function'), [], [])
  );

  const rawTxn = new RawTransaction(
    sender,
    BigInt(1),
    payload,
    BigInt(1000),
    BigInt(100),
    BigInt(Math.floor(Date.now() / 1000) + 3600),
    new ChainId(1)
  );

  return new MultiAgentTransaction(rawTxn, secondarySignerAddresses);
}

// Helper function to create a test raw transaction
function createTestRawTransaction(): SimpleTransaction {
  const sender = AccountAddress.from('0x1');
  const moduleId = new ModuleId(sender, new Identifier('test_module'));
  const payload = new TransactionPayloadEntryFunction(
    new EntryFunction(moduleId, new Identifier('test_function'), [], [])
  );

  const rawTxn = new RawTransaction(
    sender,
    BigInt(1),
    payload,
    BigInt(1000),
    BigInt(100),
    BigInt(Math.floor(Date.now() / 1000) + 3600),
    new ChainId(1)
  );

  return new SimpleTransaction(rawTxn);
}
