import {List, Map, Record, fromJS} from 'immutable';

import Constants from './constants';
import RegisterSet from './register_set';

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

}
