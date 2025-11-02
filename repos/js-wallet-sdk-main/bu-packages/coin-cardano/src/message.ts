import {base} from "@okxweb3/coin-base"
import {Cardano, Serialization} from "@cardano-sdk/core";
import * as Crypto from "@cardano-sdk/crypto";
import {HexBlob} from "@cardano-sdk/util";


export const hex2Uint8Array = (s: string) => new Uint8Array(base.fromHex(s))

type CborValue =
    | boolean
    | number
    | bigint
    | string
    | Uint8Array
    | Map<CborValue, CborValue>
    | CborValue[]
    | { [key: string]: CborValue };

export function encodeCbor(value: CborValue): Uint8Array {
  const writer = new Serialization.CborWriter();
  encodeValue(writer, value);
  return writer.encode();
}

function encodeValue(writer: Serialization.CborWriter, value: CborValue): void {
  if (typeof value === 'number') {
      if (Number.isInteger(value)) {
          writer.writeInt(value);
      } else {
          writer.writeFloat(value);
      }
  } else if (typeof value === 'boolean') {
      writer.writeBoolean(value);
  } else if (typeof value === 'bigint') {
    writer.writeBigInteger(value);
  } else if (typeof value === 'string') {
    writer.writeTextString(value);
  } else if (value instanceof Uint8Array) {
    writer.writeByteString(value);
  } else if (value instanceof Map) {
    writer.writeStartMap(value.size);
    for (const [key, val] of value.entries()) {
      encodeValue(writer, key);
      encodeValue(writer, val);
    }
  } else if (Array.isArray(value)) {
    writer.writeStartArray(value.length);
    for (const item of value) {
      encodeValue(writer, item);
    }
  } else if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    writer.writeStartMap(entries.length);
    for (const [key, val] of entries) {
      writer.writeTextString(key);
      encodeValue(writer, val);
    }
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}


export const signData = async (
    address: string,
    payload: string,
    privateKey: string,
) => {
    await Crypto.ready()
    const addr = hex2Uint8Array((await addressFromHexOrBech32(address)).toBytes())

    const keyHash = await extractKeyHash(address);
    const prefix = keyHash.startsWith('addr_vkh') ? 'addr_vkh' : 'stake_vkh';
    const p = base.fromHex(privateKey.toLowerCase())

    const privKey = Crypto.Ed25519PrivateKey.fromExtendedBytes(prefix === 'addr_vkh' ? p.slice(0, 64) : p.slice(64))
    const pubKey = privKey.toPublic()


    if (keyHash !== base.toBech32(prefix, pubKey.hash().bytes())) {
        throw new Error("Private key does not match address");
    }

    const publicKey = pubKey.bytes()

    const protectedHeader = new Map()
    protectedHeader.set(1, -8)
    protectedHeader.set('address', addr);

    const protectedBytes = new Uint8Array(encodeCbor(protectedHeader));
    const payloadBytes = hex2Uint8Array(payload)

    // === Sig_structure ===
    const sigStructure = [
        'Signature1',
        protectedBytes,
        new Uint8Array(), // external_aad
        payloadBytes,
    ];


    const toSign = base.toHex(encodeCbor(sigStructure));

    const sig = new Uint8Array(privKey.sign(HexBlob(toSign)).bytes());

    const unprotectedHeaders = new Map()
    unprotectedHeaders.set("hashed", false)

    const coseSign1 = [
        protectedBytes,     // protected headers (bstr)
        unprotectedHeaders,  // unprotected headers (add `kid`, `address`, etc. if needed)
        payloadBytes,
        sig,
    ];

    const signature = base.toHex(encodeCbor(coseSign1));

    const coseKey = new Map()
    coseKey.set(1, 1);// kty: OKP
    coseKey.set(3, -8); // alg: EdDSA
    coseKey.set(-1, 6); // crv: Ed25519
    coseKey.set(-2, publicKey); // x: public key
    // coseKey.set(2, addr);    // kid: address (optional)

    const key = base.toHex(encodeCbor(coseKey));

    return {
        key,
        signature,
    }
}


export const addressFromHexOrBech32 = async (address: string) => {
    const addr = Cardano.Address.fromString(address)
    if (!addr) {
        throw new Error('Invalid address')
    }
    return addr
}

const extractKeyHash = async (address: string) => {
    const parsedAddress = await addressFromHexOrBech32(address);
    try {
        const addr = parsedAddress.asBase()!
        return base.toBech32('addr_vkh', base.fromHex(addr.getPaymentCredential().hash))
    } catch (e) {}
    try {
        const addr = parsedAddress.asEnterprise()!
        return base.toBech32('addr_vkh', base.fromHex(addr.getPaymentCredential().hash))
    } catch (e) {}
    try {
        const addr = parsedAddress.asPointer()!
        return base.toBech32('addr_vkh', base.fromHex(addr.getPaymentCredential().hash))
    } catch (e) {}
    try {
        const addr = parsedAddress.asReward()!
        return base.toBech32('stake_vkh', base.fromHex(addr.getPaymentCredential().hash))
    } catch (e) {}
    throw new Error("Address not pk");
};
