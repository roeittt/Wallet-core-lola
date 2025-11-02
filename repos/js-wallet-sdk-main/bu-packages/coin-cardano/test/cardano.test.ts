import { log } from "console";
import {
    AdaWallet,
    addressFromPubKey,
    bech32AddressToHexAddress,
    TxData,
} from "../src";
import {Serialization} from "@cardano-sdk/core";
import {base} from "@okxweb3/coin-base";

const wallet = new AdaWallet();

describe("account", () => {
    test("derive key", async () => {
        let mnemonic = "bean mountain minute enemy state always weekend accuse flag wait island tortoise";
        const hdPath = "m/1852'/1815'/0'/0/0"
        const privateKey = await wallet.getDerivedPrivateKey({mnemonic, hdPath})
        expect(privateKey).toEqual('30db52f355dc57e92944cbc93e2d30c9352a096fa2bbe92f1db377d3fdc2714aa3d22e03781d5a8ffef084aa608b486454b34c68e6e402d4ad15462ee1df5b8860e14a0177329777e9eb572aa8c64c6e760a1239fd85d69ad317d57b02c3714aeb6e22ea54b3364c8aaa0dd8ee5f9cea06fa6ce22c3827b740827dd3d01fe8f3')
    });

    test("check private key", async () => {
        const result = await wallet.validPrivateKey({privateKey: "0000000000000000000000000000000000000000000000000000000000000000"});
        expect(result.isValid).toEqual(false)
    });

    test("addressFromPubKey", async () => {
        const privateKey = "30db52f355dc57e92944cbc93e2d30c9352a096fa2bbe92f1db377d3fdc2714aa3d22e03781d5a8ffef084aa608b486454b34c68e6e402d4ad15462ee1df5b8860e14a0177329777e9eb572aa8c64c6e760a1239fd85d69ad317d57b02c3714aeb6e22ea54b3364c8aaa0dd8ee5f9cea06fa6ce22c3827b740827dd3d01fe8f3"
        const publicKey = "f78d9bc8ca867c04f75fd86f2457c1ba35ce6b25e7cbc90356eea4b1503e2f537d3d86598bc62e0481f803603bc7f33cbddb1f185417e9386fce43d871c270b0";

        const addressData = await wallet.getNewAddress({privateKey});
        expect(addressData.publicKey).toEqual(publicKey);

        const addressData2 = await wallet.getNewAddress({privateKey: '0x' + privateKey});
        expect(addressData2.publicKey).toEqual(publicKey);

        const addressData3 = await wallet.getNewAddress({privateKey: '0X' + privateKey});
        expect(addressData3.publicKey).toEqual(publicKey);

        const addressData4 = await wallet.getNewAddress({privateKey: '0X' + privateKey.toUpperCase()});
        expect(addressData4.publicKey).toEqual(publicKey);

        const expectedAddress = "addr1q95y9uu3ekfwmlu3mthnjeuptu95th8m0qzqw2kexej6xgpttfhlqgwy5vavd7ggzneerhd80456j736e085zcys9y9q5frsx7";
        expect(await addressFromPubKey(publicKey)).toEqual(expectedAddress)
        expect(await addressFromPubKey('0x' + publicKey)).toEqual(expectedAddress)
        expect(await addressFromPubKey('0X' + publicKey)).toEqual(expectedAddress)
        expect(await addressFromPubKey('0X' + publicKey.toUpperCase())).toEqual(expectedAddress)
    });

    test("bech32 address to hex address", () => {
        const bech32Address = "addr1q8nrdx6sukqwatkv7x8y0csl0x2l0rek9cmc04n5z35anxphyemygs8dxvfe432u6xcrt89d968u478w6s0cu8x7thrsng2ztx";
        const expectedHexAddress = "01e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc7";
        expect(wallet.bech32AddressToHexAddress(bech32Address)).toEqual(expectedHexAddress);
    })
})


