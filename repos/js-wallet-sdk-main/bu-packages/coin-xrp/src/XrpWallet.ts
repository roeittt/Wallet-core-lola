import {
    BaseWallet,
    CalcTxHashParams,
    GenPrivateKeyError,
    GetDerivedPathParam,
    isHexStr,
    NewAddressError,
    NewAddressParams,
    SignCommonMsgParams,
    SignTxParams,
    SignType,
    ValidAddressParams,
    ValidPrivateKeyData,
    ValidPrivateKeyParams,
    VerifyMessageParams
} from "@okxweb3/coin-base";
import {base} from "@okxweb3/coin-base";
import {hashes, isValidClassicAddress, isValidXAddress, Wallet} from "xrpl";
import {
    convertTxParam,
    createWallet,
    DerivePriKeyParams,
    isEd25519PrivateKey,
    isInValidAddress,
    SignMessageRequest,
    transferMsgPayload,
    VerifyMessageSig,
    XrpParam,
} from "./common";
import {PREFIX_ED25519, PREFIX_SECP256K1, ZERO_SEED_ED25519, ZERO_SEED_SECP256} from "./const";
import {sign, verify} from "ripple-keypairs";

export class XrpWallet extends BaseWallet {
    async getDerivedPath(param: GetDerivedPathParam): Promise<any> {
        return `m/44'/144'/0'/0/${param.index}`;
    }

    async getRandomPrivateKey(): Promise<any> {
        try {
            const w = Wallet.generate()
            return Promise.resolve(w.privateKey)
        } catch (e) {
            return Promise.reject(GenPrivateKeyError);
        }
    }

    async getDerivedPrivateKey(param: DerivePriKeyParams): Promise<any> {
        try {
            const words = param.mnemonic.split(' ')
            if (words.length < 12) {
                return Promise.reject(GenPrivateKeyError);
            }
            const w = Wallet.fromMnemonic(param.mnemonic, {
                derivationPath: param.hdPath,
                masterAddress: param.masterAddress,
                mnemonicEncoding: param.mnemonicEncoding,
                algorithm: param.algorithm,
            })
            return w.privateKey;
        } catch (e) {
            return Promise.reject(GenPrivateKeyError);
        }
    }

    validPrivateKey(param: ValidPrivateKeyParams): Promise<any> {
        const data: ValidPrivateKeyData = {
            isValid: this.checkPrivateKey(param.privateKey),
            privateKey: param.privateKey
        };
        return Promise.resolve(data);
    }

    checkPrivateKey(privateKey: string) {
        if (isHexStr(privateKey)) {
            // Either a 32-bit seed or a full 64-bit private key
            const keyBytes = base.fromHex(privateKey.toLowerCase())
            if (keyBytes.every(byte => byte === 0)) {
                return false;
            }
            if (keyBytes.length == 33) {
                if (!privateKey.toUpperCase().startsWith(PREFIX_ED25519) && !privateKey.toUpperCase().startsWith(PREFIX_SECP256K1)) {
                    return false;
                }
                return keyBytes.slice(1).some(b => b !== 0);
            }
            return false;
        } else {
            if (privateKey.toLowerCase() == ZERO_SEED_ED25519.toLowerCase() ||
                privateKey.toLowerCase() == ZERO_SEED_SECP256.toLowerCase()) {
                return false;
            }
            try {
                const w = Wallet.fromSeed(privateKey)
                return !isInValidAddress(w.address);
            } catch (e) {
                return false
            }
        }
    }


    getNewAddress(param: NewAddressParams): Promise<any> {
        try {
            if (!this.checkPrivateKey(param.privateKey)) {
                return Promise.reject(NewAddressError)
            }
            const w = createWallet(param.privateKey, param.addressType);
            if (isInValidAddress(w.address)) {
                return Promise.reject(NewAddressError)
            }
            return Promise.resolve({
                address: w.address,
                publicKey: w.publicKey
            });
        } catch (e) {
            return Promise.reject(NewAddressError);
        }
    }

    signTransaction(param: SignTxParams): Promise<any> {
        const privateKey = param.privateKey;
        const w = createWallet(privateKey)
        const xrpParam = param.data as XrpParam
        const tx = convertTxParam(xrpParam, w.address);
        return Promise.resolve(w.sign(tx));
    }

    validAddress(param: ValidAddressParams): Promise<any> {
        let res = {
            isValid: false,
            address: param.address
        }
        let isInValid = isInValidAddress(param.address);
        if (isInValid) {
            return Promise.resolve(res);
        }
        res.isValid = isValidClassicAddress(param.address) || isValidXAddress(param.address)
        return Promise.resolve(res);
    }

    // get tx hash by raw transaction
    calcTxHash(param: CalcTxHashParams): Promise<string> {
        return Promise.resolve(hashes.hashSignedTx(param.data));
    }

    signMessage(param: SignTxParams): Promise<string> {
        if (!this.checkPrivateKey(param.privateKey)) {
            return Promise.reject("Invalid private key")
        }
        const w = createWallet(param.privateKey);
        const msg = param.data as SignMessageRequest
        return Promise.resolve(sign(transferMsgPayload(msg), w.privateKey).toString());
    }

    verifyMessage(param: VerifyMessageParams): Promise<boolean> {
        const msg = param.data as VerifyMessageSig
        return Promise.resolve(verify(transferMsgPayload(msg.message), param.signature, msg.publicKey));
    }

    signCommonMsg(params: SignCommonMsgParams): Promise<any> {
        const w = createWallet(params.privateKey)
        if (w.privateKey.length != 66) {
            return Promise.reject("Invalid private key")
        }
        if (isEd25519PrivateKey(w.privateKey)) {
            return super.signCommonMsg({
                privateKey: w.privateKey,
                privateKeyHex: w.privateKey.slice(2),
                message: params.message,
                signType: SignType.ED25519
            })
        } else {
            return super.signCommonMsg({
                privateKey: w.privateKey,
                privateKeyHex: w.privateKey.slice(2),
                message: params.message,
                signType: SignType.Secp256k1
            })
        }
    }

}