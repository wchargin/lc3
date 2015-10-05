import {expect} from 'chai';

import {fromJS} from 'immutable';

import parseRaw from '../../src/core/raw';

describe('parseRaw', () => {
    const success = (input, orig, data) => () => {
        const output = parseRaw(input);
        expect(output.status).to.equal("success");

        const result = output.result;
        expect(result.orig).to.equal(orig);
        expect(fromJS(result.machineCode)).to.equal(fromJS(data));
        expect(fromJS(result.symbolTable)).to.equal(fromJS({}));
    };

    const failure = (input, message) => () => {
        const output = parseRaw(input);
        expect(output.status).to.equal("error");
        if (message) {
            expect(output.message).to.contain(message);
        }
    }

    it("should fail when given empty data", failure("", "empty"));
    it("should fail when given binary data of a bad length",
        failure("0000", "length"));
    it("should fail when given hex data of a bad length",
        failure("abc", "length"));
    it("should fail when given non-hex characters",
        failure("efg", "character"));

    it("should succeed when only given a binary .ORIG",
        success("0011 0000 0000 0000", 0x3000, []));
    it("should succeed when only given a hex .ORIG",
        success("3000", 0x3000, []));

    it("should parse a few words of binary",
        success("0111 0000 0000 0000 \n" +
                "0101 1010 1111 0000 \n" +
                "1000 0100 0010 0001",
            0x7000, [0x5AF0, 0x8421]));

    it("should parse a few words of hex",
        success("4000 1a2b CAFE bEeF 0000",
            0x4000, [0x1A2B, 0xCAFE, 0xBEEF, 0x0000]));

    it("should parse binary with comments",
        success("0111 0000 0000 0000 ; this is the .ORIG\n" +
                "0101 1010 1111 0000 ; random junk\n" +
                "; this is a comment-only line\n" +
                "   ; comment-and-whitespace-only line\n" +
                "1000 0100 0010 0001",
            0x7000, [0x5AF0, 0x8421]));

    it("should parse hex with comments",
        success("9001 ; .ORIG\n" +
                "1000 2000 3000 4000 ; data section\n" +
                "; that's all for this program\n" +
                "4321  ; oh yeah, except for that",
            0x9001, [0x1000, 0x2000, 0x3000, 0x4000, 0x4321]));
});
