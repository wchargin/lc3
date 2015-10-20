import {describe, it} from 'mocha';
import {expect} from 'chai';

import ErrorUtils from '../../src/core/error_utils';

describe("ErrorUtils", () => {

    const inc1 = x => x + 1;
    const bad = x => {
        throw new Error("bad!");
    };
    const greaterThan = (x, y) => {
        if (x > y) {
            return x;
        } else {
            throw new Error(`expected ${x} to be greater than ${y}!`);
        }
    };

    describe("handleErrors", () => {
        const errfmt = msg => "at line 42: " + msg;
        const {handleErrors} = ErrorUtils;

        it("passes arguments through a successful unary function", () =>
            expect(handleErrors(inc1, errfmt)(10)).to.deep.equal(
                { success: true, result: 11 }));

        it("formats an error based on a failed unary function", () =>
            expect(handleErrors(bad, errfmt)(10)).to.deep.equal(
                { success: false, errorMessage: "at line 42: bad!" }));

        it("passes arguments through a successful binary function", () =>
            expect(handleErrors(greaterThan, errfmt)(4, 2)).to.deep.equal(
                { success: true, result: 4 }));

        it("formats an error based on a failed binary function", () =>
            expect(handleErrors(greaterThan, errfmt)(2, 4)).to.deep.equal({
                success: false,
                errorMessage: "at line 42: expected 2 to be greater than 4!",
            }));

        it("works with nesting", () => {
            const inner = x => { throw new Error("failure"); };
            const outer = y => {
                handleErrors(inner, msg => {
                    throw new Error("in inner: " + msg);
                })(y);
            };
            expect(handleErrors(outer, errfmt)(1)).to.deep.equal({
                success: false,
                errorMessage: "at line 42: in inner: failure",
            });
        });
    });

    describe("withContext", () => {
        const {withContext} = ErrorUtils;

        it("passes arguments through a successful unary function", () =>
            expect(withContext(inc1, "uh oh")(10)).to.equal(11));

        it("formats an error based on a failed unary function", () =>
            expect(() => withContext(bad, "uh oh")(10)).to.throw(
                "uh oh: bad!"));

        it("passes arguments through a successful binary function", () =>
            expect(withContext(greaterThan, "uh oh")(4, 2)).to.equal(4));

        it("formats an error based on a failed binary function", () =>
            expect(() => withContext(greaterThan, "uh oh")(2, 4)).to.throw(
                "uh oh: expected 2 to be greater than 4!"));
    });

});
