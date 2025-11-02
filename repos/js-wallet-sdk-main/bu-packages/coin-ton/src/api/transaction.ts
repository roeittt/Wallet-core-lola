import {VenomWalletV3, WalletContractV4, WalletContractV5R1} from "../ton";
import {signUtil} from "@okxweb3/crypto-lib";
import {base} from "@okxweb3/coin-base";
import {
    Contract,
    external,
    internal,
    MessageRelaxed,
    SendMode,
    storeMessage,
    storeStateInit,
    Address,
    beginCell,
    Cell, storeMessageRelaxed,
} from "../lib/ton-core";
import {
    AuthType,
    ExtensionParam,
    JettonMultiTxData,
    JettonTxData,
    TonTransferParams,
    TransactionPayloadMessage,
    TxData,
    WalletContract
} from "./types";
import {getWalletContract, parseAddress} from "./address";
import {generateQueryId} from "./index";
import {TRANSFER_TIMEOUT_SEC} from "./constant";


function toExternalMessage(
    contract: Contract,
    seqno: number,
    body: Cell,
) {
    return beginCell()
        .storeWritable(
            storeMessage(
                external({
                    to: contract.address,
                    init: seqno === 0 ? contract.init : undefined,
                    body,
                }),
            ),
        )
        .endCell();
}

function getAuthType(wallet: WalletContract, authType: string | undefined): AuthType {
    if (!authType) {
        return undefined
    }
    if (wallet instanceof WalletContractV4 ) {
        throw new Error("Wallet contract v4 cannot set auth type");
    }

    if (authType != "internal" && authType != "external" && authType != "extension") {
        throw new Error("Auth type can only be 'internal', 'external', or 'extension'");
    }
    return authType
}
function getKeyParams(seed: string, publicKey?: string){
    if (!seed && !publicKey) {
        throw new Error("privateKey or publicKey is required");
    }
    let secretK = Buffer.alloc(64);
    let publicK : Buffer
    let isForSimulate: boolean = false
    if (seed) {
        const {
            secretKey, publicKey
        } = signUtil.ed25519.fromSeed(base.fromHex(seed))
        secretK = Buffer.from(secretKey)
        publicK = Buffer.from(publicKey)
    } else {
        publicK = base.fromHex(publicKey!)
        isForSimulate = true
    }

    return {secretK, publicK, isForSimulate}
}

function getAddressFromContract(wallet: Contract) {
    return wallet.address.toString({bounceable: false})
}

function getStateInit(wallet: Contract, seqno: number, authType?: string){
    if (authType === 'internal' && seqno === 0) {
        return beginCell()
            .storeWritable(storeStateInit(wallet.init!))
            .endCell()
            .toBoc()
            .toString('base64');
    }
    return undefined
}

function getSignedMessage(wallet: WalletContract,
                          authType: AuthType,
                          messages: MessageRelaxed[],
                          secretKey: Buffer,
                          seqno: number,
                          sendMode?: number,
                          timeout?: number,

                          ) {
    let signedMessage: Cell

    if (authType == 'extension'){
        if (!(wallet instanceof WalletContractV5R1)) {
            throw new Error('Transfer by extension auth only available for contract v5r1')
        }
        signedMessage = wallet.createTransfer({seqno, messages, sendMode, timeout, authType});
    } else {
        signedMessage = wallet.createTransfer({seqno, messages, secretKey, sendMode, timeout, authType});
    }
    return signedMessage
}

export function transfer(txData: TxData, seed: string) {
    const {secretK, publicK, isForSimulate} = getKeyParams(seed, txData.publicKey)

    const wallet = getWalletContract(txData.walletVersion, publicK)
    const authType = getAuthType(wallet, txData.authType)

    const messages = [internal({
        to: txData.to,
        value: BigInt(txData.amount),
        // bounce: txData.toIsInit,
        bounce: false, // depend on the design of PM
        body: txData.memo
    })];

    let signedMessage = getSignedMessage( wallet, authType, messages, secretK, txData.seqno, txData.sendMode, txData.expireAt)

    if (!isForSimulate && authType != 'internal' && authType != 'extension') {
        signedMessage = toExternalMessage(wallet, txData.seqno, signedMessage)
    }

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, txData.seqno, authType),
        address: getAddressFromContract(wallet),
    };
}

