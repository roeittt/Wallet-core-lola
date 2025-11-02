import {signUtil, bip32} from "@okxweb3/crypto-lib";
import {
    BigNumberish,
    CalculateContractAddressFromHash,
    ContractCall,
    ec,
    hash,
    modPrivateKey,
    StarknetWallet,
    TypedData,
    typedData,
    verifyMessage
} from "../src"
import { ETH, STRK } from '../src/constants';
import {encodeShortString} from "../src/lib/utils/shortString";
import {StarknetSignData} from "../src";
import {toHex} from "../src/lib/utils/num";
import {StarknetChainId} from "../src/lib/global/constants";

const Signature = signUtil.schnorr.stark.Signature;

const privateKey = '0x5283459ec65271070e2c7f67917bc66774eb08dad406d54d766270267162ecf'
const wallet = new StarknetWallet()

describe("account", () => {
    test("validPrivateKey", async () => {
        const privateKey = await wallet.getRandomPrivateKey();
        const res = await wallet.validPrivateKey({privateKey:privateKey});
        expect(res.isValid).toEqual(true);
    });

    test("getDerivedPath", async () => {
        const path1 = await wallet.getDerivedPath({index: 0});
        expect(path1).toBe("m/44'/9004'/0'/0/0");

        const path2 = await wallet.getDerivedPath({index: 5});
        expect(path2).toBe("m/44'/9004'/0'/0/5");

        const path3 = await wallet.getDerivedPath({index: 999});
        expect(path3).toBe("m/44'/9004'/0'/0/999");
    });

    test("getDerivedPrivateKey", async () => {
        const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const hdPath = "m/44'/9004'/0'/0/0";
        
        const privateKey = await wallet.getDerivedPrivateKey({mnemonic, hdPath});
        expect(privateKey).toMatch(/^0x[0-9a-fA-F]+$/);
        expect(privateKey.length).toBeGreaterThan(10);
        
        // 测试相同助记词和路径应该产生相同的私钥
        const privateKey2 = await wallet.getDerivedPrivateKey({mnemonic, hdPath});
        expect(privateKey).toBe(privateKey2);
        
        // 测试不同路径应该产生不同的私钥
        const differentPath = "m/44'/9004'/0'/0/1";
        const privateKey3 = await wallet.getDerivedPrivateKey({mnemonic, hdPath: differentPath});
        expect(privateKey).not.toBe(privateKey3);
    });

    test("getDerivedPrivateKey error handling", async () => {
        // 测试无效助记词
        await expect(wallet.getDerivedPrivateKey({
            mnemonic: "invalid mnemonic words",
            hdPath: "m/44'/9004'/0'/0/0"
        })).rejects.toMatch(/generate private key error/);

        // 测试空助记词
        await expect(wallet.getDerivedPrivateKey({
            mnemonic: "",
            hdPath: "m/44'/9004'/0'/0/0"
        })).rejects.toMatch(/generate private key error/);

        // 测试无效的派生路径 - 可能触发行155,165的错误分支
        await expect(wallet.getDerivedPrivateKey({
            mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            hdPath: "invalid/path/format"
        })).rejects.toMatch(/generate private key error/);
    });

    test("getDerivedPrivateKeyOld (legacy method)", async () => {
        // 测试旧的派生私钥方法以提高覆盖率
        const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const hdPath = "m/44'/9004'/0'/0/0";
        
        // 由于这是私有方法，我们需要通过类型断言来访问它
        const walletWithPrivate = wallet as any;
        if (walletWithPrivate.getDerivedPrivateKeyOld) {
            const privateKey = await walletWithPrivate.getDerivedPrivateKeyOld({mnemonic, hdPath});
            expect(privateKey).toMatch(/^0x[0-9a-fA-F]+$/);
            expect(privateKey.length).toBeGreaterThan(10);
        }
    });

    test("getDerivedPrivateKey branch coverage - ethKey.privateKey null", async () => {
        // 使用jest.spyOn模拟ethKey.privateKey为null的情况
        const spy = jest.spyOn(bip32, 'fromSeedV2');

        // Mock第一次调用返回没有privateKey的对象
        spy.mockReturnValueOnce({ privateKey: null } as any);

        try {
            await expect(wallet.getDerivedPrivateKey({
                mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
                hdPath: "m/44'/9004'/0'/0/0"
            })).rejects.toMatch(/generate private key error/);

            // 验证spy被调用
            expect(spy).toHaveBeenCalledWith(expect.any(Buffer), "m/44'/60'/0'/0/0");
        } finally {
            // 恢复原始方法
            spy.mockRestore();
        }
    });

    test("getDerivedPrivateKey branch coverage - childKey.privateKey null", async () => {
        // 使用jest.spyOn模拟childKey.privateKey为null的情况
        const spy = jest.spyOn(bip32, 'fromSeedV2');

        // Mock第一次调用返回有效的privateKey，第二次返回没有privateKey的对象
        spy.mockReturnValueOnce({ privateKey: Buffer.from("test_private_key", "hex") } as any)
           .mockReturnValueOnce({ privateKey: null } as any);

        try {
            await expect(wallet.getDerivedPrivateKey({
                mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
                hdPath: "m/44'/9004'/0'/0/0"
            })).rejects.toMatch(/generate private key error/);

            // 验证spy被调用了两次
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenNthCalledWith(1, expect.any(Buffer), "m/44'/60'/0'/0/0");
            expect(spy).toHaveBeenNthCalledWith(2, expect.any(Buffer), "m/44'/9004'/0'/0/0");
        } finally {
            // 恢复原始方法
            spy.mockRestore();
        }
    });

    test("getDerivedPrivateKeyOld branch coverage - ethKey.privateKey null", async () => {
        // 使用jest.spyOn模拟旧方法中ethKey.privateKey为null的情况
        const spy = jest.spyOn(bip32, 'fromSeed');

        // Mock返回没有privateKey的对象
        const mockDerivePath = jest.fn().mockReturnValue({ privateKey: null });
        spy.mockReturnValue({ derivePath: mockDerivePath } as any);

        try {
            const walletWithPrivate = wallet as any;
            if (walletWithPrivate.getDerivedPrivateKeyOld) {
                await expect(walletWithPrivate.getDerivedPrivateKeyOld({
                    mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
                    hdPath: "m/44'/9004'/0'/0/0"
                })).rejects.toMatch(/generate private key error/);

                // 验证spy被调用
                expect(spy).toHaveBeenCalledWith(expect.any(Buffer));
                expect(mockDerivePath).toHaveBeenCalledWith("m/44'/60'/0'/0/0");
            }
        } finally {
            // 恢复原始方法
            spy.mockRestore();
        }
    });

    test("getDerivedPrivateKeyOld branch coverage - childKey.privateKey null", async () => {
        // 使用jest.spyOn模拟旧方法中childKey.privateKey为null的情况
        const spy = jest.spyOn(bip32, 'fromSeed');

        // Mock第一次derivePath返回有效privateKey，第二次返回null
        const mockDerivePath1 = jest.fn().mockReturnValue({ privateKey: Buffer.from("test_private_key", "hex") });
        const mockDerivePath2 = jest.fn().mockReturnValue({ privateKey: null });
        
        spy.mockReturnValueOnce({ derivePath: mockDerivePath1 } as any)
           .mockReturnValueOnce({ derivePath: mockDerivePath2 } as any);

        try {
            const walletWithPrivate = wallet as any;
            if (walletWithPrivate.getDerivedPrivateKeyOld) {
                await expect(walletWithPrivate.getDerivedPrivateKeyOld({
                    mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
                    hdPath: "m/44'/9004'/0'/0/0"
                })).rejects.toMatch(/generate private key error/);

                // 验证spy被调用了两次
                expect(spy).toHaveBeenCalledTimes(2);
                expect(mockDerivePath1).toHaveBeenCalledWith("m/44'/60'/0'/0/0");
                expect(mockDerivePath2).toHaveBeenCalledWith("m/44'/9004'/0'/0/0");
            }
        } finally {
            // 恢复原始方法
            spy.mockRestore();
        }
    });

    const ps: any[] = [];
    ps.push("");
    ps.push("0x");
    ps.push("124699");
    ps.push("1dfi付");
    ps.push("9000 12");
    ps.push("548yT115QRHH7Mpchg9JJ8YPX9RTKuan=548yT115QRHH7Mpchg9JJ8YPX9RTKuan ");
    ps.push("L1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYAr");
    ps.push("L1v");
    ps.push("0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b428 97a");
    ps.push("0x31342f041c5b54358074b457。、。9231c8a300be65e687dff020bc7779598b428 97a");
    ps.push("0000000000000000000000000000000000000000000000000000000000000000");
    test("edge test", async () => {
        let j = 1;
        for (let i = 0; i < ps.length; i++) {
            try {
                await wallet.getNewAddress({privateKey: ps[i]});
            } catch (e) {
                j = j + 1
                expect((await wallet.validPrivateKey({privateKey:ps[i]})).isValid).toEqual(false);
            }
        }
        expect(j).toEqual(ps.length+1);
    });


    test('getNewAddress', async () => {
        const privateKey = "49c0722d56d6bac802bdf5c480a17c870d1d18bc4355d8344aa05390eb778280";
        const expectedAddress = "0x05b0563ae63a7ba9929129f5117bcbcbe552b7cc8cf81c806d343e2de7f3d555";
        expect((await wallet.getNewAddress({privateKey: privateKey})).address).toEqual(expectedAddress);
        expect((await wallet.getNewAddress({privateKey: '0x'+privateKey})).address).toEqual(expectedAddress);
        expect((await wallet.getNewAddress({privateKey: '0X'+privateKey})).address).toEqual(expectedAddress);
        expect((await wallet.getNewAddress({privateKey: '0X'+privateKey.toUpperCase()})).address).toEqual(expectedAddress);

        expect((await wallet.validPrivateKey({privateKey:privateKey})).isValid).toEqual(true);
        expect((await wallet.validPrivateKey({privateKey: '0x'+privateKey})).isValid).toEqual(true);
        expect((await wallet.validPrivateKey({privateKey: '0X'+privateKey})).isValid).toEqual(true);
        expect((await wallet.validPrivateKey({privateKey: '0X'+privateKey.toUpperCase()})).isValid).toEqual(true);
    });

    test("getNewAddress error handling", async () => {
        // 测试无效私钥导致的错误 - 应该抛出异常并被catch捕获，触发行210
        await expect(wallet.getNewAddress({
            privateKey: "invalid_key_format"
        })).rejects.toThrow(/invalid key/);

        // 测试空私钥
        await expect(wallet.getNewAddress({
            privateKey: ""
        })).rejects.toThrow(/invalid key/);
    });

    test("validAddress", async () => {
        // 测试有效地址
        const validAddress = "0x05b0563ae63a7ba9929129f5117bcbcbe552b7cc8cf81c806d343e2de7f3d555";
        const result1 = await wallet.validAddress({address: validAddress});
        expect(result1.isValid).toBe(true);
        expect(result1.address).toBe(validAddress);

        // 测试另一个有效地址
        const validAddress2 = "0x027854ed5aa9f534c7aa0165c89b3915bc461f70e64ce9d64f4e2549037ebcf2";
        const result2 = await wallet.validAddress({address: validAddress2});
        expect(result2.isValid).toBe(true);

        // 测试无效地址 - 太短
        const shortAddress = "0x123";
        const result3 = await wallet.validAddress({address: shortAddress});
        expect(result3.isValid).toBe(false);
        expect(result3.address).toBe(shortAddress);

        // 测试无效地址 - 没有0x前缀
        const noPrefix = "05b0563ae63a7ba9929129f5117bcbcbe552b7cc8cf81c806d343e2de7f3d555";
        const result4 = await wallet.validAddress({address: noPrefix});
        expect(result4.isValid).toBe(false);

        // 测试无效地址 - 包含非hex字符
        const invalidHex = "0x05b0563ae63a7ba9929129f5117bcbcbe552b7cc8cf81c806d343e2de7f3d55g";
        const result5 = await wallet.validAddress({address: invalidHex});
        expect(result5.isValid).toBe(false);

        // 测试空地址
        const emptyAddress = "";
        const result6 = await wallet.validAddress({address: emptyAddress});
        expect(result6.isValid).toBe(false);
    });
})

