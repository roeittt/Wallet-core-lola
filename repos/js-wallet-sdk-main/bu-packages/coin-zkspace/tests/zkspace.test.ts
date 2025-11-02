import { BigNumber } from "@ethersproject/bignumber";
import { SignTxError, SignTxParams } from "@okxweb3/coin-base";
import {
  changePubkey,
  closestPackableTransactionAmount,
  closestPackableTransactionFee,
  transfer,
  ZkspaceWallet,
} from "../src";

describe("zkspace", () => {
  // Consolidated test data
  const TEST_DATA = {
    privateKey:
      "0xbdd80f4421968142b3a4a6c27a1d84a3623384d085a04a895f109fd8d49cef0a",
    from: "0xad06a98cAC85448Cb33495ca68b0837e3b65ABe6",
    to: "0x21dceed765c30b2abea933a161479aea4702e433",
    accountId: 11573,
    chainId: 13,
    tokenId: 2,
    tokenSymbol: "USDT",
    decimals: 6,
    feeTokenId: 1,
    feeTokenSymbol: "ZKS",
    feeDecimals: 18,
    nonce: {
      transfer: 11,
      changePubkey: 2,
    },
    amounts: {
      standard: "100",
      large: "999999999999999999999",
      zero: "0",
    },
    fees: {
      standard: "8410000000000000000",
      minimal: "1",
    },
    test: {
      large: "123456789123456789",
      veryLarge: "999999999999999999999999999999999999",
    },
  };

  test("changepubkey", async () => {
    let wallet = new ZkspaceWallet();
    const { address } = await wallet.getNewAddress({
      privateKey:
        "bdd80f4421968142b3a4a6c27a1d84a3623384d085a04a895f109fd8d49cef0a",
    });
    expect(address).toBe("0x5d4d48eb6e9677b0d91f8fb77b419591e5c625ee");

    const data = await changePubkey(
      TEST_DATA.privateKey,
      TEST_DATA.from,
      TEST_DATA.nonce.changePubkey,
      TEST_DATA.accountId
    );
    const expected =
      '{"type":"ChangePubKey","accountId":11573,"account":"0x5d4d48eb6e9677b0d91f8fb77b419591e5c625ee","newPkHash":"sync:1a15456df95b1af2cdc390b7c303dd389bdabf0b","nonce":2,"ethSignature":"0xa0cd2dbed420d529d23dab710877eab3ea06deb4240e789ec0dd4792bee46bb862b8938944ea4657100b33c7da88e9cbe76ba6dada3726720d741bed06347aac1c","txHash":"0x9413872b6a87bc622f26da6083a40dd5878a0cd4f45f7601c6ca3a4c5a98cafd"}';
    expect(data).toEqual(JSON.parse(expected));
  });

  test("transfer", async () => {
    const data = await transfer(
      TEST_DATA.privateKey,
      TEST_DATA.from,
      TEST_DATA.nonce.transfer,
      TEST_DATA.accountId,
      TEST_DATA.chainId,
      TEST_DATA.to,
      TEST_DATA.tokenId,
      TEST_DATA.tokenSymbol,
      TEST_DATA.decimals,
      TEST_DATA.feeTokenId,
      TEST_DATA.feeTokenSymbol,
      TEST_DATA.feeDecimals,
      TEST_DATA.amounts.standard,
      TEST_DATA.fees.standard
    );
    const expected =
      '{"tx":{"type":"Transfer","accountId":11573,"from":"0x5d4d48eb6e9677b0d91f8fb77b419591e5c625ee","to":"0x21dceed765c30b2abea933a161479aea4702e433","token":2,"amount":"100","feeToken":1,"fee":"8410000000000000000","chainId":13,"nonce":11,"signature":{"pubKey":"fc4711342be219074595bbe005db42b56259e41135d57eaa88a3397dfd9c2628","signature":"164dcda5ac6903616251d84b9882d5cf6b57eb781daf7cefd4ec9d45af40f5afb80239db24a73966dcd9f440db1a9cc6c662cc70799ff8c0f6ee67d3c91f3003"},"txHash":"0x4f60fca7dd47d78154f1aadf276d75817471b1529c765ee7cbac035d1f93b291"},"signature":{"type":"EthereumSignature","signature":"0x5f490d8c290c0b5d92169735d76a8749feee5a5904bf29c73e2cfb0a7b35fead7d2811fa7814f96fd470041a0c8b83e15258bfce185a99f978cdc597b9d87d6e1c"}}';
    expect(data).toEqual(JSON.parse(expected));
  });

  // Test ZkspaceWallet.signTransaction method
  describe("ZkspaceWallet.signTransaction", () => {
    let wallet: ZkspaceWallet;

    beforeEach(() => {
      wallet = new ZkspaceWallet();
    });

    test("should sign transfer transaction successfully", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "transfer",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.transfer,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.tx.type).toBe("Transfer");
      expect(result.tx.accountId).toBe(TEST_DATA.accountId);
    });

    test("should sign changePubkey transaction successfully", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "changePubkey",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.changePubkey,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      const result = await wallet.signTransaction(param);
      expect(result.type).toBe("ChangePubKey");
      expect(result.accountId).toBe(TEST_DATA.accountId);
    });

    test("should reject when transfer has null from", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "transfer",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.transfer,
          from: null,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });

    test("should reject when transfer has null to", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "transfer",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.transfer,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: null,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });

    test("should reject when changePubkey has null from", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "changePubkey",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.changePubkey,
          from: null,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });

    test("should reject when changePubkey has null nonce", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "changePubkey",
          accountId: TEST_DATA.accountId,
          nonce: null,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });

    test("should reject when changePubkey has null accountId", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "changePubkey",
          accountId: null,
          nonce: TEST_DATA.nonce.changePubkey,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });

    test("should reject invalid transaction type", async () => {
      const param: SignTxParams = {
        privateKey: TEST_DATA.privateKey,
        data: {
          type: "invalidType",
          accountId: TEST_DATA.accountId,
          nonce: TEST_DATA.nonce.changePubkey,
          from: TEST_DATA.from,
          chainId: TEST_DATA.chainId,
          to: TEST_DATA.to,
          tokenId: TEST_DATA.tokenId,
          tokenSymbol: TEST_DATA.tokenSymbol,
          decimals: TEST_DATA.decimals,
          feeTokenId: TEST_DATA.feeTokenId,
          feeTokenSymbol: TEST_DATA.feeTokenSymbol,
          feeDecimals: TEST_DATA.feeDecimals,
          amounts: TEST_DATA.amounts.standard,
          fee: TEST_DATA.fees.standard,
        },
      };

      await expect(wallet.signTransaction(param)).rejects.toBe(SignTxError);
    });
  });

  // Test utility functions
  describe("Utility functions", () => {
    test("closestPackableTransactionAmount", () => {
      const result = closestPackableTransactionAmount("100000000");
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe("100000000");
    });

    test("closestPackableTransactionAmount with large amount", () => {
      const result = closestPackableTransactionAmount(TEST_DATA.test.large);
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.lte(BigNumber.from(TEST_DATA.test.large))).toBe(true);
    });

    test("closestPackableTransactionFee", () => {
      const result = closestPackableTransactionFee(TEST_DATA.fees.standard);
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe(TEST_DATA.fees.standard);
    });

    test("closestPackableTransactionFee with large fee", () => {
      const result = closestPackableTransactionFee("999999999999999999");
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.lte(BigNumber.from("999999999999999999"))).toBe(true);
    });

    test("closestPackableTransactionAmount with zero", () => {
      const result = closestPackableTransactionAmount(TEST_DATA.amounts.zero);
      expect(result.toString()).toBe("0");
    });

    test("closestPackableTransactionFee with zero", () => {
      const result = closestPackableTransactionFee(TEST_DATA.amounts.zero);
      expect(result.toString()).toBe("0");
    });

    test("closestPackableTransactionAmount with string input", () => {
      const result = closestPackableTransactionAmount("1000000000000000000");
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe("1000000000000000000");
    });

    test("closestPackableTransactionFee with string input", () => {
      const result = closestPackableTransactionFee("1000000000000000");
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe("1000000000000000");
    });

    test("closestPackableTransactionAmount with very large value", () => {
      const result = closestPackableTransactionAmount(TEST_DATA.test.veryLarge);
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.lte(BigNumber.from(TEST_DATA.test.veryLarge))).toBe(true);
    });

    test("closestPackableTransactionFee with very large value", () => {
      const result = closestPackableTransactionFee("99999999999999999999999");
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.lte(BigNumber.from("99999999999999999999999"))).toBe(true);
    });
  });

  // Additional edge case tests
  describe("Edge cases and error scenarios", () => {
    test("transfer with very large amounts", async () => {
      const result = await transfer(
        TEST_DATA.privateKey,
        TEST_DATA.from,
        TEST_DATA.nonce.transfer,
        TEST_DATA.accountId,
        TEST_DATA.chainId,
        TEST_DATA.to,
        TEST_DATA.tokenId,
        TEST_DATA.tokenSymbol,
        TEST_DATA.decimals,
        TEST_DATA.feeTokenId,
        TEST_DATA.feeTokenSymbol,
        TEST_DATA.feeDecimals,
        TEST_DATA.amounts.large,
        TEST_DATA.fees.standard
      );
      expect(result).toHaveProperty("tx");
      expect(result).toHaveProperty("signature");
    });

    test("changePubkey with edge case values", async () => {
      const result = await changePubkey(
        TEST_DATA.privateKey,
        TEST_DATA.from,
        0,
        0
      );
      expect(result).toHaveProperty("type", "ChangePubKey");
      expect(result).toHaveProperty("accountId", 0);
      expect(result).toHaveProperty("nonce", 0);
    });

    test("transfer with zero amounts", async () => {
      const result = await transfer(
        TEST_DATA.privateKey,
        TEST_DATA.from,
        TEST_DATA.nonce.transfer,
        TEST_DATA.accountId,
        TEST_DATA.chainId,
        TEST_DATA.to,
        TEST_DATA.tokenId,
        TEST_DATA.tokenSymbol,
        TEST_DATA.decimals,
        TEST_DATA.feeTokenId,
        TEST_DATA.feeTokenSymbol,
        TEST_DATA.feeDecimals,
        TEST_DATA.amounts.zero,
        TEST_DATA.fees.standard
      );
      expect(result).toHaveProperty("tx");
      expect(result.tx.amount).toBe("0");
    });

    test("transfer with minimal fee", async () => {
      const result = await transfer(
        TEST_DATA.privateKey,
        TEST_DATA.from,
        TEST_DATA.nonce.transfer,
        TEST_DATA.accountId,
        TEST_DATA.chainId,
        TEST_DATA.to,
        TEST_DATA.tokenId,
        TEST_DATA.tokenSymbol,
        TEST_DATA.decimals,
        TEST_DATA.feeTokenId,
        TEST_DATA.feeTokenSymbol,
        TEST_DATA.feeDecimals,
        TEST_DATA.amounts.standard,
        TEST_DATA.fees.minimal
      );
      expect(result).toHaveProperty("tx");
      expect(result).toHaveProperty("signature");
    });
  });
});
