import {describe, it} from 'mocha';
import {expect} from 'chai';

import {List} from 'immutable';

import reducer from '../src/reducers';
import * as actions from '../src/actions';

import LC3Program from '../src/core/program';
import * as Constants from '../src/core/constants';

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
        expect(newLC3.registers.pc).to.equal(0x9001);
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

    describe("SCROLL_TO", () => {
        const state0 = reducer(initialState, actions.setPC(0x9001));
        const test = (input, expected) => () => {
            const state = reducer(state0, actions.scrollTo(input));
            expect(state).to.be.ok;
            const actual = state.getIn(["viewOptions", "topAddressShown"]);
            expect(actual).to.equal(expected);
        };

        it("scrolls to an arbitrary address", test(0x4321, 0x4321));
        it("scrolls to the beginning of memory", test(0x0, 0x0));
        it("doesn't scroll into negative memory", test(-100, 0));

        const maxAddress = Constants.MEMORY_SIZE - 1;
        it("scrolls to the end of memory", test(maxAddress, maxAddress));
        it("doesn't scroll past the end of memory",
            test(maxAddress + 1, maxAddress));
    });

    it("handles SCROLL_TO_PC", () => {
        const state = [
            actions.setPC(0x1234),
            actions.scrollToPC(),
        ].reduce(reducer, initialState);

        expect(state).to.be.ok;
        expect(state.getIn(["viewOptions", "topAddressShown"])).to.equal(0x1234);
    });

    describe("SCROLL_BY", () => {
        // First set an absolute location so we know where we're starting.
        const state0 = [
            actions.setPC(0x9001),
            actions.scrollToPC(),
        ].reduce(reducer, initialState);

        const testScrollBy = (delta, expected) => () => {
            const state = reducer(state0, actions.scrollBy(delta));
            expect(state).to.be.ok;
            expect(state.getIn(["viewOptions", "topAddressShown"])).to.equal(expected);
        };

        it("scrolls forward", testScrollBy(0x10, 0x9011));
        it("scrolls backward", testScrollBy(-0x8, 0x8FF9));
        it("scrolls backward a lot", testScrollBy(-0x9000, 0x1));
        it("scrolls backward to 0x0000", testScrollBy(-0x9001, 0x0));
        it("doesn't scroll past 0x0000", testScrollBy(-0x9002, 0x0));
        it("doesn't scroll past 0x0000 no matter how hard you try",
            testScrollBy(-0x19002, 0x0));

        const maxAddress = Constants.MEMORY_SIZE - 1;
        const distanceToEnd = maxAddress - 0x9001;

        it("scrolls to near the end of memory",
            testScrollBy(distanceToEnd - 1, maxAddress - 1));
        it("scrolls to the very end of memory",
            testScrollBy(distanceToEnd, maxAddress));
        it("doesn't scroll past the end of memory",
            testScrollBy(distanceToEnd + 1, maxAddress));
        it("doesn't scroll past the end of memory, no matter how hard you try",
            testScrollBy(distanceToEnd + 0x10000, maxAddress));
    });

    describe("SET_REGISTER", () => {

        it("can set numeric registers", () => {
            const action = actions.setRegister("r3", 10);
            const newState = reducer(initialState, action);
            expect(newState.get("lc3").registers.r3).to.equal(10);
        });

        it("can set the program counter", () => {
            const action = actions.setRegister("pc", 0x4343);
            const newState = reducer(initialState, action);
            expect(newState.get("lc3").registers.pc).to.equal(0x4343);
        });

        it("can set the instruction register", () => {
            const action = actions.setRegister("ir", 0x4343);
            const newState = reducer(initialState, action);
            expect(newState.get("lc3").registers.ir).to.equal(0x4343);
        });

        it("can set the program status register", () => {
            const action = actions.setRegister("psr", 0x4343);
            const newState = reducer(initialState, action);
            expect(newState.get("lc3").registers.psr).to.equal(0x4343);
        });

    });

    it("handles ENQUEUE_STDIN", () => {
        const action = actions.enqueueStdin("echo");

        const state2 = reducer(initialState, action);
        expect(state2).to.be.ok;
        expect(state2.getIn(["lc3", "console", "stdin"])).to.equal("echo");

        const state3 = reducer(state2, action);
        expect(state3).to.be.ok;
        expect(state3.getIn(["lc3", "console", "stdin"])).to.equal("echoecho");
    });

    const withStdinStdout = initialState
        .setIn(["lc3", "console", "stdin"], "foo")
        .setIn(["lc3", "console", "stdout"], "bar")
        ;

    it("handles CLEAR_STDIN", () => {
        const state = reducer(withStdinStdout, actions.clearStdin());
        expect(state).to.be.ok;
        expect(state.getIn(["lc3", "console", "stdin"])).to.equal("");
        expect(state.getIn(["lc3", "console", "stdout"])).to.equal(
            withStdinStdout.getIn(["lc3", "console", "stdout"]));
    });

    it("handles CLEAR_STDOUT", () => {
        const state = reducer(withStdinStdout, actions.clearStdout());
        expect(state).to.be.ok;
        expect(state.getIn(["lc3", "console", "stdin"])).to.equal(
            withStdinStdout.getIn(["lc3", "console", "stdin"]));
        expect(state.getIn(["lc3", "console", "stdout"])).to.equal("");
    });

    describe("SET_NEWLINE_MODE", () => {
        const test = value => it(`handles '${value}'`, () =>
            expect(reducer(initialState, actions.setNewlineMode(value))
                    .getIn(["lc3", "console", "newlineMode"])).to.equal(value));
        test("CR");
        test("LF");
        test("ignore");
    })

    describe("with batch-mode-related actions", () => {
        const oldBatchModeLimit = Constants.BATCH_MODE_LIMIT;
        before("mock out BATCH_MODE_LIMIT", () => {
            Constants.BATCH_MODE_LIMIT = 4;
        });

        const addInstruction = 0b0001000000100001;  // ADD R0, R0, #1
        const lc3 = initialState.get("lc3");
        const baseMachine = lc3
            .update("memory", m => m
                .set(lc3.registers.pc + 0, addInstruction)
                .set(lc3.registers.pc + 1, addInstruction)
                .set(lc3.registers.pc + 2, addInstruction)
                .set(lc3.registers.pc + 3, addInstruction)
                .set(lc3.registers.pc + 4, addInstruction))
            .update("batchState", bs => bs
                .set("running", false)
                .set("currentSubroutineLevel", 10)
                .set("targetSubroutineLevel", 4))
            .update("registers", rs => rs
                .setNumeric(0, 0x0000));
        const baseState = initialState.set("lc3", baseMachine);

        it("enters batch mode with CONTINUE", () => {
            const action = actions.enterBatchMode("CONTINUE");
            expect(reducer(baseState, action).get("lc3")).to.equal(
                baseMachine.enterBatchMode());
        });

        it("enters batch mode with NEXT", () => {
            const action = actions.enterBatchMode("NEXT");
            expect(reducer(baseState, action).get("lc3")).to.equal(
                baseMachine.enterBatchModeForNext());
        });

        it("enters batch mode with FINISH", () => {
            const action = actions.enterBatchMode("FINISH");
            expect(reducer(baseState, action).get("lc3")).to.equal(
                baseMachine.enterBatchModeForFinish());
        });

        it("enters batch mode with FOREVER", () => {
            const action = actions.enterBatchMode("RUN");
            expect(reducer(baseState, action).get("lc3")).to.equal(
                baseMachine.enterBatchModeForRunForever());
        });

        it("exits batch mode", () => {
            const action = actions.exitBatchMode();
            expect(reducer(baseState
                    .setIn(["lc3", "batchState", "running"], true),
            action).get("lc3")).to.equal(baseMachine);
        });

        it("takes a batch step", () => {
            const state1 = reducer(baseState, actions.enterBatchMode("RUN"));
            const state2 = reducer(state1, actions.stepBatch());
            expect(state2.get("lc3")).to.equal(state1.get("lc3").stepBatch());
        });

        after("restore BATCH_MODE_LIMIT", () => {
            Constants.BATCH_MODE_LIMIT = oldBatchModeLimit;
        });
    });

});
