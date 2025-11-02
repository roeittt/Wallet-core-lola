import { HDKey } from '@scure/bip32';

export function fromSeedV2(seed: Buffer, hdPath: string): HDKey {
    const hdkey = HDKey.fromMasterSeed(new Uint8Array([...seed]));
    const childKey = hdkey.derive(hdPath);
    return childKey;
}