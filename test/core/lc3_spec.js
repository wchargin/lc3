import {expect} from 'chai';

import LC3, {getConditionCode, formatConditionCode} from '../../src/core/lc3';
import Constants from '../../src/core/constants';

describe('LC3', () => {

    describe("the LC3 constructor", () => {

        const lc3 = LC3();

        it("creates some sort of thing", () => {
            expect(lc3).to.be.ok;
        });

        it("has a memory buffer of the right length", () => {
            const memory = lc3.get("memory");
            expect(memory.size).to.equal(Constants.MEMORY_SIZE);
        });

        it("has the right number of registers", () => {
            const registers = lc3.get("registers");
            expect(registers.size).to.equal(
                Constants.REGISTER_NAMES.get("all").size);
        });

        it("has the program counter set to 0x3000", () => {
            const registers = lc3.get("registers");
            const pc = registers.get("PC");
            expect(pc).to.equal(0x3000);
        });

        it("has a symbol table", () => {
            const symbolTable = lc3.get("symbolTable");
            expect(symbolTable).to.be.ok;
        });

        it("starts with an empty console buffer", () => {
            const consoleBuffer = lc3.get("consoleBuffer");
            expect(consoleBuffer).to.equal("");
        });

    });

    describe('getConditionCode', () => {
        const test = (psr, expected) => () => {
            expect(getConditionCode(psr)).to.equal(expected);
        };

        it("handles the negative case", test(0x8004, -1));
        it("handles the zero case", test(0x8002, 0));
        it("handles the positive case", test(0x8001, 1));

        it("fails when none of the bits is set", test(0x8000, null));
        it("fails when two of the bits are set", test(0x8003, null));
        it("fails when all the bits are set", test(0x8007, null));
    });

    describe('formatConditionCode', () => {
        const test = (psr, expected) => () => {
            expect(formatConditionCode(psr)).to.equal(expected);
        };

        it("handles the negative case", test(0x8004, "N"));
        it("handles the zero case", test(0x8002, "Z"));
        it("handles the positive case", test(0x8001, "P"));

        it("fails when none of the bits is set", test(0x8000, "Invalid"));
        it("fails when two of the bits are set", test(0x8003, "Invalid"));
        it("fails when all the bits are set", test(0x8007, "Invalid"));
    });

});
