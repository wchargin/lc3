import {expect} from 'chai';

import {List} from 'immutable';

import reducer from '../src/reducers';
import * as actions from '../src/actions';

import LC3Program from '../src/core/program';

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

    it("handles SET_MEMORY_BLOCK", () => {
        const action = actions.setMemoryBlock(new LC3Program({
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

});
