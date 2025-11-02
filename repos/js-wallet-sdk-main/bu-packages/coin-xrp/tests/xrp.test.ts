import {XrpWallet} from "../src";
import {expect} from "@jest/globals";
import {TextEncoder} from "util";
import nock from "nock";

const encoder = new TextEncoder();

let networkConnectInstance: string[] = []
const address1 = "rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw"
const seed1 = "sEd7BP8uSNdVeeV4i8B72yH7y3uAJJc"
const address2 = "rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE"
const seed2 = "sEdSjg4zhBGRa2SrfwsE6L31ePxrkcY";
describe("xrp", () => {
    beforeEach(() => {
        nock.disableNetConnect()
        nock.emitter.on("no match", (req) => {
            networkConnectInstance.push(`Unexpected network call to ${req.method} ${req.hostname}${req.path}`);
        });
    });
    afterEach(()=> {
        if (networkConnectInstance.length > 0) {
            throw new Error(networkConnectInstance.join("\n"));
        }
        // Clean up all nock interceptors
        nock.cleanAll();
        nock.enableNetConnect();
    })
    const wallet = new XrpWallet();
    test("getDerivedPath", async () => {
        const path = await wallet.getDerivedPath({index: 0})
        expect(path).toEqual(`m/44'/144'/0'/0/0`)
    })

    test("test with go-sdk", async () => {
        const mnemonic = `monster march exile fee forget response seven push dragon oil clinic attack black miss craft surface patient stomach tank float cabbage visual image resource`;
        let privateKey = await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 0})
        })
        expect(privateKey).toEqual("003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398")
        let addr = await wallet.getNewAddress({privateKey: privateKey});
        expect(addr.address).toEqual("rnGUZ6FzJyazXqkqBheSQdw7c5JfohZafv")
        expect(addr.publicKey).toEqual("03B31228D181BB9B1617DC8220792A3114ACD9F892707A2620B4C668AD1711501E")


        privateKey = await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 1})
        })
        expect(privateKey).toEqual("00C4F30631C14230C3A45E615A3C0381B758EFBBE8FA0444AF968914080CD74CEE")
        addr = await wallet.getNewAddress({privateKey: privateKey});
        expect(addr.address).toEqual("rKBXDsAP8TUx6Lt4n9uQbHY9NgfLgyXvRb")
        expect(addr.publicKey).toEqual("0333EC6E43CA079D8800487939994C517F64AA83D3EA8201E5C20D2CE0EE84E112")


        privateKey = await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 2})
        })
        expect(privateKey).toEqual("00941BD073780E25DBA06D1B375B501F6BDBEBFE9D48480D60D2E04C79BE4848B4")
        addr = await wallet.getNewAddress({privateKey: privateKey});
        expect(addr.address).toEqual("ranz1G63cqN4X5LsExaF1khK6tRyGbbiU7")
        expect(addr.publicKey).toEqual("02ED12DF0F55AEF3D1D6DFE0D2C4AD3E0A2362B1B013512CC814AC55351B5C9FB4")


        privateKey = await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 3})
        })
        expect(privateKey).toEqual("00BDB5CDF7C32A64AEAC81D37A0378F723EE3079DE7D00614FD9B5AC50187A2168")
        addr = await wallet.getNewAddress({privateKey: privateKey});
        expect(addr.address).toEqual("rHNkU8RNHUwwYBrSf2njirmTiNJRyM3rus")
        expect(addr.publicKey).toEqual("020A88E6968DE18010823E9963C02008EC34DD778E0A366A673F45486991F743C2")


        const mnemonic2 = 'monster march exile fee forget response seven push dragon oil clinic attack black miss craft surface patient stomach tank float cabbage visual image resource'
        let privateKey1 = await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic2,
            hdPath: await wallet.getDerivedPath({index: 0})
        })
        expect(privateKey1).toEqual("003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398")
        let address = await wallet.getNewAddress({privateKey:"003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398"})
        expect(address.address).toEqual('rnGUZ6FzJyazXqkqBheSQdw7c5JfohZafv');
        expect(address.publicKey).toEqual('03B31228D181BB9B1617DC8220792A3114ACD9F892707A2620B4C668AD1711501E');

        address = await wallet.getNewAddress({privateKey:"ED4C4513D22E3FB5C8537C601774AAB70ED3A5DA2631B7ACFA8EF347D8D0DE139D"})
        expect(address.address).toEqual('r4zwq8rTNeVFTrU6Bf2VJagLkBYTneaFyG');
        expect(address.publicKey).toEqual('ED38F3FAF499B75D28594CB056D6EEE0FF93D59814A2CD37BA6A54B9D516BC2394');

        address = await wallet.getNewAddress({privateKey:"00854A56E4B34EE79A2F15932F7CE51EAB3214CF85FCFE99825410AC3C7A01D6F7"})
        expect(address.address).toEqual('rsWYAWBLjeeDZfVZBjVA1UxVsXRbJiWuvC');
        expect(address.publicKey).toEqual('022D393B1D1DE9920E28B0D1537B7544464FEA12B1475D93A285C37BD84E69DA5D');

    })

    test("getDerivedPrivateKey", async () => {
        const mnemonic = 'draw attack antique swing base employ blur above palace lucky glide clap pen use illegal'

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 0})
        })).toEqual("00B1F5B1D1B8F1B0CD9AD357CA67E3D9E0779F312C3B4E15FA6597872ECD04CAD8");
        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 1}),
        })).toEqual("00BE14080B595C0DF4FE29EFBE5DEBB0F0F61E18560B0C902D1C57E4E83D1A88BA")
        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 2}),
        })).toEqual("0058ADE6374139390B1A491510DEA96EF60AEF5AF2149DD24C437EC3F7549E5409")
        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 3}),
        })).toEqual("007FB82A3DBAA4677494F075E4B23E97D9173ECB5D12EFAF1906772A5DB3B64825")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 4}),
        })).toEqual("0016DC3FECEB08060DAE308A0FA60F2A8646565AD3CEECA0C4602AE6C26B1A419C")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 5}),
        })).toEqual("005FBE51B99D0570F325CF98F485C3BDA31C8FE9D10348E5FBAFFCB4793C14D556")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 6}),
        })).toEqual("00CBA50289EA2E7C91CA6D20AE2381DADC95864AAED30BBB21A1247C65A8454039")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 7}),
        })).toEqual("00B0DADA499A7184AE37D2A56FBDD3A45E72D8B25CC4CF759FE4BD479BC55D1C26")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 8}),
        })).toEqual("00A11DD6335DC4CC5DC1E693BD6E0D3C62ADC9D365893AAE9EF04776051B437448")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 9}),
        })).toEqual("00C69C28E3B4608DBF35DB8D5EC2A0DA87983E46AE70BA1C00DE37A2007ED41932")

        expect(await wallet.getDerivedPrivateKey({
            mnemonic: mnemonic,
            hdPath: await wallet.getDerivedPath({index: 10}),
        })).toEqual("004C6E39576268252691AFBCDA66305218C982E6C6FDD61ECCFD2ACBC2EFEE0315")
    })

    test("getNewAddress", async () => {
        //secp256
        const addr = await wallet.getNewAddress({privateKey: "00B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19"})
        expect(addr.address).toEqual("rQKQsPeE3iTRyfUypLhuq74gZdcRdwWqDp")
        expect(addr.publicKey).toEqual("03BFC2F7AE242C3493187FA0B72BE97B2DF71194FB772E507FF9DEA0AD13CA1625")

        //default ed25519
        const addr2 = await wallet.getNewAddress({privateKey: "sh1HiK7SwjS1VxFdXi7qeMHRedrYX"})
        expect(addr2.address).toEqual("rHnnXF4oYodLonx7P7MV4WaqPUvBWzskEw")
        expect(addr2.publicKey).toEqual("ED8079E575450E256C496578480020A33E19B579D58A2DB8FF13FC6B05B9229DE3")


        const addr3 = await wallet.getNewAddress({privateKey: "sh1HiK7SwjS1VxFdXi7qeMHRedrYX"})
        expect(addr3.address).toEqual("rHnnXF4oYodLonx7P7MV4WaqPUvBWzskEw")
        const addr4 = await wallet.getNewAddress({privateKey: "EDD2AF6288A903DED9860FC62E778600A985BDF804E40BD8266505553E3222C3DA"})
        expect(addr4.address).toEqual("rHnnXF4oYodLonx7P7MV4WaqPUvBWzskEw")
    })

    test("test validPrivateKey", async () => {
        expect((await wallet.validPrivateKey({privateKey: "sh1HiK7SwjS1VxFdXi7qeMHRedrYX"})).isValid).toEqual(true)
        expect((await wallet.validPrivateKey({privateKey: "EDD2AF6288A903DED9860FC62E778600A985BDF804E40BD8266505553E3222C3DA"})).isValid).toEqual(true)
        expect((await wallet.validPrivateKey({privateKey: "00B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19"})).isValid).toEqual(true)
        expect((await wallet.validPrivateKey({privateKey: "ADD2AF6288A903DED9860FC62E778600A985BDF804E40BD8266505553E3222C3DA"})).isValid).toEqual(false)
        expect((await wallet.validPrivateKey({privateKey: "01B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19"})).isValid).toEqual(false)
        expect((await wallet.validPrivateKey({privateKey: "ED0000000000000000000000000000000000000000000000000000000000000000"})).isValid).toEqual(false)
        expect((await wallet.validPrivateKey({privateKey: "000000000000000000000000000000000000000000000000000000000000000000"})).isValid).toEqual(false)
    })

    test("validAddress", async () => {
        expect((await wallet.validAddress({address: "rQKQsPeE3iTRyfUypLhuq74gZdcRdwWqDp"})).isValid).toEqual(true);
        expect((await wallet.validAddress({address: "rHnnXF4oYodLonx7P7MV4WaqPUvBWzskEw"})).isValid).toEqual(true);
        expect((await wallet.validAddress({address: "XVTpHQBCUkbqMxcg1BxrvjMzon6scwLUrfprGFQ5HbcntmP"})).isValid).toEqual(true);

        expect((await wallet.validAddress({address: "rQKQsPeE3iTRyfUypLhuq74gZdcRdwWqDa"})).isValid).toEqual(false);
        expect((await wallet.validAddress({address: "rHnnXF4oYodLonx7P7MV4WaqPUvBWzskEa"})).isValid).toEqual(false);

    })

    test("signMessage", async () => {
        const msg = {
            messageId: "123",
            url: "",
            title: "",
            favicon: "",
            message: "",
        }
        const sig = await wallet.signMessage({
            privateKey: "003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398",
            data: msg,
        })
        const addr = await wallet.getNewAddress({privateKey:"003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398"})
        const res = await wallet.verifyMessage({
            signature: sig,
            data: {
                message: msg,
                publicKey:addr.publicKey
            },
        })
        expect(res).toEqual(true)
    })

    test("signMessage compare with Go-SDK", async () => {
        const msg = {
            messageId: "1",
            url: "https://www.example.com",
            title: "hello",
            favicon: "",
            message: "{}",
        }
        const sig = await wallet.signMessage({
            privateKey: "sEdTvuBoBX2s1cMbuFLwDj7svShwta2",
            data: msg,
        })
        const expected = '220DF8184AF045D21C047276415CEE2E45EB3D02E4C8841A691E24FADFC70D1FDBF3EB0218107A2A56F760BEBA1CFAAD02DE60DB5BD81DA64D0AC545831C250E';
        expect(sig).toEqual(expected)
    })

    test("signCommonMsg", async () => {
        //secp256k1
        let s = await wallet.signCommonMsg({
            privateKey: "00B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19",
            message: {
                walletId: "123456789",
            }
        })
        let expected = `1b0c6a5a270b08a190e9a3a0189151a56eb12d8844d191cf5e88105e6f35cc2a6015411897b1d9fff143d3befb32b0ce08deae0752553abcce1095e8e1b6676d6d`
        expect(s).toEqual(expected)

        let s2 = await wallet.signCommonMsg({
            privateKey: "00B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19",
            message: {
                text: "123456789",
            }
        })

        expected = '1b1169e542a5d5c9842734e0baa99e702a0e5ecfee63e9098e19404aed3e8d3c9b6b360487162cec89ad4237a6ebcca6d36dd52d28af27bb32eac2e2a447fd97f4'
        expect(s2).toEqual(expected)


        //ed25519
        s = await wallet.signCommonMsg({
            privateKey: "sh1HiK7SwjS1VxFdXi7qeMHRedrYX",
            message: {
                walletId: "123456789",
            }
        })
        // console.log(await wallet.getNewAddress({privateKey:"sh1HiK7SwjS1VxFdXi7qeMHRedrYX"}))
        expected = `13684c892fec65517b0c8bf42a3a67e05314e17d97e9267b8adfc58dde1ec123d4de11ed284eb67046d25de44c35b2755e3c84a35e29cd40c89a816042cc5602`
        expect(s).toEqual(expected)

        s = await wallet.signCommonMsg({
            privateKey: "sh1HiK7SwjS1VxFdXi7qeMHRedrYX",
            message: {
                text: "123456789",
            }
        })
        expected = `91d8b8696ed4779aef72b958127cc67868a4ec777291ffc552f3e15fbfa6ccdd6dde2394cda716067f8dbaaeb635f71cc0ee8b05a61036937bb500d03c338c05`
        expect(s).toEqual(expected)
        // console.log(await wallet.getNewAddress({privateKey:"00B6FE8507D977E46E988A8A94DB3B8B35E404B60F8B11AC5213FA8B5ABC8A8D19"}))
        // console.log(await wallet.getNewAddress({privateKey:"sh1HiK7SwjS1VxFdXi7qeMHRedrYX"}))
    })

    test("calcTxHash", async () => {
        let txHex = `1200002400582FF8201B0058456D61400000000012C4B068400000000000000C7321ED16F6E4E8E21F976F36BAD42C1125500BCBE407D071E4C6B0271A6A03A305131E7440C2F6F4E6626997300E8359024712CCB118949B0671D64EBBC46A80357A238C7183A931D0B945A3DC8A02EAB8F49A82DFB49164B4C97506AC94EA1523933B9D0A811436A75B1BF0E788ED08B06BAE697DC8E52AAE6D748314C17921479B0BC69B0B5560A6A4605B5470EB7F31`;
        let expectedTxHash = `5978FAF3CAB22AF7F391416A28315B87B62AA4751C9ECA9F557D2F9900E81CD5`
        expect(await wallet.calcTxHash({data: txHex})).toEqual(expectedTxHash)

        txHex = `12000024003588522E00003039201B0058A126614000000005F5E10068400000000000000C7321ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F744099D54C249F99CBAB8A12215F889E17AA6497336E2A47938BFC136B38032086459522CA7D654477892F3FD2ABF8C3CA85D51908A66FA65DFC85B9B6562F889D0B8114629CCC144AC8464561F11D8870A57DC376A0D1918314C17921479B0BC69B0B5560A6A4605B5470EB7F31`;
        expectedTxHash = `DD3609022C716E318C3B613FC6ECB5BB41379538F4FCB322D6D63388B1AD2ED4`
        expect(await wallet.calcTxHash({data: txHex})).toEqual(expectedTxHash)
    })

    test("signTransfer", async () => {
        let tx = await wallet.signTransaction({
            privateKey: seed1,
            data: {
                type: "transfer",
                base: {
                    account: "rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw",
                    flags: 0,
                    fee: "12",
                    sequence: 5779448,
                    lastLedgerSequence: 5784941
                },
                data: {
                    amount: '1230000',
                    destination: 'rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE',
                }
            }
        })
        expect(tx.tx_blob).toEqual("1200002400582FF8201B0058456D61400000000012C4B068400000000000000C7321ED16F6E4E8E21F976F36BAD42C1125500BCBE407D071E4C6B0271A6A03A305131E7440C2F6F4E6626997300E8359024712CCB118949B0671D64EBBC46A80357A238C7183A931D0B945A3DC8A02EAB8F49A82DFB49164B4C97506AC94EA1523933B9D0A811436A75B1BF0E788ED08B06BAE697DC8E52AAE6D748314C17921479B0BC69B0B5560A6A4605B5470EB7F31")
        expect(tx.hash).toEqual("5978FAF3CAB22AF7F391416A28315B87B62AA4751C9ECA9F557D2F9900E81CD5")
    })
    test("signTransfer address with string type", async () => {
        let tx = await wallet.signTransaction({
            privateKey: seed1,
            data: {
                type: "transfer",
                base: {
                    account: "rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw",
                    flags: 0,
                    fee: "12",
                    sequence: "5779448",
                    lastLedgerSequence: "5784941"
                },
                data: {
                    amount: '1230000',
                    destination: 'rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE',
                }
            }
        })
        expect(tx.tx_blob).toEqual("1200002400582FF8201B0058456D61400000000012C4B068400000000000000C7321ED16F6E4E8E21F976F36BAD42C1125500BCBE407D071E4C6B0271A6A03A305131E7440C2F6F4E6626997300E8359024712CCB118949B0671D64EBBC46A80357A238C7183A931D0B945A3DC8A02EAB8F49A82DFB49164B4C97506AC94EA1523933B9D0A811436A75B1BF0E788ED08B06BAE697DC8E52AAE6D748314C17921479B0BC69B0B5560A6A4605B5470EB7F31")
        expect(tx.hash).toEqual("5978FAF3CAB22AF7F391416A28315B87B62AA4751C9ECA9F557D2F9900E81CD5")
    })
    test("signTransfer x address", async () => {
        let tx = await wallet.signTransaction({
            privateKey: "sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE",
            data: {
                type: "transfer",
                base: {
                    account: "r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7",
                    flags: 0,
                    fee: "12",
                    sequence: 3508306,
                    lastLedgerSequence: 5808422
                },
                data: {
                    amount: '100000000',
                    destination: 'XVTpHQBCUkbqMxcg1BxrvjMzon6scwLUrfprGFQ5HbcntmP', //x address
                }
            }
        })
        expect(tx.tx_blob).toEqual("12000024003588522E00003039201B0058A126614000000005F5E10068400000000000000C7321ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F744099D54C249F99CBAB8A12215F889E17AA6497336E2A47938BFC136B38032086459522CA7D654477892F3FD2ABF8C3CA85D51908A66FA65DFC85B9B6562F889D0B8114629CCC144AC8464561F11D8870A57DC376A0D1918314C17921479B0BC69B0B5560A6A4605B5470EB7F31")
        expect(tx.hash).toEqual("DD3609022C716E318C3B613FC6ECB5BB41379538F4FCB322D6D63388B1AD2ED4")
    })


    test("trust set", async () => {
        let tx = await wallet.signTransaction({
            privateKey: seed1,
            data: {
                type: "TrustSet",
                base: {
                    account: "rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw",
                    flags: 0,
                    fee: "12",
                    sequence: 5779449,
                    lastLedgerSequence: 5785541
                },
                data: {
                    limitAmount: {
                        currency: "USD",
                        issuer: "rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE",
                        value: "123",
                    }
                }
            }
        })
        expect(tx.tx_blob).toEqual("1200142400582FF9201B005847C563D5045EADB112E0000000000000000000000000005553440000000000C17921479B0BC69B0B5560A6A4605B5470EB7F3168400000000000000C7321ED16F6E4E8E21F976F36BAD42C1125500BCBE407D071E4C6B0271A6A03A305131E7440EC373F3B89FA5B010B9BEE30D9BD4BA692321B5F256008BB351EA9DECA7CEB529272D9A32B832B8EBF5C013592CC2FD9079C3B3BD4174DC9635AF3DA97339D0D811436A75B1BF0E788ED08B06BAE697DC8E52AAE6D74")
        expect(tx.hash).toEqual("D28EBC9D7999D270848232CA6CC0EDEC87F2AD8B4DC547F9532C3865672C052B")
    })

    test("send currency", async () => {
        let tx = await wallet.signTransaction({
            privateKey: seed2,
            data: {
                type: "transfer",
                base: {
                    account: address2,
                    flags: 0,
                    fee: "12",
                    sequence: 5779442,
                    lastLedgerSequence: 5786248
                },
                data: {
                    destination: address1,
                    amount: {
                        currency: "USD",
                        issuer: address2,
                        value: "1.23",
                    }
                }
            }
        })
        expect(tx.tx_blob).toEqual("1200002400582FF2201B00584A8861D4845EADB112E0000000000000000000000000005553440000000000C17921479B0BC69B0B5560A6A4605B5470EB7F3168400000000000000C7321ED3FD6ED6060A0F4DBB1C5F9CA924A7C6CF31A2E94BA4B479C010F5CC744813E96744004A20B7499260B32634BC0B58CA5554D9707B87CF9AE86882C8EA348C33ED08976B793CBE0995A95A32872B9F7C277348B5E64BE58015B6A6CE5369DB449790F8114C17921479B0BC69B0B5560A6A4605B5470EB7F31831436A75B1BF0E788ED08B06BAE697DC8E52AAE6D74")
        expect(tx.hash).toEqual("896F042FC4E4A5841B83E222217ED0604F3C2BBA444DB2B28B595788E70F18BB")
    })
})