// to replace the bigint-buffer with @noble/curves
import { Buffer } from 'buffer';
import {
    bytesToNumberBE,
    bytesToNumberLE,
    numberToBytesBE,
    numberToBytesLE,
} from '@noble/curves/abstract/utils';

// Keep API names/signatures aligned with `bigint-buffer`
export function toBigIntBE(buf: Uint8Array | Buffer): bigint {
    // Accept Buffer/Uint8Array seamlessly
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return bytesToNumberBE(bytes);
}

export function toBigIntLE(buf: Uint8Array | Buffer): bigint {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return bytesToNumberLE(bytes);
}

export function toBufferBE(num: bigint, width: number): Buffer {
    // Noble's utils expect unsigned bigint (>= 0)
    if (!Number.isFinite(width as unknown as number) || width <= 0) {
        throw new Error('width must be a positive integer');
    }
    const out = numberToBytesBE(num as unknown as bigint, width);
    return Buffer.from(out);
}

export function toBufferLE(num: bigint, width: number): Buffer {
    if (!Number.isFinite(width as unknown as number) || width <= 0) {
        throw new Error('width must be a positive integer');
    }
    const out = numberToBytesLE(num as unknown as bigint, width);
    return Buffer.from(out);
}