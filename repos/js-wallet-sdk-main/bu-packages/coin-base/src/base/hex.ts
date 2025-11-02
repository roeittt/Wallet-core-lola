import {validateHexString} from "./helper";

export function toHex(data: Uint8Array | Buffer | number[], addPrefix: boolean = false): string {
    const buffer = Buffer.from(data)
    return addPrefix ? "0x" + buffer.toString("hex") : buffer.toString("hex")
}

export function fromHex(data: string): Buffer {
    if (data.startsWith("0x") || data.startsWith("0X")) {
        data = data.substring(2)
    }
    if (data.length % 2 != 0) {
        data = "0" + data
    }
    if (!validateHexString(data)) {
        throw new Error("invalid hex string")
    }
    return Buffer.from(data, "hex")
}

export function stripHexPrefix(hex: string): string {
    if (hex.startsWith("0x")) {
        return hex.substring(2)
    }
    return hex
}

export function isHexPrefixed(hex: string): boolean {
    return hex.startsWith("0x")
}