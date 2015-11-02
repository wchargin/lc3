import {List, Map, Record, fromJS} from 'immutable';

import Constants from './constants';
import RegisterSet from './register_set';
import OS from './os';
import Utils from './utils';
import decode from './instructions';

/*
 * Create the initial memory for the LC3.
 * Returns: an Immutable.List with one entry per address, in order.
 */
function createMemory() {
    const zeroMemory = List(Array(Constants.MEMORY_SIZE)).map(() => 0);

    // The OS memory is sparse, and is not stored as a normal LC3Program;
    // instead, it's an Object representing a partial function
    // from memory addresses to values.
    // We'll merge those in manually.
    const initialMemory = zeroMemory.withMutations(mem => {
        Object.keys(OS.memory).forEach(key => {
            mem.set(key, OS.memory[key]);
        });
    });

    return initialMemory;
}

/*
 * Create the initial symbol table for the LC3.
 * This contains just the operating system labels.
 */
function createSymbolTable() {
    return Map(OS.symbolTable);
}

/*
 * Create the map of OS-provided TRAP vectors.
 * The format is the inverse of the symbol table:
 * this maps addresses to names instead of the other way aroud.
 * This is just used for formatting purposes.
 */
function createSystemTraps() {
    // We can't just return Map({0x20: ...})
    // because JS coerces numeric literal object keys to strings,
    // so instead we set these one at a time.
    return Map()
        .set(0x20, "GETC")
        .set(0x21, "OUT")
        .set(0x22, "PUTS")
        .set(0x23, "IN")
        .set(0x24, "PUTSP")
        .set(0x25, "HALT");
}

function createConsole() {
    return Map({
        stdout: "",
        stdin: "",
        newlineMode: "LF",
    });
}

/*
 * We use batch mode when you click "Next", "Return", or "Finish";
 * each of these will cause the LC-3 to repeatedly execute instructions
 * until it reaches the termination condition
 * (e.g., the machine returns from a subroutine).
 *
 * Practically, however, we also need to *delay* execution
 * after you execute a large number of consecutive instructions
 * or execute an instruction that depends on I/O,
 * so that the DOM remains responsive and users can provide input.
 *
 * So the batchState fields are as follows:
 *   - running:
 *         whether batch mode is currently running,
 *         and a batch step should be invoked again after some time has passed;
 *         this is true when you first enter batch mode,
 *         or when you have hit the instruction cap,
 *         or when you execute an I/O instruction
 *   - currentSubroutineLevel:
 *         the number of levels of nested subroutines in the current state;
 *         i.e., what would be the number of stack frames
 *         if we were dealing with function calls instead of subroutines
 *   - targetSubroutineLevel:
 *         the desired subroutine level;
 *         when we reach this level or below,
 *         we will exit batch mode immediately.
 *   - interactedWithIO:
 *         whether the last instruction executed depended on I/O
 *         (this field is updated at every call to "step")
 */
export class BatchState extends Record({
    running: false,
    currentSubroutineLevel: 0,
    targetSubroutineLevel: 0,
    interactedWithIO: false,
}) {}

