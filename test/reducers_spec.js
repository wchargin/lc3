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

    it("handles SET_MEMORY", () => {
        const action = {
            type: "SET_MEMORY",
            address: 0x4001,
            value: 0xABCD,
        };
        const newState = reducer(initialState, action);
        const newLC3 = newState.get("lc3");

        expect(newState).to.be.ok;
        expect(newLC3.get("memory").get(0x4001)).to.equal(0xABCD);

        // Make sure we can compose these.
        const action2 = {
            type: "SET_MEMORY",
            address: 0x4002,
            value: 0xBCDE,
        };
        const newerState = reducer(newState, action2);
        const newerLC3 = newerState.get("lc3");

        expect(newerState).to.be.ok;
        expect(newerLC3.get("memory").get(0x4001)).to.equal(0xABCD);
        expect(newerLC3.get("memory").get(0x4002)).to.equal(0xBCDE);
    });

});
