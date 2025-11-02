import { base, SignTxError } from '@okxweb3/coin-base';
import {
	generateMnemonic,
	isPasswordNeeded,
	mnemonicToKeyPair,
	mnemonicToSeed,
	validateMnemonic,
} from 'tonweb-mnemonic';
import { Builder, Cell, TonWallet, VenomWallet } from '../src';
import {
	buildNftTransferPayload,
	buildNotcoinVoucherExchange,
} from '../src/api';
import {
	commentToBytes,
	NftOpCode,
	OpCode,
	packBytesAsSnake,
} from '../src/api/nfts';

const tonWallet = new TonWallet();
const venomWallet = new VenomWallet();

describe('ton', () => {
	const timeoutAtSeconds = Math.floor(Date.now() / 1e3) + 600;
	// const timeoutAtSeconds = 1718863283n;

	test('signCommonMsg', async () => {
		let wallet = new TonWallet();
		let sig = await wallet.signCommonMsg({
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			message: { walletId: '123456789' },
		});
		expect(sig).toEqual(
			'cc40d1fe95d67c7cd7e994a49fe8576f6958767084247cdc0b47fb8d62feef3578de28ce230f55eaec6396dc5d3b6720c0bbd53579f532b645eeb15055e30801'
		);

		sig = await wallet.signCommonMsg({
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			message: { text: '123456789' },
		});
		expect(sig).toEqual(
			'7996f58cca2f3d823096aeebfe9ad7cadd1800182507daa4b942b6085536d181f9036b8e3dde2d3a6615898f60deb4beb02b7911c4824e774a116da297f82307'
		);
	});

	test('derive seed', async () => {
		const seed = await tonWallet.getDerivedPrivateKey({
			// bip39 mnemoric
			// mnemonic: "ensure net noodle crystal estate arrange then actor symbol menu term eyebrow",
			// ton official mnemoric
			mnemonic:
				'dutch capable garlic drink camera foot wrestle quiz hidden bench deny world aware morning confirm pottery rail prize sorry mom dance parrot flavor deputy',
			// mnemonic: "margin twelve physical buffalo tone cancel winner globe nature embody twelve ahead",
			// hdPath: "m/44'/607'/0'/0'/1'", // for bip39 mnemoric
			hdPath: '', // for ton official mnemoric
		});
		expect(seed).toBe(
			'85d3685f33418ef815d7476755cdde923d77a7a8cf3e66adadf40c761c2836de'
		);
	});

	const invalidPrivateKeys = [
		{ key: '', description: 'empty string' },
		{ key: '0x', description: 'incomplete hex prefix' },
		{ key: '0X', description: 'incomplete hex prefix uppercase' },
		{ key: '124699', description: 'too short number' },
		{ key: '1dfi付', description: 'invalid characters with unicode' },
		{ key: '9000 12', description: 'contains spaces' },
		{
			key: '548yT115QRHH7Mpchg9JJ8YPX9RTKuan=548yT115QRHH7Mpchg9JJ8YPX9RTKuan ',
			description: 'invalid base64-like string with spaces',
		},
		{
			key: 'L1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYArL1vSc9DuBDeVkbiS79mJ441FNAYAr',
			description: 'too long string',
		},
		{ key: 'L1v', description: 'too short string' },
		{
			key: '0x31342f041c5b54358074b4579231c8a300be65e687dff020bc7779598b428 97a',
			description: 'hex with space',
		},
		{
			key: '0x31342f041c5b54358074b457。、。9231c8a300be65e687dff020bc7779598b428 97a',
			description: 'hex with unicode punctuation',
		},
		{
			key: '0000000000000000000000000000000000000000000000000000000000000000',
			description: 'all zeros',
		},
	];

	describe('invalid private key validation', () => {
		const wallet = new TonWallet();

		invalidPrivateKeys.forEach(({ key, description }) => {
			test(`should reject ${description}: "${key}"`, async () => {
				// Test that getNewAddress handles invalid private key gracefully
				try {
					const result = await wallet.getNewAddress({
						privateKey: key,
					});
					// If no exception, the result should indicate failure
					expect(result).toBeUndefined();
				} catch (error) {
					// Throwing is also acceptable behavior
					expect(error).toBeDefined();
				}

				// Test that validPrivateKey returns false
				const { isValid } = await wallet.validPrivateKey({
					privateKey: key,
				});
				expect(isValid).toBe(false);
			});
		});
	});

	test('validPrivateKey', async () => {
		const wallet = new TonWallet();
		const privateKey = await wallet.getRandomPrivateKey();
		const res = await wallet.validPrivateKey({ privateKey: privateKey });
		expect(res.isValid).toEqual(true);
	});

	test('validateMnemonicOfTon', async () => {
		const validateMnemonicOfTon = await tonWallet.validateMnemonicOfTon({
			mnemonicArray:
				'ensure net noodle crystal estate arrange then actor symbol menu term eyebrow'.split(
					' '
				),
			password: '',
		});
		expect(validateMnemonicOfTon).toBe(false);
	});

	test('ton getNewAddress', async () => {
		const seed =
			'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8';
		let result = await tonWallet.getNewAddress({ privateKey: seed });
		expect(result.address).toBe(
			'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR'
		);
		result = await tonWallet.getNewAddress({
			privateKey:
				'0xfc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
		});
		expect(result.address).toBe(
			'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR'
		);
		result = await tonWallet.getNewAddress({
			privateKey:
				'FC81E6F42150458F53D8C42551A8AB91978A55D0E22B1FD890B85139086B93F8',
		});
		expect(result.address).toBe(
			'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR'
		);
		result = await tonWallet.getNewAddress({
			privateKey:
				'0XFC81E6F42150458F53D8C42551A8AB91978A55D0E22B1FD890B85139086B93F8',
		});
		expect(result.address).toBe(
			'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR'
		);
	});

	test('ton validateAddress', async () => {
		let result = await tonWallet.validAddress({
			address:
				'0:a341adb1b38974d70bd09eb5a5e3a072f6f32ecbd706c9c2e873ba60b7cb32fb',
		});
		/*const expectedRaw = {
            address: "EQCjQa2xs4l01wvQnrWl46By9Muy9cGycLoc7pgt8sy-wUL",
            isRaw: true,
            isValid: true
        }*/
		expect(result.isValid).toEqual(true);
		result = await tonWallet.validAddress({
			address: 'EQCjQa2xs4l01wvQnrWl46By9vMuy9cGycLoc7pgt8sy-wUL',
		});
		/*const expectedRaw = {
            isBounceable: true,
            isTestOnly: false,
            isUrlSafe: true,
            address: EQCjQa2xs4l01wvQnrWl46By9vMuy9cGycLoc7pgt8sy-wUL,
            isUserFriendly: true,
            isValid: true
        }*/
		expect(result.isValid).toEqual(true);
		expect(result.isUrlSafe).toEqual(true);
		result = await tonWallet.validAddress({
			address: 'UQC6QJ31Bv/hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR',
		});
		/*const expectedRaw = {
            isBounceable: true,
            isTestOnly: false,
            isUrlSafe: false,
            address: EQCjQa2xs4l01wvQnrWl46By9vMuy9cGycLoc7pgt8sy-wUL,
            isUserFriendly: true,
            isValid: true
        }*/
		expect(result.isValid).toEqual(true);
		expect(result.isUrlSafe).toEqual(false);
	});

	test('ton parseAddress', async () => {
		let result = await tonWallet.parseAddress({
			address: 'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR',
		});
		expect(result.isValid).toBe(true);
		result = await tonWallet.parseAddress({
			address:
				'0:6bef7d76e46fd1f308f0bf0b59f1ca6318aa6d950ea00aecc7d162218acaaa36',
		});
		expect(result.isValid).toBe(true);
	});

	test('ton convertAddress', async () => {
		const expected = {
			raw: '0:ba409df506ffe18e6b286948d19a9658aa3f4d5db05bbee7c237272773482345',
			addrBounceable: {
				bounceable: true,
				urlSafe: true,
				userFriendlyBounceable:
					'EQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjRbdU',
			},
			addrUnounceable: {
				bounceable: false,
				urlSafe: true,
				userFriendlyUnbounceable:
					'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR',
			},
		};
		let result = await tonWallet.convertAddress({
			address: 'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR',
		});
		expect(result).toEqual(expected);
		result = await tonWallet.convertAddress({
			address: 'EQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjRbdU',
		});
		expect(result).toEqual(expected);
		result = await tonWallet.convertAddress({
			address:
				'0:ba409df506ffe18e6b286948d19a9658aa3f4d5db05bbee7c237272773482345',
		});
		expect(result).toEqual(expected);
	});

	test('ton signTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				type: 'transfer', // type of TON transfer
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr', // destination address
				decimal: 9, // decimal on ton blockchain
				amount: '10000000', // decimal of TON is 9 on ton blockchain, so that here real value is 0.01
				seqno: 14, // nonce or sequence of from address
				toIsInit: true, // destination address init or not
				memo: 'ton test', // comment for this tx
				expireAt: timeoutAtSeconds, // timeout at seconds eg, 1718863283n, default now + 60s
				/**
				 * export enum SendMode {
				 *     CARRY_ALL_REMAINING_BALANCE = 128,
				 *     CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
				 *     DESTROY_ACCOUNT_IF_ZERO = 32,
				 *     PAY_GAS_SEPARATELY = 1,
				 *     IGNORE_ERRORS = 2,
				 *     NONE = 0
				 * }
				 */
				sendMode: 1,
			},
		};
		const tx = await tonWallet.signTransaction(param);

		// Verify transaction structure
		expect(tx).toBeDefined();
		expect(tx.boc).toBeDefined();
		expect(typeof tx.boc).toBe('string');
		expect(tx.boc.length).toBeGreaterThan(0);
		expect(tx.address).toBe(
			'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR'
		);
		expect(tx.stateInit).toBeUndefined(); // No stateInit for regular transfer

		// Verify BOC format (should be base64 encoded)
		expect(tx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	test('ton jetton signTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				type: 'jettonTransfer', // type of jetton TOKEN transfer
				// jetton wallet address of from address
				fromJettonAccount:
					'kQDL9sseMzrh4vewfQgZKJzVwDFbDTpbs2f8BY6iCMgRTyOG',
				to: 'UQDXgyxgYKNSdTiJBqmNNfbD7xuRMl6skrBmsEtyXslFm5an',
				seqno: 15, // nonce or sequence of from address
				toIsInit: false, // destination address init or not
				memo: 'jetton test', // comment for this tx
				decimal: 2, // decimal of jetton TOKEN on ton blockchain
				amount: '100', // decimal of TOKEN is 2 on ton blockchain, so that here real value is 1
				messageAttachedTons: '50000000', // message fee, default 0.05, here is 0.05 * 10^9
				invokeNotificationFee: '1', // notify fee, official recommend 0.000000001, here is 0.000000001 * 10^9
				expireAt: timeoutAtSeconds, // timeout at seconds eg, 1718863283n, default now + 60s
				/**
				 * export enum SendMode {
				 *     CARRY_ALL_REMAINING_BALANCE = 128,
				 *     CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
				 *     DESTROY_ACCOUNT_IF_ZERO = 32,
				 *     PAY_GAS_SEPARATELY = 1,
				 *     IGNORE_ERRORS = 2,
				 *     NONE = 0
				 * }
				 */
				sendMode: 1,
				queryId: '18446744073709551615', // string of uint64 number, eg 18446744073709551615 = 2^64 - 1
			},
		};
		const tx = await tonWallet.signTransaction(param);

		// Verify jetton transaction structure
		expect(tx).toBeDefined();
		expect(tx.boc).toBeDefined();
		expect(typeof tx.boc).toBe('string');
		expect(tx.boc.length).toBeGreaterThan(0);
		expect(tx.address).toBe(
			'EQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjRbdU'
		);
		expect(tx.stateInit).toBeUndefined();

		// Verify BOC format and jetton-specific structure
		expect(tx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
		// Jetton transfers typically result in longer BOCs due to internal messages
		expect(tx.boc.length).toBeGreaterThan(100);
	});

	test('ton jetton mintless signTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				type: 'jettonTransfer', // type of jetton TOKEN transfer
				// jetton wallet address of from address
				fromJettonAccount:
					'EQAbjeYovCwu8rdK_BVD-K3G1RO9DwHDXAYQVjYX2oYq2nNs',
				to: 'UQDXgyxgYKNSdTiJBqmNNfbD7xuRMl6skrBmsEtyXslFm5an',
				seqno: 2, // nonce or sequence of from address
				toIsInit: false, // destination address init or not
				memo: '', // comment for this tx
				decimal: 9, // decimal of jetton TOKEN on ton blockchain
				amount: '0', // decimal of TOKEN is 2 on ton blockchain, so that here real value is 1
				messageAttachedTons: '100000000', // message fee, default 0.05, here is 0.05 * 10^9
				invokeNotificationFee: '1', // notify fee, official recommend 0.000000001, here is 0.000000001 * 10^9
				expireAt: timeoutAtSeconds, // timeout at seconds eg, 1718863283n, default now + 60s
				customPayload:
					'te6ccgECMQEABD0AAQgN9gLWAQlGA6+1FWXC4ss/wvDOFwMk2bVM97AUEWqaUhh63uWfQ26nAB4CIgWBcAIDBCIBIAUGKEgBAfRz1Bc0mT2ncrMSGDzpgrCQTSHm8sfmADRmLiUnsNxaAB0iASAHCChIAQENfwBAdh4BtwI1FNpt1Hbn/aOwPSJoRdgU4zhuF90XqQAcIgEgCQooSAEBUi2VG6r6RjQj0FCr2Sx9GziTij+IViV1EBb8L/8WoM4AGyhIAQGxLvEY9WgzlAYqIwgEJVjCjPP2LL8POA5cPtDX/ICFaQAZIgEgCwwoSAEB6C5kMujM0MhhSLbqrUztWB5Kcfdecx8LZ6KRkOc5bDcAGCIBIA0OKEgBAbJ3XoghuVwSjFJGWOTC54k0ZFmCsOAOc0Wt15GI+gb6ABciASAPEChIAQFyOFgLXez90Sj/+GRRcPt/AJ/ObHVkwgjYcDhSx6fbsAAWIgEgERIiASATFChIAQEDtQVupKrXeJhjhyUKYd3OPf0GxwVV1IDy+iXMR/goewAVKEgBAQph4s1pC9y8MWknNPBHNJrSHdimhsjwJTKsTtzHBRlqABQiASAVFihIAQHp9WxWiNgvfUyhwWIaQ2z+uU0RwqxkbNxLSMEnZWzzQAASIgEgFxgoSAEBBkIlY9AlSY8GsPcFaJPchY7tWfKtKX0Awx0SEiJz3lAAEiIBIBkaKEgBAfdZX+TtPDalGNq7Md2id0vCHK8HKOR0+77eJzH8InXhABEiASAbHCIBIB0eKEgBATpKVSPw6KyxJiw0GmzuGCyNHlA5ogc24DODkte6fzy9AA8iASAfIChIAQE3+haceo/EslgK3xv0t2ZrKxRfLxDm0IkOkcnDyCeavwANKEgBATO8W3KDeWmmTIv23CQoiJhyidxgL6c3entEm7SheuCDAA0iASAhIiIBICMkKEgBARarfhq0MYyF8WkqTkqkIPAVBh7lU3reBlDc6wA/70b8AAsiASAlJihIAQFt+vYtnMIi7RH91EaU58Yvf+MiwNd7A40P1aoFhaD+IgAJKEgBAWxv6OupJReZmkRM5LIkpMupuGMKAGRnI4L0J6ZOw9s7AAkiASAnKChIAQE/XI2bRyyEWynQamQHJC2HjpgY4hauLSTGBuNFatZlSAAIIgEgKSooSAEB+Xjkf6ScDOWWGtDqcMQtUW65GhHphB4SHSQ14sx0VCYABiIBICssIgEgLS4oSAEBU4bYiAJBEK5qwy1eRIdLAOK8QELz0yTAPCTsYmZhPEUABCIBbi8wKEgBAerGQGO6mv6nukMVfDI/M+KNNRCBH8q+t4G6XRxqKAK/AAEoSAEBf4jiG+pY6Cml375ovmTBNuvf7QI6oiVsL8e/DGVfGE4AAABduf2NRRLK+qYONCLh6kHV9jpZw5nRQ26fwK2MmpB9IdzWUAAAAzcG7AAAAzeq1oQ=',
				stateInit:
					'te6ccgEBAwEAjwACATQBAghCAg7xnhv0Dyukkvyqw4buylm/aCejhQcI2fzZrbaDq8M2AMoAgAPeTn9jUUSyvqmDjQi4epB1fY6WcOZ0UNun8CtjJqQfUAPpn0MdzkzH7w8jwjgGMZfR3Y2FqlpEArXYKCy3B42gyr7UVZcLiyz/C8M4XAyTZtUz3sBQRappSGHre5Z9DbqcDA==',
				/**
				 * export enum SendMode {
				 *     CARRY_ALL_REMAINING_BALANCE = 128,
				 *     CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
				 *     DESTROY_ACCOUNT_IF_ZERO = 32,
				 *     PAY_GAS_SEPARATELY = 1,
				 *     IGNORE_ERRORS = 2,
				 *     NONE = 0
				 * }
				 */
				sendMode: 3,
				// queryId: "18446744073709551615" // string of uint64 number, eg 18446744073709551615 = 2^64 - 1
			},
		};
		const tx = await tonWallet.signTransaction(param);

		// Verify mintless jetton transaction with custom payload and stateInit
		expect(tx).toBeDefined();
		expect(tx.boc).toBeDefined();
		expect(typeof tx.boc).toBe('string');
		expect(tx.boc.length).toBeGreaterThan(0);
		expect(tx.address).toBe(
			'EQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjRbdU'
		);
		expect(tx.stateInit).toBeUndefined(); // StateInit handled in the transaction data

		// Verify BOC format and that it's significantly longer due to custom payload
		expect(tx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
		// Mintless transactions with custom payload should be very long
		expect(tx.boc.length).toBeGreaterThan(1000);
	});

	test('getWalletInformation', async () => {
		const param = {
			workChain: 0, // mainnet
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			publicKey: '',
			walletVersion: 'v4r2', // version of wallet, default v4r2
		};
		const walletInfo = await tonWallet.getWalletInformation(param);
		const expected = {
			initCode:
				'te6cckECFAEAAtQAART/APSkE/S88sgLAQIBIAIPAgFIAwYC5tAB0NMDIXGwkl8E4CLXScEgkl8E4ALTHyGCEHBsdWe9IoIQZHN0cr2wkl8F4AP6QDAg+kQByMoHy//J0O1E0IEBQNch9AQwXIEBCPQKb6Exs5JfB+AF0z/IJYIQcGx1Z7qSODDjDQOCEGRzdHK6kl8G4w0EBQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAHDgIBIAgNAgFYCQoAPbKd+1E0IEBQNch9AQwAsjKB8v/ydABgQEI9ApvoTGACASALDAAZrc52omhAIGuQ64X/wAAZrx32omhAEGuQ64WPwAARuMl+1E0NcLH4AFm9JCtvaiaECAoGuQ+gIYRw1AgIR6STfSmRDOaQPp/5g3gSgBt4EBSJhxWfMYQE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVAj45Sg=',
			initData:
				'te6cckEBAQEAKwAAUQAAAAApqaMXSEu9odGrPom4O0I2hanUy+eii4uWu77lHQVTtH5NtC9As9YYUg==',
			publicKey:
				'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f',
			walletStateInit:
				'te6cckECFgEAAwQAAgE0ARUBFP8A9KQT9LzyyAsCAgEgAxACAUgEBwLm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQUGAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAgPAgEgCQ4CAVgKCwA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIAwNABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xESExQAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF0hLvaHRqz6JuDtCNoWp1MvnoouLlru+5R0FU7R+TbQvQHEIMAk=',
			walletAddress: 'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR',
		};
		expect(walletInfo).toEqual(expected);
	});

	test('getTransactionBodyForSimulate', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				type: 'transfer', // type of TON transfer
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr', // destination address
				decimal: 9, // decimal on ton blockchain
				amount: '10000000',
				seqno: 14, // nonce or sequence of from address
				toIsInit: true, // destination address init or not
				memo: 'ton test', // comment for this tx
				expireAt: 1718863283n /*timeoutAtSeconds*/, // timeout at seconds eg, 1718863283n, default now + 60s
				/**
				 * export enum SendMode {
				 *     CARRY_ALL_REMAINING_BALANCE = 128,
				 *     CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
				 *     DESTROY_ACCOUNT_IF_ZERO = 32,
				 *     PAY_GAS_SEPARATELY = 1,
				 *     IGNORE_ERRORS = 2,
				 *     NONE = 0
				 * }
				 */
				sendMode: 1,
				publicKey:
					'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f', // public key needed if no private key
			},
		};
		const body = await tonWallet.getTransactionBodyForSimulate(param);
		const expected =
			'te6cckEBAgEAkgABnGGGiWsDbhR1aWGsKNzV6pUGgf1WiTneQJcxyGb5rjLgVQkc4ATUyXsUar0oa6zJjIrxFhMZJlmbjWGICV5+AQQpqaMXZnPFswAAAA4AAQEAfkIAG/5JBJQYWlTVwagiD2xUaEesReCCNtYiImcz4eLYRWGcxLQAAAAAAAAAAAAAAAAAAAAAAAB0b24gdGVzdBTnQls=';
		expect(body).toBe(expected);
	});

	test('signTonProof', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			walletAddress: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
			tonProofItem: 'ton-proof-item-v2/',
			messageAction: 'ton-connect',
			messageSalt: 'ffff',
			proof: {
				timestamp: 1719309177,
				domain: 'ton.org.com',
				payload: '123',
			},
		};
		const messageHash = await tonWallet.signTonProof(param);
		expect(messageHash).toBe(
			'tkrepSlC/7RMdGmtqNQ/OKRkxtdzvwF6GYBP6sgKWI/9mP0KcqyUwpFHAEGF6xeNOrwwoxIce8KJuEHLxuIgDw=='
		);
	});

	test('calcTxHash', async () => {
		const param = {
			data: 'te6cckECBAEAARIAAeGIAYlhKogJET0rm+rLlfY0aczCGg5/zakLEHs5hkk2pIbUAShC3ZvFZPuxndFImUSjvgQR9L1RDS4ZeBioM66enEURWPqGElGG9bGj2cB5KiWeilKRIewkerr43RalHk7wOBFNTRi7M9OXWAAAAGAADAEBaEIAZftljxmdcPF72D6EDJROauAYrYadLdmz/gLHUQRkCKegF9eEAAAAAAAAAAAAAAAAAAECAaYPin6lAAAAAAAAAAAicQgBrwZYwMFGpOpxEg1TGmvth943ImS9WSVgzWCW5L2SizcAMSwlUQEiJ6VzfVlyvsaNOZhDQc/5tSFiD2cwySbUkNqCAwMAHgAAAABqZXR0b24gdGVzdBhpB+M=',
		};
		const messageHash = await tonWallet.calcTxHash(param);
		expect(messageHash).toBe(
			'2270cac96399e182d3d31688cc0a2d3676631e31a79dd2247aa6a1162ff3db0b'
		);
	});

	test('signMultiTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				messages: [
					{
						address:
							'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
						amount: '100000000',
						payload: '', // payload
						stateInit:
							'te6cckECFgEAAwQAAgE0ARUBFP8A9KQT9LzyyAsCAgEgAxACAUgEBwLm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQUGAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAgPAgEgCQ4CAVgKCwA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIAwNABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xESExQAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjFxPhbQc75H/FJ8sz1fe06yzTrMQfrE9fxKS/t1aneB9oQMb69Ik=', //base64
						isBase64Payload: false,
					},
					{
						address:
							'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
						amount: '100000000',
						payload: 'this is a memo',
						stateInit: '', //base64
						isBase64Payload: false,
					},
					{
						// mint NFT item
						address:
							'EQDF0cVEVw917PZVNtKdyCYjiyoeIIHCngS7Dat-PtDLcKQV',
						amount: '50000000',
						payload:
							'te6ccsEBAwEATgAAHEEBMQAAAAEAAAAAAAAAAAAAAAAAAAAAQC+vCAgBAUOAGJYSqICRE9K5vqy5X2NGnMwhoOf82pCxB7OYZJNqSG1QAgAWbXlfbmZ0Lmpzb25Yc7tj',
						stateInit: '', //base64
						isBase64Payload: true,
					},
				],
				seqno: 20, // nonce or sequence of from address
				valid_until: '1829924412000', // timeout at milliseconds eg, 1718869081781n or seconds 1718869081n
				network: 'mainnet', // default mainnet 0, other 1
			},
		};
		const { transaction } = await tonWallet.signMultiTransaction(param);
		const expected =
			'te6cckECGwEABH4AA+WIAXSBO+oN/8Mc1lDSkaM1LLFUfpq7YLd9z4RuTk7mkEaKAW3aeS/BUgyDQtzjcqivjrItSkNXvXnybugzE9Ua0xsw8/oZjHYf0kTWUb2RSItwam7TcA+ot/vQbMalAjOMcGFNTRi7aJNx4AAAAKAAGBgcARcYAnFiABv+SQSUGFpU1cGoIg9sVGhHrEXggjbWIiJnM+Hi2EVhoC+vCAAAAAAAAAAAAAAAAAACMAAAAAICFgEU/wD0pBP0vPLICwMCASAEEQIBSAUIAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcAeAH6APQEMPgnbyIwUAqhIb7y4FCCEHBsdWeDHrFwgBhQBMsFJs8WWPoCGfQAy2kXyx9SYMs/IMmAQPsABgCKUASBAQj0WTDtRNCBAUDXIMgBzxb0AMntVAFysI4jghBkc3Rygx6xcIAYUAXLBVADzxYj+gITy2rLH8s/yYBA+wCSXwPiAgEgCRACASAKDwIBWAsMAD2ynftRNCBAUDXIfQEMALIygfL/8nQAYEBCPQKb6ExgAgEgDQ4AGa3OdqJoQCBrkOuF/8AAGa8d9qJoQBBrkOuFj8AAEbjJftRNDXCx+ABZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEBPjygwjXGCDTH9Mf0x8C+CO78mTtRNDTH9Mf0//0BNFRQ7ryoVFRuvKiBfkBVBBk+RDyo/gAJKTIyx9SQMsfUjDL/1IQ9ADJ7VT4DwHTByHAAJ9sUZMg10qW0wfUAvsA6DDgIcAB4wAhwALjAAHAA5Ew4w0DpMjLHxLLH8v/EhMUFQBu0gf6ANTUIvkABcjKBxXL/8nQd3SAGMjLBcsCIs8WUAX6AhTLaxLMzMlz+wDIQBSBAQj0UfKnAgBwgQEI1xj6ANM/yFQgR4EBCPRR8qeCEG5vdGVwdIAYyMsFywJQBs8WUAT6AhTLahLLH8s/yXP7AAIAbIEBCNcY+gDTPzBSJIEBCPRZ8qeCEGRzdHJwdIAYyMsFywJQBc8WUAP6AhPLassfEss/yXP7AAAK9ADJ7VQAUQAAAAApqaMXE+FtBzvkf8UnyzPV97TrLNOsxB+sT1/EpL+3Vqd4H2hAAIxiABv+SQSUGFpU1cGoIg9sVGhHrEXggjbWIiJnM+Hi2EVhoC+vCAAAAAAAAAAAAAAAAAAAAAAAAHRoaXMgaXMgYSBtZW1vAZliAGLo4qIrh7r2eyqbaU7kExHFlQ8QQOFPAl2G1b8faGW4IBfXhAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAABAL68ICBkBQ4AYlhKogJET0rm+rLlfY0aczCGg5/zakLEHs5hkk2pIbVAaABZteV9uZnQuanNvbnhHt9s=';
		expect(transaction).toBe(expected);
	});

	test('simulateMultiTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				messages: [
					{
						address:
							'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
						amount: '100000000',
						payload: '', // payload
						stateInit:
							'te6cckECFgEAAwQAAgE0ARUBFP8A9KQT9LzyyAsCAgEgAxACAUgEBwLm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQUGAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAgPAgEgCQ4CAVgKCwA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIAwNABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xESExQAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjFxPhbQc75H/FJ8sz1fe06yzTrMQfrE9fxKS/t1aneB9oQMb69Ik=', //base64
						isBase64Payload: false,
					},
					{
						address:
							'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
						amount: '100000000',
						payload: 'this is a memo',
						stateInit: '', //base64
						isBase64Payload: false,
					},
					{
						// mint NFT item
						address:
							'EQDF0cVEVw917PZVNtKdyCYjiyoeIIHCngS7Dat-PtDLcKQV',
						amount: '50000000',
						payload:
							'te6ccsEBAwEATgAAHEEBMQAAAAEAAAAAAAAAAAAAAAAAAAAAQC+vCAgBAUOAGJYSqICRE9K5vqy5X2NGnMwhoOf82pCxB7OYZJNqSG1QAgAWbXlfbmZ0Lmpzb25Yc7tj',
						stateInit: '', //base64
						isBase64Payload: true,
					},
				],
				seqno: 16, // nonce or sequence of from address
				valid_until: '1829924412000', // timeout at milliseconds eg, 1718869081781n or seconds 1718869081n
				network: 'mainnet', // default mainnet 0, other 1
				publicKey:
					'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f', // public key needed if no private key
			},
		};
		const { transaction } = await tonWallet.simulateMultiTransaction(param);
		const expected =
			'te6cckECGwEABFsAA6DvxnPzoU0Ashsgz218uhIVU2+JPrnC2f+fyBVdHaY9aZAJxexTi1QjFFc8llH+qOtQLXTSHb+K3QILVpEobBwKKamjF20SbjwAAAAQAAMDAwEXGAJxYgAb/kkElBhaVNXBqCIPbFRoR6xF4II21iIiZzPh4thFYaAvrwgAAAAAAAAAAAAAAAAAAjAAAAACAhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjFxPhbQc75H/FJ8sz1fe06yzTrMQfrE9fxKS/t1aneB9oQACMYgAb/kkElBhaVNXBqCIPbFRoR6xF4II21iIiZzPh4thFYaAvrwgAAAAAAAAAAAAAAAAAAAAAAAB0aGlzIGlzIGEgbWVtbwGZYgBi6OKiK4e69nsqm2lO5BMRxZUPEEDhTwJdhtW/H2hluCAX14QAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAQC+vCAgZAUOAGJYSqICRE9K5vqy5X2NGnMwhoOf82pCxB7OYZJNqSG1QGgAWbXlfbmZ0Lmpzb266LA27';
		expect(transaction).toBe(expected);
	});
});

