import { BigNumber } from "@ethersproject/bignumber";
import { SignTxParams } from "@okxweb3/coin-base";
import {
  closestPackableTransactionAmount,
  closestPackableTransactionFee,
  zksyncChangePubkey,
  zksyncTransfer,
  ZksyncWallet,
} from "../src";

describe("zksync", () => {
  // Consolidated test data
  const TEST_DATA = {
    privateKeys: {
      main: "0xbdd80f4421968142b3a4a6c27a1d84a3623384d085a04a895f109fd8d49cef0a",
      alt: "0xad1de25be0cdb519400b578a87d16322e59e243fff53f58995dd7cef0a4e6ec4",
    },
    addresses: {
      from: "0xad06a98cac85448cb33495ca68b0837e3b65abe6",
      to: "0x21dceed765c30b2abea933a161479aea4702e433",
      altTo: "0x2ce910fbba65b454bbaf6a18c952a70f3bcd8299",
      upperTo: "0XD2C072664D3B0F12066C002494330B5CB4350CDE",
    },
    accounts: {
      main: 987028,
      alt: 11573,
    },
    tokens: {
      eth: { id: 0, symbol: "ETH", decimals: 18 },
      usdt: { id: 2, symbol: "USDT", decimals: 6 },
    },
    amounts: {
      small: "100000",
      medium: "19000000000000000",
      large: "100000000",
      test: {
        packable: "5410801312626000000",
        veryLarge: "541080131200000000000000000",
        nonPackable: "123456789123456789",
      },
    },
    fees: {
      small: "50500000000000",
      medium: "900000000000000",
      large: "840000000000000000",
      test: "54900000000000",
    },
    nonces: {
      standard: [10, 11, 12],
      alt: 2,
    },
  };

  test("changepubkey", async () => {
    const data = await zksyncChangePubkey(
      TEST_DATA.privateKeys.main,
      TEST_DATA.addresses.from,
      TEST_DATA.nonces.standard[1],
      TEST_DATA.accounts.main,
      TEST_DATA.fees.medium,
      TEST_DATA.tokens.eth.id
    );

    const expected =
      '{"tx":{"type":"ChangePubKey","accountId":987028,"account":"0x5d4d48eb6e9677b0d91f8fb77b419591e5c625ee","newPkHash":"sync:305270c40d9fd2a18e6974f3b7fba95e56ad7b37","nonce":11,"validFrom":0,"validUntil":4294967295,"fee":"900000000000000","feeToken":0,"signature":{"pubKey":"40fc352d3f24a590cc4fc8ca2cc414d71cd35e92b602b74e82fd696af86bfa8e","signature":"8064118d87de8b404849859bc9429d5ea54454dafeb3af50c8a431c048d69faafcceb505bc0070852bea134cb9e9f3666535733235869d9745be7c9cd648a603"},"ethAuthData":{"type":"ECDSA","batchHash":"0x0000000000000000000000000000000000000000000000000000000000000000","ethSignature":"0x32cd2f756c3e3c0ebc27dcbfa7787a12b025b777c4069788d385126c36ccada4285974d166a3ea3bf2a8291d94769d68e15a80b60120a0d94f2481621f8196631c"},"txHash":"0x272b7c15e5a1bb7ab649cde5fd6bce8dbe209aba7296bbfc85aa3f2dba6ef46b"}}';
    expect(data).toEqual(JSON.parse(expected));
  });

  test("transferToken", async () => {
    const data = await zksyncTransfer(
      TEST_DATA.privateKeys.alt,
      TEST_DATA.addresses.from,
      TEST_DATA.addresses.altTo,
      TEST_DATA.accounts.main,
      TEST_DATA.tokens.eth.id,
      TEST_DATA.tokens.eth.symbol,
      TEST_DATA.amounts.small,
      TEST_DATA.fees.small,
      TEST_DATA.tokens.eth.decimals,
      TEST_DATA.nonces.standard[2]
    );
    const expected =
      '{"tx":{"accountId":987028,"amount":"100000","fee":"50500000000000","from":"0xad06a98cac85448cb33495ca68b0837e3b65abe6","nonce":12,"signature":{"pubKey":"481bc2122e7156f834fcbdc1bf44e75cb37ac72d71db0d65a496b9f07cc93010","signature":"bb20c405411c164751fc92267c2fec0d82151005df0bc837e3f72e023b5fca92d66b47fedb14ebc5ad1c8ed21bf460eb5e6159b419e34396fd361db7b0330f01"},"to":"0x2ce910fbba65b454bbaf6a18c952a70f3bcd8299","token":0,"type":"Transfer","validFrom":0,"validUntil":4294967295,"txHash":"0x195cea014e72831c6ce60b0bd063444fc9fa0239c389e9ef94bc0269310859f8"},"signature":{"signature":"0x5bbcdb47862416573b75f8ca73ecc5bc23ab629016375a1ee2be8c6be1ad92d90dff000b6780308aed168f32681dc4c6315fa9fab94964002132538fb2a94fbd1c","type":"EthereumSignature"}}';
    expect(data).toEqual(JSON.parse(expected));
  });

  test("transfer", async () => {
    const data = await zksyncTransfer(
      TEST_DATA.privateKeys.main,
      TEST_DATA.addresses.from,
      TEST_DATA.addresses.upperTo,
      TEST_DATA.accounts.main,
      TEST_DATA.tokens.eth.id,
      TEST_DATA.tokens.eth.symbol,
      TEST_DATA.amounts.medium,
      TEST_DATA.fees.medium,
      TEST_DATA.tokens.eth.decimals,
      TEST_DATA.nonces.standard[0]
    );
    const expected =
      '{"tx":{"accountId":987028,"amount":"19000000000000000","fee":"900000000000000","from":"0xad06a98cac85448cb33495ca68b0837e3b65abe6","nonce":10,"signature":{"pubKey":"40fc352d3f24a590cc4fc8ca2cc414d71cd35e92b602b74e82fd696af86bfa8e","signature":"5846d537df9f30c02d0e6a84f4f25b0a302752ca508b25e47fe328848cc2e7089c209ed5f6bb135b486c8ebb6ae06b759a6d2e29b70d7b1c32ae3e1decbb7803"},"to":"0xd2c072664d3b0f12066c002494330b5cb4350cde","token":0,"type":"Transfer","validFrom":0,"validUntil":4294967295,"txHash":"0x4ee59a29667c2a95f939aec6804d4680e1c992c58a2f55350ba7d06c21dd2513"},"signature":{"signature":"0x1a5149cef6a07e975d03da6e999528659173eac152c64b39ed7726e9e08eeca2594ff1d124cc022d8964fa0f381bba161ac32cc8b0442bde596e55cb6c058e1c1c","type":"EthereumSignature"}}';
    expect(data).toEqual(JSON.parse(expected));
  });

  test("closestPackableTransactionAmount", async () => {
    const number = closestPackableTransactionAmount(
      TEST_DATA.amounts.test.packable
    );
    const amounts_number = BigNumber.from("5410801312000000000");
    expect(number).toEqual(amounts_number);
  });

  test("closestPackableTransactionFee", async () => {
    const number = closestPackableTransactionFee(TEST_DATA.fees.test);
    const amounts_number = BigNumber.from(TEST_DATA.fees.test);
    expect(number).toEqual(amounts_number);
  });

  test("testAmount", async () => {
    const number = closestPackableTransactionAmount(
      TEST_DATA.amounts.test.veryLarge
    );
    const amounts_number = BigNumber.from(TEST_DATA.amounts.test.veryLarge);
    expect(number).toEqual(amounts_number);
  });

  // Test ZksyncWallet
  describe("ZksyncWallet", () => {
    let wallet: ZksyncWallet;

    beforeEach(() => {
      wallet = new ZksyncWallet();
    });

    test("should sign transfer transaction successfully", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKeys.main,
        data: {
          type: "transfer",
          from: TEST_DATA.addresses.from,
          to: TEST_DATA.addresses.to,
          accountId: TEST_DATA.accounts.alt,
          tokenId: TEST_DATA.tokens.usdt.id,
          tokenSymbol: TEST_DATA.tokens.usdt.symbol,
          amounts: TEST_DATA.amounts.large,
          fees: TEST_DATA.fees.large,
          decimals: TEST_DATA.tokens.usdt.decimals,
          nonce: TEST_DATA.nonces.standard[1],
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.tx.type).toBe("Transfer");
      expect(result.tx.accountId).toBe(TEST_DATA.accounts.alt);
    });

    test("should sign changePubkey transaction successfully", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKeys.main,
        data: {
          type: "changePubkey",
          from: TEST_DATA.addresses.from,
          to: TEST_DATA.addresses.to,
          accountId: TEST_DATA.accounts.alt,
          tokenId: TEST_DATA.tokens.usdt.id,
          tokenSymbol: TEST_DATA.tokens.usdt.symbol,
          amounts: TEST_DATA.amounts.large,
          fees: TEST_DATA.fees.large,
          decimals: TEST_DATA.tokens.usdt.decimals,
          nonce: TEST_DATA.nonces.alt,
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.tx.type).toBe("ChangePubKey");
      expect(result.tx.accountId).toBe(TEST_DATA.accounts.alt);
    });

    test("should reject non-packable fee", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKeys.main,
        data: {
          type: "transfer",
          from: TEST_DATA.addresses.from,
          to: TEST_DATA.addresses.to,
          accountId: TEST_DATA.accounts.alt,
          tokenId: TEST_DATA.tokens.usdt.id,
          tokenSymbol: TEST_DATA.tokens.usdt.symbol,
          amounts: TEST_DATA.amounts.large,
          fees: TEST_DATA.amounts.test.nonPackable,
          decimals: TEST_DATA.tokens.usdt.decimals,
          nonce: TEST_DATA.nonces.standard[1],
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.code).toBe("402");
      expect(result.reason).toBe("Fee is not packable");
    });

    test("should reject non-packable amount", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKeys.main,
        data: {
          type: "transfer",
          from: TEST_DATA.addresses.from,
          to: TEST_DATA.addresses.to,
          accountId: TEST_DATA.accounts.alt,
          tokenId: TEST_DATA.tokens.usdt.id,
          tokenSymbol: TEST_DATA.tokens.usdt.symbol,
          amounts: TEST_DATA.amounts.test.nonPackable,
          fees: TEST_DATA.fees.large,
          decimals: TEST_DATA.tokens.usdt.decimals,
          nonce: TEST_DATA.nonces.standard[1],
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.code).toBe("401");
      expect(result.reason).toBe("Amount is not packable");
    });

    test("getCloseAmounts static method", async () => {
      const result = await ZksyncWallet.getCloseAmounts(
        TEST_DATA.amounts.large
      );
      expect(result).toBe(TEST_DATA.amounts.large);
    });

    test("getCloseFee static method", async () => {
      const result = await ZksyncWallet.getCloseFee(TEST_DATA.fees.large);
      expect(result).toBe(TEST_DATA.fees.large);
    });
  });
});