describe("transaction", () => {
    const privateKey = '30db52f355dc57e92944cbc93e2d30c9352a096fa2bbe92f1db377d3fdc2714aa3d22e03781d5a8ffef084aa608b486454b34c68e6e402d4ad15462ee1df5b8860e14a0177329777e9eb572aa8c64c6e760a1239fd85d69ad317d57b02c3714aeb6e22ea54b3364c8aaa0dd8ee5f9cea06fa6ce22c3827b740827dd3d01fe8f3'

    const analyzeTxInfo = (txBase64: string) => {
        const txHex = base.toHex(base.fromBase64(txBase64))
        const tx = Serialization.Transaction.fromCbor(Serialization.TxCBOR(txHex));
        const txCore = tx.toCore();
        const outputs = txCore.body.outputs;
        const fee = txCore.body.fee;

        return {
            fee: fee.toString(),
            outputCount: outputs.length,
            outputs: outputs.map((output, i) => ({
                address: output.address,
                amount: output.value.coins.toString(),
                hasMultiAsset: !!(output.value.assets && output.value.assets.size > 0)
            }))
        };
    };

    test("Keep change output", async () => {
        // change = 8ada (10-2) > 969750 = requiredAda for change output
        // fee with change output ≈ 168141
        // actual_change = 8ada - 168141 = 7.831859ada > 969750 = requiredAda for change output
        // keep change output
        // valid = true
        const testData: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "10000000", // 10 ADA input
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "2000000", // 2 ADA output, large change remains sufficient after fee
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        const fee = await AdaWallet.minFee({data: testData, privateKey})
        expect(fee).toEqual("165281")

        const tx = await wallet.signTransaction({data: testData, privateKey})

        const txInfo = analyzeTxInfo(tx)
        expect(txInfo.outputCount).toBe(2) // Should have recipient + change output
    })

    test("Change removed, fee = remaining", async () => {
        // change =  1ada > 969750 = requiredAda for change output
        // fee with change output = 168141
        // actual_change = 1ada - 168141  = 831859 < 969750 = requiredAda for change output
        // remove change output
        // recalculate fee = 165281 < 1 ada = change
        // fee = change = 1 ada
        // valid = true
        const testData: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "3000000", // 3 ADA
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "2000000", // 2 ADA, leaving 1ADA change (
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        const fee = await AdaWallet.minFee({data: testData, privateKey})
        expect(fee).toEqual("165281")

        const tx = await wallet.signTransaction({data: testData, privateKey})

        const txInfo = analyzeTxInfo(tx)
        expect(txInfo.outputCount).toEqual(1) // Should only have recipient output
        expect(txInfo.fee).toEqual("1000000")
    })

    test("Change removed, insufficient for new fee", async () => {
        // change = 1ada (550ada - 549ada) > 969750 = requiredAda for change output
        // fee with change output (550 inputs = very large tx size) ≈ 1.1ada
        // actual_change = 1ada - 1.1ada = -0.1ada < 969750 = requiredAda for change output
        // remove change output
        // recalculate fee without change output ≈ 1.1ada > 1ada = change
        // fee = calculated fee (1.1ada), valid = false
        const testData: TxData = {
            privateKey,
            inputs: [

            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "549000000", // 4 ADA output, leaving 1 ADA change
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }
        for (let i = 0; i < 550; i++) {
            testData.inputs.push({
                "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                "index": i,
                "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                "amount": "1000000", // 1 ADA
            })

        }

        const fee = await AdaWallet.minFee({data: testData, privateKey})
        expect(fee).toEqual("1071065")

        await expect(wallet.signTransaction({data: testData, privateKey})).rejects.toThrow()

    })


    test("No change output, fee = change", async () => {
        // change = 180000 < 969750 = requiredAda for change output
        // no change output from start
        // fee without change output ≈ 165281 < 180000 = change
        // fee = change = 180000
        // valid = true
        const testData: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "2180000", // Small change insufficient for its own output
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "2000000", // Leave 180k which becomes fee
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        const fee = await AdaWallet.minFee({data: testData, privateKey})
        expect(fee).toEqual("165281")

        const tx = await wallet.signTransaction({data: testData, privateKey})

        const txInfo = analyzeTxInfo(tx)
        expect(txInfo.outputCount).toEqual(1) // Should only have recipient output
        expect(txInfo.fee).toEqual("180000")
    })

    test("No change output, insufficient for fee", async () => {
        // change = 50000 < 969750 = requiredAda for change output
        // no change output from start
        // fee without change output ≈ 165281 > 50000 = change
        // fee = calculated fee, valid = false
        const testData: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "2100000", // Very tight
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "2050000", // Leave only 50k for fees (insufficient)
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        const fee = await AdaWallet.minFee({data: testData, privateKey})
        expect(fee).toEqual("165281")

        await expect(wallet.signTransaction({data: testData, privateKey})).rejects.toThrow()

    })

    test("Insufficient input ADA", async () => {
        // totalInputLovelace = 1ada < totalOutputLovelace = 2ada
        // change = 1ada - 2ada = -1ada < 0
        // throw error: "not enough input ada"
        const testData: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "1000000", // 1 ADA input
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "2000000", // 2 ADA output (more than input)
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        await expect(AdaWallet.minFee({data: testData, privateKey})).rejects.toThrow('not enough input ada')
        await expect(wallet.signTransaction({data: testData, privateKey})).rejects.toThrow('not enough input ada')
    })

    test("estimate then transfer max", async() => {
        const data: TxData = {
            privateKey,
            inputs: [
                {
                    "txId": "a27780fc81a766e09e95426c8cd2860d83e5b38c8f607ac13cd838988a6ff9eb",
                    "index": 0,
                    "address": "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
                    "amount": "994410000",
                }
            ],
            address: "addr1q88vdk7j6h2d98u5e2hmxqh9sxdh0atx873yzhzhnrasekdt0l90f5x6mzhq8r9z2h776c8phzd2sy5p0ewkvvynf50qsxwezv",
            amount: "994410000",
            multiAsset: [

            ],
            changeAddress: "addr1q8yx6w98nxmg45mvumeh8f26f2wkj8ard0jufmwxwq8q7khxzx9jj2ueswgn9ln0npdu4jm0z8ewehsl40mqkspeg56s68fjud",
            ttl: "999999999"
        }

        const fee = await AdaWallet.minFee({data, privateKey})

        const maxSend = data.inputs.reduce(
            (acc, input) => acc + parseInt(input.amount),
            0
        ) - parseInt(fee)

        if (parseInt(data.amount) > maxSend) {
            data.amount = maxSend.toString()
        }


        const tx = await wallet.signTransaction({data, privateKey})

        const txInfo = analyzeTxInfo(tx)
        expect(txInfo.outputCount).toEqual(1) // Should only have recipient output no change
        expect(txInfo.fee).toEqual(fee)
    })

    test("transfer", async() => {
        const param = {
            privateKey,
            data: {
                inputs: [
                    {
                        txId: "7f6a09b3eb7ea3942b788c7aa086a43124021136f9ea4afe9ac705bc28e0cf17",
                        index: 1,
                        amount: "1000000000",
                        address: "addr1qyxdgpwcqsrfsfv7gs3el47ym205hxaxnnpvs550czrjr8gr7z40zns2zm4kdd5jgxhawpstcgnyt4zdwzn4e9g6qmksvhsufu",
                        privateKey,
                    },
                    {
                        txId: "7f6a09b3eb7ea3942b788c7aa086a43124021136f9ea4afe9ac705bc28e0cf17",
                        index: 2,
                        amount: "1150770",
                        address: "addr1qyxdgpwcqsrfsfv7gs3el47ym205hxaxnnpvs550czrjr8gr7z40zns2zm4kdd5jgxhawpstcgnyt4zdwzn4e9g6qmksvhsufu",
                        privateKey,
                        multiAsset: [
                            {
                                policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
                                assets: [
                                    {
                                        assetName: "4d494e",
                                        amount: "11614448"
                                    }
                                ]

                            }
                        ]
                    },
                    {
                        txId: "f2b78093ca7be37d24a8f6462991745552f80f4610d1777c456a7ce24f2b3e02",
                        index: 1,
                        amount: "2000000",
                        address: "addr1qyxdgpwcqsrfsfv7gs3el47ym205hxaxnnpvs550czrjr8gr7z40zns2zm4kdd5jgxhawpstcgnyt4zdwzn4e9g6qmksvhsufu",
                        privateKey,
                        multiAsset: [
                            {
                                policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
                                assets: [
                                    {
                                        assetName: "4d494e",
                                        amount: "1741609"
                                    }
                                ]

                            }
                        ]
                    }
                ],
                address: "addr1qyxdgpwcqsrfsfv7gs3el47ym205hxaxnnpvs550czrjr8gr7z40zns2zm4kdd5jgxhawpstcgnyt4zdwzn4e9g6qmksvhsufu",
                amount: "1150770",
                multiAsset: [
                    {
                        policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
                        assets: [
                            {
                                assetName: "4d494e",
                                amount: "13356057"
                            }
                        ]

                    }
                ],
                changeAddress: "addr1qyxdgpwcqsrfsfv7gs3el47ym205hxaxnnpvs550czrjr8gr7z40zns2zm4kdd5jgxhawpstcgnyt4zdwzn4e9g6qmksvhsufu",
                ttl: "999999999"
            }
        }
        const tx = await wallet.signTransaction(param)
        const expectedTx = 'hKQAg4JYIH9qCbPrfqOUK3iMeqCGpDEkAhE2+epK/prHBbwo4M8XAYJYIH9qCbPrfqOUK3iMeqCGpDEkAhE2+epK/prHBbwo4M8XAoJYIPK3gJPKe+N9JKj2RimRdFVS+A9GENF3fEVqfOJPKz4CAQGCglg5AQzUBdgEBpglnkQjn9fE2p9Lm6acwshSj8CHIZ0D8KrxTgoW62a2kkGv1wYLwiZF1E1wp1yVGgbtghoAEY8yoVgcKdIiznY0VePXoJpmXOVU8ArInS6Zoag9JnFwxqFDTUlOGgDLzBmCWDkBDNQF2AQGmCWeRCOf18Tan0ubppzCyFKPwIchnQPwqvFOChbrZraSQa/XBgvCJkXUTXCnXJUaBu0aO7aqGwIaAAKkZQMaO5rJ/6EAgYJYIPeNm8jKhnwE91/YbyRXwbo1zmsl58vJA1bupLFQPi9TWEDiCIo3s1twzboLPQGnmtNPNGTfBQA5qoejI1d9hzUZDN3W2SKAhfrNR5gIZ2EUvyt6oC7ZdOsQm+lDSa/EMM0N9fY='
        expect(tx).toEqual(expectedTx)

        const expectedTxHash = '249f102ff7f42ce1eb17dbcc2b593ffb03d46a5b4a5579e091becfda37dc7a77'
        const hashFromTxObj = await wallet.calcTxHash(param)
        const hashFromTxHex = await wallet.calcTxHash({data: expectedTx})
        expect(hashFromTxObj).toEqual(expectedTxHash)
        expect(hashFromTxHex).toEqual(expectedTxHash)

        const ada = await AdaWallet.minAda(param.data.address, param.data.multiAsset)
        expect(ada).toEqual('1150770')

        const fee = await AdaWallet.minFee(param)
        expect(fee).toEqual('170297')
    })

    test('sign dapp tx', async () => {
        const txCbor = '84a500d90102838258200d9decba21834902cc87d39a3b334da8015c23a97c931db84af7dcbd5a7acbaf0182582014baf4ae16ded674ac2593f4982f7bd0db75bcc50a8bcfe59d9ee949a8eb397f01825820b8d810edafed71fedaf117ea232854df8bc67800d2d7f2fc2ce550a6e3b63c34010182a300583911c3e28c36c3447315ba5a56f33da6a6ddc1770a876a8d9f0cb3a97c4c03f0aaf14e0a16eb66b69241afd7060bc22645d44d70a75c951a06ed011a0047b760028201d818590130d8799fd8799f581c0cd405d8040698259e44239fd7c4da9f4b9ba69cc2c8528fc087219dffd8799fd8799f581c0cd405d8040698259e44239fd7c4da9f4b9ba69cc2c8528fc087219dffd8799fd8799fd8799f581c03f0aaf14e0a16eb66b69241afd7060bc22645d44d70a75c951a06edffffffffd87980d8799fd8799f581c0cd405d8040698259e44239fd7c4da9f4b9ba69cc2c8528fc087219dffd8799fd8799fd8799f581c03f0aaf14e0a16eb66b69241afd7060bc22645d44d70a75c951a06edffffffffd87980d8799f581cf5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c582082e2b1fd27a7712a1a9cf750dfbea1a5778611b20e06dd6a611df7a643f8cb75ffd8799fd87a80d8799f1a001e8480ff1a035a397ad87980ff1a000aae60d87a80ff825839010cd405d8040698259e44239fd7c4da9f4b9ba69cc2c8528fc087219d03f0aaf14e0a16eb66b69241afd7060bc22645d44d70a75c951a06ed1a00318951021a0002dfb1031a08ffa3580758201feb00f18fbe772cc375aa495da0b08d837a719671e68da62f8ed658915d8fd1a0f5a11902a2a1636d736781754d696e737761703a204d61726b6574204f72646572'

        const networkId = wallet.getNetworkId(txCbor)
        expect(networkId).toEqual(1)

        const fee = wallet.getTxFee(txCbor)
        expect(fee).toEqual('188337')

        const witnessSet = await wallet.signTransaction({data: {type: "rawTx", tx: txCbor}, privateKey})
        expect(witnessSet).toEqual('a10081825820f78d9bc8ca867c04f75fd86f2457c1ba35ce6b25e7cbc90356eea4b1503e2f535840c4d51241d2d74950fc4b74dede4942d8a2ef553e5dff7d30086c63e341332c6185a5363f4380587a7f1b3d6fa49022579067f4acf97136fcc05db7bc17e5c905')
    })

    test('getUtxos', async () => {
        const inputs =  [
            {
                "txId": "661920f5d019bba6c8f5aa2d84cba38575f698882055b851331f7dbc67b38917",
                "index": 0,
                "address": "addr1q8nrdx6sukqwatkv7x8y0csl0x2l0rek9cmc04n5z35anxphyemygs8dxvfe432u6xcrt89d968u478w6s0cu8x7thrsng2ztx",
                "amount": "15000000"
            },
            {
                "txId": "7e1c8d23e347748dbc02fdc60250154e1e8f91225127ec95f9f4e95d098dfd77",
                "index": 0,
                "address": "addr1q8nrdx6sukqwatkv7x8y0csl0x2l0rek9cmc04n5z35anxphyemygs8dxvfe432u6xcrt89d968u478w6s0cu8x7thrsng2ztx",
                "amount": "2000000"
            },
            {
                "txId": "2622aa9dd0ba3337ceae89da8beeae19f8316dd26e1d6242bf2d366abf3557f0",
                "index": 1,
                "address": "addr1q8nrdx6sukqwatkv7x8y0csl0x2l0rek9cmc04n5z35anxphyemygs8dxvfe432u6xcrt89d968u478w6s0cu8x7thrsng2ztx",
                "amount": "1150770",
                "multiAsset": [
                    {
                        "policyId": "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
                        "assets": [
                            {
                                "assetName": "4d494e",
                                "amount": "9847890"
                            }
                        ]
                    }
                ]
            },
            {
                "txId": "f7d2adafaeaf64f5e4aa048cb7b3476a5eb548f69535b6d298d5ed6283c7ebb9",
                "index": 0,
                "address": "addr1q8nrdx6sukqwatkv7x8y0csl0x2l0rek9cmc04n5z35anxphyemygs8dxvfe432u6xcrt89d968u478w6s0cu8x7thrsng2ztx",
                "amount": "1150770",
                "multiAsset": [
                    {
                        "policyId": "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
                        "assets": [
                            {
                                "assetName": "4d494e",
                                "amount": "200000"
                            }
                        ]
                    }
                ]
            }
        ]
        const utxos = wallet.getFilteredUtxos(inputs)
        expect(utxos).toStrictEqual([
            "82825820661920f5d019bba6c8f5aa2d84cba38575f698882055b851331f7dbc67b389170082583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc71a00e4e1c0",
            "828258207e1c8d23e347748dbc02fdc60250154e1e8f91225127ec95f9f4e95d098dfd770082583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc71a001e8480",
            "828258202622aa9dd0ba3337ceae89da8beeae19f8316dd26e1d6242bf2d366abf3557f00182583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc7821a00118f32a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a00964452",
            "82825820f7d2adafaeaf64f5e4aa048cb7b3476a5eb548f69535b6d298d5ed6283c7ebb90082583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc7821a00118f32a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a00030d40"
        ])

        const valueCbor = '821a00118f32a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a00030d40'

        const filteredUtxos = wallet.getFilteredUtxos(inputs, valueCbor)
        expect(filteredUtxos).toStrictEqual([
            "82825820661920f5d019bba6c8f5aa2d84cba38575f698882055b851331f7dbc67b389170082583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc71a00e4e1c0",
            "828258207e1c8d23e347748dbc02fdc60250154e1e8f91225127ec95f9f4e95d098dfd770082583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc71a001e8480",
            "828258202622aa9dd0ba3337ceae89da8beeae19f8316dd26e1d6242bf2d366abf3557f00182583901e6369b50e580eeaeccf18e47e21f7995f78f362e3787d6741469d9983726764440ed33139ac55cd1b0359cad2e8fcaf8eed41f8e1cde5dc7821a00118f32a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a00964452"
        ])

        const sum = wallet.getBalance(inputs)
        expect(sum).toEqual('821a012684a4a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a00995192')
    })

    test('message', async() => {
        const address = 'addr1q95y9uu3ekfwmlu3mthnjeuptu95th8m0qzqw2kexej6xgpttfhlqgwy5vavd7ggzneerhd80456j736e085zcys9y9q5frsx7'
        const hash = 'd2b850c8c45abc5364b12da492ba718c6668c3d1d7dc8ef4ae6190581514cac7'
        const expected = {"signature":"845846a2012767616464726573735839016842f391cd92edff91daef3967815f0b45dcfb7804072ad93665a3202b5a6ff021c4a33ac6f90814f391dda77d69a97a3acbcf416090290aa166686173686564f45820d2b850c8c45abc5364b12da492ba718c6668c3d1d7dc8ef4ae6190581514cac75840c520f13a63f19ea963822e8f5cc4ae20b5db0d599b2c6f094c0e7d4aaefc65c171fbb1380a6ae2c2542af8662a5942bb7d15c59db781948dffae90938d2e660e","key":"a4010103272006215820f78d9bc8ca867c04f75fd86f2457c1ba35ce6b25e7cbc90356eea4b1503e2f53"}
        const res = await wallet.signMessage({data: {address, message: hash}, privateKey})
        expect(res).toEqual(expected)
    })
});