export function venomTransfer(txData: TxData, seed: string) {
    const {secretKey, publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = VenomWalletV3.create({workchain: 0, publicKey: Buffer.from(publicKey)});
    const messages = [internal({
        to: txData.to,
        value: BigInt(txData.amount),
        bounce: txData.toIsInit,
        body: txData.memo
    })];
    const signedMessage = wallet.createTransfer({
        seqno: txData.seqno,
        messages, secretKey: Buffer.from(secretKey),
        globalId: txData.globalId!,
        sendMode: txData.sendMode,
        timeout: txData.expireAt,
    });

    return {
        id: base.toBase64(signedMessage.hash()),
        body: base.toBase64(signedMessage.toBoc()),
    };
}

export function jettonTransfer(txData: JettonTxData, seed: string) {
    const {secretK, publicK, isForSimulate} = getKeyParams(seed, txData.publicKey)

    const wallet = getWalletContract(txData.walletVersion, publicK)
    const authType = getAuthType(wallet, txData.authType)

    const responseAddr = txData.responseAddr ? Address.parse(txData.responseAddr) : wallet.address
    const toAddr = Address.parse(txData.to)
    const fromJettonWallet = Address.parse(txData.fromJettonAccount)
    // todo support other decimal
    if (txData.decimal < 0) {
        throw new Error("invalid decimal");
    }
    const jettonAmount = BigInt(txData.amount);
    if (jettonAmount < 0) {
        throw new Error("invalid amount");
    }
    const queryId = txData.queryId ? BigInt(txData.queryId) : generateQueryId();
    let transferPayload: Cell
    const customPayload = txData.customPayload ? Cell.fromBase64(txData.customPayload!) : undefined
    const messageBuild = beginCell()
        .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
        // .storeUint(0, 64) // query id
        .storeUint(queryId, 64) // query id
        // .storeCoins(toNano(txData.amount)) // jetton amount, amount * 10^9
        .storeCoins(BigInt(txData.amount)) // jetton amount, amount * 10^9
        .storeAddress(toAddr)
        .storeAddress(responseAddr) // response destination
        .storeMaybeRef(customPayload)
        .storeCoins(BigInt(txData.invokeNotificationFee || "1")) // forward fee, amount of TON

    if (txData.memo) {
        const forwardPayload = beginCell()
            .storeUint(0, 32) // 0 opcode means we have a comment
            .storeStringTail(txData.memo)
            .endCell();

        transferPayload = messageBuild.storeBit(true) // we store forwardPayload as a reference
            .storeRef(forwardPayload)
            .endCell();
    } else {
        transferPayload = messageBuild.storeBit(false).endCell();
    }

    const internalMessage = [internal({
        to: fromJettonWallet,
        value: BigInt(txData.messageAttachedTons || "50000000"), // message fee, amount of TON
        body: transferPayload,
        // bounce: txData.toIsInit,
        bounce: false, // depend on the design of PM
    })];

    let signedMessage = getSignedMessage( wallet, authType, internalMessage, secretK, txData.seqno, txData.sendMode, txData.expireAt)

    if (!isForSimulate && authType !== 'internal') {
        signedMessage = toExternalMessage(wallet, txData.seqno, signedMessage)
    }

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, txData.seqno, authType),
        address: wallet.address.toString(),
    };
}

