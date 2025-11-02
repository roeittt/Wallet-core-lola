/**
 * Author:https://github.com/nbd-wtf/nostr-tools
 * */
import {secp256k1} from "@okxweb3/crypto-lib";
import {base} from "@okxweb3/coin-base";

export function generatePrivateKey(): string {
    return base.toHex(secp256k1.utils.randomPrivateKey(),false)
}

export function getPublicKey(privateKey: string): string {
    return base.toHex(secp256k1.schnorr.getPublicKey(base.stripHexPrefix(privateKey)),false)
}