describe('ton mnemonic', () => {
	const mWords = [
		'parent',
		'manual',
		'come',
		'hello',
		'way',
		'shed',
		'example',
		'photo',
		'rocket',
		'rescue',
		'keen',
		'galaxy',
		'lift',
		'treat',
		'guess',
		'garment',
		'zebra',
		'secret',
		'credit',
		'cloth',
		'drip',
		'mad',
		'obvious',
		'buffalo',
	];

	const expectedSeed =
		'8502f462b26de9b5e4b9369ee771c26b6176a60471a0047fdba77eb3036b2353';

	test('generate mnemonic', async () => {
		const words = await generateMnemonic();
		expect(words.length).toBe(24);
		const needPassword = await isPasswordNeeded(words);
		expect(needPassword).toBe(false);
	});

	test('validate mnemonic', async () => {
		const valid = await validateMnemonic(mWords);
		expect(valid).toBe(true);
	});

	test('mnemonic to seed', async () => {
		const seedBytes = await mnemonicToSeed(mWords);
		const seed = base.toHex(seedBytes);
		expect(seed).toBe(expectedSeed);
	});

	test('mnemonic to key pair', async () => {
		const keyPair = await mnemonicToKeyPair(mWords);
		const privateKey = base.toHex(keyPair.secretKey);
		const publicKey = base.toHex(keyPair.publicKey);
		expect(privateKey.slice(0, 64)).toBe(expectedSeed);
		expect(publicKey).toBe(
			'b4ca47eb85ea32a93899bdfe05fbc3511e43a34667f521238151191b4a72b94b'
		);
	});
});

