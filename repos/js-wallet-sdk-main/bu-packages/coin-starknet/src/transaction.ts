import {Account} from "./lib/account";
import * as ec from './lib/utils/ec';
import * as hash from './lib/utils/hash';
import * as json from './lib/utils/json';
import {CallData} from "./lib/utils/calldata";
import {addHexPrefix} from "./lib/utils/encode";
import {addAddressPadding} from "./lib/utils/address";

import {accountClassHash, ProxyAccountClassHash} from "./constants"
import {StarknetChainId} from "./lib/global/constants";
import {BigNumberish, ResourceBounds} from "./lib/types";

export function CalculateContractAddressFromHash(starkPub: string): string {
    const constructorCallData = {
        implementation: accountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({signer: starkPub, guardian: "0"}),
    }

    const contractAddress = hash.calculateContractAddressFromHash(
        starkPub,
        ProxyAccountClassHash,
        CallData.compile(constructorCallData),
        0
    );

    return addAddressPadding(contractAddress);
}

export async function CreateSignedDeployAccountTx(resourceBounds: ResourceBounds, chainId: StarknetChainId, privateKey: string) {
    const starkPub = ec.starkCurve.getStarkKey(privateKey);
    const contractAddress = CalculateContractAddressFromHash(starkPub);

    const AAaccount = new Account(contractAddress, addHexPrefix(privateKey));
    const constructorCallData = {
        implementation: accountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({signer: starkPub, guardian: "0"}),
    }
    const callData = CallData.compile(constructorCallData);
    const tx = await AAaccount.deployAccount(
        {
            addressSalt: starkPub,
            classHash: ProxyAccountClassHash,
            constructorCalldata: callData,
            contractAddress: contractAddress
        }, {chainId, resourceBounds});

    return {txId: tx.txId, signature: json.stringify(tx.signature)};
}

export async function CreateTransferTx(contractAddress: string, from: string, to: string, amount: BigNumberish, nonce: BigNumberish, resourceBounds: ResourceBounds, chainId: StarknetChainId, privateKey: string) {
    const AAaccount = new Account(from, addHexPrefix(privateKey));
    const tx = await AAaccount.execute({
        contractAddress: contractAddress,
        entrypoint: "transfer",
        calldata: [to, amount, 0]
    }, {
        chainId,
        nonce,
        resourceBounds,
    });
    return {txId: tx.txId, signature: json.stringify(tx.signature)};
}

export async function CreateContractCall(contractAddress: string, from: string, functionName: string, callData: string[], nonce: BigNumberish, resourceBounds: ResourceBounds, chainId: StarknetChainId, privateKey: string) {
    const AAaccount = new Account(from, addHexPrefix(privateKey));
    if (!callData) {
        callData = [];
    }
    const tx = await AAaccount.execute({
        contractAddress: contractAddress,
        entrypoint: functionName,
        calldata: callData
    }, {
        chainId,
        nonce,
        resourceBounds,
    });
    return {txId: tx.txId, signature: json.stringify(tx.signature)};
}

export type ContractCall = {
    contractAddress?: string,
    contract_address?:string,
    entrypoint?: string,
    entry_point?:string,
    calldata: string[]
}

export async function CreateMultiContractCall(from: string, calls: ContractCall[], nonce: BigNumberish, resourceBounds: ResourceBounds, chainId: StarknetChainId, privateKey: string) {
    const AAaccount = new Account(from, addHexPrefix(privateKey));
    let arr = calls.map(item => ({
        contractAddress: item.contract_address? item.contract_address:item.contractAddress!,
        entrypoint:item.entry_point? item.entry_point:item.entrypoint!,
        calldata: item.calldata,
    }))
    const tx = await AAaccount.execute(arr, {
        chainId,
        nonce,
        resourceBounds,
    });
    return {txId: tx.txId, signature: json.stringify(tx.signature)};
}
