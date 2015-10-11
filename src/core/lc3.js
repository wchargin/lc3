import {List, Map, Record, fromJS} from 'immutable';

import Constants from './constants';
import RegisterSet from './register_set';
import Utils from './utils';
import decode from './instructions';

/*
 * Create the initial memory for the LC3.
 * Returns: an Immutable.List with one entry per address, in order.
 */
function createMemory() {
    let memory = List(Array(Constants.MEMORY_SIZE)).map(() => 0);
    // TODO(william): load the OS memory here.
    return memory;
}

/*
 * Create the initial symbol table for the LC3.
 * This currently is just a blank symbol table,
 * but eventually should contain some predefined labels, etc.
 */
function createSymbolTable() {
    // TODO(william): Load the OS symbol table here.
    return Map();
}

export default class LC3 extends Record({
    memory: createMemory(),
    registers: new RegisterSet(),
    symbolTable: createSymbolTable(),
    consoleBuffer: "",
}) {

    /*
     * Merge the given LC3Program into this machine.
     */
    loadProgram(program) {
        const orig = program.get("orig");
        const machineCode = program.get("machineCode");
        const symbolTable = program.get("symbolTable") || Map();
        const length = machineCode.size;

        // Only move the PC if we actually loaded instructions.
        // This prevents moving the PC if we, say, just load a symbol table.
        const newPC = length > 0 ? orig : this.registers.pc;

        return this
            .update("memory", mem => mem.withMutations(mem => {
                for (let i = 0; i < length; i++) {
                    mem.set(orig + i, machineCode.get(i));
                }
                return mem;
            }))
            .update("symbolTable", table => table.concat(symbolTable))
            .setIn(["registers", "pc"], newPC);
    }

    /*
     * Given an integer representing an address in the LC3 memory,
     * return a label associated with this address,
     * or the address as a hex string if no such label exists.
     * If there are multiple label for this address,
     * one will be chosen arbitrarily.
     */
    formatAddress(address) {
        const label = this.symbolTable.keyOf(address);
        if (label !== undefined) {
            return label;
        } else {
            return Utils.toHexString(address);
        }
    }

    getConditionCode() {
        return Utils.getConditionCode(this.registers.psr);
    }

    formatConditionCode() {
        return Utils.formatConditionCode(this.registers.psr);
    }

    _cycle() {
        const instructionValue = this.memory.get(this.registers.pc);
        return this
            .updateIn(["registers", "pc"], x => x + 1)
            .setIn(["registers", "ir"], instructionValue)
            ._execute(instructionValue);
    }

    step(n = 1) {
        return this.withMutations(lc3 => {
            for (let i = 0; i < n; i++) {
                lc3._cycle();
            }
            return lc3;
        });
    }

    /*
     * Execute the given instruction, provided as a (binary) number.
     * This does *not* correspond to the full instruction cycle!
     * In particular, it does not include the "fetch" phase,
     * so the instruction register is not modified,
     * and the PC will only be modified if the instruction is a BR, JMP, etc.
     */
    _execute(instructionValue) {
        const instruction = decode(instructionValue);
        const address = this._evaluateAddress(instruction);

        const opcode = instruction.get("opcode");
        switch (opcode) {
            case 0b0001:  // ADD
                return this._executeBinop(instruction, (x, y) => x + y);

            case 0b0101:  // AND
                return this._executeBinop(instruction, (x, y) => x & y);

            case 0b0000:  // BR
                const cc = Utils.getConditionCode(this.registers.psr);
                const nzp = (cc < 0) ? "n" : (cc > 0) ? "p" : "z";
                const shouldBranch = instruction.get(nzp);
                if (shouldBranch) {
                    return this.setIn(["registers", "pc"], address);
                } else {
                    return this;
                }

            case 0b1100:  // JMP, RET
                return this.setIn(["registers", "pc"], address);

            case 0b0100:  // JSR, JSRR
                return this.update("registers", rs => rs
                    .set("r7", rs.get("pc"))
                    .set("pc", address));

            case 0b0010:  // LD
            case 0b0110:  // LDR
                return this._setRegisterCC(
                    instruction.get("dr"), this.memory.get(address));

            case 0b1010:  // LDI
                return this._setRegisterCC(
                    instruction.get("dr"),
                    this.memory.get(this.memory.get(address)));

            case 0b1110:  // LEA
                return this._setRegisterCC(instruction.get("dr"), address);

            case 0b1001:  // NOT
                return this._setRegisterCC(
                    instruction.get("dr"), Utils.toUint16(
                        ~this.registers.getNumeric(instruction.get("sr"))));

            case 0b1000:  // RTI
                throw new Error("RTI not yet implemented");

            case 0b0011:  // ST
            case 0b0111:  // STR
                return this.setIn(["memory", address],
                    this.registers.getNumeric(instruction.get("sr")));

            case 0b1011:  // STI
                return this.setIn(["memory", this.memory.get(address)],
                    this.registers.getNumeric(instruction.get("sr")));

            case 0b1111:  // TRAP
                return this.update("registers", rs => rs
                    .setNumeric(7, rs.pc)
                    .set("pc", this.memory.get(address)));

            case 0b1101:  // RSRV
                throw new Error(
                    "Reserved instruction not yet handled " +
                    "(this should halt the machine and set a status flag)");

            default:
                throw new Error(`Unknown opcode: ${opcode}`);
        }
    }

    _evaluateAddress(instruction) {
        const mode = instruction.get("mode");
        switch (mode) {
            case "none":
                return null;
            case "pcOffset":
                return Utils.toUint16(
                    this.registers.pc + instruction.get("offset"));
            case "baseOffset":
                const baseR = instruction.get("baseR");
                const offset = instruction.get("offset");
                return Utils.toUint16(
                    this.registers.getNumeric(baseR) + offset);
            case "trap":
                return instruction.get("trapVector");
            default:
                throw new Error(`unknown addressing mode: ${mode}`);
        }
    }

    _fetchOperand(address) {
        if (address === null) {
            return null;
        } else {
            return this.memory.get(address);
        }
    }

    _executeBinop(instruction, computer) {
        const source1 = this.registers.getNumeric(instruction.get("sr1"));

        const source2 = (() => {
            const mode = instruction.get("arithmeticMode");
            switch (mode) {
                case "immediate":
                    return instruction.get("immediateField");
                case "register":
                    return this.registers.getNumeric(instruction.get("sr2"));
                default:
                    throw new Error(`Unknown arithmetic mode: ${mode}`);
            }
        })();

        const result = Utils.toUint16(computer(source1, source2));

        return this._setRegisterCC(instruction.get("dr"), result);
    }

    _setRegisterCC(registerNumber, value) {
        return this
            .update("registers", rs => rs.setNumeric(registerNumber, value))
            ._setConditionCode(value);
    }

    _setConditionCode(value) {
        const sign = Math.sign(Utils.toInt16(value));
        const cc =
            sign < 0 ? 0x4 :
            sign > 0 ? 0x1 :
            0x2;
        return this.updateIn(["registers", "psr"], psr => (psr & ~0b111) | cc);
    }

}