describe('venom', () => {
	test('venom getNewAddress', async () => {
		const seed =
			'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8';
		const result = await venomWallet.getNewAddress({ privateKey: seed });
		expect(result.address).toBe(
			'0:6bef7d76e46fd1f308f0bf0b59f1ca6318aa6d950ea00aecc7d162218acaaa36'
		);
	});

	test('venom validateAddress', async () => {
		const result = await venomWallet.validAddress({
			address:
				'0:6bef7d76e46fd1f308f0bf0b59f1ca6318aa6d950ea00aecc7d162218acaaa36',
		});
		expect(result.isValid).toBe(true);
	});

	test('venom signTransaction', async () => {
		const param = {
			privateKey:
				'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8',
			data: {
				to: '0:b547ad1de927f0dcf95372cd766302e2c9351331d7673454017cc52c149727c0',
				amount: '100000000',
				seqno: 4,
				toIsInit: true,
				memo: '',
				globalId: 1000,
				expireAt: 1718863283n,
			},
		};
		const tx = await venomWallet.signTransaction(param);
		const expected = {
			id: '36nIKSE6TW1nXCo7f3eXi4Db05YbWWE/359RdMVI2OI=',
			body: 'te6cckEBAgEArQAB34gA19767cjfo+YR4X4Ws+OUxjFU2yodQBXZj6LEQxWVVGwDEkiOl9C+/61RNiWRBtzYr+fzZ0gETOmvTCDLvRyasj8zPpbEDv4z1GgqgYYvPQlfvnYehdtg1h74Wb1LgVRgcl1JbFMzni2YAAAAIBwBAHBiAFqj1o70k/hufKm5ZrsxgXFkmomY67OaKgC+YpYKS5PgIC+vCAAAAAAAAAAAAAAAAAAAAAAAAP/2clI=',
		};
		expect(tx).toEqual(expected);
	});
});

