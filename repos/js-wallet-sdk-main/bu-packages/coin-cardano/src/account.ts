import {bip39, signUtil} from "@okxweb3/crypto-lib";
import {base} from "@okxweb3/coin-base";
import { Cardano } from "@cardano-sdk/core"
import * as Crypto from "@cardano-sdk/crypto";

export async function getNewAddress(privateKey: string) {
    await checkPrivateKey(privateKey)
    return await addressFromPubKey(await pubKeyFromPrivateKey(privateKey));
}

export async function checkPrivateKey(privateKey: string) {
    if (!base.validateHexString(privateKey)) {
        throw new Error('invalid key');
    }
    const keyBytes = base.fromHex(privateKey.toLowerCase())
    if(keyBytes.every(byte => byte===0)) {
        throw new Error("invalid key");
    }
    if (![32, 64, 96, 128].includes(keyBytes.length)) {
        throw new Error('invalid key');
    }
    return Promise.resolve(true);
}

export async function pubKeyFromPrivateKey(privateKey: string) {
    await checkPrivateKey(privateKey)
    const privKey = base.fromHex(privateKey.toLowerCase())

    const paymentPrivateKey = privKey.slice(0, 32)
    const stakePrivateKey = privKey.slice(64, 96)

    const paymentKey = signUtil.ed25519.ed25519MulBase(paymentPrivateKey)
    const stakeKey = signUtil.ed25519.ed25519MulBase(stakePrivateKey)

    return base.toHex(paymentKey) + base.toHex(stakeKey)
}

export async function addressFromPubKey(publicKey: string) {
    const pubKey = base.fromHex(publicKey.toLowerCase())
    const paymentHash =base.blake2b(pubKey.slice(0, 32), {dkLen: 28, key: undefined})
    const stakeHash =base.blake2b(pubKey.slice(32), {dkLen: 28, key: undefined})

    const paymentCredential: Cardano.Credential =  {type: Cardano.CredentialType.KeyHash, hash: Crypto.Hash28ByteBase16(base.toHex(paymentHash))}
    const stakeCredential: Cardano.Credential =  {type: Cardano.CredentialType.KeyHash, hash: Crypto.Hash28ByteBase16(base.toHex(stakeHash))}

    const address = Cardano.BaseAddress.fromCredentials(Cardano.NetworkId.Mainnet, paymentCredential, stakeCredential)
    return address.toAddress().toBech32()
}


/** GetDerivedPrivateKey
 * the derivation path format is: m / purpose' / coin_type' / account' / role / index
 *
 * m: represents the root key in a HD wallet
 *
 * purpose: a constant set to 1852, which reference standards set by CIP1852
 *
 * coin_type: a constant set to 1815, which references the birth year of Ada Lovelace
 *
 * account: the account index. HD wallets support multiple accounts
 *
 * role: this indicates the role of the generated key based on the following:
 *
 * 0: external payment address
 *
 * 1: internal change address, which might be used in receiving change from transactions
 *
 * 2: staking key address
 *
 * index: the index of the key within the role
 */

export async function getDerivedPrivateKey(mnemonic: string, path: string) {
    await Crypto.ready()
    const entropy = bip39.mnemonicToEntropy(mnemonic);
    const rootKey = Crypto.Bip32PrivateKey.fromBip39Entropy(base.fromHex(entropy), '');

    const harden = (num: number): number => {
        return 0x80000000 + num;
    };
    const splitPath = path.split('/').slice(1);
    if (splitPath.length != 5) {
        throw new Error("invalid path")
    }
    const pathArray: number[] = [];
    splitPath.forEach((e, i) => {
        if (i < 3) {
            if (e.substring(e.length - 1, e.length) != "'") throw new Error("invalid path");
            pathArray.push(harden(parseInt(e.substring(0, e.length - 1), 10)))
        } else {
            pathArray.push(parseInt(e, 10))
        }
    });
    const accountKey = rootKey.derive(pathArray.slice(0, 3))
    const keyToRawKeyHex = (key: Crypto.Bip32PrivateKey) => key.toRawKey().hex()

    const paymentKey = keyToRawKeyHex(accountKey.derive([0, pathArray[4]]))
    const stakeKey = keyToRawKeyHex(accountKey.derive([2, pathArray[4]]))

    return paymentKey + stakeKey
}


export function bech32AddressToHexAddress(address: string) {
    const [hrp, data] = base.fromBech32(address, false);
    if (hrp !== "addr" || data.length === 0) {
        throw new Error("invalid bech32 address");
    }
    return base.toHex(data)
}
