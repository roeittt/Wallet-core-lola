import {
    GetDerivedPathParam
} from "@okxweb3/coin-base";
import {StellarWallet} from "./StellarWallet";



export const PINetworks = {
    TESTNET: 'Pi Testnet',
    TESTNET2: 'Pi Testnet',
    MAINNET: 'Pi Network',
};


export class PIWallet extends StellarWallet {
    async getDerivedPath(param: GetDerivedPathParam): Promise<any> {
        return `m/44'/314159'/${param.index}'`;
    }

    // async getDerivedPrivateKey(param: DerivePriKeyParams): Promise<any> {
    //     try {
    //         const key = await signUtil.ed25519.ed25519_getDerivedPrivateKey(param.mnemonic,param.hdPath, false, "hex")
    //         return Promise.resolve(StrKey.encodeEd25519SecretSeed(base.fromHex(key)));
    //     } catch (e) {
    //         return Promise.reject(GenPrivateKeyError);
    //     }
    // }
}