describe('ton v5', () => {
	test('derive seed', async () => {
		let privateKey = await tonWallet.getDerivedPrivateKey({
			mnemonic:
				'into always exhaust slice adapt now fuel razor scissors sibling cup ensure urge remind enter collect gasp ability frown ocean leaf gate view resist',
			hdPath: '', // for bip39 mnemoric
		});
		const addr = await tonWallet.getNewAddress({
			privateKey,
			addressType: 'v5r1',
		});
		expect(addr.address).toBe(
			'UQBjVneLXi3rT51D_st08eBEX3j6oCfrMi4y4XhJH8EY3nvw'
		);
	});

	test('getWalletInformation v5', async () => {
		const seed = await tonWallet.getDerivedPrivateKey({
			mnemonic:
				'into always exhaust slice adapt now fuel razor scissors sibling cup ensure urge remind enter collect gasp ability frown ocean leaf gate view resist',
			hdPath: '', // for ton official mnemonic
		});

		// Verify seed generation
		expect(seed).toBeDefined();
		expect(typeof seed).toBe('string');
		expect(seed.length).toBe(64); // 32 bytes in hex = 64 characters
		expect(seed).toBe(
			'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8'
		);

		const param = {
			workChain: 0, // mainnet
			privateKey: seed,
			publicKey: '',
			walletVersion: 'v5r1', // version of wallet, v5r1
		};
		const walletInfo = await tonWallet.getWalletInformation(param);

		// Verify wallet information structure for v5r1
		expect(walletInfo).toBeDefined();
		expect(walletInfo.publicKey).toBe(
			'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd'
		);
		expect(walletInfo.walletAddress).toBe(
			'UQBjVneLXi3rT51D_st08eBEX3j6oCfrMi4y4XhJH8EY3nvw'
		);
		expect(walletInfo.initCode).toBeDefined();
		expect(walletInfo.initData).toBeDefined();
		expect(walletInfo.walletStateInit).toBeDefined();

		// Verify v5r1 specific characteristics
		expect(walletInfo.initCode).toBeDefined();
		expect(walletInfo.initCode!.length).toBeGreaterThan(800); // v5r1 has complex init code
	});

	test('ton signTransaction v5', async () => {
		const param = {
			privateKey:
				'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '1000000000',
				seqno: 15,
				toIsInit: false,
				memo: 'single transfer',
				sendMode: 3,
			},
		};
		const tx = await tonWallet.signTransaction(param);

		// Verify v5r1 transaction structure
		expect(tx).toBeDefined();
		expect(tx.boc).toBeDefined();
		expect(typeof tx.boc).toBe('string');
		expect(tx.boc.length).toBeGreaterThan(0);
		expect(tx.address).toBe(
			'UQBjVneLXi3rT51D_st08eBEX3j6oCfrMi4y4XhJH8EY3nvw'
		);
		expect(tx.stateInit).toBeUndefined();

		// Verify BOC format and v5r1 characteristics
		expect(tx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
		// v5r1 transactions tend to be longer due to more complex structure
		expect(tx.boc.length).toBeGreaterThan(200);
	});

	test('ton signTransaction jetton v5', async () => {
		const param = {
			privateKey:
				'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8',
			data: {
				type: 'jettonTransfer',
				fromJettonAccount:
					'kQDN9dhwJGrWD4hXnf8X03F29SA0cjtECPVyDuagkxBaKhSI',
				walletVersion: 'v5r1',
				to: 'UQDJEP_9WIOuk7lsc7oC31wLkfzdbeftwtBt6hYd3WKxwtmB',
				decimal: 9,
				amount: '1000000000000',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '0',
				seqno: 16,
				toIsInit: false,
				memo: 'single jetton transfer',
				sendMode: 3,
			},
		};
		const tx = await tonWallet.signTransaction(param);

		// Verify v5r1 jetton transaction structure
		expect(tx).toBeDefined();
		expect(tx.boc).toBeDefined();
		expect(typeof tx.boc).toBe('string');
		expect(tx.boc.length).toBeGreaterThan(0);
		expect(tx.address).toBe(
			'EQBjVneLXi3rT51D_st08eBEX3j6oCfrMi4y4XhJH8EY3iY1'
		);
		expect(tx.stateInit).toBeUndefined();

		// Verify BOC format and jetton v5r1 characteristics
		expect(tx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
		// v5r1 jetton transactions are significantly longer
		expect(tx.boc.length).toBeGreaterThan(300);
	});

	test('ton sign relay transaction v5', async () => {
		const param = {
			privateKey:
				'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '1000000000',
				seqno: 18,
				toIsInit: false,
				memo: 'single relay transfer',
				sendMode: 3,
				authType: 'internal',
			},
		};
		const internalTxMsg = await tonWallet.signTransaction(param);

		// Verify internal transaction was created properly
		expect(internalTxMsg).toBeDefined();
		expect(internalTxMsg.boc).toBeDefined();
		expect(internalTxMsg.address).toBeDefined();

		const relayParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				seqno: 45,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '10000000',
						isBase64Payload: true,
						payload: internalTxMsg.boc,
						stateInit: internalTxMsg.stateInit,
						address: internalTxMsg.address,
					},
				],
			},
		};
		const externalTx = await tonWallet.signMultiTransaction(relayParam);

		// Verify relay transaction structure
		expect(externalTx).toBeDefined();
		expect(externalTx.seqno).toBe(45);
		expect(externalTx.transaction).toBeDefined();
		expect(typeof externalTx.transaction).toBe('string');
		expect(externalTx.transaction.length).toBeGreaterThan(0);
		expect(externalTx.externalMessage).toBeDefined();

		// Verify BOC format
		expect(externalTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
		expect(externalTx.externalMessage).toMatch(/^[A-Za-z0-9+/]+=*$/);

		// Relay transactions should be quite long due to nested structure
		expect(externalTx.transaction.length).toBeGreaterThan(450);
	});

	test('ton sign jetton relay transaction v5', async () => {
		const param = {
			privateKey:
				'4eb6095b3f03c444fa915763306e6589d670675851ab9e71cf72ec6f30c9c96a',
			data: {
				type: 'jettonTransfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				fromJettonAccount:
					'kQD7o5kZoF8_CRvL9oCPvS-MmB3cUnESLGI71rtilEniufl8',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '1',
				decimal: 9,
				amount: '100000000000',
				seqno: 0,
				toIsInit: false,
				memo: 'relay paid for gas',
				sendMode: 0,
				authType: 'internal',
				responseAddr:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
			},
		};
		const internalTxMsg = await tonWallet.signTransaction(param);

		const relayParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 25,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '50000000',
						isBase64Payload: true,
						payload: internalTxMsg.boc,
						stateInit: internalTxMsg.stateInit,
						address: internalTxMsg.address,
					},
				],
			},
		};
		const relayTx = await tonWallet.signMultiTransaction(relayParam);

		// Verify internal jetton transaction was created properly
		expect(internalTxMsg).toBeDefined();
		expect(internalTxMsg.boc).toBeDefined();
		expect(internalTxMsg.address).toBeDefined();

		// Verify jetton relay transaction structure
		expect(relayTx).toBeDefined();
		expect(relayTx.seqno).toBe(25);
		expect(relayTx.transaction).toBeDefined();
		expect(typeof relayTx.transaction).toBe('string');
		expect(relayTx.transaction.length).toBeGreaterThan(0);
		expect(relayTx.externalMessage).toBeDefined();

		// Verify BOC format
		expect(relayTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
		expect(relayTx.externalMessage).toMatch(/^[A-Za-z0-9+/]+=*$/);

		// Jetton relay transactions should be even longer due to complex nested structure
		expect(relayTx.transaction.length).toBeGreaterThan(1000);
	});

	test('ton sign jetton relay transaction multiple v5', async () => {
		const param1 = {
			privateKey:
				'6727a0f4cf3e552815e56ebb4d2acbf06b65241a2c0bae49ff0cc7af3d07cd5a',
			data: {
				type: 'jettonTransfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				fromJettonAccount:
					'kQCniLsApqLpnWig-0mTJ0vegVvuWkFMcdTuNnBbNIU75ouL',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '0',
				decimal: 9,
				amount: '100000000000',
				seqno: 3,
				toIsInit: false,
				memo: 'single jetton relay transfer',
				sendMode: 3,
				authType: 'internal',
				responseAddr:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
			},
		};
		const internalMsg1 = await tonWallet.signTransaction(param1);

		const param2 = {
			privateKey:
				'6b564dc83a8ab4d78a3c71cc26d3c621ca9e988db3a996c4a912a68ed1be9973',
			data: {
				type: 'jettonTransfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				fromJettonAccount:
					'0QAxLu8mTNSokBHM365h_Q35rf0WMuhW_fiS3QTZNt9WK6sI',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '0',
				decimal: 9,
				amount: '100000000000',
				seqno: 3,
				toIsInit: false,
				memo: 'single jetton relay transfer',
				sendMode: 3,
				authType: 'internal',
				responseAddr:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
			},
		};
		const internalMsg2 = await tonWallet.signTransaction(param2);

		const relayParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 15,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '80000000',
						isBase64Payload: true,
						payload: internalMsg1.boc,
						stateInit: internalMsg1.stateInit,
						address: internalMsg1.address,
					},
					{
						amount: '80000000',
						isBase64Payload: true,
						payload: internalMsg2.boc,
						stateInit: internalMsg2.stateInit,
						address: internalMsg2.address,
					},
				],
			},
		};
		const relayTx = await tonWallet.signMultiTransaction(relayParam);

		// Verify both internal jetton transactions were created properly
		expect(internalMsg1).toBeDefined();
		expect(internalMsg1.boc).toBeDefined();
		expect(internalMsg1.address).toBeDefined();
		expect(internalMsg2).toBeDefined();
		expect(internalMsg2.boc).toBeDefined();
		expect(internalMsg2.address).toBeDefined();

		// Verify multiple jetton relay transaction structure
		expect(relayTx).toBeDefined();
		expect(relayTx.seqno).toBe(15);
		expect(relayTx.transaction).toBeDefined();
		expect(typeof relayTx.transaction).toBe('string');
		expect(relayTx.transaction.length).toBeGreaterThan(0);
		expect(relayTx.externalMessage).toBeDefined();

		// Verify BOC format
		expect(relayTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
		expect(relayTx.externalMessage).toMatch(/^[A-Za-z0-9+/]+=*$/);

		// Multiple jetton relay transactions should be very long
		expect(relayTx.transaction.length).toBeGreaterThan(1000);
	});

	test('ton sign relay transaction v5 wrap v4 (fail)', async () => {
		// v4 internal tx
		const param = {
			privateKey:
				'6727a0f4cf3e552815e56ebb4d2acbf06b65241a2c0bae49ff0cc7af3d07cd5a',
			data: {
				type: 'transfer',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '1000000000',
				seqno: 16,
				toIsInit: false,
				memo: 'v5 wrap v4',
				sendMode: 3,
				authType: 'internal',
			},
		};
		await expect(
			async () => await tonWallet.signTransaction(param)
		).rejects.toBe(SignTxError);

		// v5 relay tx
		// const relayParam = {
		//     privateKey: "75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d",
		//     data: {
		//         type: "transfer",
		//         walletVersion: "v5r1",
		//         decimal: 9,
		//         seqno: 17,
		//         toIsInit: false,
		//         sendMode: 3,
		//         messages: [
		//             {
		//                 amount: "100000000",
		//                 isBase64Payload: true,
		//                 payload: internalTxMsg.boc,
		//                 stateInit: internalTxMsg.stateInit,
		//                 address: internalTxMsg.address
		//             }
		//         ]
		//     },
		// };
		// const relayTx = await tonWallet.signMultiTransaction(relayParam);
		// const expected = {
		// };
		// expect(relayTx).toEqual(expected)
	});

	test('ton sign relay transaction v4 wrap v5', async () => {
		// v5 internal tx
		const param = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '1000000000',
				seqno: 18,
				toIsInit: false,
				memo: 'v4 wrap v5',
				sendMode: 3,
				authType: 'internal',
			},
		};
		const internalMsg = await tonWallet.signTransaction(param);

		// v4 relay tx
		const relayParam = {
			privateKey:
				'6727a0f4cf3e552815e56ebb4d2acbf06b65241a2c0bae49ff0cc7af3d07cd5a',
			data: {
				type: 'transfer',
				decimal: 9,
				seqno: 16,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '100000000',
						isBase64Payload: true,
						payload: internalMsg.boc,
						stateInit: internalMsg.stateInit,
						address: internalMsg.address,
					},
				],
			},
		};
		const relayTx = await tonWallet.signMultiTransaction(relayParam);

		// Verify v5 internal transaction was created properly
		expect(internalMsg).toBeDefined();
		expect(internalMsg.boc).toBeDefined();
		expect(internalMsg.address).toBeDefined();

		// Verify v4 wrapping v5 relay transaction structure
		expect(relayTx).toBeDefined();
		expect(relayTx.seqno).toBe(16);
		expect(relayTx.transaction).toBeDefined();
		expect(typeof relayTx.transaction).toBe('string');
		expect(relayTx.transaction.length).toBeGreaterThan(0);
		expect(relayTx.externalMessage).toBeDefined();

		// Verify BOC format
		expect(relayTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
		expect(relayTx.externalMessage).toMatch(/^[A-Za-z0-9+/]+=*$/);

		// v4 wrapping v5 transactions should be moderately long
		expect(relayTx.transaction.length).toBeGreaterThan(400);
	});

	test('ton sign extension transaction v5', async () => {
		const param = {
			privateKey: '',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '100000000',
				seqno: 12,
				toIsInit: false,
				memo: 'single extension transfer',
				sendMode: 3,
				authType: 'extension',
				publicKey:
					'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd',
			},
		};
		const internalTxMsg = await tonWallet.signTransaction(param);

		const extensionParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 37,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '10000000',
						isBase64Payload: true,
						payload: internalTxMsg.boc,
						stateInit: internalTxMsg.stateInit,
						address: internalTxMsg.address,
					},
				],
			},
		};
		const extensionTx = await tonWallet.signMultiTransaction(
			extensionParam
		);

		// Verify internal extension transaction was created properly
		expect(internalTxMsg).toBeDefined();
		expect(internalTxMsg.boc).toBeDefined();
		expect(internalTxMsg.address).toBeDefined();

		// Verify extension transaction structure
		expect(extensionTx).toBeDefined();
		expect(extensionTx.seqno).toBe(37);
		expect(extensionTx.transaction).toBeDefined();
		expect(typeof extensionTx.transaction).toBe('string');
		expect(extensionTx.transaction.length).toBeGreaterThan(0);
		expect(extensionTx.externalMessage).toBeDefined();

		// Verify BOC format
		expect(extensionTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
		expect(extensionTx.externalMessage).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	test('ton sign add extension transaction v5', async () => {
		const param = {
			privateKey:
				'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8',
			data: {
				type: 'extension',
				walletVersion: 'v5r1',
				extensionAddress:
					'0QC7dY9Zn1fxZDl1t7IEdOjnqkSAgfdHqwAxq4u-WCKPTSnq',
				decimal: 9,
				seqno: 13,
				toIsInit: false,
				publicKey:
					'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd',
			},
		};
		const addExtensionTx = await tonWallet.addExtension(param);

		// Verify add extension transaction structure
		expect(addExtensionTx).toBeDefined();
		expect(addExtensionTx.boc).toBeDefined();
		expect(typeof addExtensionTx.boc).toBe('string');
		expect(addExtensionTx.boc.length).toBeGreaterThan(0);
		expect(addExtensionTx.address).toBe(
			'EQBjVneLXi3rT51D_st08eBEX3j6oCfrMi4y4XhJH8EY3iY1'
		);

		// Verify BOC format
		expect(addExtensionTx.boc).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	test('ton sign remove extension with extension auth transaction v5', async () => {
		const param = {
			privateKey: '',
			data: {
				type: 'extension',
				walletVersion: 'v5r1',
				extensionAddress:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
				decimal: 9,
				seqno: 12,
				toIsInit: false,
				publicKey:
					'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd',
				authType: 'extension',
			},
		};
		const removeExtensionInternalMsg = await tonWallet.removeExtension(
			param
		);

		const extensionParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 38,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '10000000',
						isBase64Payload: true,
						payload: removeExtensionInternalMsg.boc,
						stateInit: removeExtensionInternalMsg.stateInit,
						address: removeExtensionInternalMsg.address,
					},
				],
			},
		};
		const extensionTx = await tonWallet.signMultiTransaction(
			extensionParam
		);

		// Verify remove extension transaction structure
		expect(extensionTx).toBeDefined();
		expect(extensionTx.seqno).toBe(38);
		expect(extensionTx.transaction).toBeDefined();
		expect(extensionTx.externalMessage).toBeDefined();
		expect(extensionTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	test('ton sign disable signature auth v5', async () => {
		const param = {
			privateKey: '',
			data: {
				type: 'extension',
				walletVersion: 'v5r1',
				extensionAddress:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
				decimal: 9,
				seqno: 10,
				toIsInit: false,
				isSignatureAuthEnabled: false,
				publicKey:
					'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd',
				authType: 'extension',
			},
		};
		const disableSignatureAuthInternalMsg =
			await tonWallet.setSignatureAuth(param.data);

		const extensionParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 28,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '10000000',
						isBase64Payload: true,
						payload: disableSignatureAuthInternalMsg.boc,
						stateInit: disableSignatureAuthInternalMsg.stateInit,
						address: disableSignatureAuthInternalMsg.address,
					},
				],
			},
		};
		const extensionTx = await tonWallet.signMultiTransaction(
			extensionParam
		);

		// Verify disable signature auth transaction structure
		expect(extensionTx).toBeDefined();
		expect(extensionTx.seqno).toBe(28);
		expect(extensionTx.transaction).toBeDefined();
		expect(extensionTx.externalMessage).toBeDefined();
		expect(extensionTx.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});
	test('ton sign enable signature auth v5', async () => {
		const param = {
			privateKey: '',
			data: {
				type: 'extension',
				walletVersion: 'v5r1',
				extensionAddress:
					'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
				decimal: 9,
				seqno: 12,
				toIsInit: false,
				isSignatureAuthEnabled: true,
				publicKey:
					'a140d29469e0bf07d353934653745b4f9ec550353f9394f802a7a5c52b9a92fd',
				authType: 'extension',
			},
		};
		const enableSignatureAuthInternalMsg = await tonWallet.setSignatureAuth(
			param.data
		);

		const extensionParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 30,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '10000000',
						isBase64Payload: true,
						payload: enableSignatureAuthInternalMsg.boc,
						stateInit: enableSignatureAuthInternalMsg.stateInit,
						address: enableSignatureAuthInternalMsg.address,
					},
				],
			},
		};
		const extensionTx = await tonWallet.signMultiTransaction(
			extensionParam
		);
		console.info(extensionTx);
	});

	test('ton sign signature auth transaction v5', async () => {
		const param = {
			privateKey:
				'cea5a0bedca38e9d76978b6d260fe0200f647e9f388e314eea7e67ea2b0997e8',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
				decimal: 9,
				amount: '100000000',
				seqno: 11,
				toIsInit: false,
				memo: 'single normal transfer with signature auth disabled',
				sendMode: 3,
			},
		};
		const tx = await tonWallet.signTransaction(param);
		console.info(tx);
	});

	// gasless example
	test('ton sign jetton multi-transfer', async () => {
		const param = {
			privateKey:
				'4eb6095b3f03c444fa915763306e6589d670675851ab9e71cf72ec6f30c9c96a',
			data: {
				type: 'jettonTransfer',
				walletVersion: 'v5r1',
				messages: [
					{
						to: 'UQDVaFnHgUqMdXNUV8Lkct6_1qvkKiT39THJ5XC8sZmKcLBo',
						fromJettonAccount:
							'kQD7o5kZoF8_CRvL9oCPvS-MmB3cUnESLGI71rtilEniufl8',
						messageAttachedTons: '50000000',
						invokeNotificationFee: '1',
						decimal: 9,
						amount: '100000000000',
						toIsInit: false,
						memo: 'gasless transfer',
						responseAddr:
							'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
					},
					{
						to: 'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
						fromJettonAccount:
							'kQD7o5kZoF8_CRvL9oCPvS-MmB3cUnESLGI71rtilEniufl8',
						messageAttachedTons: '50000000',
						invokeNotificationFee: '0',
						decimal: 9,
						amount: '5000000000',
						toIsInit: false,
						memo: 'jetton fee payment',
						responseAddr:
							'UQD0J5UnirvRs_vsCI154XmTDXY3NafF-5y5uwFzIwRFCYKq',
					},
				],
				authType: 'internal',
				seqno: 1,
				sendMode: 0,
			},
		};
		const internalTxMsg = await tonWallet.signJettonMultiTransaction(param);

		const relayParam = {
			privateKey:
				'75c5cabec5fcf916c294113c7acd1dc079e97ab20eed9c1a7bf8794e10212f3d',
			data: {
				type: 'transfer',
				walletVersion: 'v5r1',
				decimal: 9,
				seqno: 42,
				toIsInit: false,
				sendMode: 3,
				messages: [
					{
						amount: '50000000',
						isBase64Payload: true,
						payload: internalTxMsg.boc,
						stateInit: internalTxMsg.stateInit,
						address: internalTxMsg.address,
					},
				],
			},
		};
		const relayTx = await tonWallet.signMultiTransaction(relayParam);
		console.info(relayTx);
	});
});

