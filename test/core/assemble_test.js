import {describe, it} from 'mocha';
import {expect} from 'chai';

import assemble, * as assembleHelpers from '../../src/core/assemble';

describe('assemble', () => {

    const makeTesters = (fn) => ({
        good: (...args) => (expected) => () =>
            expect(fn.apply(null, args)).to.deep.equal(expected),
        bad: (...args) => (message) => () =>
            expect(() => fn.apply(null, args)).to.throw(message),
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

    describe("helper parseString", () => {
        const {good, bad} = makeTesters(assembleHelpers.parseString);
        const r = String.raw;

        it("parses the empty string", good(r`""`)(''));
        it("parses a simple string", good(r`"hello"`)('hello'));
        it("parses a newline", good(r`"lm\nop"`)('lm\nop'));
        it("parses an escaped backslash", good(r`"/\\/\\"`)('/\\/\\'));
        it("parses an escaped quote", good(r`"q\"b"`)(r`q"b`));
        it("parses a backslash then a quote", good(r`"a\\\""`)(r`a\"`));

        it("rejects a string without any quotes at all", bad(r`hi`)());
        it("rejects a string without trailing quote", bad(r`"hi`)());
        it("rejects a string without leading quote", bad(r`hi"`)());

        it("rejects a string where the trailing quote is escaped",
            bad(r`"abc\"`)());
    });

    describe("helper tokenize", () => {
        const {good, bad} = makeTesters(assembleHelpers.tokenize);

        it("parses an empty document", good("")([[]]));

        it("parses a single line with just a comment",
            good("; things go here")([[]]));
        it("parses a single line with just a comment and leading whitespace",
            good("  ; things go here")([[]]));

        it("parses a single line with an .ORIG",
            good(".ORIG x3000")([[".ORIG", "x3000"]]));
        it("parses a single line with an .ORIG and a comment",
            good(".ORIG  x3000   ; start here")([[".ORIG", "x3000"]]));
        it("parses a single line with an .ORIG, a comment, and whitespace",
            good("  .ORIG  x3000   ; start here")([[".ORIG", "x3000"]]));

        it("parses a comma-separated ADD instruction",
            good("ADD  R1,  R2 , R3 ")([["ADD", "R1", "R2", "R3"]]));
        it("parses a terse comma-separated ADD instruction",
            good("ADD R1,R2,R3")([["ADD", "R1", "R2", "R3"]]));

        it("parses a space-separated ADD instruction",
            good("ADD R1 R2 R3")([["ADD", "R1", "R2", "R3"]]));

        it("parses a mixed-space-and-comma-separated ADD instruction ",
            good("ADD R1,R2 R3")([["ADD", "R1", "R2", "R3"]]));

        it("parses two consecutive instruction lines",
            good("ADD R1, R2, R3\nAND R4, R5, #11")([
                ["ADD", "R1", "R2", "R3"],
                ["AND", "R4", "R5", "#11"],
            ]));

        it("parses five lines with comments/blanks at lines 1, 3, and 5",
            good("; xxx\nADD R1, R2, R3\n\nAND R4, R5, #-11\n ; the end")([
                [],
                ["ADD", "R1", "R2", "R3"],
                [],
                ["AND", "R4", "R5", "#-11"],
                [],
            ]));

        it("parses some assembler directives",
            good(".ORIG x3000\n.FILL #1234\n.BLKW xFF\n.END")([
                [".ORIG", "x3000"],
                [".FILL", "#1234"],
                [".BLKW", "xFF"],
                [".END"],
            ]));

        it("deals with semicolons within comments",
            good(";; comment\nBRnzp STUFF ; comment; really\n.END")([
                [],
                ["BRnzp", "STUFF"],
                [".END"],
            ]));

        it("deals with Windows shenanigans",
            good("JMP R1\nJMP R2\r\nJMP R3\r\n\nJMP R5")([
                ["JMP", "R1"],
                ["JMP", "R2"],
                ["JMP", "R3"],
                [],
                ["JMP", "R5"],
            ]));

        it("treats quoted expressions atomically",
            good('.STRINGZ "A thing" ; comment text')([
                ['.STRINGZ', 'A thing'],
            ]));

        it("allows escaped quotes in quoted expressions",
            good(String.raw`.STRINGZ "He says \"hi\"\\"`)([
                ['.STRINGZ', "He says \"hi\"\\"],
            ]));
    });

    describe("helper findOrig", () => {
        const {good, bad} = makeTesters(raw => {
            return assembleHelpers.findOrig(assembleHelpers.tokenize(raw));
        });

        it("finds an .ORIG directive on the first line of an empty program",
            good(".ORIG x3000\n\n.END")({
                orig: 0x3000,
                begin: 1,
            }));

        it("finds a decimal .ORIG directive",
            good(".ORIG #1234\n\n.END")({
                orig: 1234,
                begin: 1,
            }));

        it("finds an .ORIG directive on the first line of an invalid program",
            good(".ORIG x3000\n\n")({
                orig: 0x3000,
                begin: 1,
            }));

        it("finds an .ORIG directive past the first line",
            good("; Program!\n; It does things.\n.ORIG x4000\n\n.END")({
                orig: 0x4000,
                begin: 3,
            }));

        it("finds an .orig (lowercase .ORIG) directive",
            good("; Program!\n; It does things.\n.orig x4000\n\n.END")({
                orig: 0x4000,
                begin: 3,
            }));

        it("fails on an .ORIG directive with no address specified",
            bad(".ORIG\n.END")(/operand/i));

        it("fails on an .ORIG directive with something other than a number",
            bad(".ORIG START\n.END")(/ORIG.*operand.*invalid.*literal/i));

        it("fails on an .ORIG directive with multiple numbers",
            bad(".ORIG x3000 x4000\n.END")(/operand/i));

        it("fails when the .ORIG directive has a label",
            bad("HERE .ORIG x3000\n.END")(/label/i));

        it("fails when the .ORIG directive's address is too high",
            bad(".ORIG x10000\n.END")(/range/i));

        it("fails when the .ORIG directive's address is negative",
            bad(".ORIG #-1\n.END")(/range/i));

        it("fails on the empty document", bad("")(/empty/i));
    });

    describe("helper isValidLabelName", () => {
        // This function should never throw an error,
        // so we can discard the "bad" tester.
        // Instead, we care about whether it returns true or false.
        const {good, _} = makeTesters(assembleHelpers.isValidLabelName);
        const yes = (input) => good(input)(true);
        const no = (input) => good(input)(false);

        it("should accept a normal alphabetic label", yes("START"));
        it("should accept an alphanumeric label", yes("TEN4"));
        it("should accept 'ADD' as a label name", yes("ADD"));
        it("should accept a label that's purely numeric", yes("1234"));
        it("should reject a label with spaces", no("START HERE"));
        it("should reject a label that's a valid hex literal", no("x3000"));
        it("should reject a label that's a valid decimal literal", no("#10"));
        it("should reject punctuation", no("$$BILLS"));
    });

    describe.skip("helper determineRequiredMemory", () => {
        const {good, _} = makeTesters(assembleHelpers.determineRequiredMemory);

        it("should allocate one word for a .FILL of any value",
            good(".FILL", 1234)(1));

        it("should allocate an arbitrary size for a .BLKW",
            good(".BLKW", 10)(10));
        it("should correctly handle .BLKWs of zero size",
            good(".BLKW", 0)(0))

        it("should allocate one word for the empty string's null terminator",
            good(".STRINGZ", "")(1));
        it("should allocate the right amount of space for a normal string",
            good(".STRINGZ", "hello")(6));
        it("shouldn't treat backslashes or quotes as anything special",
            good(".STRINGZ", String.raw`I said, \ "hi!"`)(16));

        it("should allocate one word for an instruction (or anything else)",
            good("ADD", "R1, R2, #5")(1));
    });

});
