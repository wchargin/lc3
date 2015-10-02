import {expect} from 'chai';

import reducer from '../src/reducers';

describe('reducer', () => {

    const initialState = reducer(undefined, {});

    it("provides a reasonable initial state", () => {
        const dummyAction = {
            type: "Ignore me; I'm not a real action",
        };

        expect(initialState).to.be.ok;
        expect(initialState.get("lc3")).to.be.ok;
    });

    it("handles SET_PC", () => {
        const action = {
            type: "SET_PC",
            newPC: 0x9001,
        };
        const newState = reducer(initialState, action);
        const newLC3 = newState.get("lc3");

        expect(newState).to.be.ok;
        expect(newLC3.getIn(["registers", "PC"])).to.equal(0x9001);
    });

});
