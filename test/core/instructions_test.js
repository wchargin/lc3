import {describe, it} from 'mocha';
import {expect} from 'chai';

import decode from '../../src/core/instructions';

const test = (s, expected) => {
    const stripped = s.replace(/[^01]/g, "");
    if (stripped.length !== 16) {
        throw new Error("Invalid test definition; expected 16 characters");
    }
    const binary = parseInt(stripped, 2);

    return () => {
        expect(decode(binary).toJS()).to.deep.equal({
            raw: binary,
            ...expected,
        });
    };
};

describe('decode', () => {

    describe("for ADD instructions", () => {

        it("decodes immediate-mode ADDs", test("0001 101 011 1 10101", {
            opcode: 0b0001,
            opname: "ADD",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "immediate",
            immediateField: -11,
            strictValid: true,
        }));

        it("decodes valid register-mode ADDs", test("0001 101 011 0 00 111", {
            opcode: 0b0001,
            opname: "ADD",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "register",
            sr2: 0b111,
            strictValid: true,
        }));

        it("decodes invalid register-mode ADDs", test("0001 101 011 0 01 111", {
            opcode: 0b0001,
            opname: "ADD",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "register",
            sr2: 0b111,
            strictValid: false,
        }));

    });

    describe("for AND instructions", () => {

        it("decodes immediate-mode ANDs", test("0101 101 011 1 10101", {
            opcode: 0b0101,
            opname: "AND",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "immediate",
            immediateField: -11,
            strictValid: true,
        }));

        it("decodes valid register-mode ADDs", test("0101 101 011 0 00 111", {
            opcode: 0b0101,
            opname: "AND",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "register",
            sr2: 0b111,
            strictValid: true,
        }));

        it("decodes invalid register-mode ADDs", test("0101 101 011 0 10 111", {
            opcode: 0b0101,
            opname: "AND",
            dr: 0b101,
            sr1: 0b011,
            mode: "none",
            arithmeticMode: "register",
            sr2: 0b111,
            strictValid: false,
        }));

    });

    describe("for BR instructions", () => {

        it("decodes BR0 (unconditional don't branch) instructions", test(
            "0000 000 101010101", {
                opcode: 0b0000,
                opname: "BR",
                mode: "pcOffset",
                n: false,
                z: false,
                p: false,
                offset: 0b01010101 - (1 << 8),
                strictValid: true,
            }));

        it("decodes BRz instructions", test("0000 010 111111111", {
            opcode: 0b0000,
            opname: "BR",
            mode: "pcOffset",
            n: false,
            z: true,
            p: false,
            offset: -1,
            strictValid: true,
        }));

        it("decodes BRnp instructions", test("0000 101 100000001", {
            opcode: 0b0000,
            opname: "BR",
            mode: "pcOffset",
            n: true,
            z: false,
            p: true,
            offset: -255,
            strictValid: true,
        }));

    });

    describe("for JMP/RET instructions", () => {

        it("decodes a valid JMP R2", test("1100 000 010 000000", {
            opcode: 0b1100,
            opname: "JMP",
            mode: "baseOffset",
            baseR: 2,
            offset: 0,
            strictValid: true,
        }));

        it("decodes a 1-invalid JMP R3", test("1100 010 011 000000", {
            opcode: 0b1100,
            opname: "JMP",
            mode: "baseOffset",
            baseR: 3,
            offset: 0,
            strictValid: false,
        }));

        it("1ecodes a 2-invalid JMP R4", test("1100 000 100 000010", {
            opcode: 0b1100,
            opname: "JMP",
            mode: "baseOffset",
            baseR: 4,
            offset: 0,
            strictValid: false,
        }));

        it("decodes a 1,2-invalid JMP R5", test("1100 100 101 111111", {
            opcode: 0b1100,
            opname: "JMP",
            mode: "baseOffset",
            baseR: 5,
            offset: 0,
            strictValid: false,
        }));

        it("decodes a valid RET", test("1100 000 111 000000", {
            opcode: 0b1100,
            opname: "RET",
            mode: "baseOffset",
            baseR: 7,
            offset: 0,
            strictValid: true,
        }));

        it("decodes an invalid RET", test("1100 111 111 000000", {
            opcode: 0b1100,
            opname: "RET",
            mode: "baseOffset",
            baseR: 7,
            offset: 0,
            strictValid: false,
        }));

    });

    describe("for JSR/JSRR instructions", () => {

        it("decodes a JSR with positive offset", test("0100 1 00000001111", {
            opcode: 0b0100,
            opname: "JSR",
            mode: "pcOffset",
            offset: 15,
            strictValid: true,
        }));

        it("decodes a JSR with negative offset", test("0100 1 11111110000", {
            opcode: 0b0100,
            opname: "JSR",
            mode: "pcOffset",
            offset: -16,
            strictValid: true,
        }));

        it("decodes a valid JSRR", test("0100 0 00 000 000000", {
            opcode: 0b0100,
            opname: "JSRR",
            mode: "baseOffset",
            baseR: 0,
            offset: 0,
            strictValid: true,
        }));

        it("decodes a 1-invalid JSRR", test("0100 0 11 001 000000", {
            opcode: 0b0100,
            opname: "JSRR",
            mode: "baseOffset",
            baseR: 1,
            offset: 0,
            strictValid: false,
        }));

        it("decodes a 2-invalid JSRR", test("0100 0 00 010 010010", {
            opcode: 0b0100,
            opname: "JSRR",
            mode: "baseOffset",
            baseR: 2,
            offset: 0,
            strictValid: false,
        }));

        it("decodes a 1,2-invalid JSRR", test("0100 0 10 011 010010", {
            opcode: 0b0100,
            opname: "JSRR",
            mode: "baseOffset",
            baseR: 3,
            offset: 0,
            strictValid: false,
        }));

    });

    describe("for LD instructions", () => {

        it("decodes a positive-offset LD", test("0010 101 001010101", {
            opcode: 0b0010,
            opname: "LD",
            dr: 5,
            mode: "pcOffset",
            offset: 85,
            strictValid: true,
        }));

        it("decodes a negative-offset LD", test("0010 101 101010101", {
            opcode: 0b0010,
            opname: "LD",
            dr: 5,
            mode: "pcOffset",
            offset: -171,
            strictValid: true,
        }));

    });

    describe("for LDI instructions", () => {

        it("decodes a positive-offset LDI", test("1010 001 001010101", {
            opcode: 0b1010,
            opname: "LDI",
            dr: 1,
            mode: "pcOffset",
            offset: 85,
            strictValid: true,
        }));

        it("decodes a negative-offset LDI", test("1010 010 101010101", {
            opcode: 0b1010,
            opname: "LDI",
            dr: 2,
            mode: "pcOffset",
            offset: -171,
            strictValid: true,
        }));

    });

    describe("for LDR instructions", () => {

        it("decodes a positive-offset LDR", test("0110 110 000 010101", {
            opcode: 0b0110,
            opname: "LDR",
            dr: 6,
            mode: "baseOffset",
            baseR: 0,
            offset: 21,
            strictValid: true,
        }));

        it("decodes a negative-offset LDR", test("0110 111 111 100000", {
            opcode: 0b0110,
            opname: "LDR",
            dr: 7,
            mode: "baseOffset",
            baseR: 7,
            offset: -32,
            strictValid: true,
        }));

    });

    describe("for LEA instructions", () => {

        it("decodes a positive-offset LEA", test("1110 000 001010101", {
            opcode: 0b1110,
            opname: "LEA",
            dr: 0,
            mode: "pcOffset",
            offset: 85,
            strictValid: true,
        }));

        it("decodes a negative-offset LEA", test("1110 011 101010101", {
            opcode: 0b1110,
            opname: "LEA",
            dr: 3,
            mode: "pcOffset",
            offset: -171,
            strictValid: true,
        }));

    });

    describe("for NOT instructions", () => {

        it("decodes a valid NOT instruction", test("1001 000 111 111111", {
            opcode: 0b1001,
            opname: "NOT",
            mode: "none",
            dr: 0,
            sr: 7,
            strictValid: true,
        }));

        it("decodes an invalid NOT instruction", test("1001 000 111 010101", {
            opcode: 0b1001,
            opname: "NOT",
            mode: "none",
            dr: 0,
            sr: 7,
            strictValid: false,
        }));

    });

    describe("for ST instructions", () => {

        it("decodes a positive-offset ST", test("0011 101 001010101", {
            opcode: 0b0011,
            opname: "ST",
            sr: 5,
            mode: "pcOffset",
            offset: 85,
            strictValid: true,
        }));

        it("decodes a negative-offset ST", test("0011 101 101010101", {
            opcode: 0b0011,
            opname: "ST",
            sr: 5,
            mode: "pcOffset",
            offset: -171,
            strictValid: true,
        }));

    });

    describe("for STI instructions", () => {

        it("decodes a positive-offset STI", test("1011 001 001010101", {
            opcode: 0b1011,
            opname: "STI",
            sr: 1,
            mode: "pcOffset",
            offset: 85,
            strictValid: true,
        }));

        it("decodes a negative-offset STI", test("1011 010 101010101", {
            opcode: 0b1011,
            opname: "STI",
            sr: 2,
            mode: "pcOffset",
            offset: -171,
            strictValid: true,
        }));

    });

    describe("for STR instructions", () => {

        it("decodes a positive-offset STR", test("0111 110 000 010101", {
            opcode: 0b0111,
            opname: "STR",
            sr: 6,
            mode: "baseOffset",
            baseR: 0,
            offset: 21,
            strictValid: true,
        }));

        it("decodes a negative-offset STR", test("0111 111 111 100000", {
            opcode: 0b0111,
            opname: "STR",
            sr: 7,
            mode: "baseOffset",
            baseR: 7,
            offset: -32,
            strictValid: true,
        }));

    });

    describe("for TRAP", () => {

        it("decodes a valid TRAP instruction", test("1111 0000 11110000", {
            opcode: 0b1111,
            opname: "TRAP",
            mode: "trap",
            trapVector: 0b11110000,
            strictValid: true,
        }));

        it("decodes an invalid TRAP instruction", test("1111 0010 00001111", {
            opcode: 0b1111,
            opname: "TRAP",
            mode: "trap",
            trapVector: 0b00001111,
            strictValid: false,
        }));

    });

    describe("for RTI", () => {

        it("decodes a valid RTI instruction", test("1000 000000000000", {
            opcode: 0b1000,
            opname: "RTI",
            mode: "none",
            strictValid: true,
        }));

        it("decodes an invalid RTI instruction", test("1000 000000010000", {
            opcode: 0b1000,
            opname: "RTI",
            mode: "none",
            strictValid: false,
        }));

    });

    describe("for the reserved instruction", () => {

        it("decodes the reserved instruction", test("1101 000000000000", {
            opcode: 0b1101,
            opname: "RSRV",
            mode: "none",
            strictValid: false,
        }));

    });

});
