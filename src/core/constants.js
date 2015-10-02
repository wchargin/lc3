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

/*
 * Names of registers in the "registers" attribute of the LC3 datatype.
 */
export const REGISTER_NAMES = (function() {
    let standard = List([0, 1, 2, 3, 4, 5, 6, 7]).map(x => "R" + x);
    let special = List(["PC", "IR", "PSR"]);
    let all = standard.concat(special);
    return Map({ standard, special, all });
})();

export default {
    MEMORY_SIZE,
    WORD_BITS,
    MAX_STANDARD_MEMORY,
    REGISTER_NAMES,
};
