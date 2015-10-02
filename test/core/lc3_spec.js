import {expect} from 'chai';

import LC3 from '../../src/core/lc3';
import Constants from '../../src/core/constants';

describe('LC3', () => {

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

    it("has a symbol table", () => {
        const symbolTable = lc3.get("symbolTable");
        expect(symbolTable).to.be.ok;
    });

    it("starts with an empty console buffer", () => {
        const consoleBuffer = lc3.get("consoleBuffer");
        expect(consoleBuffer).to.equal("");
    });

});
