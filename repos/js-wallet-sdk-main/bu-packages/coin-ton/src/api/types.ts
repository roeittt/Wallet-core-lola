import {Cell} from "../lib/ton-core";
import {WalletContractV4, WalletContractV5R1} from "../ton";

export type AnyPayload = string | Cell | Uint8Array;

export type TxData = {
    type: string
    to: string
    amount: string
    seqno: number
    toIsInit: boolean
    decimal: number
    memo?: string
    globalId?: number
    sendMode?: number
    expireAt?: number
    customPayload?: string
    publicKey?: string
    walletVersion?: string
    authType?: string
    internalTxs: TransactionPayloadMessage[];
};

export type JettonTxData = {
    type: string
    to: string
    fromJettonAccount: string // jetton wallet address
    amount: string
    decimal: number
    seqno: number
    toIsInit: boolean // destination address init or not
    memo?: string // comment
    messageAttachedTons?: string // message fee,
    invokeNotificationFee?: string // notify fee, 0.000000001
    sendMode?: number
    expireAt?: number
    queryId?: string
    publicKey?: string
    walletVersion?: string
    authType?: string
    responseAddr?: string
    customPayload?: string
};

export type JettonMsgData ={
    to: string
    fromJettonAccount: string // jetton wallet address
    amount: string
    decimal: number
    toIsInit: boolean // destination address init or not
    memo?: string // comment
    messageAttachedTons?: string // message fee,
    invokeNotificationFee?: string // notify fee, 0.000000001
    queryId?: string
    responseAddr?: string
}

export type JettonMultiTxData = {
    type: string
    seqno: number
    messages: JettonMsgData[]
    sendMode?: number
    expireAt?: number
    publicKey?: string
    walletVersion?: string
    authType?: string
};


export type ValidateMnemonicParams = {
    mnemonicArray: string[],
    password: string
}

export type SignTonProofParams = {
    privateKey: string,
    walletAddress: string,
    tonProofItem: string,
    messageAction: string,
    messageSalt: string,
    proof: ApiTonConnectProof,
}

export type GetWalletInformationParams = {
    workChain: number,
    publicKey?: string,
    privateKey?: string,
    walletVersion?: string
}

export interface ApiTonConnectProof {
    timestamp: number;
    domain: string;
    payload: string;
}

export type TonTransferParam = {
    toAddress: string;
    amount: string;
    payload?: string;
    stateInit?: string; //base64
    isBase64Payload?: boolean;
}

export type SignMultiTransactionParams = {
    messages: TonTransferParam[],
    seqno: number,
    expireAt?: number,
    workchain?: number
}

export interface TransactionPayloadMessage {
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
    isBase64Payload?: boolean;
}

export interface TransactionPayload {
    valid_until?: number;
    messages: TransactionPayloadMessage[];
    seqno: number,
    network?: string;
    from?: string;
    publicKey?: string;
    walletVersion?: string;
}

export interface ApiNft {
    index: number;
    name?: string;
    address: string;
    thumbnail: string;
    image: string;
    description?: string;
    collectionName?: string;
    collectionAddress?: string;
    isOnSale: boolean;
    isHidden?: boolean;
    isOnFragment?: boolean;
    isScam?: boolean;
}

export type SignMultiTransactionForNFTParams = {
    fromNFTAddress: string;
    nftAddresses: string[];
    toAddress: string;
    comment?: string;
    nfts?: ApiNft[];
    seqno: number,
    expireAt?: number,
    workchain?: number
}

export type BuildNotcoinVoucherExchangeParams = {
    fromNFTAddress: string,
    nftAddress: string,
    nftIndex: number,
}

export type BuildNftTransferPayloadParams = {
    fromNFTAddress: string,
    nftAddress: string,
    comment: string,
}

export interface TonTransferParams {
    toAddress: string;
    amount: bigint;
    payload?: AnyPayload;
    stateInit?: Cell;
    isBase64Payload?: boolean;
}

export type ExtensionParam = {
    type: string
    seqno: number
    extensionAddress?: string
    isSignatureAuthEnabled?: boolean
    memo?: string
    globalId?: number
    expireAt?: number
    publicKey?: string
    walletVersion?: string
    authType?: string
};

export type AuthType = "internal" | "external" | "extension" | undefined

export type WalletContract = WalletContractV4 | WalletContractV5R1