describe('ton signing edge cases and valid scenarios', () => {
	const validPrivateKey =
		'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8';
	const timeoutAtSeconds = Math.floor(Date.now() / 1e3) + 600;

	test('signTransaction with zero amount', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '0',
				seqno: 1,
				toIsInit: true,
				memo: 'zero amount test',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signTransaction with very large amount', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '999999999999999999',
				seqno: 1,
				toIsInit: true,
				memo: 'large amount test',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signTransaction with different send modes', async () => {
		const sendModes = [0, 1, 2, 3, 32, 64, 128];

		for (const sendMode of sendModes) {
			const param = {
				privateKey: validPrivateKey,
				data: {
					type: 'transfer',
					to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
					decimal: 9,
					amount: '10000000',
					seqno: 1,
					toIsInit: true,
					memo: `send mode ${sendMode}`,
					expireAt: timeoutAtSeconds,
					sendMode: sendMode,
				},
			};
			const tx = await tonWallet.signTransaction(param);
			expect(tx.boc).toBeDefined();
		}
	});

	test('signTransaction with supported wallet versions', async () => {
		const walletVersions = ['v4r2', 'v5r1']; // Only test stable supported versions

		for (const walletVersion of walletVersions) {
			const param = {
				privateKey: validPrivateKey,
				data: {
					type: 'transfer',
					walletVersion: walletVersion,
					to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
					decimal: 9,
					amount: '10000000',
					seqno: 1,
					toIsInit: true,
					memo: `wallet ${walletVersion}`,
					expireAt: timeoutAtSeconds,
					sendMode: 1,
				},
			};
			const tx = await tonWallet.signTransaction(param);
			expect(tx.boc).toBeDefined();
		}
	});

	test('signTransaction with empty memo', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '10000000',
				seqno: 1,
				toIsInit: true,
				memo: '',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signTransaction with special characters in memo', async () => {
		const specialMemo =
			'🚀💎 Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>? 中文 русский';
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '10000000',
				seqno: 1,
				toIsInit: true,
				memo: specialMemo,
				expireAt: timeoutAtSeconds,
				sendMode: 1,
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signMultiTransaction with empty messages array should create valid transaction', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				messages: [],
				seqno: 1,
				valid_until: '1829924412000',
				network: 'mainnet',
			},
		};
		// Empty messages array is allowed and creates an empty transaction
		const { transaction } = await tonWallet.signMultiTransaction(param);
		expect(transaction).toBeDefined();
	});

	test('signMultiTransaction with maximum number of messages', async () => {
		const messages = [];
		for (let i = 0; i < 4; i++) {
			// TON supports up to 4 messages
			messages.push({
				address: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				amount: '10000000',
				payload: `message ${i}`,
				stateInit: '',
				isBase64Payload: false,
			});
		}

		const param = {
			privateKey: validPrivateKey,
			data: {
				messages: messages,
				seqno: 1,
				valid_until: '1829924412000',
				network: 'mainnet',
			},
		};
		const { transaction } = await tonWallet.signMultiTransaction(param);
		expect(transaction).toBeDefined();
	});

	test('signCommonMsg with different message types', async () => {
		const wallet = new TonWallet();

		// Test with walletId
		let sig = await wallet.signCommonMsg({
			privateKey: validPrivateKey,
			message: { walletId: '123456789' },
		});
		expect(sig).toBeDefined();
		expect(typeof sig).toBe('string');

		// Test with text
		sig = await wallet.signCommonMsg({
			privateKey: validPrivateKey,
			message: { text: 'Hello TON!' },
		});
		expect(sig).toBeDefined();
		expect(typeof sig).toBe('string');

		// Test with both walletId and text (should prioritize walletId)
		sig = await wallet.signCommonMsg({
			privateKey: validPrivateKey,
			message: { walletId: '123', text: 'test' },
		});
		expect(sig).toBeDefined();
		expect(typeof sig).toBe('string');
	});

	test('signTransaction with expired timeout', async () => {
		const expiredTime = Math.floor(Date.now() / 1e3) - 3600; // 1 hour ago
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '10000000',
				seqno: 1,
				toIsInit: true,
				memo: 'expired test',
				expireAt: expiredTime,
				sendMode: 1,
			},
		};
		// Should still create transaction even with expired time (validation happens on blockchain)
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signTransaction with missing expireAt (should use default)', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '10000000',
				seqno: 1,
				toIsInit: true,
				memo: 'default timeout test',
				sendMode: 1,
				// expireAt is omitted, should use default
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('jettonTransfer with zero queryId', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'jettonTransfer',
				fromJettonAccount:
					'kQDL9sseMzrh4vewfQgZKJzVwDFbDTpbs2f8BY6iCMgRTyOG',
				to: 'UQDXgyxgYKNSdTiJBqmNNfbD7xuRMl6skrBmsEtyXslFm5an',
				seqno: 1,
				toIsInit: false,
				memo: 'zero queryId test',
				decimal: 2,
				amount: '100',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '1',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
				queryId: '0',
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('jettonTransfer with missing queryId (should use default)', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'jettonTransfer',
				fromJettonAccount:
					'kQDL9sseMzrh4vewfQgZKJzVwDFbDTpbs2f8BY6iCMgRTyOG',
				to: 'UQDXgyxgYKNSdTiJBqmNNfbD7xuRMl6skrBmsEtyXslFm5an',
				seqno: 1,
				toIsInit: false,
				memo: 'default queryId test',
				decimal: 2,
				amount: '100',
				messageAttachedTons: '50000000',
				invokeNotificationFee: '1',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
				// queryId is omitted, should use default
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signTonProof with complete fields should work', async () => {
		const param = {
			privateKey: validPrivateKey,
			walletAddress: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
			tonProofItem: 'ton-proof-item-v2/',
			messageAction: 'ton-connect',
			messageSalt: 'ffff',
			proof: {
				timestamp: 1719309177,
				domain: 'ton.org.com',
				payload: '123',
			},
		};
		const result = await tonWallet.signTonProof(param);
		expect(result).toBeDefined();
		expect(typeof result).toBe('string');
	});

	test('getTransactionBodyForSimulate with supported wallet versions', async () => {
		const walletVersions = ['v4r2', 'v5r1']; // Only test stable supported versions

		for (const walletVersion of walletVersions) {
			const param = {
				privateKey: validPrivateKey,
				data: {
					type: 'transfer',
					walletVersion: walletVersion,
					to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
					decimal: 9,
					amount: '10000000',
					seqno: 1,
					toIsInit: true,
					memo: `simulate ${walletVersion}`,
					expireAt: timeoutAtSeconds,
					sendMode: 1,
					publicKey:
						'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f',
				},
			};
			const body = await tonWallet.getTransactionBodyForSimulate(param);
			expect(body).toBeDefined();
			expect(typeof body).toBe('string');
		}
	});

	test('signTransaction with testnet network', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				type: 'transfer',
				to: 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
				decimal: 9,
				amount: '10000000',
				seqno: 1,
				toIsInit: true,
				memo: 'testnet test',
				expireAt: timeoutAtSeconds,
				sendMode: 1,
				network: 'testnet',
			},
		};
		const tx = await tonWallet.signTransaction(param);
		expect(tx.boc).toBeDefined();
	});

	test('signMultiTransaction with testnet network', async () => {
		const param = {
			privateKey: validPrivateKey,
			data: {
				messages: [
					{
						address:
							'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr',
						amount: '10000000',
						payload: 'testnet multi tx',
						stateInit: '',
						isBase64Payload: false,
					},
				],
				seqno: 1,
				valid_until: '1829924412000',
				network: 'testnet',
			},
		};
		const { transaction } = await tonWallet.signMultiTransaction(param);
		expect(transaction).toBeDefined();
	});
});

