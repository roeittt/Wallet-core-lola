import { signUtil } from "@okxweb3/crypto-lib";
import { base, BN } from "@okxweb3/coin-base";
import * as ec from './lib/utils/ec';

export async function GetRandomPrivateKey() {
    while (true) {
        const randBytes = base.randomBytes(32)
        if (privateKeyVerify(randBytes)) {
            if (testSign(randBytes.toString('hex'))) {
                return `0x${signUtil.schnorr.bytesToHex(randBytes)}`
            }
        }
    }
}

export function testSign(privateKey: string) {
    const msg = "7465dd6b1bbffdb05442eb17f5ca38ad1aa78a6f56bf4415bdee219114a47a1";
    const signature = ec.starkCurve.sign(msg, privateKey);
    const pub = signUtil.schnorr.stark.getPublicKey(privateKey);
    return ec.starkCurve.verify(signature, msg, pub)
}

function privateKeyVerify(seckey: Buffer) {
    const bn = new BN(Array.from(seckey))
    const n = new BN(ec.starkCurve.CURVE.n.toString())
    return bn.cmp(n) < 0 && !bn.isZero()
}

const CURVE_ORDER = BigInt(
    '3618502788666131213697322783095070105526743751716087489154079457884512865583'
);

export function modPrivateKey(privateKey: string): string {
    let key: string;
    if (!privateKey.startsWith("0x") && !privateKey.startsWith('0X')) {
        key = `0x${privateKey}`; // Remove the "0x" prefix
    } else {
        key = privateKey;
    }

    const pk = BigInt(key.toLowerCase());
    const priKey = pk % CURVE_ORDER;

    return "0x" + priKey.toString(16);
}
