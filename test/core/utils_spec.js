import {expect} from 'chai';

import * as Utils from '../../src/core/utils';

describe('utils', () => {

    describe('parseNumber', () => {
        const {parseNumber} = Utils;

        const success = (input, expected) => () => {
            expect(parseNumber(input)).to.equal(expected);
        };
        const failure = (input) => () => {
            expect(parseNumber(input)).to.be.NaN;
        };

        it("fails on the empty string", failure(''));
        it("parses a decimal zero", success('0', 0));
        it("parses a hex zero", success('x0', 0));
        it("parses a decimal value", success('123', 123));
        it("parses a negative decimal value", success('-123', -123));
        it("fails on double negations", failure('--123'));
        it("parses a hex value with 'x'", success('x90ab', 0x90AB));
        it("parses a capital hex value with 'x'", success('x90AB', 0x90AB));
        it("fails on a hex value with '0x'", failure('0x123'));
        it("parses a negative hex value", success('-x123', -0x123));
        it("fails on hex input with non-hex values", failure('xDEFG'));
        it("fails on decimal input with non-digits", failure('90AB'));
    });

    describe('toHexString', () => {
        const {toHexString} = Utils;
        
        it("has a leading 'x' prefix", () => {
            expect(toHexString(0x1234)).to.equal('x1234');
        });

        it("zero-pads three-digit strings", () => {
            expect(toHexString(0x234)).to.equal('x0234');
        });

        it("zero-pads two-digit strings", () => {
            expect(toHexString(0x34)).to.equal('x0034');
        });

        it("zero-pads one-digit strings", () => {
            expect(toHexString(0x4)).to.equal('x0004');
        });

        it("zero-pads zero", () => {
            expect(toHexString(0x0)).to.equal('x0000');
        });

        it("allows strings more than four digits without clipping", () => {
            expect(toHexString(0x12345)).to.equal('x12345');
        });

        it("allows other padding values", () => {
            expect(toHexString(0x1234, 6)).to.equal('x001234');
        });
        
        it("allows other prefixes", () => {
            expect(toHexString(0x1234, undefined, 'y')).to.equal('y1234');
        });

        it("allows other prefixes and padding values together", () => {
            expect(toHexString(0x1234, 6, 'y')).to.equal('y001234');
        });

    });

    describe('toInt16', () => {
        const test = (input, expected) => () => {
            expect(Utils.toInt16(input)).to.equal(expected);
        };

        it("is the identity for 0", test(0, 0));
        it("is the identity for 1", test(1, 1));
        it("is the identity for -1", test(-1, -1));

        it("takes 0x10000 to 0", test(0x10000, 0));
        it("takes 0x20000 to 0", test(0x20000, 0));
        it("takes 0x1FFFF to -1", test(0x1FFFF, -1));
        it("takes 0x54321 to 0x4321", test(0x54321, 0x4321));
        it("takes 0xABCDE to 0xBCDE - 0x10000",
            test(0xABCDE, 0xBCDE - 0x10000));
    });

    describe('toUint16', () => {
        const test = (input, expected) => () => {
            expect(Utils.toUint16(input)).to.equal(expected);
        };

        it("is the identity for 0", test(0, 0));
        it("is the identity for 1", test(1, 1));
        it("takes -1 to 0xFFFF", test(-1, 0xFFFF));

        it("takes 0x10000 to 0", test(0x10000, 0));
        it("takes 0x20000 to 0", test(0x20000, 0));
        it("takes 0x1FFFF to 0xFFFF", test(0x1FFFF, 0xFFFF));
        it("takes 0x54321 to 0x4321", test(0x54321, 0x4321));
        it("takes 0xABCDE to 0xBCDE", test(0xABCDE, 0xBCDE));
    });

});