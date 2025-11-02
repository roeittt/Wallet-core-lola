import {isHexStr, NewAddressError, SignTxError} from "@okxweb3/coin-base";
import {signUtil} from "@okxweb3/crypto-lib";
import {base} from "@okxweb3/coin-base";
import {TrustSet, Wallet} from "xrpl";
import {Amount, IssuedCurrencyAmount, Memo, MPTAmount, Path, Signer} from "xrpl/src/models/common";
import {Payment, PaymentFlagsInterface} from "xrpl/src/models/transactions/payment";
import {Account, GlobalFlags} from "xrpl/src/models/transactions/common";
import ECDSA from "xrpl/src/ECDSA";
import {INVALID_ADDRESS} from "./const";

declare const TextEncoder: any;


export type DerivePriKeyParams = {
    mnemonic: string;
    hdPath: string;
    masterAddress?: string
    mnemonicEncoding?: 'bip39' | 'rfc1751'
    algorithm?: ECDSA
};

export type XrpParam = {
    type: "transfer" | "TrustSet",
    base: XrpBasePram,
    data: any
}


export type XrpBasePram = {
    account: Account
    fee: string
    sequence: number | string
    accountTxnID?: string
    flags?: number | GlobalFlags
    lastLedgerSequence?: number | string
    memos?: Memo[]
    signers?: Signer[]
    sourceTag?: number
    signingPubKey?: string
    ticketSequence?: number
    txnSignature?: string
    networkID?: number
}

export type PaymentTxParam = {
    amount: Amount | MPTAmount
    destination: Account
    destinationTag?: number
    invoiceID?: string
    paths?: Path[]
    sendMax?: Amount | MPTAmount
    deliverMin?: Amount | MPTAmount
    credentialIDs?: string[]
    flags?: number | PaymentFlagsInterface
}


export type TrustSetParam = {
    limitAmount: IssuedCurrencyAmount
    qualityIn?: number
    qualityOut?: number
    flags?: number
}

export type SignMessageRequest = {
    messageId: string,
    url: string;
    title: string;
    favicon: string | null | undefined;
    message: string;
}


export type VerifyMessageSig = {
    message: SignMessageRequest
    publicKey: string
}


export function isInValidAddress(addr: string) {
    return INVALID_ADDRESS.includes(addr)
}

export function convertTxParam(xrpParam: XrpParam, account: string) {
    const baseParm = xrpParam.base
    const tx = convertTxParamInner(xrpParam, account);
    if (baseParm.lastLedgerSequence) {
        tx.LastLedgerSequence = typeof baseParm.lastLedgerSequence == 'string' ? Number(baseParm.lastLedgerSequence) : baseParm.lastLedgerSequence;
    }
    return tx;
}

function convertTxParamInner(xrpParam: XrpParam, account: string) {
    const baseParm = xrpParam.base
    const sequence = typeof baseParm.sequence == 'string' ? Number(baseParm.sequence) : baseParm.sequence;
    switch (xrpParam.type) {
        case "transfer": {
            const txP = xrpParam.data as PaymentTxParam
            const tx: Payment = {
                TransactionType: 'Payment',
                Account: account,
                Amount: txP.amount,
                Destination: txP.destination,
                Sequence: sequence,
                Fee: baseParm.fee,
                DestinationTag: txP.destinationTag,
                InvoiceID: txP.invoiceID,
                Paths: txP.paths,
                SendMax: txP.sendMax,
                DeliverMin: txP.deliverMin,
                CredentialIDs: txP.credentialIDs,
                Flags: txP.flags,
            }
            return tx
        }
        case "TrustSet": {
            const txP = xrpParam.data as TrustSetParam
            const tx: TrustSet = {
                TransactionType: 'TrustSet',
                Account: account,
                Sequence: sequence,
                Fee: baseParm.fee,
                LimitAmount: txP.limitAmount,
                QualityIn: txP.qualityIn,
                QualityOut: txP.qualityOut,
                Flags: txP.flags,
            }
            return tx;
        }
        default:
            throw new Error(SignTxError);
    }
}

export function isSecp256PrivateKey(privateKey: string) {
    return isHexStr(privateKey) && privateKey.startsWith("00")
}

export function isEd25519PrivateKey(privateKey: string) {
    return isHexStr(privateKey) && (privateKey.startsWith("ED") || privateKey.startsWith("ed"))
}

export function createWallet(seedOrPrivate: string, addressType?: string) {
    if (isHexStr(seedOrPrivate)) {
        let pubKeyHex;
        if (seedOrPrivate.startsWith("00") && seedOrPrivate.length == 66) {
            let pubKey = signUtil.secp256k1.publicKeyCreate(base.fromHex(seedOrPrivate.slice(2)), true)
            pubKeyHex = base.toHex(pubKey)
        } else if (seedOrPrivate.startsWith("ED") && seedOrPrivate.length == 66) {
            let pubKey = signUtil.ed25519.publicKeyCreate(base.fromHex(seedOrPrivate.slice(2)))
            pubKeyHex = 'ED' + base.toHex(pubKey)
        } else {
            throw new Error(NewAddressError)
        }
        return new Wallet(pubKeyHex.toUpperCase(), seedOrPrivate)
    } else {
        return Wallet.fromSeed(seedOrPrivate)
    }
}

export function transferMsgPayload(msg: SignMessageRequest): string {
    let fullMessage: string = "";
    fullMessage = fullMessage.concat("messageId: ", msg.messageId)
    fullMessage = fullMessage.concat("\nurl: ", msg.url)
    fullMessage = fullMessage.concat("\ntitle: ", msg.title)
    if (msg.favicon) {
        fullMessage = fullMessage.concat("\nfavicon: ", msg.favicon)
    }
    fullMessage = fullMessage.concat("\nmessage: ", msg.message)
    const textEncoder = new TextEncoder();
    return base.toHex(Buffer.from(textEncoder.encode(fullMessage)))
}