describe("message", () => {
    test("signCommonMsg", async () => {
        let sig = await wallet.signCommonMsg({privateKey:"0x0028e2e382f4e68b24154142dece87d03b6214a34834aede41e100848826c16b",message:{walletId:"12345678901234567890"}});
        let address = await wallet.getNewAddress({privateKey:"0x0028e2e382f4e68b24154142dece87d03b6214a34834aede41e100848826c16b"});
        let addr = address.address;
        let publicKey = address.publicKey;
        let chainIndex = 9004;
        let coinName = "starknet"
        let actual = `{"coin_name":"${coinName}","data":"{\\"pubKey\\":\\"${publicKey}\\",\\"name\\":\\"Account 01\\",\\"walletType\\":1,\\"accountId\\":\\"123456789\\",\\"addresses\\":[{\\"address\\":\\"${addr}\\",\\"chainPubKey\\":\\"${publicKey}\\",\\"chainSign\\":\\"${sig}\\"}\\",\\"chainIndexList\\":[${chainIndex}]}]}","func_name":"verify_web_data"}`;
        let expected = `{"coin_name":"starknet","data":"{\\"pubKey\\":\\"0x1a78bff4c0b69619fe061f540c6fd89f8c33a0364970c77334aa558ed7fce55\\",\\"name\\":\\"Account 01\\",\\"walletType\\":1,\\"accountId\\":\\"123456789\\",\\"addresses\\":[{\\"address\\":\\"0x027854ed5aa9f534c7aa0165c89b3915bc461f70e64ce9d64f4e2549037ebcf2\\",\\"chainPubKey\\":\\"0x1a78bff4c0b69619fe061f540c6fd89f8c33a0364970c77334aa558ed7fce55\\",\\"chainSign\\":\\"7b227075626c69634b6579223a22316137386266663463306236393631396665303631663534306336666438396638633333613033363439373063373733333461613535386564376663653535222c227075626c69634b657959223a22373063663835626131376161363562346665633664643439613631333337633362313864383937363664376366663736636365623732653839383838636564222c227369676e65644461746152223a22333930643230663831313237353965393265323636346463613762616632663964396233653034356535613837663934613231656134633734613830343132222c227369676e65644461746153223a22356132383265343163643936306361313533393337336366646130373262616661356232333861356433623738663237373631383765643565336530316564227d\\"}\\",\\"chainIndexList\\":[9004]}]}","func_name":"verify_web_data"}`
        expect(actual).toEqual(expected);

        sig = await wallet.signCommonMsg({privateKey:"0x0028e2e382f4e68b24154142dece87d03b6214a34834aede41e100848826c16b",message:{text:"12345678901234567890"}});
        expected="7b227075626c69634b6579223a22316137386266663463306236393631396665303631663534306336666438396638633333613033363439373063373733333461613535386564376663653535222c227075626c69634b657959223a22373063663835626131376161363562346665633664643439613631333337633362313864383937363664376366663736636365623732653839383838636564222c227369676e65644461746152223a22346232386562306535326661663063623734373736336362633765613533666166643863663035386366353834623462383239333335666666636362633366222c227369676e65644461746153223a22363763313665666439666564386630343337663035633033386262303833396136396333376630373834333938613233626466626266323337326637383237227d";
        expect(sig).toEqual(expected);

        sig = await wallet.signCommonMsg({privateKey:"4b43bf0e3864122edff9f143006f0a0d61b16df3f676c8070dac1d0f42d78353",message:{walletId:"AEEDD050-0DD9-43E6-9161-0B54E1D66E09"}});
        expected = "7b227075626c69634b6579223a22363764623830316266353131666333376536663534363139353032653338616335306538313732633063363937393566323861383233656239343566326335222c227075626c69634b657959223a22316632623266313366306437633138663234353664313430366139333538383732666437383635323237373033306264633062376666346464306431396436222c227369676e65644461746152223a22356435626433306231373133373463623432653363396338323134323964343232336133306236356233366363303237393061383063626637343734663235222c227369676e65644461746153223a22343134626565356539363865643063333061353532623163383663313433356636306335393939366131303566643635663339393863303733393436633633227d";
        expect(sig).toEqual(expected);
    })

    test("signMessage with TypedData", async () => {
        const typedDataValidate: TypedData = {
            types: {
                StarkNetDomain: [
                    {name: "name", type: "string"},
                    {name: "version", type: "felt"},
                    {name: "chainId", type: "felt"},
                ],
                Airdrop: [
                    {name: "address", type: "felt"},
                    {name: "amount", type: "felt"}
                ],
                Validate: [
                    {name: "id", type: "felt"},
                    {name: "from", type: "felt"},
                    {name: "amount", type: "felt"},
                    {name: "nameGamer", type: "string"},
                    {name: "endDate", type: "felt"},
                    {name: "itemsAuthorized", type: "felt*"}, // array of felt
                    {name: "chkFunction", type: "selector"}, // name of function
                    {name: "rootList", type: "merkletree", contains: "Airdrop"} // root of a merkle tree
                ]
            },
            primaryType: "Validate",
            domain: {
                name: "myDapp", // put the name of your dapp to ensure that the signatures will not be used by other DAPP
                version: "1",
                chainId: encodeShortString("SN_GOERLI"), // shortString of 'SN_GOERLI' (or 'SN_MAIN' or 'SN_GOERLI2'), to be sure that signature can't be used by other network.
            },
            message: {
                id: "0x0000004f000f",
                from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
                amount: "400",
                nameGamer: "Hector26",
                endDate: "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
                itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
                chkFunction: "check_authorization",
                rootList: [
                    {
                        address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                        amount: "1554785",
                    }, {
                        address: "0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b",
                        amount: "2578248",
                    }, {
                        address: "0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1",
                        amount: "4732581",
                    }, {
                        address: "0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a",
                        amount: "913548",
                    },
                ]
            },
        };

        let sig = await wallet.signMessage({privateKey, data: {message: typedDataValidate}})
        const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
        expect(verifyMessage(new Signature(sig.signature.r, sig.signature.s), sig.hash, publicKey)).toEqual(true)
        
        // 验证返回的签名格式
        expect(sig).toHaveProperty('signature');
        expect(sig.signature).toHaveProperty('r');
        expect(sig.signature).toHaveProperty('s');
        expect(sig.signature).toHaveProperty('recovery');
        expect(sig).toHaveProperty('hash');
        expect(sig).toHaveProperty('publicKey');
    });

    test("signMessage with hex string message", async () => {
        const hexMessage = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        const sig = await wallet.signMessage({
            privateKey,
            data: { message: hexMessage }
        });

        // 验证返回的签名格式
        expect(sig).toHaveProperty('signature');
        expect(sig.signature).toHaveProperty('r');
        expect(sig.signature).toHaveProperty('s');
        expect(sig.signature).toHaveProperty('recovery');
        expect(sig).toHaveProperty('hash');
        expect(sig).toHaveProperty('publicKey');

        // 验证签名可以验证
        const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
        expect(verifyMessage(new Signature(sig.signature.r, sig.signature.s), sig.hash, publicKey)).toEqual(true);
    });

    test("signMessage with different hex message formats", async () => {
        const messages = [
            "0x123abc",
            "0xabcdef1234567890",
            "0x0000000000000001",
            "0xffffffffffffffff"
        ];

        for (const message of messages) {
            const sig = await wallet.signMessage({
                privateKey,
                data: { message }
            });

            expect(sig).toHaveProperty('signature');
            expect(sig.signature).toHaveProperty('r');
            expect(sig.signature).toHaveProperty('s');
            expect(sig.signature).toHaveProperty('recovery');
            expect(sig).toHaveProperty('hash');
            expect(sig).toHaveProperty('publicKey');

            // 验证签名
            const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
            expect(verifyMessage(new Signature(sig.signature.r, sig.signature.s), sig.hash, publicKey)).toEqual(true);
        }
    });

    test("signMessage with simple TypedData", async () => {
        const simpleTypedData: TypedData = {
            types: {
                StarkNetDomain: [
                    {name: "name", type: "felt"},
                    {name: "version", type: "felt"},
                    {name: "chainId", type: "felt"}
                ],
                Person: [
                    {name: "name", type: "felt"},
                    {name: "wallet", type: "felt"}
                ]
            },
            primaryType: "Person",
            domain: {
                name: "TestApp",
                version: "1",
                chainId: "1"
            },
            message: {
                name: "Alice",
                wallet: "0x1234567890abcdef1234567890abcdef12345678"
            }
        };

        const sig = await wallet.signMessage({
            privateKey,
            data: { message: simpleTypedData }
        });

        // 验证返回的签名格式
        expect(sig).toHaveProperty('signature');
        expect(sig.signature).toHaveProperty('r');
        expect(sig.signature).toHaveProperty('s');
        expect(sig.signature).toHaveProperty('recovery');
        expect(sig).toHaveProperty('hash');
        expect(sig).toHaveProperty('publicKey');

        // 验证签名
        const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
        expect(verifyMessage(new Signature(sig.signature.r, sig.signature.s), sig.hash, publicKey)).toEqual(true);
    });

    test("signMessage error handling - invalid message format", async () => {
        // 测试非hex字符串且非TypedData的情况 - 应该返回undefined
        const result1 = await wallet.signMessage({
            privateKey,
            data: { message: "not a hex string" }
        });
        expect(result1).toBeUndefined();

        // 测试空字符串 - 应该返回undefined
        const result2 = await wallet.signMessage({
            privateKey,
            data: { message: "" }
        });
        expect(result2).toBeUndefined();

        // 测试只有0x前缀的情况 - 这实际上会被正常处理
        const result3 = await wallet.signMessage({
            privateKey,
            data: { message: "0x" }
        });
        expect(result3).toBeDefined();
        expect(result3.hash).toBe("0x");
    });

    test("signMessage error handling - invalid private key", async () => {
        const validMessage = "0x1234567890abcdef";
        
        // 测试无效的私钥
        await expect(wallet.signMessage({
            privateKey: "invalid_private_key",
            data: { message: validMessage }
        })).rejects.toMatch(/sign tx error.*Cannot convert.*to a BigInt/);

        await expect(wallet.signMessage({
            privateKey: "",
            data: { message: validMessage }
        })).rejects.toMatch(/sign tx error/);
    });

    test("signMessage error handling - invalid TypedData", async () => {
        // 测试不完整的TypedData
        const invalidTypedData = {
            types: {},
            primaryType: "NonExistentType",
            domain: {},
            message: {}
        };

        await expect(wallet.signMessage({
            privateKey,
            data: { message: invalidTypedData }
        })).rejects.toMatch(/sign tx error.*does not match JSON schema/);
    });

    test("signMessage with different private key formats", async () => {
        const hexMessage = "0x1234567890abcdef";
        const privateKeyFormats = [
            privateKey,  // 已经有0x前缀
            privateKey.substring(2),  // 去掉0x前缀
            privateKey.toUpperCase(),  // 大写
            privateKey.substring(2).toUpperCase()  // 去掉0x前缀的大写
        ];

        for (const pk of privateKeyFormats) {
            const sig = await wallet.signMessage({
                privateKey: pk,
                data: { message: hexMessage }
            });

            expect(sig).toHaveProperty('signature');
            expect(sig).toHaveProperty('hash');
            expect(sig).toHaveProperty('publicKey');

            // 验证所有格式的私钥产生相同的签名结果（因为modPrivateKey会标准化它们）
            const publicKey = signUtil.schnorr.stark.getPublicKey(privateKey);
            expect(verifyMessage(new Signature(sig.signature.r, sig.signature.s), sig.hash, publicKey)).toEqual(true);
        }
    });

    test("signMessage signature properties validation", async () => {
        const hexMessage = "0xabcdef1234567890";
        
        const sig = await wallet.signMessage({
            privateKey,
            data: { message: hexMessage }
        });

        // 验证signature.r是bigint类型（在新的实现中）
        expect(typeof sig.signature.r).toBe('bigint');

        // 验证signature.s是bigint类型（在新的实现中）
        expect(typeof sig.signature.s).toBe('bigint');

        // 验证recovery是数字
        expect(typeof sig.signature.recovery).toBe('number');

        // 验证hash是有效的hex字符串
        expect(typeof sig.hash).toBe('string');
        expect(sig.hash).toMatch(/^0x[0-9a-fA-F]+$/);

        // 验证publicKey是对象格式（在新的实现中）
        expect(typeof sig.publicKey).toBe('object');
        expect(sig.publicKey).toBeDefined();
    });

    test("verifyMessage", async () => {
        // 首先签名一个消息
        const hexMessage = "0x1234567890abcdef";
        const sig = await wallet.signMessage({
            privateKey,
            data: { message: hexMessage }
        });

        // 验证签名
        const verifyResult = await wallet.verifyMessage({
            signature: "dummy", // VerifyMessageParams需要signature字段
            data: {
                signature: new Signature(sig.signature.r, sig.signature.s),
                hash: sig.hash,
                publicKey: sig.publicKey
            }
        });
        expect(verifyResult).toBe(true);

        // 测试错误的签名
        const wrongSig = new Signature(BigInt("0x123"), BigInt("0x456"));
        const verifyResult2 = await wallet.verifyMessage({
            signature: "dummy", // VerifyMessageParams需要signature字段
            data: {
                signature: wrongSig,
                hash: sig.hash,
                publicKey: sig.publicKey
            }
        });
        expect(verifyResult2).toBe(false);
    });

    test("verifyMessage error handling", async () => {
        // 测试无效参数导致的错误
        await expect(wallet.verifyMessage({
            signature: "dummy",
            data: {
                signature: null,
                hash: "0x123",
                publicKey: []
            }
        })).rejects.toBeDefined();
    });
})