export function jettonMultiTransfer(txData: JettonMultiTxData, seed: string) {
    const {secretK, publicK, isForSimulate} = getKeyParams(seed, txData.publicKey)

    const wallet = getWalletContract(txData.walletVersion, publicK)
    const authType = getAuthType(wallet, txData.authType)

    const messages = txData.messages.map(m => {
        const responseAddr = m.responseAddr ? Address.parse(m.responseAddr) : wallet.address
        const toAddr = Address.parse(m.to)
        const fromJettonWallet = Address.parse(m.fromJettonAccount)
        // todo support other decimal
        if (m.decimal < 0) {
            throw new Error("invalid decimal");
        }
        const jettonAmount = BigInt(m.amount);
        if (jettonAmount < 0) {
            throw new Error("invalid amount");
        }
        const queryId = m.queryId ? BigInt(m.queryId) : generateQueryId();
        let transferPayload: Cell
        const messageBuild = beginCell()
            .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
            // .storeUint(0, 64) // query id
            .storeUint(queryId, 64) // query id
            // .storeCoins(toNano(m.amount)) // jetton amount, amount * 10^9
            .storeCoins(BigInt(m.amount)) // jetton amount, amount * 10^9
            .storeAddress(toAddr)
            .storeAddress(responseAddr) // response destination
            .storeBit(false) // no custom payload
            .storeCoins(BigInt(m.invokeNotificationFee || "1")) // forward fee, amount of TON

        if (m.memo) {
            const forwardPayload = beginCell()
                .storeUint(0, 32) // 0 opcode means we have a comment
                .storeStringTail(m.memo)
                .endCell();

            transferPayload = messageBuild.storeBit(true) // we store forwardPayload as a reference
                .storeRef(forwardPayload)
                .endCell();
        } else {
            transferPayload = messageBuild.storeBit(false).endCell();
        }

        return internal({
            to: fromJettonWallet,
            // value: toNano(m.messageAttachedTons || "0.05"),
            value: BigInt(m.messageAttachedTons || "50000000"), // message fee, amount of TON
            body: transferPayload,
            // bounce: m.toIsInit,
            bounce: false, // depend on the design of PM
        });
    })


    let signedMessage = getSignedMessage( wallet, authType, messages, secretK, txData.seqno, txData.sendMode, txData.expireAt)

    if (!isForSimulate && authType !== 'internal') {
        signedMessage = toExternalMessage(wallet, txData.seqno, signedMessage)
    }

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, txData.seqno, authType),
        address: wallet.address.toString(),
    };
}

export async function signMultiTransaction(
    privateKey: string,
    messages: TonTransferParams[],
    seqno: number,
    expireAt?: number,
    workchain?: number,
    publicKey?: string,
    authType? : string,
    walletVersion?: string,
) {
    if (!expireAt) {
        expireAt = Math.round(Date.now() / 1000) + TRANSFER_TIMEOUT_SEC;
    }

    const preparedMessages = messages.map((message) => {
        const {
            amount, toAddress, stateInit, isBase64Payload,
        } = message;
        let {payload} = message;

        if (isBase64Payload && typeof payload === 'string') {
            payload = Cell.fromBase64(payload);
        } else if (typeof payload === 'string') {
            try {
                payload = Cell.fromBase64(payload);
            } catch (e) {

            }
        }

        const init = stateInit ? {
            code: stateInit.refs[0],
            data: stateInit.refs[1],
        } : undefined;

        return internal({
            value: amount,
            to: toAddress,
            body: payload as Cell | string | undefined, // TODO Fix Uint8Array type
            bounce: parseAddress(toAddress).isBounceable,
            init,
        });
    });
    const {secretK, publicK, isForSimulate} = getKeyParams(privateKey, publicKey)

    const wallet = getWalletContract(walletVersion, publicK, workchain)
    let signedMessage = getSignedMessage(
        wallet,
        undefined,
        preparedMessages,
        secretK,
        seqno,
         SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        expireAt,
    )

    if (!isForSimulate && authType !== 'internal') {
        signedMessage= toExternalMessage(wallet, seqno, signedMessage)
    }

    const tx = base.toBase64(signedMessage.toBoc())
    const externalMessage = toExternalMessage(wallet, seqno, signedMessage);
    const externalMsg = externalMessage.toBoc().toString('base64');
    return {seqno: seqno, transaction: tx, externalMessage: externalMsg};
}

