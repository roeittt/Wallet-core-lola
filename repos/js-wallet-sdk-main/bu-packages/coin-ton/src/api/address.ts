import {signUtil} from "@okxweb3/crypto-lib";
import {base} from "@okxweb3/coin-base";
import {VenomWalletV3} from "../ton";
import {Address} from "../lib/ton-core";
import {WalletContractV4, WalletContractV5R1} from "../ton";
import {WalletContract} from "./types";
export type ApiNetwork = 'mainnet' | 'testnet';


export function getWalletContract(walletVersion: string | undefined, publicK: Uint8Array | string, workchain?: number): WalletContract {
    if (typeof(publicK) == 'string') {
        publicK = base.fromHex(publicK);
    }
    workchain = workchain || 0

    if (!walletVersion || walletVersion == "v4r2" || walletVersion == "v4R2") {
        return WalletContractV4.create({workchain: workchain, publicKey: Buffer.from(publicK)});
    }

    if (walletVersion == "v5r1" || walletVersion == "v5R1") {
        return WalletContractV5R1.create({workchain: workchain, publicKey: Buffer.from(publicK)});
    }

    throw new Error("invalid wallet version");
}

export function getPubKeyBySeed(seed: string) {
    checkSeed(seed);
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    return base.toHex(publicKey);
}

export function checkSeed(seed: string) {
    if (!base.validateHexString(seed)) {
        throw new Error("invalid key");
    }
    const buf = base.fromHex(seed.toLowerCase());
    if (!buf || (buf.length != 32) || buf.every(byte=>byte===0)) {
        throw new Error("invalid key");
    }
}

export function getAddressBySeed(seed: string, version?: string): string {
    checkSeed(seed);
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = getWalletContract(version, publicKey)
    return wallet.address.toString({bounceable: false});
}

export function parseAddress(address: string): {
    isValid: boolean;
    isRaw?: boolean;
    isUserFriendly?: boolean;
    isBounceable?: boolean;
    isTestOnly?: boolean;
    address?: Address;
    isUrlSafe?: boolean;
} {
    try {
        if (Address.isRaw(address)) {
            return {
                address: Address.parseRaw(address),
                isRaw: true,
                isValid: true,
            };
        } else if (Address.isFriendly(address)) {
            const addr = Address.parseFriendly(address)
            if (addr.isTestOnly) {
                return {isValid: false};
            }
            return {
                ...addr,
                isUserFriendly: true,
                isValid: true,
            };
        }
    } catch (err) {

    }

    return {isValid: false};
}

export function getVenomAddressBySeed(seed: string): string {
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = VenomWalletV3.create({workchain: 0, publicKey: Buffer.from(publicKey)});

    return wallet.address.toRawString();
}

export function validateAddress(address: string) {
    try {
        return Address.parse(address);
    } catch (e) {
        return false;
    }
}

export function convertAddress(address: string): any {
    const a = parseAddress(address);
    if (!a.isValid) {
        return a;
    } else {
        const rawString = a.address?.toRawString();
        const userFriendlyBounceable = a.address?.toString({bounceable: true, urlSafe: true});
        const userFriendlyUnbounceable = a.address?.toString({bounceable: false, urlSafe: true});
        const addrBounceable = {bounceable: true, urlSafe: true, userFriendlyBounceable: userFriendlyBounceable};
        const addrUnounceable = {bounceable: false, urlSafe: true, userFriendlyUnbounceable: userFriendlyUnbounceable};
        return {
            raw: rawString,
            addrBounceable,
            addrUnounceable,
        }
    }
}

export function toBase64Address(address: Address | string, isBounceable = true, network?: ApiNetwork) {
    if (typeof address === 'string') {
        address = Address.parse(address);
    }
    return address.toString({
        urlSafe: true,
        bounceable: isBounceable,
        testOnly: network === 'testnet',
    });
}