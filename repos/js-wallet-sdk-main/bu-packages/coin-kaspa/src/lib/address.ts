import { validate } from "./validation";
import { convert as convertBits } from "./convertBits";
import * as base32 from "./base32";
import { base } from "@okxweb3/coin-base";

export function encodePubKeyAddress(pubKey: string, prefix: string) {
  const eight0 = [0,0,0,0,0,0,0,0];
  const prefixData = prefixToArray(prefix).concat([0]);
  const versionByte = 0;

  const pubKeyArray = Array.prototype.slice.call(base.fromHex(pubKey), 0);
  const payloadData = convertBits(new Uint8Array([versionByte].concat(pubKeyArray)), 8, 5, false);
  const checksumData = new Uint8Array(prefixData.length + payloadData.length + eight0.length);
  checksumData.set(prefixData);
  checksumData.set(payloadData, prefixData.length);
  checksumData.set(eight0, prefixData.length + payloadData.length);
  const polymodData = checksumToArray(polymod(checksumData));

  const payload = new Uint8Array(payloadData.length + polymodData.length);
  payload.set(payloadData);
  payload.set(polymodData, payloadData.length);

  return 'kaspa:' + base32.encode(payload);
}

export function payToAddrScript(address: string) {
  validate(hasSingleCase(address), 'Mixed case');
  address = address.toLowerCase();

  const pieces = address.split(':');
  validate(pieces.length === 2, 'Invalid format: ' + address);

  const prefix = pieces[0];
  validate(prefix === 'kaspa', 'Invalid prefix: ' + address);
  const encodedPayload = pieces[1];
  const decoded = base32.decode(encodedPayload);
  validate(validChecksum(prefix, decoded), 'Invalid checksum: ' + address);

  const convertedBits = convertBits(decoded.slice(0, -8), 5, 8, true);
  const version = convertedBits[0];
  const payload = convertedBits.slice(1);

  switch (version) {
  case 0x00: // Schnorr P2PK
    if (payload.length !== 32) {
      throw new Error("Invalid Schnorr public key length");
    }
    return Buffer.concat([
      Buffer.from([0x20]), // Push 32 bytes
      payload, // 32-byte Schnorr pubkey
      Buffer.from([0xac]), // OP_CHECKSIG
    ]);

  case 0x01: // ECDSA P2PK
    if (payload.length !== 33) {
      throw new Error("Invalid ECDSA public key length");
    }
    return Buffer.concat([
      Buffer.from([0x21]), // Push 33 bytes
      payload, // 33-byte ECDSA pubkey
      Buffer.from([0xab]), // OP_CHECKSIGECDSA
    ]);

  case 0x08: // Script Hash
    if (payload.length !== 32) {
      throw new Error("Invalid script hash length");
    }
    return Buffer.concat([
      Buffer.from([0xaa]), // OP_BLAKE2B
      Buffer.from([0x20]), // Push 32 bytes
      payload, // 32-byte script hash
      Buffer.from([0x87]), // OP_EQUAL
    ]);

  default:
    throw new Error(`Unsupported address version: ${version}`);
}
};

function hasSingleCase(string: string) {
  return string === string.toLowerCase() || string === string.toUpperCase();
}

function prefixToArray(prefix: string) {
  const result = [];
  for (let i = 0; i < prefix.length; i++) {
    result.push(prefix.charCodeAt(i) & 31);
  }
  return result;
}

function checksumToArray(checksum: number) {
  const result = [];
  for (let i = 0; i < 8; ++i) {
    result.push(checksum & 31);
    checksum /= 32;
  }
  return result.reverse();
}

function validChecksum(prefix: string, payload: Uint8Array) {
  const prefixData = prefixToArray(prefix);
  const data = new Uint8Array(prefix.length + 1 + payload.length);
  data.set(prefixData);
  data.set([0], prefixData.length)
  data.set(payload, prefixData.length + 1);

  return polymod(data) === 0;
}


const GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
const GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

function polymod(data: Uint8Array) {
  // Treat c as 8 bits + 32 bits
  var c0 = 0, c1 = 1, C = 0;
  for (var j = 0; j < data.length; j++) {
    // Set C to c shifted by 35
    C = c0 >>> 3;
    // 0x[07]ffffffff
    c0 &= 0x07;
    // Shift as a whole number
    c0 <<= 5;
    c0 |= c1 >>> 27;
    // 0xffffffff >>> 5
    c1 &= 0x07ffffff;
    c1 <<= 5;
    // xor the last 5 bits
    c1 ^= data[j];
    for (var i = 0; i < GENERATOR1.length; ++i) {
      if (C & (1 << i)) {
        c0 ^= GENERATOR1[i];
        c1 ^= GENERATOR2[i];
      }
    }
  }
  c1 ^= 1;
  // Negative numbers -> large positive numbers
  if (c1 < 0) {
    c1 ^= 1 << 31;
    c1 += (1 << 30) * 2;
  }
  // Unless bitwise operations are used,
  // numbers are consisting of 52 bits, except
  // the sign bit. The result is max 40 bits,
  // so it fits perfectly in one number!
  return c0 * (1 << 30) * 4 + c1;
}
