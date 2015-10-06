import redux from 'redux';
import {Map, fromJS} from 'immutable';

import LC3, * as LC3Utils from './core/lc3';
import LC3Program from './core/program';

export function createInitialState() {
    return Map({
        lc3: new LC3(),
        editorBuffers: Map({
            assembler: "",
            rawInput: "",
        }),
        viewOptions: Map({
            topAddressShown: 0x3000,
            followPC: true,
        }),
    });
}

function setPC(state, newPC) {
    return state.setIn(["lc3", "registers", "PC"], newPC);
}

function setMemory(state, address, value) {
    return state.setIn(["lc3", "memory", address], value);
}

function setMemoryBlock(state, program) {
    const data = new LC3Program.fromJS(program);
    return state.update("lc3", lc3 => lc3.mergeMemory(data));
}

export default function reducer(state, action) {
    if (state === undefined) {
        state = createInitialState();
    }

    switch (action.type) {
        case "SET_PC":
            return setPC(state, action.newPC);
        case "SET_MEMORY":
            return setMemory(state, action.address, action.value);
        case "SET_MEMORY_BLOCK":
            return setMemoryBlock(state, action.program);
    }

    return state;
}