export default class LC3 extends Record({
    memory: createMemory(),
    registers: new RegisterSet(),
    symbolTable: createSymbolTable(),
    systemTraps: createSystemTraps(),
    console: createConsole(),
    batchState: new BatchState(),
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

    _stepStdin() {
        const stdin = this.console.get("stdin");
        const {KBSR, KBDR} = Constants.HARDWARE_ADDRESSES;
        if (stdin.length === 0 || (this.memory.get(KBSR) & 0x8000) !== 0) {
            return this;
        } else {
            const first = stdin.charCodeAt(0) & 0xFF;
            return this
                .setIn(["console", "stdin"], stdin.substring(1))
                .update("memory", m => m
                    .update(KBSR, kbsr => kbsr | 0x8000)
                    .update(KBDR, kbdr => (kbdr & 0xFF00) | first));
        }
    }

    _stepStdout() {
        const {DSR, DDR} = Constants.HARDWARE_ADDRESSES;
        if ((this.memory.get(DSR) & 0x8000) !== 0) {
            return this;
        } else {
            const character = String.fromCharCode(this.memory.get(DDR) & 0xFF);
            return this
                .updateIn(["console", "stdout"], stdout => stdout + character)
                .updateIn(["memory", DSR], dsr => dsr | 0x8000);
        }
    }

    step() {
        const instructionValue = this.memory.get(this.registers.pc);
        return this
            .updateIn(["registers", "pc"], x => x + 1)
            .setIn(["registers", "ir"], instructionValue)
            ._execute(instructionValue)
            ._stepStdin()
            ._stepStdout()
            ;
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
                const addrLD = this.memory.get(address);
                const boundLD = this.readMemory(address);
                return boundLD._setRegisterCC(instruction.get("dr"), addrLD);

            case 0b1010:  // LDI
                const addrLDI1 = this.memory.get(address);
                const boundLDI1 = this.readMemory(address);
                const addrLDI2 = boundLDI1.memory.get(addrLDI1);
                const boundLDI2 = boundLDI1.readMemory(addrLDI1);
                return boundLDI2
                    ._setRegisterCC(instruction.get("dr"), addrLDI2);

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
                return this.writeMemory(address,
                    this.registers.getNumeric(instruction.get("sr")));

            case 0b1011:  // STI
                const addrSTI = this.memory.get(address);
                const boundSTI = this.readMemory(address);
                return boundSTI.writeMemory(addrSTI,
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

    /*
     * Note: this does not return the contents of the memory location!
     * It's only used for watching the memory-mapped device registers.
     */
    readMemory(address) {
        const {KBSR, KBDR} = Constants.HARDWARE_ADDRESSES;
        if (address === KBDR) {
            return this.updateIn(["memory", KBSR], kbsr => kbsr & 0x7FFF);
        } else {
            return this;
        }
    }

    writeMemory(address, value) {
        const {DSR, DDR} = Constants.HARDWARE_ADDRESSES;
        if (address === DDR) {
            return this.update("memory", m => m
                .set(address, value)
                .update(DSR, dsr => dsr & 0x7FFF));
        } else {
            return this.setIn(["memory", address], value);
        }
    }

    _evaluateAddress(instruction, pc = this.registers.pc) {
        const mode = instruction.get("mode");
        switch (mode) {
            case "none":
                return null;
            case "pcOffset":
                return Utils.toUint16(pc + instruction.get("offset"));
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

    formatInstructionAtAddress(address) {
        const immutableInstruction =
            decode(this.memory.get(Utils.toUint16(address)));
        const instruction = immutableInstruction.toJS();

        // Show .FILL for invalid instructions.
        if (!instruction.strictValid) {
            return ".FILL " + Utils.toHexString(instruction.raw);
        }

        const {opcode, opname} = instruction;

        const dr = "R" + instruction.dr;
        const sr = "R" + instruction.sr;
        const sr1 = "R" + instruction.sr1;
        const sr2 = "R" + instruction.sr2;
        const baseR = "R" + instruction.baseR;

        const targetAddress =
            this._evaluateAddress(immutableInstruction, address + 1);
        const label = targetAddress && this.formatAddress(targetAddress);

        switch (opcode) {
            case 0b0001:  // ADD
            case 0b0101:  // AND
                const arithmeticMode = instruction.arithmeticMode;
                switch (arithmeticMode) {
                    case "immediate":
                        return `${opname} ${dr}, ${sr1}, #${instruction.immediateField}`;
                    case "register":
                        return `${opname} ${dr}, ${sr1}, ${sr2}`;
                    default:
                        throw new Error("Unknown arithmetic mode: " + arithmeticMode);
                }

            case 0b0000:  // BR
                const {n, z, p} = instruction;
                if (!(n || z || p)) {
                    // If there's no condition code that matches, it's a no-op.
                    return "NOP";
                } else {
                    // Otherwise, just format it normally.
                    return (opname
                        + (n ? "n" : "")
                        + (z ? "z" : "")
                        + (p ? "p" : "")
                        + " " + label);
                }

            case 0b1100:  // JMP, RET
                return instruction.baseR === 7 ? "RET" : `JMP ${baseR}`;

            case 0b0100:  // JSR, JSRR
                switch (opname) {
                    case "JSR":
                        return `${opname} ${label}`;
                    case "JSRR":
                        return `${opname} ${baseR}`;
                    default:
                        throw new Error(`Unknown JSR/JSRR variant: ${opname}`);
                }

            case 0b0010:  // LD
            case 0b1010:  // LDI
            case 0b1110:  // LEA
                return `${opname} ${dr}, ${label}`;

            case 0b0110:  // LDR
                return `${opname} ${dr}, ${baseR}, #${instruction.offset}`;

            case 0b1001:  // NOT
                return `${opname} ${dr}, ${sr}`;

            case 0b1000:  // RTI
                return opname;

            case 0b0011:  // ST
            case 0b1011:  // STI
                return `${opname} ${sr}, ${label}`;

            case 0b0111:  // STR
                return `${opname} ${sr}, ${baseR}, #${instruction.offset}`;

            case 0b1111:  // TRAP
                const {trapVector} = instruction;

                const systemTrap = this.systemTraps.get(trapVector);
                if (systemTrap !== undefined) {
                    // These don't get a TRAP prefix.
                    return systemTrap;
                }

                const userTrap = this.symbolTable.keyOf(trapVector);
                if (userTrap !== undefined) {
                    return `${opname} ${userTrap}`;
                }

                // Use just two hex digits for the trap vector.
                return `${opname} ${Utils.toHexString(trapVector, 2)}`;

            case 0b1101:  // RSRV
                // We shouldn't get here,
                // because the reserved instruction is not strictValid.
                // But handle it anyway.
                return op.opname;
        }
    }

}
