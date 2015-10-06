import {Record, fromJS} from 'immutable';

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

    static numericRegisterNames() {
        return [0, 1, 2, 3, 4, 5, 6, 7].map(RegisterSet.numericRegisterName);
    }

    static specialRegisterNames() {
        return ["pc", "ir", "psr"];
    }

    static numericRegisterName(n) {
        if (!(0 <= n && n <= 7)) {
            throw new Error(
                `Numeric register index out of bounds: ` +
                `expected between 0 and 7 inclusive, but got ${n}`);
        }

        return "r" + n;
    }

    getNumericRegister(n) {
        return this.get(Registers.numericRegisterName(n));
    }

    setNumericRegister(n, value) {
        return this.get(Registers.numericRegisterName(n), value);
    }

}
