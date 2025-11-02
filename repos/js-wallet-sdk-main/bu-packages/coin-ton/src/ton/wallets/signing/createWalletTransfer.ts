/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    beginCell,
    MessageRelaxed,
    storeMessageRelaxed,
    OutAction,
    Builder,
    OutActionSendMsg,
    Cell
} from "../../../lib/ton-core";
import {sign} from "../../../lib/ton-crypto";
import {Maybe} from "../../utils/maybe";
import {OutActionExtended} from "../v5r1/WalletV5OutActions";
import {signPayload} from "./signer";
import {
    Wallet5VR1SendArgsExtensionAuth,
    WalletContractV5R1,
    WalletV5R1PackedCell,
    WalletV5R1SendArgs,
    WalletV5R1SendArgsSignable
} from "../v5r1/WalletContractV5R1";
import {patchV5R1ActionsSendMode, storeOutListExtendedV5R1} from "../v5r1/WalletV5R1Actions";


function packSignatureToTail(signature: Buffer, signingMessage: Builder): Cell {
    const body = beginCell()
        .storeBuilder(signingMessage)
        .storeBuffer(signature)
        .endCell();

    return body;
}
export function createWalletTransferV1(args: {
    seqno: number,
    sendMode: number,
    message: Maybe<MessageRelaxed>,
    secretKey: Buffer
}) {

    // Create message
    let signingMessage = beginCell()
        .storeUint(args.seqno, 32);
    if (args.message) {
        signingMessage.storeUint(args.sendMode, 8);
        signingMessage.storeRef(beginCell().store(storeMessageRelaxed(args.message)));
    }

    // Sign message
    let signature = sign(signingMessage.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV2(args: {
    seqno: number,
    sendMode: number,
    messages: MessageRelaxed[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw Error("Maximum number of messages in a single transfer is 4");
    }

    // Create message
    let signingMessage = beginCell()
        .storeUint(args.seqno, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }
    for (let m of args.messages) {
        signingMessage.storeUint(args.sendMode, 8);
        signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
    }

    // Sign message
    let signature = sign(signingMessage.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV3(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: MessageRelaxed[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw Error("Maximum number of messages in a single transfer is 4");
    }

    // Create message to sign
    let signingMessage = beginCell()
        .storeUint(args.walletId, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }
    signingMessage.storeUint(args.seqno, 32);
    for (let m of args.messages) {
        signingMessage.storeUint(args.sendMode, 8);
        signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
    }

    // Sign message
    let signature = sign(signingMessage.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV4(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: MessageRelaxed[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw Error("Maximum number of messages in a single transfer is 4");
    }

    let signingMessage = beginCell()
        .storeUint(args.walletId, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 600, 32); // Default timeout: 60 seconds
    }
    signingMessage.storeUint(args.seqno, 32);
    signingMessage.storeUint(0, 8); // Simple order
    for (let m of args.messages) {
        signingMessage.storeUint(args.sendMode, 8);
        signingMessage.storeRef(beginCell().store(storeMessageRelaxed(m)));
    }

    // Sign message
    let signature: Buffer = sign(signingMessage.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV5R1<T extends WalletV5R1SendArgs>(
    args: T extends Wallet5VR1SendArgsExtensionAuth
        ? T & { actions: (OutActionSendMsg | OutActionExtended)[]}
        : T & { actions: (OutActionSendMsg | OutActionExtended)[], walletId: (builder: Builder) => void }
): WalletV5R1PackedCell<T> {
    // Check number of actions
    if (args.actions.length > 255) {
        throw Error("Maximum number of OutActions in a single request is 255");
    }
    args = {...args};

    if (args.authType === 'extension') {
        return beginCell()
            .storeUint(WalletContractV5R1.OpCodes.auth_extension, 32)
            .storeUint(args.queryId ?? 0, 64)
            .store(storeOutListExtendedV5R1(args.actions))
            .endCell() as WalletV5R1PackedCell<T>;
    }

    args.actions = patchV5R1ActionsSendMode(args.actions, args.authType);

    const signingMessage = beginCell()
        .storeUint(args.authType === 'internal'
            ? WalletContractV5R1.OpCodes.auth_signed_internal
            : WalletContractV5R1.OpCodes.auth_signed_external, 32)
        .store(args.walletId);

    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }

    signingMessage
        .storeUint(args.seqno, 32)
        .store(storeOutListExtendedV5R1(args.actions));

    return signPayload(
        args,
        signingMessage,
        packSignatureToTail,
    ) as T extends WalletV5R1SendArgsSignable ? Promise<Cell> : Cell;
}
