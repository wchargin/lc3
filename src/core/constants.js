// Constant values for the LC3 system.
import {List, Map} from 'immutable';

/*
 * Number of addressable locations in the LC3 memory.
 */
export const MEMORY_SIZE = 0x10000;

/*
 * The number of bits in an LC3 machine word.
 */
export const WORD_BITS = 16;

/*
 * Any addresses greater than or equal to this one
 * are mapped to devices or reserved for the system.
 */
export const MAX_STANDARD_MEMORY = 0xFE00;

export const HARDWARE_ADDRESSES = {
    "KBSR": 0xFE00,
    "KBDR": 0xFE02,
    "DSR": 0xFE04,
    "DDR": 0xFE06,
    "MCR": 0xFFFE,
};

/*
 * The maximum number of instructions
 * that can be executed before exiting batch mode.
 */
export const BATCH_MODE_LIMIT = 0x1000;

export default {
    MEMORY_SIZE,
    WORD_BITS,
    MAX_STANDARD_MEMORY,
    HARDWARE_ADDRESSES,
};
