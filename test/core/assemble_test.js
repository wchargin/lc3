import {describe, it} from 'mocha';
import {expect} from 'chai';

import assemble, * as assembleHelpers from '../../src/core/assemble';

describe('assemble', () => {

    const makeTesters = (fn) => ({
        good: (...args) => (expected) => () =>
            expect(fn.apply(null, args)).to.equal(expected),
        bad: (...args) => (message) => () =>
            expect(() => fn.apply(null, args)).to.throw(message),
    });

    describe("meta-helper handleErrors", () => {
        const inc1 = x => x + 1;
        const bad = x => {
            throw new Error("Bad!");
        };
        const greaterThan = (x, y) => {
            if (x > y) {
                return x;
            } else {
                throw new Error(`Expected ${x} to be greater than ${y}!`);
            }
        };

        const context = {
            line: 42,
        };
        const {handleErrors} = assembleHelpers;

        it("passes arguments through a successful unary function", () =>
            expect(handleErrors(context, inc1)(10)).to.deep.equal(
                { success: true, result: 11 }));

        it("formats an error based on a failed unary function", () =>
            expect(handleErrors(context, bad)(10)).to.deep.equal(
                { success: false, errorMessage: "at line 42: Bad!" }));

        it("passes arguments through a successful binary function", () =>
            expect(handleErrors(context, greaterThan)(4, 2)).to.deep.equal(
                { success: true, result: 4 }));

        it("formats an error based on a failed binary function", () =>
            expect(handleErrors(context, greaterThan)(2, 4)).to.deep.equal({
                success: false,
                errorMessage: "at line 42: Expected 2 to be greater than 4!",
            }));
    });

    describe("helper parseRegister", () => {
        const {good, bad} = makeTesters(assembleHelpers.parseRegister);

        it("works for R0", good("R0")(0));
        it("works for r1", good("r1")(1));
        it("works for R7", good("R7")(7));
        it("fails for R8", bad("R8")());
        it("fails for R-1", bad("R-1")());
        it("fails for just R", bad("R")());
        it("fails for 1R", bad("1R")());
        it("fails for R12", bad("R12")());
    });

    describe("helper parseLiteral", () => {
        const {good, bad} = makeTesters(assembleHelpers.parseLiteral);

        it("parses #0", good("#0")(0));
        it("parses #-1", good("#-1")(-1));
        it("parses #1", good("#1")(1));
        it("parses xF", good("xF")(15));
        it("parses xf", good("xf")(15));
        it("parses xf", good("xf")(15));
        it("fails on xG", bad("xG")());
        it("fails on #--1", bad("#--1")());
        it("fails on START", bad("START")());
        it("fails on x", bad("x")());
    });

});
