import {Signature, TypedData} from "./lib/types";
import * as ec from "./lib/utils/ec";
import {Account} from "./lib/account";
import {addHexPrefix} from "./lib/utils/encode";
import {CalculateContractAddressFromHash} from "./transaction";
import { signUtil } from "@okxweb3/crypto-lib";


export async function signMessageWithTypeData(typedData: TypedData, privateKey: string) {
    const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
    const starkPub = ec.starkCurve.getStarkKey(privateKey);
    const address = CalculateContractAddressFromHash(starkPub);
    let account = new Account(address, addHexPrefix(privateKey));

    let sig = await account.signMessage(typedData);
    let hash = await account.hashMessage(typedData);

    return {signature: sig, hash: hash, publicKey: publicKey};
}

export async function signMessage(message: string, privateKey: string) {
    const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
    const sig = ec.starkCurve.sign(message, privateKey);

    return {signature: sig, hash: message, publicKey: publicKey};
}

type Hex = Uint8Array | string;

export function verifyMessage(signature: Signature | Hex, msgHash: Hex, publicKey: Hex) {
    //@ts-ignore
    return signUtil.schnorr.stark.verify(signature, msgHash, publicKey);
}

