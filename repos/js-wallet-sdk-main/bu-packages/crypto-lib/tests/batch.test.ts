import { bip39, bip32, signUtil} from "../src"
import * as base from "../src/lib/base";

describe("crypto", () => {
  // mnemonic root  child  secp256k1-public ed25519-public msg  secp256k1-signature ed25519-signature
  test("bip32", async () => {
    for(let i = 0; i < 100; i++) {
      const mnemonic = bip39.generateMnemonic()
      const masterSeed = await bip39.mnemonicToSeed(mnemonic)
      const rootKey = bip32.fromSeed(masterSeed)
      const childKey =  rootKey.derivePath("m/44'/0'/0'/0/0")
      const items = []
      items.push(mnemonic)
      items.push(base.toHex(rootKey.privateKey!))
      items.push(base.toHex(childKey.privateKey!) )

      const pk = childKey.privateKey!
      const pb1 =  signUtil.secp256k1.publicKeyCreate(pk, true)
      items.push(base.toHex(pb1))

      const pb2 = signUtil.ed25519.publicKeyCreate(pk)
      items.push(base.toHex(pb2))

      const msg = base.randomBytes(32)
      items.push(base.toHex(msg))

     // recovery + r + s
      const s1 = signUtil.secp256k1.sign(msg, pk, true)
      items.push(base.toHex(base.concatBytes(Uint8Array.of(s1.recovery + 27), s1.signature)))

      const s2 = signUtil.ed25519.sign(msg, pk)
      items.push(base.toHex(s2))

     const line = items.join(",") + "\r\n"
     const info = `${i}  ${line}`
     console.info(info)
    }
  })

  test("bip32_V2", async () => {
    for(let i = 0; i < 100; i++) {
      const mnemonic = bip39.generateMnemonic()
      const masterSeed = await bip39.mnemonicToSeedV2(mnemonic)
      const rootKey = bip32.fromSeed(masterSeed)
      const childKey =  rootKey.derivePath("m/44'/0'/0'/0/0")
      const items = []
      items.push(mnemonic)
      items.push(base.toHex(rootKey.privateKey!))
      items.push(base.toHex(childKey.privateKey!) )

      const pk = childKey.privateKey!
      const pb1 =  signUtil.secp256k1.publicKeyCreate(pk, true)
      items.push(base.toHex(pb1))

      const pb2 = signUtil.ed25519.publicKeyCreate(pk)
      items.push(base.toHex(pb2))

      const msg = base.randomBytes(32)
      items.push(base.toHex(msg))

      // recovery + r + s
      const s1 = signUtil.secp256k1.sign(msg, pk, true)
      items.push(base.toHex(base.concatBytes(Uint8Array.of(s1.recovery + 27), s1.signature)))

      const s2 = signUtil.ed25519.sign(msg, pk)
      items.push(base.toHex(s2))

      const line = items.join(",") + "\r\n"
      const info = `${i}  ${line}`
      console.info(info)
    }
  }, 120000)
})
