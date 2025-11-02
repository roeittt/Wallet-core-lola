import {Cardano, coalesceValueQuantities, Serialization} from "@cardano-sdk/core";
import {
    computeMinimumCost,
    createTransactionInternals,
    minAdaRequired,
} from "@cardano-sdk/tx-construction"
import { SelectionResult} from "@cardano-sdk/input-selection"
import * as Crypto from "@cardano-sdk/crypto"
import {HexBlob} from "@cardano-sdk/util"
import {DefaultMainnetProtocolParameters} from "./parameters"
import {base} from "@okxweb3/coin-base";

export type MultiAssetData = {
    policyId: string
    assets: {
        assetName: string
        amount: string
    }[]
}[];

export type TxInput = {
    txId: string
    index: number
    address: string
    amount: string
    multiAsset?: MultiAssetData
    privateKey?: string
};

export type TxData = {
    inputs: TxInput[]
    address: string
    amount: string
    multiAsset?: MultiAssetData
    changeAddress: string
    fee?: string
    ttl?: string
    type?: string
    tx?: string
    privateKey?: string
};

export function getMultiAsset(multiAsset?: MultiAssetData) {
    const assets = new Map<Cardano.AssetId, Cardano.Lovelace>();
    // Add multi-assets to the output if present
    if (multiAsset && multiAsset.length > 0) {
        for (const policy of multiAsset) {
            for (const asset of policy.assets) {
                const assetId = Cardano.AssetId(`${policy.policyId}${asset.assetName}`);
                assets.set(assetId, BigInt(asset.amount));
            }
        }
    }
    return assets
}

export function getUtxos(inputs: TxInput[]): Cardano.Utxo[] {
    // Convert inputs to Cardano.Utxo format
    return inputs.map(input => {
        // Create basic UTXO with ADA amount
        const value: Cardano.Value = {
            coins: BigInt(input.amount)
        };

        const assets = getMultiAsset(input.multiAsset);
        if (assets.size > 0) {
            value.assets = assets;
        }

        return [
            {
                txId: Cardano.TransactionId(input.txId),
                index: input.index,
                address: Cardano.PaymentAddress(input.address)
            },
            {
                address: Cardano.PaymentAddress(input.address),
                value
            }
        ] as Cardano.Utxo;
    })
}

export function hasSufficientAda(output: Cardano.TxOut) {
    const requiredAda = minAdaRequired(output, BigInt(DefaultMainnetProtocolParameters.coinsPerUtxoByte))
    return output.value.coins >= requiredAda
}

export async function signTxBody(txBody: Serialization.TransactionBody, auxilaryData?: Serialization.AuxiliaryData, privKey?: string): Promise<Serialization.Transaction> {
    const txHash = HexBlob(txBody.hash())

    let publicKey = new Crypto.Ed25519PublicKey(Buffer.alloc(32));
    let signature = new Crypto.Ed25519Signature(Buffer.alloc(64));

    if (privKey) {
        await Crypto.ready()
        const privateKey = Crypto.Ed25519PrivateKey.fromExtendedBytes(
            base.fromHex(privKey.toLowerCase()).slice(0, 64) // payment key
        );
        publicKey = privateKey.toPublic();
        signature = privateKey.sign(txHash);
    }

    const vKeys = Serialization.CborSet.fromCore([[publicKey.hex(), signature.hex()]], Serialization.VkeyWitness.fromCore);
    const witnessSet = new Serialization.TransactionWitnessSet();
    witnessSet.setVkeys(vKeys);

    // Create a transaction with body and witness set
    return new Serialization.Transaction(
        txBody,
        witnessSet,
        auxilaryData
    );
}

