import {describe, it} from 'mocha';
import {expect} from 'chai';

import assemble, * as helpers from '../../src/core/assemble';
import ParseResult from '../../src/core/parse_result';

describe('assemble', () => {

    it("assembles the empty program", () =>
        expect(assemble(`
            .ORIG x3000
            .END
        `)).to.equal(ParseResult.fromJS({
            success: true,
            program: {
                orig: 0x3000,
                machineCode: [],
                symbolTable: {},
            },
        })));

    it("assembles a simple arithmetic program", () =>
        expect(assemble(`
            ; negative multiplier:
            ; multiplies R1 by -R2 and stores the result in R0
            .ORIG x3000
            AND R0, R0, #0
            ST R1, StashR1

            ; we'd like to assume that R1 > 0;
            ; to do this, we'll negate R1 if it's negative,
            ; or otherwise negate R2 like we would do anyway
            ADD R1, R1, #0
            BRzp NegateR2
            NOT R1, R1
            ADD R1, R1, #1
            BR Loop
            NegateR2
            NOT R2, R2
            ADD R2, R2, #1

            Loop
            ; now keep iterating
            ; (this is probably not the most efficient, but whatever)
            ADD R1, R1, #-1
            BRn Done
            ADD R0, R0, R2
            BR Loop

            Done
            LD R1, StashR1
            HALT

            StashR1 .BLKW #1
            .END
        `)).to.equal(ParseResult.fromJS({
            success: true,
            program: {
                orig: 0x3000,
                machineCode: [
                    0b0101000000100000,  // AND R0, R0, #0
                    0b0011001000001101,  // ST R1, StashR1 (+13)
                    0b0001001001100000,  // ADD R1, R1, #0
                    0b0000011000000011,  // BRzp NegateR2 (+3)
                    0b1001001001111111,  // NOT R1, R1
                    0b0001001001100001,  // ADD R1, R1, #1
                    0b0000111000000010,  // BR(nzp) Loop (+2)
                    0b1001010010111111,  // NOT R2, R2
                    0b0001010010100001,  // ADD R2, R2, #1
                    0b0001001001111111,  // ADD R1, R1, #-1,
                    0b0000100000000010,  // BRn Done (+2)
                    0b0001000000000010,  // ADD R0, R0, R2
                    0b0000111111111100,  // BR(nzp) Loop (-4),
                    0b0010001000000001,  // LD R1, StashR1 (+1)
                    0b1111000000100101,  // HALT
                    0b0000000000000000,  // StashR1[0]
                ],
                symbolTable: {
                    "NegateR2": 0x3007,
                    "Loop": 0x3009,
                    "Done": 0x300D,
                    "StashR1": 0x300F,
                },
            },
        })));

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

        it("uses the right string offset with lowercase directives", good([
            ".orig x3000",
            "lbl add r1,r2,r3",
            'txt .stringz "hello"',
            "lbl2 add r1,r2,r3",
            ".end"
        ])({
            symbolTable: {
                "lbl": 0x3000,
                "txt": 0x3001,
                "lbl2": 0x3007,
            },
            programLength: 8,
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
        ])(/line 4.*x10001.*memory limit/));

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

        it("fails when there is no .END directive",
            bad([".ORIG x3000"])(/\.END/));

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
                bad("ADD R0, R1, #16")(/range/));
            it("should reject an invalid negative immediate-mode ADD",
                bad("ADD R0, R1, #-17")(/range/));
            it("should reject an ADD with no operands",
                bad("ADD")(/operand/));
            it("should reject an ADD with a single operand",
                bad("ADD R0")(/operand/));
            it("should reject an ADD with just two operands",
                bad("ADD R0, R1")(/operand/));
            it("should reject an ADD with a whole four operands",
                bad("ADD R0, R1, R2, R3")(/operand/));
        });

        describe("for AND instructions", () => {
            it("should accept a valid register-mode AND",
                good("AND R0, R1, R2")(0b0101000001000010));
            it("should accept a valid positive immediate-mode AND",
                good("AND R0, R1, #15")(0b0101000001101111));
            it("should accept a valid negative immediate-mode AND",
                good("AND R0, R1, #-16")(0b0101000001110000));
            it("should reject an invalid positive immediate-mode AND",
                bad("AND R0, R1, #16")(/range/));
            it("should reject an invalid negative immediate-mode AND",
                bad("AND R0, R1, #-17")(/range/));
            it("should reject an AND with no operands",
                bad("AND")(/operand/));
            it("should reject an AND with a single operand",
                bad("AND R0")(/operand/));
            it("should reject an AND with just two operands",
                bad("AND R0, R1")(/operand/));
            it("should reject an AND with a whole four operands",
                bad("AND R0, R1, R2, R3")(/operand/));
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
                bad("BRnp POSTTT")(/range/));
            it("should reject an invalid BRnp with a backward label reference",
                bad("BRnp PREEE")(/range/));
            it("should work for a BRnzp",
                good("BRnzp HERE")(0b0000111000000000));
            it("should treat a blank BR like a BRnzp",
                good("BR HERE")(0b0000111000000000));
            it("should reject a branch without an operand",
                bad("BR")(/operand/));
            it("should reject a branch with two operands",
                bad("BR #0 #0")(/operand/));
        });

        describe("for JMP instructions", () => {
            it("should work for JMP R0", good("JMP R0")(0b1100000000000000));
            it("should work for JMP R7", good("JMP R7")(0b1100000111000000));
            it("should fail without an operand", bad("JMP")(/operand/));
            it("should fail with two operands", bad("JMP R1, R2")(/operand/));
        });

        describe("for RET instructions", () => {
            it("should just work", good("RET")(0b1100000111000000));
            it("should fail with an operand", bad("RET R7")(/operand/));
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
                bad("JSR #1024")(/offset/));
            it("should reject a invalid negative literal offset",
                bad("JSR x-401")(/offset/));
            it("should reject a invalid forward symbol offset",
                bad("JSR POSTTT")(/offset/));
            it("should reject a invalid backward symbol offset",
                bad("JSR PREEE")(/offset/));

            it("should reject a JSR with no operands",
                bad("JSR")(/operand/));
            it("should reject a JSR with two operands",
                    bad("JSR #1, #2")(/operand/));
        });

        describe("for JSRR instructions", () => {
            it("should work for JSRR R5",
                good("JSRR R5")(0b0100000101000000));
            it("should reject a JSRR with no operands",
                bad("JSRR")(/operand/));
            it("should reject a JSRR with two operands",
                bad("JSRR R1, R2")(/operand/));
        });

        // All these instructions take the exact same form (like ADD/AND).
        // We can just test them in batch.
        const pcRelativeMemoryInstructions = [
            { name: "LD", opcode: 0b0010, },
            { name: "LDI", opcode: 0b1010, },
            { name: "LEA", opcode: 0b1110, },
            { name: "ST", opcode: 0b0011, },
            { name: "STI", opcode: 0b1011, },
        ];
        pcRelativeMemoryInstructions.forEach(data => {
            const {name, opcode} = data;
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

                it("should reject an invalid positive literal offset",
                    bad(`${name} R5, #1024`)(/offset/));
                it("should reject an invalid negative literal offset",
                    bad(`${name} R5, x-401`)(/offset/));
                it("should reject an invalid forward symbol offset",
                    bad(`${name} R5, POSTTT`)(/offset/));
                it("should reject an invalid backward symbol offset",
                    bad(`${name} R5, PREEE`)(/offset/));

                it(`should reject an instruction with no operands`,
                    bad(`${name}`)(/operand/));
                it(`should reject an instruction with just one operand`,
                    bad(`${name} R0`)(/operand/));
                it(`should reject an instruction with three operands`,
                    bad(`${name} R1, #1, #2`)(/operand/));
            });
        });

        describe("for LDR instructions", () => {
            it("should accept a valid positive offset",
                good("LDR R0, R1, #31")(0b0110000001011111));
            it("should accept a valid negative offset",
                good("LDR R0, R1, #-32")(0b0110000001100000));
            it("should reject an invalid positive offset",
                bad("LDR R0, R1, #32")(/offset/));
            it("should reject an invalid negative offset",
                bad("LDR R0, R1, #-33")(/offset/));

            it("should reject an instruction with no operands",
                bad("LDR")(/operand/));
            it("should reject an instruction with just one operand",
                bad("LDR R0")(/operand/));
            it("should reject an instruction with just two operands",
                bad("LDR R0, R1")(/operand/));
            it("should reject an instruction with just four operands",
                bad("LDR R0, R1, #10, #20")(/operand/));
        });

        describe("for STR instructions", () => {
            it("should accept a valid positive offset",
                good("STR R0, R1, #31")(0b0111000001011111));
            it("should accept a valid negative offset",
                good("STR R0, R1, #-32")(0b0111000001100000));
            it("should reject an invalid positive offset",
                bad("STR R0, R1, #32")(/offset/));
            it("should reject an invalid negative offset",
                bad("STR R0, R1, #-33")(/offset/));

            it("should reject an instruction with no operands",
                bad("STR")(/operand/));
            it("should reject an instruction with just one operand",
                bad("STR R0")(/operand/));
            it("should reject an instruction with just two operands",
                bad("STR R0, R1")(/operand/));
            it("should reject an instruction with just four operands",
                bad("STR R0, R1, #10, #20")(/operand/));
        });

        describe("for NOT instructions", () => {
            it("should work with two register operands",
                good("NOT R1, R2")(0b1001001010111111));
            it("should reject a literal operand",
                bad("NOT R1, #11")());

            it("should reject an instruction with no operands",
                bad("NOT")());
            it("should reject an instruction with just one operand",
                bad("NOT R1")());
            it("should reject an instruction with three operands",
                bad("NOT R3, R4, R5")());
        });

        describe("for RTI instructions", () => {
            it("should just work", good("RTI")(0b1000000000000000));
            it("should reject an instruction with an operand",
                bad("RTI R1")(/operand/));
        });

        describe("for TRAP instructions", () => {
            it("should accept a valid trap vector",
                good("TRAP xAA")(0b1111000010101010));
            it("should reject a trap vector that's too large",
                bad("TRAP #256")(/range/));
            it("should reject a negative trap vector",
                bad("TRAP #-1")(/range/));
            it("should reject an instruction with no operands",
                bad("TRAP")(/operand/));
            it("should reject an instruction with two operands",
                bad("TRAP x33, x44")(/operand/));
        });

        describe("for trap service routine keyword instructions", () => {
            it("should handle GETC", good("GETC")(0xF020));
            it("should handle OUT", good("OUT")(0xF021));
            it("should handle PUTS", good("PUTS")(0xF022));
            it("should handle IN", good("IN")(0xF023));
            it("should handle PUTSP", good("PUTSP")(0xF024));
            it("should handle HALT", good("HALT")(0xF025));

            it("should reject a GETC with an operand",
                bad("GETC x11")(/operand/));
            it("should reject a OUT with an operand",
                bad("OUT x11")(/operand/));
            it("should reject a PUTS with an operand",
                bad("PUTS x11")(/operand/));
            it("should reject a IN with an operand",
                bad("IN x11")(/operand/));
            it("should reject a PUTSP with an operand",
                bad("PUTSP x11")(/operand/));
            it("should reject a HALT with an operand",
                bad("HALT x11")(/operand/));
        });

    });

    describe("helper generateMachineCode", () => {
        const {good, bad} = makeTesters(helpers.generateMachineCode);

        it("should parse the empty program (with .ORIG and .END only)",
            good([[".ORIG", "x3000"], [".END"]], {}, 0x3000, 1)([]));

        it("should parse a program to just clear R0", good([
            [/* ; clear R0 */],
            [".ORIG", "x3000"],
            ["AND", "R0", "R0", "x0000"],
            [".END"],
        ], {}, 0x3000, 2)([0b0101000000100000]));

        it("should parse a simple program with labels", good([
            [], [], [],  // a few lines of comments
            [".ORIG x4000"], [],
            ["AND", "R0", "R0", "#0"],
            ["ADD", "R1", "R0", "#10"],
            ["LD", "R2", "FortyTwo"],
            ["Loop", "ADD", "R0", "R0", "R2"],
            ["ADD", "R1", "R1", "#-1"],
            ["BRp", "Loop"],
            ["HALT"],
            ["FortyTwo", ".FILL", "#42"],
            [".END"],
        ], {"Loop": 0x4003, "FortyTwo": 0x4007}, 0x4000, 4)([
            0b0101000000100000,
            0b0001001000101010,
            0b0010010000000100,
            0b0001000000000010,
            0b0001001001111111,
            0b0000001111111101,
            0b1111000000100101,
            42,
        ]));

        it("should ignore anything after the .END directive", good([
            [".ORIG", "x3000"],
            [".FILL", "xAFAF"],
            [".END"],
            [".FILL", "xAFAF"],
        ], {}, 0x3000, 1)([0xAFAF]));

        it("should handle some basic strings and I/O", good([
            [".ORIG", "x3000"],
            ["LEA", "R0", "Prompt"],
            ["PUTS"],
            ["GETC"],
            ["ADD", "R0", "R0", "#1"],
            ["OUT"],
            ["LD", "R0", "Exclamation"],
            ["OUT"],
            ["HALT"],
            ["Prompt", ".STRINGZ", "press a key\n> "],
            ["Exclamation", ".FILL", "x21"],
            [".END"],
        ], { "Prompt": 0x3008, "Exclamation": 0x3017 }, 0x3000, 1)([
            0b1110000000000111,
            0b1111000000100010,
            0b1111000000100000,
            0b0001000000100001,
            0b1111000000100001,
            0b0010000000010001,
            0b1111000000100001,
            0b1111000000100101,
            // p  r     e     s     s     <Sp>
            0x70, 0x72, 0x65, 0x73, 0x73, 0x20,
            // a  <Sp>  k     e     y
            0x61, 0x20, 0x6B, 0x65, 0x79,
            // newline, >, <Sp>, null-terminator
            0x0A, 0x3E, 0x20, 0,
            // "!"
            0x21,
        ]));

        it("should fail when there is no .END directive", bad([
            [".ORIG", "x3000"],
            [".FILL", "x1234"],
        ], {}, 0x3000, 1)(/\.END/));

    });

});
