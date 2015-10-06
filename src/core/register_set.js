import {Record, fromJS} from 'immutable';

/*
 * We need a few properties to construct RegisterSet,
 * but we'll also later attach these to RegisterSet itself
 * so that users of the class can access them.
 */
const _numericRegisters = [0, 1, 2, 3, 4, 5, 6, 7];
const _numericRegisterNames = _numericRegisters.map(_numericRegisterName);
const _specialRegisterNames = ["pc", "ir", "psr"];
const _allRegisterNames = _numericRegisterNames.concat(_specialRegisterNames);

function _numericRegisterName(n) {
    if (!(0 <= n && n <= 7)) {
        throw new Error(
            `Numeric register index out of bounds: ` +
            `expected between 0 and 7 inclusive, but got ${n}`);
    }

    return "r" + n;
}

export default class RegisterSet extends Record({
    r0: 0x0000,
    r1: 0x0000,
    r2: 0x0000,
    r3: 0x0000,
    r4: 0x0000,
    r5: 0x0000,
    r6: 0x0000,
    r7: 0x0000,
    pc: 0x3000,
    ir: 0x0000,
    psr: 0x8002,
}) {

    static fromJS(js) {
        return new Registers(fromJS(js));
    }

    getNumericRegister(n) {
        return this.get(_numericRegisterName(n));
    }

    setNumericRegister(n, value) {
        return this.get(_numericRegisterName(n), value);
    }

}

RegisterSet.numericRegisterNames = _numericRegisterNames;
RegisterSet.specialRegisterNames = _specialRegisterNames;
RegisterSet.allRegisterNames = _allRegisterNames;
RegisterSet.numericRegisterName = _numericRegisterName;