describe("tx", () => {
    const multiplyResourceBounds = (rb: any, percent: number = 120) => {
        const multiply = (val: BigNumberish) => {
            const resultBigInt = BigInt(val) * BigInt(percent) / BigInt(100);

            if (typeof val === 'string' && val.startsWith('0x')) {
                return '0x' + resultBigInt.toString(16);
            } else {
                return resultBigInt.toString(10);
            }
        }
        const result: any = {};
        for (const key in rb) {
            if (Object.prototype.hasOwnProperty.call(rb, key)) {
                result[key] = multiply(rb[key]);
            }
        }
        return result;
    }

    const privateKey = '0x0248555dbad1b89eb17dca845a0fedc2ac02d2102737e3724241349fc6e4d3a1'

    test("transfer ETH", async () => {
        const address = await wallet.getNewAddress({privateKey})
        let data: StarknetSignData = {
            type: "transfer",
            transferData:{
                contractAddress: ETH,
                from: address.address,
                to: "0x0783cfec76289cb25e5735086c0447421c0dd47e2f8e68941851bc254256354b",
                amount: "10000000000000",
            },
            nonce: "0xaa",
            chainId: StarknetChainId.SN_MAIN,
        }

        let resourceBounds = {
            l1_data_gas_consumed: '0x140',
            l1_data_gas_price: '0x7ca',
            l1_gas_consumed: '0x0',
            l1_gas_price: '0x165c16445de6',
            l2_gas_consumed: '0xf2580',
            l2_gas_price: '0x24a25818',
        }

        data.resourceBounds = multiplyResourceBounds(resourceBounds)
        const tx = await wallet.signTransaction({privateKey, data});

        expect(tx.txId).toEqual('0x613586e3b3221fe735c26750b21a0641cc1bf40094f2635a566fd0b7ec812e0')
        expect(tx.signature).toEqual('{"type":"INVOKE_FUNCTION","sender_address":"0x053002233beeab93e45fa620ab40e82b26a0700f514915b3a15e091a4004c392","calldata":["0x1","0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7","0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e","0x0","0x3","0x3","0x783cfec76289cb25e5735086c0447421c0dd47e2f8e68941851bc254256354b","0x9184e72a000","0x0"],"signature":["0xcad585c7b23c5a3c7f169e2027b1a2acf43146c677161ef7573aff50a26081","0x492a61252a447bde7ae5c2eb2f93ec3df58f17c2d3681226e1459e3ca2288f9"],"nonce":"0xaa","resource_bounds":{"L1_GAS":{"max_amount":"0x0","max_price_per_unit":"0x1ad4e7853d7a"},"L1_DATA_GAS":{"max_amount":"0x180","max_price_per_unit":"0x958"},"L2_GAS":{"max_amount":"0x122d00","max_price_per_unit":"0x2bf60350"}},"tip":"0x0","paymaster_data":[],"nonce_data_availability_mode":0,"fee_data_availability_mode":0,"account_deployment_data":[],"version":"0x3"}')
    })

    test("transfer STRK", async () => {
        const address = await wallet.getNewAddress({privateKey})
        let data: StarknetSignData = {
            type: "transfer",
            transferData:{
                contractAddress: STRK,
                from: address.address,
                to: "0x02dc53467fca68213dfef46091fd2985a40564e8841cb9795e48ca61e66d17cd",
                amount: "10000000000000000",
            },
            nonce: "0xb0",
            chainId: StarknetChainId.SN_MAIN,
        }

        let resourceBounds = {
            l1_data_gas_consumed: '0xe0',
            l1_data_gas_price: '0x858',
            l1_gas_consumed: '0x0',
            l1_gas_price: '0x13c60f87b09e',
            l2_gas_consumed: '0xe8940',
            l2_gas_price: '0x2065ae22',
        };

        data.resourceBounds = multiplyResourceBounds(resourceBounds, 200)

        const tx = await wallet.signTransaction({privateKey, data});
        expect(tx.txId).toEqual('0x7d05b8a2b60a2daef421535befc3bbd6d7d511fc7f7f80582d9b61ca6715274')
        expect(tx.signature).toEqual('{"type":"INVOKE_FUNCTION","sender_address":"0x053002233beeab93e45fa620ab40e82b26a0700f514915b3a15e091a4004c392","calldata":["0x1","0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d","0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e","0x0","0x3","0x3","0x2dc53467fca68213dfef46091fd2985a40564e8841cb9795e48ca61e66d17cd","0x2386f26fc10000","0x0"],"signature":["0x236c1d5230d815e0c9dc40a58373f6ffb46443aef526555ff2ec40bc737b35b","0x195625fdcdb349d3f33c4cce7eb7d52c99b58cc98667f04be8c43b8eb5cc10c"],"nonce":"0xb0","resource_bounds":{"L1_GAS":{"max_amount":"0x0","max_price_per_unit":"0x278c1f0f613c"},"L1_DATA_GAS":{"max_amount":"0x1c0","max_price_per_unit":"0x10b0"},"L2_GAS":{"max_amount":"0x1d1280","max_price_per_unit":"0x40cb5c44"}},"tip":"0x0","paymaster_data":[],"nonce_data_availability_mode":0,"fee_data_availability_mode":0,"account_deployment_data":[],"version":"0x3"}')
    })

    test("deploy account", async () => {
        let data: StarknetSignData = {
            type: "deploy_account",
            nonce: "0x0",
            chainId: StarknetChainId.SN_MAIN,
        }
        let resourceBounds = {
            l1_data_gas_consumed: '0x160',
            l1_data_gas_price: '0x858',
            l1_gas_consumed: '0x0',
            l1_gas_price: '0x13dec4316874',
            l2_gas_consumed: '0xd1dc0',
            l2_gas_price: '0x208e2875',
        }

        data.resourceBounds = multiplyResourceBounds(resourceBounds, 200)

        const tx = await wallet.signTransaction({privateKey, data})
        expect(tx.txId).toEqual('0x130dde73d90dfc61a2cae1279d9be70390d1c234ba33f6e549b6ea47911829a')
        expect(tx.signature).toEqual('{"type":"DEPLOY_ACCOUNT","version":"0x3","signature":["0x674d3b0d82f3c44fcd5b7ff83fd67c119cd429a3ebfc2b3452f5b0ab5a9f617","0x2c5ae8099999827b0871ed6a6bbf33fe48282d8f6a10a9ff27d1c24ca9d19a1"],"nonce":"0x0","contract_address_salt":"0x61170196b8140212c1166f2c574ae678c634d566415410c3aee6e91ea998f71","constructor_calldata":["0x309c042d3729173c7f2f91a34f04d8c509c1b292d334679ef1aabf8da0899cc","0x79dc0da7c54b95f10aa182ad0a46400db63156920adb65eca2654c0945a463","0x2","0x61170196b8140212c1166f2c574ae678c634d566415410c3aee6e91ea998f71","0x0"],"class_hash":"0x3530cc4759d78042f1b543bf797f5f3d647cde0388c33734cf91b7f7b9314a9","resource_bounds":{"L1_GAS":{"max_amount":"0x0","max_price_per_unit":"0x27bd8862d0e8"},"L1_DATA_GAS":{"max_amount":"0x2c0","max_price_per_unit":"0x10b0"},"L2_GAS":{"max_amount":"0x1a3b80","max_price_per_unit":"0x411c50ea"}},"tip":"0x0","paymaster_data":[],"nonce_data_availability_mode":0,"fee_data_availability_mode":0}')
    })

    test("contractCall", async () => {
        let call = {
            "contract_address": "0x067e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958",
            "entry_point": "claim",
            "calldata": [
                "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                "165800",
                0
            ]
        }

        const data: StarknetSignData = {
            type: "contract_call",
            contractCallData: {
                from: "0x00b909cefa36ab6bc26f5887a867e46ef162238f0a171b1c2974b665afd4237f",
                callData: call.calldata.map(val => toHex(val)),
                contractAddress: call.contract_address,
                functionName: call.entry_point
            },

            nonce: "0xaf",
            chainId: StarknetChainId.SN_MAIN,
        }
        let resourceBounds = {
            l1_data_gas_consumed: '0x220',
            l1_data_gas_price: '0x824',
            l1_gas_consumed: '0x0',
            l1_gas_price: '0x2b039649531a',
            l2_gas_consumed: '0x15b800',
            l2_gas_price: '0x4679625e',
        }

        data.resourceBounds = multiplyResourceBounds(resourceBounds)

        const tx = await wallet.signTransaction({privateKey, data})
        expect(tx.txId).toEqual('0x48728b2c0a387181e9d2af4b830e37fb2f7730636e000ffa349a5f1b3d1191d')
        expect(tx.signature).toEqual('{"type":"INVOKE_FUNCTION","sender_address":"0x00b909cefa36ab6bc26f5887a867e46ef162238f0a171b1c2974b665afd4237f","calldata":["0x1","0x67e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958","0xb758361d5e84380ef1e632f89d8e76a8677dbc3f4b93a4f9d75d2a6048f312","0x0","0x3","0x3","0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8","0x287a8","0x0"],"signature":["0x59563db6aa7041e29028582afef85cd8a975121f94870335a7c3ed5425aa5e7","0x68260029c1e6afafd907bb7f79f9ec19503055308f7cb1048e34805bd105a4d"],"nonce":"0xaf","resource_bounds":{"L1_GAS":{"max_amount":"0x0","max_price_per_unit":"0x339de78b3085"},"L1_DATA_GAS":{"max_amount":"0x28c","max_price_per_unit":"0x9c4"},"L2_GAS":{"max_amount":"0x1a1000","max_price_per_unit":"0x5491a93d"}},"tip":"0x0","paymaster_data":[],"nonce_data_availability_mode":0,"fee_data_availability_mode":0,"account_deployment_data":[],"version":"0x3"}')
    })

    test("multiContractCall", async () => {
        const calls  = [
            {
                "contractAddress": "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                "calldata": [
                    "0x067e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958",
                    "1000000000000000000",
                    "0"
                ],
                "entrypoint": "approve"
            },
            {
                "contractAddress": "0x067e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958",
                "calldata": [
                    2,
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                    "165800000000000000",
                    "1000000000000000000",
                    0,
                    1,
                    2,
                    0
                ],
                "entrypoint": "submit_maker_order"
            }
        ]
        const callsV2: ContractCall[] = calls.map(call => {
            return {
                ...call,
                calldata: call.calldata.map(val => toHex(val)),
            }
        })

        const data: StarknetSignData = {
            type: "multi_contract_call",
            multiContractCallData: {
                from: "0x00b909cefa36ab6bc26f5887a867e46ef162238f0a171b1c2974b665afd4237f",
                calls: callsV2,
            },

            nonce: "0xae",
            chainId: StarknetChainId.SN_MAIN,
        }
        let resourceBounds = {
                l1_data_gas_consumed: '0x8e0',
                l1_data_gas_price: '0x808',
                l1_gas_consumed: '0x0',
                l1_gas_price: '0x275292af3b26',
                l2_gas_consumed: '0x4df940',
                l2_gas_price: '0x406d12bc',
        }

        data.resourceBounds = multiplyResourceBounds(resourceBounds)

        const tx = await wallet.signTransaction({privateKey, data})
        expect(tx.txId).toEqual('0x7ad46158ba902fb24061d84bbf25eb5adee505f96a8a95e0b577ae912e5d9df')
        expect(tx.signature).toEqual('{"type":"INVOKE_FUNCTION","sender_address":"0x00b909cefa36ab6bc26f5887a867e46ef162238f0a171b1c2974b665afd4237f","calldata":["0x2","0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d","0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c","0x0","0x3","0x67e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958","0x15d8c7e20459a3fe496afb46165f48dd1a7b11ab1f7d0c320d54994417875fb","0x3","0x8","0xb","0x67e7555f9ff00f5c4e9b353ad1f400e2274964ea0942483fae97363fd5d7958","0xde0b6b3a7640000","0x0","0x2","0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d","0x24d0a38b7c28000","0xde0b6b3a7640000","0x0","0x1","0x2","0x0"],"signature":["0x4b720b6de7cb9c493fef6f88bded1d3ca7c7ad16b32402a3aa22da66b343a5a","0x7d283155342721a1d88aeb4ecfaefde52ec00b9322c7158621aa915b19923eb"],"nonce":"0xae","resource_bounds":{"L1_GAS":{"max_amount":"0x0","max_price_per_unit":"0x2f2fe338ad60"},"L1_DATA_GAS":{"max_amount":"0xaa6","max_price_per_unit":"0x9a3"},"L2_GAS":{"max_amount":"0x5d9180","max_price_per_unit":"0x4d4fb014"}},"tip":"0x0","paymaster_data":[],"nonce_data_availability_mode":0,"fee_data_availability_mode":0,"account_deployment_data":[],"version":"0x3"}')
    });

    test("signTransaction error handling", async () => {
        const privateKey = '0x0248555dbad1b89eb17dca845a0fedc2ac02d2102737e3724241349fc6e4d3a1';

        // 测试缺少nonce的情况
        await expect(wallet.signTransaction({
            privateKey,
            data: {
                type: "transfer",
                transferData: {
                    contractAddress: "0x123",
                    from: "0x456",
                    to: "0x789",
                    amount: "1000"
                }
                // 缺少nonce
            }
        })).rejects.toMatch(/sign tx error/);

        // 测试无效的交易类型 - 触发行260的错误
        await expect(wallet.signTransaction({
            privateKey,
            data: {
                type: "invalid_type" as any,
                nonce: "0x1",
                chainId: StarknetChainId.SN_MAIN
            }
        })).rejects.toMatch(/sign tx error/);

        // 测试transfer缺少transferData的情况
        await expect(wallet.signTransaction({
            privateKey,
            data: {
                type: "transfer",
                nonce: "0x1",
                chainId: StarknetChainId.SN_MAIN
                // 缺少transferData
            }
        })).rejects.toMatch(/sign tx error/);

        // 测试contract_call缺少contractCallData的情况
        await expect(wallet.signTransaction({
            privateKey,
            data: {
                type: "contract_call",
                nonce: "0x1",
                chainId: StarknetChainId.SN_MAIN
                // 缺少contractCallData
            }
        })).rejects.toMatch(/sign tx error/);

        // 测试multi_contract_call缺少multiContractCallData的情况
        await expect(wallet.signTransaction({
            privateKey,
            data: {
                type: "multi_contract_call",
                nonce: "0x1",
                chainId: StarknetChainId.SN_MAIN
                // 缺少multiContractCallData
            }
        })).rejects.toMatch(/sign tx error/);

        // 测试catch分支 - 使用无效私钥触发内部异常
        await expect(wallet.signTransaction({
            privateKey: "invalid_hex_format_key",
            data: {
                type: "transfer",
                nonce: "0x1",
                chainId: StarknetChainId.SN_MAIN,
                transferData: {
                    contractAddress: "0x123",
                    from: "0x456", 
                    to: "0x789",
                    amount: "1000"
                }
            }
        })).rejects.toMatch(/sign tx error/);
    });
})