export function addExtension(extParam: ExtensionParam, seed: string)  {
    const {secretK, publicK, isForSimulate} = getKeyParams(seed, extParam.publicKey)

    if (extParam.walletVersion && extParam.walletVersion != "v5r1" && extParam.walletVersion != "v5R1") {
        throw new Error('Extension actions only available for wallet contract v5');
    }

    if (!extParam.extensionAddress) {
        throw new Error('Adding extension requires extensionAddress');
    }

    const wallet = WalletContractV5R1.create({workchain: 0, publicKey: Buffer.from(publicK)});
    const authType = getAuthType(wallet, extParam.authType)
    const extensionAddress : Address = parseAddress(extParam.extensionAddress).address!

    let signedMessage
    if (authType == "extension"){
        signedMessage = wallet.createAddExtension({
            seqno: extParam.seqno,
            timeout: extParam.expireAt,
            extensionAddress,
            authType
        })
    } else {
        signedMessage = wallet.createAddExtension({
            seqno: extParam.seqno,
            secretKey: secretK,
            timeout: extParam.expireAt,
            extensionAddress,
            authType
        })
    }
    if (!isForSimulate && authType !== 'internal') {
        signedMessage = toExternalMessage(wallet, extParam.seqno, signedMessage)
    }

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, extParam.seqno, authType),
        address: wallet.address.toString(),
    };
}
export function removeExtension(extParam: ExtensionParam, seed: string)  {
    const {secretK, publicK, isForSimulate} = getKeyParams(seed, extParam.publicKey)

    if (extParam.walletVersion && extParam.walletVersion != "v5r1" && extParam.walletVersion != "v5R1") {
        throw new Error('Extension actions only available for wallet contract v5');
    }

    if (!extParam.extensionAddress) {
        throw new Error('Removing extension requires extensionAddress');
    }

    const wallet = WalletContractV5R1.create({workchain: 0, publicKey: Buffer.from(publicK)});
    const authType = getAuthType(wallet, extParam.authType)
    const extensionAddress : Address = parseAddress(extParam.extensionAddress).address!

    let signedMessage
    if (authType == "extension"){
        signedMessage = wallet.createRemoveExtension({
            seqno: extParam.seqno,
            timeout: extParam.expireAt,
            extensionAddress,
            authType
        })
    } else {
        signedMessage = wallet.createRemoveExtension({
            seqno: extParam.seqno,
            secretKey: secretK,
            timeout: extParam.expireAt,
            extensionAddress,
            authType
        })
    }

    if (!isForSimulate && authType !== 'internal') {
        signedMessage = toExternalMessage(wallet, extParam.seqno, signedMessage)
    }

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, extParam.seqno, authType),
        address: wallet.address.toString(),
    };
}
export function setSignatureAuth(extParam: ExtensionParam)  {
    // Only from extension so does not require secret key
    const { publicK} = getKeyParams("", extParam.publicKey)

    if (extParam.walletVersion && extParam.walletVersion != "v5r1" && extParam.walletVersion != "v5R1") {
        throw new Error('Extension actions only available for wallet contract v5');
    }

    if (extParam.isSignatureAuthEnabled == undefined) {
        throw new Error('Setting signature auth requires isSignatureAuthEnabled');
    }


    const wallet = WalletContractV5R1.create({workchain: 0, publicKey: Buffer.from(publicK)});

    const authType = getAuthType(wallet, extParam.authType)
    if (authType != "extension"){
        throw new Error('Setting signature auth requires authType = extension');
    }

    let signedMessage = wallet.createSetIsPublicKeyEnabled({
        seqno: extParam.seqno,
        timeout: extParam.expireAt,
        isEnabled: extParam.isSignatureAuthEnabled,
        authType
    })

    return {
        boc: base.toBase64(signedMessage.toBoc()),
        stateInit: getStateInit(wallet, extParam.seqno, authType),
        address: wallet.address.toString(),
    };
}
