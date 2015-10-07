import {WORD_BITS} from './constants';

/*
 * Convert a decimal or hex string to a number.
 * Return NaN on failure.
 */
export function parseNumber(string) {
    string = string.toLowerCase();
    if (string.length === 0) {
        return NaN;
    }

    let negative = false;
    if (string[0] === '-') {
        string = string.slice(1);
        negative = true;
    }

    let num;
    if (string[0] === 'x') {
        const hexDigits = string.slice(1);
        if (hexDigits.match(/[^0-9a-f]/)) {
            return NaN;
        }
        num = parseInt(hexDigits, 16);
    } else {
        if (string.match(/[^0-9]/)) {
            return NaN;
        }
        num = parseInt(string);
    }
    return negative ? -num : num;
}

/*
 * Convert a number to a hex string of at least four digits,
 * prefixed with an "x."
 *
 * The second and third parameters, respectively,
 * can specify alternate values for the minimum digit count
 * and the prefix with which to pad.
 */
export function toHexString(number, padLength=4, prefix='x') {
    let hex = number.toString(16).toUpperCase();
    if (hex.length < padLength) {
        hex = Array(padLength - hex.length + 1).join('0') + hex;
    }
    return prefix + hex;
}

/*
 * Convert a number possibly outside the [-32768, 32767] range
 * to a 16-bit signed integer.
 */
export function toInt16(n) {
    n = (n % (1 << WORD_BITS)) & ((1 << WORD_BITS) - 1);
    if (n & (1 << WORD_BITS - 1)) {
        return n - (1 << WORD_BITS);
    }
    return n;
}

/*
 * Convert a number possibly outside the [-32768, 32767] range
 * to a 16-bit unsigned signed integer.
 */
export function toUint16(n) {
    const int16 = this.toInt16(n);
    return int16 < 0 ? int16 + (1 << WORD_BITS) : int16;
}

/*
 * Assuming that the given number represents a signed integer
 * with the given number of bits,
 * sign-extend this to a 16-bit number.
 * For example, the 5-bit signed number 10001 represents -15,
 * so signExtend(0b10001, 5) === signExtend(17, 5) === -15.
 */
export function signExtend16(n, bits) {
    const justSignBit = n & (1 << (bits - 1));
    if (justSignBit) {
        return toInt16(n - (1 << bits));
    } else {
        return toInt16(n & (1 << bits) - 1);
    }
}

/*
 * Get the condition code as -1, 0, or 1,
 * or null if the PSR is in an invalid state.
 */
export function getConditionCode(psr) {
    const [n, z, p] = [psr & 0x4, psr & 0x2, psr & 0x1];

    // Make sure exactly one condition code is set.
    if (!!n + !!z + !!p !== 1) {
        return null;
    }

    return n ? -1 : p ? 1 : 0;
}

/*
 * Get the condition code as "N", "Z", or "P",
 * or "Invalid" if the PSR is in an invalid state.
 *
 * This just uses the result of getConditionCode.
 */
export function formatConditionCode(psr) {
    switch (getConditionCode(psr)) {
        case null:
            return "Invalid";
        case -1:
            return "N";
        case 0:
            return "Z";
        case 1:
            return "P";
    }
}
