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