export async function getSelection(txData: TxData, withChangeAda = true) {
    const utxoToSpend = getUtxos(txData.inputs);

    const output: Cardano.TxOut = {
        address: Cardano.PaymentAddress(txData.address),
        value: {
            coins: BigInt(txData.amount)
        }
    };
    const outputAssets = getMultiAsset(txData.multiAsset);
    if (outputAssets.size > 0) {
        output.value.assets = outputAssets;
    }
    if (!hasSufficientAda(output)) {
        throw new Error(`not enough ada for output`)
    }


    const totalInputLovelace = txData.inputs.reduce((acc, input) => acc + BigInt(input.amount), BigInt(0));
    const totalOutputLovelace = BigInt(txData.amount)
    let totalChangeLovelace = totalInputLovelace - totalOutputLovelace;

    if (totalChangeLovelace < 0) {
        throw new Error(`not enough input ada`)
    }

    const changeAssets = new Map<Cardano.AssetId, Cardano.Lovelace>();
    for (const utxo of utxoToSpend) {
        const assets = utxo[1].value.assets;
        if (assets) {
            for (const [assetId, quantity] of assets.entries()) {
                const currentQuantity = changeAssets.get(assetId) ?? BigInt(0n)
                changeAssets.set(assetId,  currentQuantity + quantity);
            }
        }
    }
    if (output.value.assets) {
        for (const [assetId, quantity] of output.value.assets.entries()) {
            const newQuantity = (changeAssets.get(assetId) ?? BigInt(0n)) - quantity
            if (newQuantity < 0) {
                throw new Error(`not enough input assets ${assetId}`)
            }
            if (newQuantity === 0n) {
                changeAssets.delete(assetId)
            } else {
                changeAssets.set(assetId,  newQuantity)
            }
        }
    }

    let changeAssetOutput: Cardano.TxOut | undefined;
    if (changeAssets.size > 0) {
        changeAssetOutput = {
            address: Cardano.PaymentAddress(txData.changeAddress),
            value: {
                coins: BigInt(300000),
                assets: changeAssets
            }
        }
        const changeAssetOutputAda = minAdaRequired(changeAssetOutput, BigInt(DefaultMainnetProtocolParameters.coinsPerUtxoByte))
        changeAssetOutput.value.coins = changeAssetOutputAda
        totalChangeLovelace = totalChangeLovelace - changeAssetOutputAda

        if (totalChangeLovelace < 0) {
            throw new Error(`not enough input ada`)
        }
    }

    let selection: SelectionResult['selection'] = {
        change: [],
        fee: BigInt(300000),
        inputs: new Set([...utxoToSpend]),
        outputs: new Set([output]),
    }

    if (changeAssetOutput) {
        selection.outputs.add(changeAssetOutput)
    }

    const changeAdaOutput = {
        address: Cardano.PaymentAddress(txData.changeAddress),
        value: {
            coins: totalChangeLovelace,
        }
    }
    if (withChangeAda && hasSufficientAda(changeAdaOutput)) {
        selection.change.push(changeAdaOutput)
    }

    // Estimate
    const buildTransaction  = async (selection:any) => {
        const txBodyWithHash = createTransactionInternals({
            inputSelection: selection,
            validityInterval: {
                invalidHereafter: txData.ttl ? Cardano.Slot(parseInt(txData.ttl)) : undefined
            }
        });
        const transaction = await signTxBody(Serialization.TransactionBody.fromCore(txBodyWithHash.body), undefined, txData.privateKey);
        return transaction.toCore();
    }

    let minFee = (await computeMinimumCost(
        DefaultMainnetProtocolParameters,
        buildTransaction,
        {evaluate: (tx, resolvedInputs) => Promise.resolve([])},
        {},
    )(selection)).fee

    if (selection.change.length > 0) {
        selection.fee = minFee
        selection.change[0].value.coins = totalChangeLovelace - minFee
        if (hasSufficientAda(selection.change[0])) {
            return {selection, minFee, valid:true}
        }
        selection.change = []
        minFee = (await computeMinimumCost(
            DefaultMainnetProtocolParameters,
            buildTransaction,
            {evaluate: (tx, resolvedInputs) => Promise.resolve([])},
            {},
        )(selection)).fee
    }

    if (totalChangeLovelace < minFee) {
        selection.fee = minFee
        return {selection, minFee, valid:false}
    }

    selection.fee = totalChangeLovelace
    return {selection, minFee, valid:true}
}

export async function buildTx(txData: TxData) {
    const {selection, valid} = await getSelection(txData)
    if (!valid) {
        throw new Error(`not enough input ada`)
    }

    const tx = createTransactionInternals({
        inputSelection: selection,
        validityInterval: {
            invalidHereafter: txData.ttl ? Cardano.Slot(parseInt(txData.ttl)) : undefined
        }
    });

    return Serialization.TransactionBody.fromCore(tx.body)
}

