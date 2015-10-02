import {fromJS, List, Map} from 'immutable';

import Constants from './constants';

/*
 * Create the initial memory for the LC3.
 * Returns: an Immutable.List with one entry per address, in order.
 */
function createMemory() {
    let memory = List(Array(Constants.MEMORY_SIZE)).map(x => 0);
    // TODO(william): load the OS memory here.
    return memory;
}

/*
 * Create the map of initial register values for the LC3.
 * Returns: an Immutable.Map from register name to word value,
 * for each register in Constants.REGISTER_NAMES.all.
 */
function createRegisters() {
    const registerDefaults = Map({
        "PC": 0x3000,
        "PSR": 0x8002,
    });

    return Map(Constants.REGISTER_NAMES.get("all").map(
            name => [name, registerDefaults[name] || 0]));
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

/*
 * Create a new LC3 machine.
 * Don't invoke this with 'new'.
 */
export default function LC3() {
    return Map({
        memory: createMemory(),
        registers: createRegisters(),
        symbolTable: createSymbolTable(),
        consoleBuffer: "",
    });
}