describe('utils', () => {

    // This test just show how to use calculateContractAddressFromHash for new devs
    test('calculated contract address should match the snapshot', () => {
        const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

        const daiAddress = '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9';
        const factoryAddress = '0x249827618A01858A72B7D04339C47195A324D20D6037033DFE2829F98AFF4FC';
        const classHash = '0x55187E68C60664A947048E0C9E5322F9BF55F7D435ECDCF17ED75724E77368F';

        // Any type of salt can be used. It depends on the dApp what kind of salt it wants to use.
        const salt = ec.starkCurve.pedersen(ethAddress, daiAddress);

        const res = hash.calculateContractAddressFromHash(
            salt,
            classHash,
            [ethAddress, daiAddress, factoryAddress],
            factoryAddress
        );

        expect(res).toMatchInlineSnapshot(
            `"0x36dc8dcb3440596472ddde11facacc45d0cd250df764ae7c3d1a360c853c324"`
        );
    });

    test("calculateContractAddressFromHash", async () => {
        const privateKey = "0x0603c85d20500520d4c653352ff6c524f358afeab7e41a511c73733e49c3075e";
        const starkPub = ec.starkCurve.getStarkKey(privateKey);

        const contractAddress = CalculateContractAddressFromHash(starkPub)
        expect(contractAddress).toEqual("0x06c3c93eeb1643740a80a338b9346c0c9a06177bfcc098a6d86e353532090ae4")
    })

    test("hashMessage", async () => {
        const data = {
            "types": {
                "StarkNetDomain": [
                    {"name": "name", "type": "felt"},
                    {"name": "version", "type": "felt"},
                    {"name": "chainId", "type": "felt"}
                ],
                "Person": [
                    {"name": "name", "type": "felt"},
                    {"name": "wallet", "type": "felt"}
                ],
                "Mail": [
                    {"name": "from", "type": "Person"},
                    {"name": "to", "type": "Person"},
                    {"name": "contents", "type": "felt"}
                ]
            },
            "primaryType": "Mail",
            "domain": {
                "name": "StarkNet Mail",
                "version": "1",
                "chainId": "1"
            },
            "message": {
                "contents": "Hello, Bob!",
                "from": {
                    "name": "Cow",
                    "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
                },
                "to": {
                    "name": "Bob",
                    "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
                }

            }
        };
        const hash = typedData.getMessageHash(data, "0x0603c85d20500520d4c653352ff6c524f358afeab7e41a511c73733e49c3075e");
        expect(hash).toEqual("0x113fceee9332ec6033c52ec5203629edd345120fd5f8bcacb68df848fe8f51e")
    })

    test('modPrivateKey', () => {
        const pri = "0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f";
        const res1 = modPrivateKey(pri);
        expect(res1).toEqual("0x0");

        const pri2 = "0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d3f";
        const res2 = modPrivateKey(pri2);
        expect(res2).toEqual("0x10")

        const pri3 = "0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2e";
        const res3 = modPrivateKey(pri3);
        expect(res3).toEqual("0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2e")

        const pri4 = "800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2e";
        const res4 = modPrivateKey(pri4);
        expect(res4).toEqual("0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2e")
    })
});