describe('ton wallet information edge cases', () => {
	const validPrivateKey =
		'fc81e6f42150458f53d8c42551a8ab91978a55d0e22b1fd890b85139086b93f8';

	test('getWalletInformation with supported wallet versions', async () => {
		const walletVersions = ['v4r2', 'v5r1']; // Only test stable supported versions

		for (const walletVersion of walletVersions) {
			const param = {
				workChain: 0,
				privateKey: validPrivateKey,
				publicKey: '',
				walletVersion: walletVersion,
			};
			const walletInfo = await tonWallet.getWalletInformation(param);
			expect(walletInfo.initCode).toBeDefined();
			expect(walletInfo.initData).toBeDefined();
			expect(walletInfo.publicKey).toBeDefined();
			expect(walletInfo.walletStateInit).toBeDefined();
			expect(walletInfo.walletAddress).toBeDefined();
		}
	});

	test('getWalletInformation with different workchain', async () => {
		const param = {
			workChain: -1, // different workchain
			privateKey: validPrivateKey,
			publicKey: '',
			walletVersion: 'v4r2',
		};
		const walletInfo = await tonWallet.getWalletInformation(param);
		expect(walletInfo).toBeDefined();
		expect(walletInfo.walletAddress).toBeDefined();
		expect(walletInfo.initCode).toBeDefined();
	});

	test('getWalletInformation with provided public key only', async () => {
		const param = {
			workChain: 0,
			privateKey: '',
			publicKey:
				'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f',
			walletVersion: 'v4r2',
		};
		const walletInfo = await tonWallet.getWalletInformation(param);
		expect(walletInfo.publicKey).toBe(
			'484bbda1d1ab3e89b83b423685a9d4cbe7a28b8b96bbbee51d0553b47e4db42f'
		);
		expect(walletInfo.walletAddress).toBeDefined();
	});
});

