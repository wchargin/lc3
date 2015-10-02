import redux from 'redux';
import {Map} from 'immutable';

import LC3 from './core/lc3';

export function createInitialState() {
    return Map({
        lc3: LC3(),
        assemblerBuffer: "",
        rawInputBuffer: "",
    });
}

export default function reducer(state, action) {
    if (state === undefined) {
        state = createInitialState();
    }

    return state;
}
