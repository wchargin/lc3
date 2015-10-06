import {Map} from 'immutable';

import LC3 from './core/lc3';
import LC3Program from './core/program';
import * as Constants from './core/constants';

export function createInitialState() {
    return Map({
        lc3: new LC3(),
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

function loadProgram(state, program) {
    const data = new LC3Program.fromJS(program);
    return state.update("lc3", lc3 => lc3.loadProgram(data));
}

function scrollToPC(state) {
    const pc = state.get("lc3").getIn(["registers", "PC"]);
    return state.setIn(["viewOptions", "topAddressShown"], pc);
}

function scrollBy(state, delta) {
    return state.updateIn(["viewOptions", "topAddressShown"],
        x => Math.max(0, Math.min(x + delta, Constants.MEMORY_SIZE - 1)));
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
        case "LOAD_PROGRAM":
            return loadProgram(state, action.program);
        case "SCROLL_TO_PC":
            return scrollToPC(state);
        case "SCROLL_BY":
            return scrollBy(state, action.delta);
    }

    return state;
}
