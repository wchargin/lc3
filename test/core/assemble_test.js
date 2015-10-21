import {describe, it} from 'mocha';
import {expect} from 'chai';

import assemble, * as helpers from '../../src/core/assemble';

describe('assemble', () => {

    const makeTesters = (fn) => ({
        good: (...args) => (expected) => () =>
            expect(fn.apply(null, args)).to.deep.equal(expected),
        bad: (...args) => (message) => () =>
            expect(() => fn.apply(null, args)).to.throw(message),
    });

    describe("helper parseRegister", () => {
        const {good, bad} = makeTesters(helpers.parseRegister);

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
        const {good, bad} = makeTesters(helpers.parseLiteral);

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
        const {good, bad} = makeTesters(helpers.parseString);
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
        const {good, bad} = makeTesters(helpers.tokenize);

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

        it("allows comments immediately after a token (no space)",
            good(String.raw`AND R0, R0, #0;clear it`)([
                ["AND", "R0", "R0", "#0"],
            ]));

        it("allows comments separated from tokens by a space",
            good(String.raw`AND R0, R0, #0 ; clear it`)([
                ["AND", "R0", "R0", "#0"],
            ]));

        it("allows comments immediately after a string (no space)",
            good(String.raw`.STRINGZ "hello";hey`)([
                [".STRINGZ", "hello"],
            ]));

        it("allows comments separated from strings by a space",
            good(String.raw`.STRINGZ "hello" ;hey`)([
                [".STRINGZ", "hello"],
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

        it("allows semicolons in strings",
            good(String.raw`.STRINGZ "hark; for here \\/ be dragons!"`)([
                ['.STRINGZ', "hark; for here \\/ be dragons!"],
            ]));

        it("allows semicolons in strings and actual comments later",
            good(String.raw`.STRINGZ "hark; for here \\/ be dragons!" ; yep`)([
                ['.STRINGZ', "hark; for here \\/ be dragons!"],
            ]));
    });

    describe("helper findOrig", () => {
        const {good, bad} = makeTesters(raw => {
            return helpers.findOrig(helpers.tokenize(raw));
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
        const {good, _} = makeTesters(helpers.isValidLabelName);
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

    describe("helper determineRequiredMemory", () => {
        const {good, bad} = makeTesters(helpers.determineRequiredMemory);

        it("should allocate one word for a .FILL of any value",
            good(".FILL", 1234)(1));

        it("should allocate an arbitrary size for a .BLKW",
            good(".BLKW", 10)(10));
        it("should correctly handle .BLKWs of zero size",
            good(".BLKW", 0)(0))
        it("should fail on .BLKWs of negative size",
            bad(".BLKW", -1)(/negative/));

        it("should allocate one word for the empty string's null terminator",
            good(".STRINGZ", "")(1));
        it("should allocate the right amount of space for a normal string",
            good(".STRINGZ", "hello")(6));
        it("shouldn't treat backslashes or quotes as anything special",
            good(".STRINGZ", String.raw`I said, \ "hi!"`)(16));

        it("should allocate one word for an instruction (or anything else)",
            good("ADD", null)(1));
    });

    describe("helper buildSymbolTable", () => {
        const {good, bad} = makeTesters(lines => {
            const tokenized = helpers.tokenize(lines.join('\n'));
            const {orig, begin} = helpers.findOrig(tokenized);
            return helpers.buildSymbolTable(tokenized, orig, begin);
        });

        it("generates an empty symbol table for the empty program",
            good([".ORIG x3000", ".END"])({
                symbolTable: {},
                programLength: 0,
            }));

        it("generates an empty symbol table for a simple program",
            good([".ORIG x3000", "ADD R0, R1, #0", ".END"])({
                symbolTable: {},
                programLength: 1,
            }));

        it("works for a program with just instructions", good([
            ".ORIG x3000",
            "START ADD R1, R1, #-1",
            "BRnz START",
            ".END",
        ])({
            symbolTable: {
                "START": 0x3000,
            },
            programLength: 2,
        }));

        it("works for a program with data at the end", good([
            ".ORIG x3000",
            "AND R0, R0, #0",
            "ADD R1, R0, #9",
            "; Next, we'll call a subroutine.",
            "; (This comment shouldn't affect the page index.)",
            "LD R2, Subroutine",
            "LOOP ADD R1, R1, #-1",
            "JSRR R2",
            "BRzp LOOP",
            "HALT",
            "Subroutine .FILL x4000",
            ".END"
        ])({
            symbolTable: {
                "LOOP": 0x3003,
                "Subroutine": 0x3007,
            },
            programLength: 8,
        }));

        it("works for a program with multi-word data", good([
            ".ORIG x5000",
            "UserInput .BLKW x10",
            'Hello .STRINGZ "Hello, world!"',
            "Newline .FILL x0A",
            ".END",
        ])({
            symbolTable: {
                "UserInput": 0x5000,
                "Hello": 0x5010,
                "Newline": 0x501E,
            },
            programLength: 0x1F,
        }));

        it("works for label-only lines", good([
            ".ORIG x3000",
            "Loop",
            "AND R0, R0, #0",
            "BRnzp Loop",
            ".END",
        ])({
            symbolTable: {
                "Loop": 0x3000,
            },
            programLength: 2,
        }));

        it("lets your instructions go up to the last memory cell", good([
            ".ORIG xFFFE",
            "JSRR R0",
            "RTI",
            ".END",
        ])({
            symbolTable: {},
            programLength: 2,
        }));

        it("fails if your instructions overflow the memory", bad([
            ".ORIG xFFFE",
            "JSRR R0",
            "ADD R0, R0, R0",
            "RTI",
            ".END",
        ])(/line 4.*x10000.*memory limit/));

        it("lets your .BLKWs go up to the last memory cell", good([
            ".ORIG xFFF0",
            ".BLKW #16",
            ".END",
        ])({
            symbolTable: {},
            programLength: 16,
        }));

        it("fails if your .BLKWs overflow the memory", bad([
            ".ORIG xFFF8",
            ".BLKW #16",
            ".END",
        ])(/line 2.*x10008.*memory limit/));

        it("fails if you have an invalid label name", bad([
            ".ORIG x3000",
            "LD R3, Subroutine",
            "xa JSR R3",
            "Subroutine .FILL x3000",
            ".END",
        ])(/line 3.*label/));

        it("fails for a .STRINGZ with no operand", bad([
            ".ORIG x3000",
            ".STRINGZ",
            ".END",
        ])(/line 2.*operand/));

        // This is a bit different from the .STRINGZ case
        // because the operand to .FILL isn't actually needed
        // to compute anything in the symbol table.
        // (And, indeed, it is handled separately in the code.)
        // It should still fail, though.
        it("fails for a .FILL with no operand", bad([
            ".ORIG x3000",
            ".FILL",
            ".END",
        ])(/line 2.*operand/));

        it("fails when you have duplicate labels", bad([
            ".ORIG x3000",
            "AND R0, R0, x0000",
            "ADD R1, R0, #5",
            "Loop ADD R0, R0, #1",
            "ADD R1, R1, #-1",
            "BRp Loop",
            "ADD R2, R1, #5",
            "Loop ADD R0, R0, #1",
            "ADD R2, R2, #-1",
            "BRp Loop",
            ".END",
        ])(/line 8.*exists.*x3002/));

    });

    describe("helper parseOffset", () => {
        const {good, bad} = makeTesters(helpers.parseOffset);

        describe("should accept", () => {
            it("a positive decimal literal offset",
                good(0x3000, "#1", {}, 5)(1));
            it("a negative decimal literal offset",
                good(0x3000, "#-1", {}, 5)(-1));
            it("a positive hex offset",
                good(0x3000, "x08", {}, 5)(8));
            it("a negative hex offset",
                good(0x3000, "x-08", {}, 5)(-8));
            it("a forward reference to a label",
                good(0x3000, "THING", { "THING": 0x3010 }, 6)(0x10));
            it("a backward reference to a label",
                good(0x3000, "THING", { "THING": 0x2FFF }, 6)(-1));
            it("a reference to a label at the current location",
                good(0x3000, "THING", { "THING": 0x3000 }, 6)(0));
        });

        describe("should reject", () => {
            describe("an out-of-range", () => {
                it("positive decimal literal offset",
                    bad(0x3000, "#30", {}, 5)(/range.*-16.*15/));
                it("negative decimal literal offset",
                    bad(0x3000, "#-17", {}, 5)(/range.*-16.*15/));
                it("positive hex offset",
                    bad(0x3000, "x10", {}, 5)(/range.*-16.*15/));
                it("negative hex offset",
                    bad(0x3000, "x-11", {}, 5)(/range.*-16.*15/));
                it("forward reference to a label",
                    bad(0x3000, "THING", { "THING": 0x3050 }, 6)(
                        /range.*-32.*31/));
                it("backward reference to a label",
                    bad(0x3000, "THING", { "THING": 0x2F00 }, 6)(
                        /range.*-32.*31/));
            });

            it("a label that doesn't exist",
                bad(0x3000, "NOPE", { "THING": 0x3005 }, 5)(/label/));
        });

    });

    describe("helper encodeDirective", () => {
        const {good, _} = makeTesters(helpers.encodeDirective);

        it("should process a .FILL with a positive value",
            good([".FILL", "x1234"])([0x1234]));

        it("should process a .FILL with a negative value",
            good([".FILL", "x-1234"])([0xEDCC]));

        it("should process a .FILL with a value past 0x10000",
            good([".FILL", "x123456"])([0x3456]));

        it("should process a .BLKW of size zero",
            good([".BLKW", "#0"])([]));

        it("should process a .BLKW of size one",
            good([".BLKW", "#1"])([0]));

        it("should process a .BLKW of size four",
            good([".BLKW", "#4"])([0, 0, 0, 0]));

        it("should process an empty .STRINGZ as just a null-terminator",
            good([".STRINGZ", ""])([0]));

        it("should process a .STRINGZ with some text",
            good([".STRINGZ", "hello"])([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x00]));

    });

    describe("helper encodeInstruction", () => {
        const {good, bad} = makeTesters((instruction) => {
            const tokens = helpers.tokenize(instruction)[0];
            const result = helpers.encodeInstruction(tokens, pc, symbols);
            const word = result[0];
            return word;
        });

        const pc = 0x3000;
        const symbols = {
            PREEE: pc - 0x1000,
            PREE: pc - 20,
            PRE: pc - 5,
            HERE: pc,
            POST: pc + 5,
            POSTT: pc + 20,
            POSTTT: pc + 0x1000,
        };

        describe("for ADD instructions", () => {
            it("should accept a valid register-mode ADD",
                good("ADD R0, R1, R2")(0b0001000001000010));
            it("should accept a valid positive immediate-mode ADD",
                good("ADD R0, R1, #15")(0b0001000001101111));
            it("should accept a valid negative immediate-mode ADD",
                good("ADD R0, R1, #-16")(0b0001000001110000));
            it("should reject an invalid positive immediate-mode ADD",
                bad("ADD R0, R1, #16")());
            it("should reject an invalid negative immediate-mode ADD",
                bad("ADD R0, R1, #-17")());
            it("should reject an ADD with a single operand",
                bad("ADD R0")());
            it("should reject an ADD with just two operands",
                bad("ADD R0, R1")());
            it("should reject an ADD with a whole four operands",
                bad("ADD R0, R1, R2, R3")());
        });

        describe("for AND instructions", () => {
            it("should accept a valid register-mode AND",
                good("AND R0, R1, R2")(0b0101000001000010));
            it("should accept a valid positive immediate-mode AND",
                good("AND R0, R1, #15")(0b0101000001101111));
            it("should accept a valid negative immediate-mode AND",
                good("AND R0, R1, #-16")(0b0101000001110000));
            it("should reject an invalid positive immediate-mode AND",
                bad("AND R0, R1, #16")());
            it("should reject an invalid negative immediate-mode AND",
                bad("AND R0, R1, #-17")());
            it("should reject an AND with a single operand",
                bad("AND R0")());
            it("should reject an AND with just two operands",
                bad("AND R0, R1")());
            it("should reject an AND with a whole four operands",
                bad("AND R0, R1, R2, R3")());
        });

        describe("for BR instructions", () => {
            it("should accept a valid BRnp with a literal positive offset",
                good("BRnp #15")(0b0000101000001111));
            it("should accept a valid BRnp with a literal negative offset",
                good("BRnp #-16")(0b0000101111110000));
            it("should accept a valid BRnp with a forward label reference",
                good("BRnp POST")(0b0000101000000101));
            it("should accept a valid BRnp with a backward label reference",
                good("BRnp PRE")(0b0000101111111011));
            it("should reject an invalid BRnp with a forward label reference",
                bad("BRnp POSTTT")());
            it("should reject an invalid BRnp with a backward label reference",
                bad("BRnp PREEE")());
            it("should work for a BRnzp",
                good("BRnzp HERE")(0b0000111000000000));
            it("should treat a blank BR like a BRnzp",
                good("BR HERE")(0b0000111000000000));
            it("should reject a branch without an operand", bad("BR")());
            it("should reject a branch with two operands", bad("BR #0 #0")());
        });

        describe("for JMP instructions", () => {
            it("should work for JMP R0", good("JMP R0")(0b1100000000000000));
            it("should work for JMP R7", good("JMP R7")(0b1100000111000000));
            it("should fail without an operand", bad("JMP")());
            it("should fail with two operands", bad("JMP R1, R2")());
        });

        describe("for RET instructions", () => {
            it("should just work", good("RET")(0b1100000111000000));
            it("should fail with an operand", bad("RET R7")());
        });

        describe("for JSR instructions", () => {
            it("should accept a valid positive literal offset",
                good("JSR #1023")(0b0100101111111111));
            it("should accept a valid negative literal offset",
                good("JSR x-400")(0b0100110000000000));
            it("should accept a valid forward symbol offset",
                good("JSR POSTT")(0b0100100000010100));
            it("should accept a valid backward symbol offset",
                good("JSR PRE")(0b0100111111111011));

            it("should reject a invalid positive literal offset",
                bad("JSR #1024")());
            it("should reject a invalid negative literal offset",
                bad("JSR x-401")());
            it("should reject a invalid forward symbol offset",
                bad("JSR POSTTT")());
            it("should reject a invalid backward symbol offset",
                bad("JSR PREEE")());

            it("should reject a JSR with no operands", bad("JSR")());
            it("should reject a JSR with two operands", bad("JSR #1, #2")());
        });

        describe("for JSRR instructions", () => {
            it("should work for JSRR R5",
                good("JSRR R5")(0b0100000101000000));
            it("should reject a JSRR with no operands", bad("JSRR")());
            it("should reject a JSRR with two operands", bad("JSRR R1, R2")());
        });

        // All these instructions take the exact same form (like ADD/AND).
        // We can just test them in batch.
        const pcRelativeMemoryInstructions = {
            "LD": 0b0010,
            "LDI": 0b1010,
            "LEA": 0b1110,
            "ST": 0b0011,
            "STI": 0b1011,
        };
        Object.keys(pcRelativeMemoryInstructions).forEach((name) => {
            const opcode = pcRelativeMemoryInstructions[name];
            const baseop = opcode << 12;

            describe(`for ${name} instructions`, () => {
                it("should accept a valid positive literal offset",
                    good(`${name} R5, #255`)(baseop | 0b101011111111));
                it("should accept a valid negative literal offset",
                    good(`${name} R5, x-100`)(baseop | 0b101100000000));
                it("should accept a valid forward symbol offset",
                    good(`${name} R5, POSTT`)(baseop | 0b101000010100));
                it("should accept a valid backward symbol offset",
                    good(`${name} R5, PRE`)(baseop | 0b101111111011));

                it("should reject a invalid positive literal offset",
                    bad(`${name} R5, #1024`)());
                it("should reject a invalid negative literal offset",
                    bad(`${name} R5, x-401`)());
                it("should reject a invalid forward symbol offset",
                    bad(`${name} R5, POSTTT`)());
                it("should reject a invalid backward symbol offset",
                    bad(`${name} R5, PREEE`)());

                it(`should reject a ${name} with no operands`,
                    bad(`${name}`)());
                it(`should reject a ${name} with just one operand`,
                    bad(`${name} R0`)());
                it(`should reject a ${name} with three operands`,
                    bad(`${name} R1, #1, #2`)());
            });
        });

    });

});