export async function transfer(txData: TxData, privateKey?: string) {
    const txBodyWithHash = await buildTx(txData)
    const privKey = privateKey ?? txData.privateKey ?? txData.inputs.find(input => input.privateKey)?.privateKey
    const transaction = await signTxBody(txBodyWithHash, undefined, privKey);
    return base.toBase64(base.fromHex(transaction.toCbor()))
}

export async function calcTxHash(txData: string | TxData) {
    if (typeof txData === 'string') {
        txData = base.toHex(base.fromBase64(txData))
        const tx = Serialization.Transaction.fromCbor(Serialization.TxCBOR(txData));
        return tx.getId().toString();
    } else {
        const txBody = await buildTx(txData)
        return txBody.hash().toString();
    }
}

export async function calcMinAda(address: string, multiAsset?: MultiAssetData) {
    const assets = getMultiAsset(multiAsset);
    const output: Cardano.TxOut = {
        address: Cardano.PaymentAddress(address),
        value: {
            coins: BigInt('1000000')
        }
    };
    if (assets.size > 0) {
        output.value.assets = assets;
    }
    return minAdaRequired(output, BigInt(DefaultMainnetProtocolParameters.coinsPerUtxoByte)).toString();
}

export async function calcMinFee(txData: TxData) {
    // we assume that there is no change output for smaller tx size and  fee
    const {minFee} = await getSelection(txData, false)
    return minFee.toString()
}

export async function signTx(
    tx: string,
    privateKey: string,
    partialSign: boolean = false,
) {
    const transaction = Serialization.Transaction.fromCbor(Serialization.TxCBOR(tx));

    const signedTx = await signTxBody(transaction.body(), transaction.auxiliaryData(), privateKey);
    return signedTx.witnessSet().toCbor()
}

// reference: https://github.com/input-output-hk/cardano-js-sdk/blob/17add5a25bceebc2eb0440fb39c9a544971efe18/packages/wallet/src/cip30.ts#L128-L148
export function filterUtxos(utxos: Cardano.Utxo[], target: Cardano.Value) {
    const selectedUtxos: Cardano.Utxo[] = [];
    const filterAmountAssets = [...(target.assets?.entries() || [])];
    let foundEnough = false;
    for (const utxo of utxos) {
        selectedUtxos.push(utxo);
        const selectedValue = coalesceValueQuantities(selectedUtxos.map(([_, { value }]) => value));
        foundEnough =
            selectedValue.coins >= target.coins &&
            filterAmountAssets.every(
                ([assetId, requestedQuantity]) => (selectedValue.assets?.get(assetId) || 0n) >= requestedQuantity
            );
        if (foundEnough) {
            break;
        }
    }
    if (!foundEnough) {
        return [];
    }
    return selectedUtxos;
}

export function getFilteredUtxos(txInputs: TxInput[], filterCbor?: string) {
    let utxos = getUtxos(txInputs)
    if (filterCbor) {
        const val = Serialization.Value.fromCbor(HexBlob(filterCbor)).toCore();
        utxos = filterUtxos(utxos, val);
    }
    return utxos.map(utxo => Serialization.TransactionUnspentOutput.fromCore(utxo).toCbor().toString())
}

export function getBalance(txInputs: TxInput[]) {
    let utxos = getUtxos(txInputs)
    const value = coalesceValueQuantities(utxos.map(([_, { value }]) => value));
    return Serialization.Value.fromCore(value).toCbor().toString()
}

export function getNetworkId(txCbor: string) {
    const tx = Serialization.Transaction.fromCbor(Serialization.TxCBOR(txCbor));
    let networkId = tx.body().networkId()
    if (networkId === undefined) {
        networkId = tx.body().outputs()[0].address().getNetworkId().valueOf()
    }
    return networkId.valueOf()
}

export function getTxFee(txCbor: string) {
    const tx = Serialization.Transaction.fromCbor(Serialization.TxCBOR(txCbor));
    return tx.body().fee().toString()
}
