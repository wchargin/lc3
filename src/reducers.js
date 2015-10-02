import redux from 'redux';
import {Map} from 'immutable';

import LC3 from './core/lc3';

export function createInitialState() {
    return Map({
        lc3: LC3(),
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

export default function reducer(state, action) {
    if (state === undefined) {
        state = createInitialState();
    }

    switch (action.type) {
        case "SET_PC":
            return setPC(state, action.newPC);
        case "SET_MEMORY":
            return setMemory(state, action.address, action.value);
    }

    return state;
}
