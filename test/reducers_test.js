import {describe, it} from 'mocha';
import {expect} from 'chai';

import {List} from 'immutable';

import reducer from '../src/reducers';
import * as actions from '../src/actions';

import LC3Program from '../src/core/program';

describe('reducer', () => {

    const initialState = reducer(undefined, {});

    it("provides a reasonable initial state", () => {
        expect(initialState).to.be.ok;
        expect(initialState.get("lc3")).to.be.ok;
    });

    it("handles SET_PC", () => {
        const action = actions.setPC(0x9001);
        const newState = reducer(initialState, action);
        const newLC3 = newState.get("lc3");

        expect(newState).to.be.ok;
        expect(newLC3.getIn(["registers", "PC"])).to.equal(0x9001);
    });

    it("handles SET_MEMORY", () => {
        const action = actions.setMemory(0x4001, 0xABCD);
        const newState = reducer(initialState, action);
        const newLC3 = newState.get("lc3");

        expect(newState).to.be.ok;
        expect(newLC3.get("memory").get(0x4001)).to.equal(0xABCD);

        // Make sure we can compose these.
        const action2 = actions.setMemory(0x4002, 0xBCDE);
        const newerState = reducer(newState, action2);
        const newerLC3 = newerState.get("lc3");

        expect(newerState).to.be.ok;
        expect(newerLC3.get("memory").get(0x4001)).to.equal(0xABCD);
        expect(newerLC3.get("memory").get(0x4002)).to.equal(0xBCDE);
    });

    it("handles LOAD_PROGRAM", () => {
        const action = actions.loadProgram(new LC3Program({
            orig: 0x3000,
            machineCode: [0x1234, 0x2345, 0x3456],
            symbolTable: {
                "START": 0x3000,
                "DATA": 0x3100,
            },
        }));
        const newState = reducer(initialState, action);
        const newLC3 = newState.get("lc3");

        expect(newState).to.be.ok;
        expect(newLC3.get("memory").slice(0x3000, 0x3003))
            .to.equal(List([0x1234, 0x2345, 0x3456]));
        expect(newLC3.getIn(["symbolTable", "START"])).to.equal(0x3000);
        expect(newLC3.getIn(["symbolTable", "DATA"])).to.equal(0x3100);
    });

    it("handles SCROLL_TO_PC", () => {
        const state = [
            actions.setPC(0x1234),
            actions.scrollToPC(),
        ].reduce(reducer, initialState);

        expect(state).to.be.ok;
        expect(state.getIn(["viewOptions", "topAddressShown"])).to.equal(0x1234);
    });

    it("handles SCROLL_BY", () => {
        // First set an absolute location so we know where we're starting.
        const state0 = [
            actions.setPC(0x9001),
            actions.scrollToPC(),
        ].reduce(reducer, initialState);

        const state1 = reducer(state0, actions.scrollBy(0x10));
        expect(state1).to.be.ok;
        expect(state1.getIn(["viewOptions", "topAddressShown"])).to.equal(0x9011);

        const state2 = reducer(state1, actions.scrollBy(0x8));
        expect(state2).to.be.ok;
        expect(state2.getIn(["viewOptions", "topAddressShown"])).to.equal(0x9019);
    });

});