describe('NFT API functions', () => {
	describe('commentToBytes', () => {
		test('should convert simple comment to bytes with OpCode.Comment prefix', () => {
			const comment = 'Hello World';
			const result = commentToBytes(comment);

			// Should have 4 bytes for OpCode.Comment + comment length
			expect(result.length).toBe(4 + comment.length);

			// First 4 bytes should be OpCode.Comment (0)
			const opCode =
				(result[0] << 24) |
				(result[1] << 16) |
				(result[2] << 8) |
				result[3];
			expect(opCode).toBe(OpCode.Comment);

			// Rest should be the comment bytes
			const commentBytes = result.slice(4);
			expect(Buffer.from(commentBytes).toString()).toBe(comment);
		});

		test('should handle empty comment', () => {
			const comment = '';
			const result = commentToBytes(comment);

			expect(result.length).toBe(4); // Only OpCode prefix
			const opCode =
				(result[0] << 24) |
				(result[1] << 16) |
				(result[2] << 8) |
				result[3];
			expect(opCode).toBe(OpCode.Comment);
		});

		test('should handle Unicode characters', () => {
			const comment = '🚀💎 测试 русский';
			const result = commentToBytes(comment);

			const expectedLength = Buffer.from(comment).length;
			expect(result.length).toBe(4 + expectedLength);

			const commentBytes = result.slice(4);
			expect(Buffer.from(commentBytes).toString()).toBe(comment);
		});

		test('should handle long comments', () => {
			const comment = 'a'.repeat(200);
			const result = commentToBytes(comment);

			expect(result.length).toBe(4 + 200);
			const commentBytes = result.slice(4);
			expect(Buffer.from(commentBytes).toString()).toBe(comment);
		});
	});

	describe('packBytesAsSnake', () => {
		test('should return bytes directly if length <= maxBytes', () => {
			const bytes = new Uint8Array([1, 2, 3, 4, 5]);
			const result = packBytesAsSnake(bytes, 127);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(bytes);
		});

		test('should return bytes directly with default maxBytes (127)', () => {
			const bytes = new Uint8Array(100);
			bytes.fill(42);
			const result = packBytesAsSnake(bytes);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(bytes);
		});

		test('should create Cell for bytes longer than maxBytes', () => {
			const bytes = new Uint8Array(150);
			bytes.fill(123);
			const result = packBytesAsSnake(bytes, 127);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should create Cell with custom small maxBytes', () => {
			const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			const result = packBytesAsSnake(bytes, 5);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle empty bytes array', () => {
			const bytes = new Uint8Array(0);
			const result = packBytesAsSnake(bytes);

			expect(result).toBeInstanceOf(Uint8Array);
			if (result instanceof Uint8Array) {
				expect(result.length).toBe(0);
			}
		});

		test('should handle single byte', () => {
			const bytes = new Uint8Array([255]);
			const result = packBytesAsSnake(bytes);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(bytes);
		});
	});

	describe('buildNotcoinVoucherExchange', () => {
		test('should build valid Notcoin voucher exchange payload', () => {
			const fromAddress =
				'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr';
			const nftAddress =
				'EQDmkj65Ab_m0aZaW8IpKw4kYqIgITw_HRstYEkVQ6NIYCyW';
			const nftIndex = 12345;

			const result = buildNotcoinVoucherExchange(
				fromAddress,
				nftAddress,
				nftIndex
			);

			expect(result).toBeInstanceOf(Cell);

			// The result should be a valid cell - we can't easily inspect the internal structure
			// but we can verify it was created without errors
			const boc = result.toBoc();
			expect(boc).toBeInstanceOf(Buffer);
			expect(boc.length).toBeGreaterThan(0);
		});

		test('should handle different NFT addresses and indices', () => {
			const fromAddress =
				'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR';
			const nftAddress =
				'EQBkiqncd7AFT5_23H-RoA2Vynk-Nzq_dLoeMVRthAU9RF0p';
			const nftIndex = 999999;

			const result = buildNotcoinVoucherExchange(
				fromAddress,
				nftAddress,
				nftIndex
			);

			expect(result).toBeInstanceOf(Cell);
			const boc = result.toBoc();
			expect(boc.length).toBeGreaterThan(0);
		});

		test('should handle zero NFT index', () => {
			const fromAddress =
				'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr';
			const nftAddress =
				'EQDmkj65Ab_m0aZaW8IpKw4kYqIgITw_HRstYEkVQ6NIYCyW';
			const nftIndex = 0;

			const result = buildNotcoinVoucherExchange(
				fromAddress,
				nftAddress,
				nftIndex
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle large NFT index', () => {
			const fromAddress =
				'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr';
			const nftAddress =
				'EQDmkj65Ab_m0aZaW8IpKw4kYqIgITw_HRstYEkVQ6NIYCyW';
			const nftIndex = 9007199254740991; // Maximum safe integer in JavaScript

			const result = buildNotcoinVoucherExchange(
				fromAddress,
				nftAddress,
				nftIndex
			);

			expect(result).toBeInstanceOf(Cell);
		});
	});

	describe('buildNftTransferPayload', () => {
		const fromAddress = 'EQA3_JIJKDC0qauDUEQe2KjQj1iLwQRtrEREzmfDxbCKw9Kr';
		const toAddress = 'UQC6QJ31Bv_hjmsoaUjRmpZYqj9NXbBbvufCNycnc0gjReqR';

		test('should build NFT transfer payload without forward payload', () => {
			const result = buildNftTransferPayload(fromAddress, toAddress);

			expect(result).toBeInstanceOf(Cell);
			const boc = result.toBoc();
			expect(boc.length).toBeGreaterThan(0);
		});

		test('should build NFT transfer payload with string comment', () => {
			const comment = 'Test NFT transfer';
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				comment
			);

			expect(result).toBeInstanceOf(Cell);
			const boc = result.toBoc();
			expect(boc.length).toBeGreaterThan(0);
		});

		test('should build NFT transfer payload with long string comment', () => {
			const comment =
				'This is a very long comment for NFT transfer that should be packed as snake cell because it exceeds the available space in the builder';
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				comment
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should build NFT transfer payload with Cell payload', () => {
			const payload = new Builder()
				.storeUint(0x12345678, 32)
				.storeUint(9999, 64)
				.endCell();

			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				payload
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should build NFT transfer payload with custom forward amount', () => {
			const customForwardAmount = 50000000n; // 0.05 TON
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				undefined,
				customForwardAmount
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle empty string payload', () => {
			const result = buildNftTransferPayload(fromAddress, toAddress, '');

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle Unicode comment payload', () => {
			const comment = '🎨 NFT 转移 передача';
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				comment
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle zero forward amount', () => {
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				'test',
				0n
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should handle very large forward amount', () => {
			const largeAmount = BigInt('1000000000000000000'); // 1 billion TON
			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				'test',
				largeAmount
			);

			expect(result).toBeInstanceOf(Cell);
		});

		test('should build payload with all parameters', () => {
			const comment = 'Complete NFT transfer test';
			const customForwardAmount = 25000000n; // 0.025 TON

			const result = buildNftTransferPayload(
				fromAddress,
				toAddress,
				comment,
				customForwardAmount
			);

			expect(result).toBeInstanceOf(Cell);
			const boc = result.toBoc();
			expect(boc.length).toBeGreaterThan(0);
		});
	});

	describe('NFT enums', () => {
		test('should have correct NftOpCode values', () => {
			expect(NftOpCode.TransferOwnership).toBe(0x5fcc3d14);
			expect(NftOpCode.OwnershipAssigned).toBe(0x05138d91);
		});

		test('should have correct OpCode values', () => {
			expect(OpCode.Comment).toBe(0);
			expect(OpCode.Encrypted).toBe(0x2167da4b);
		});
	});
});
