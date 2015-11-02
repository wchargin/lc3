import {describe, it} from 'mocha';
import {expect} from 'chai';

import {Map, List} from 'immutable';

import Constants from '../../src/core/constants';
import LC3, { getConditionCode, formatConditionCode } from '../../src/core/lc3';
import LC3Program from '../../src/core/program';
import RegisterSet from '../../src/core/register_set';
import {toHexString} from '../../src/core/utils';

describe('LC3', () => {

    describe("the LC3 constructor", () => {

        const lc3 = new LC3();

        it("creates some sort of thing", () => {
            expect(lc3).to.be.ok;
        });

        it("has a memory buffer of the right length", () => {
            const memory = lc3.memory;
            expect(memory.size).to.equal(Constants.MEMORY_SIZE);
        });

        it("has the right number of registers", () => {
            const registers = lc3.registers;
            expect(registers.size).to.equal(
                RegisterSet.allRegisterNames.length);
        });

        it("has the program counter set to 0x3000", () => {
            expect(lc3.registers.pc).to.equal(0x3000);
        });

        it("has a symbol table", () => {
            const symbolTable = lc3.symbolTable;
            expect(symbolTable).to.be.ok;
        });

        it("starts with an empty stdin and stdout", () => {
            expect(lc3.console.get("stdin")).to.equal("");
            expect(lc3.console.get("stdout")).to.equal("");
        });

    });

    describe('loadProgram', () => {
        const lc3 = new LC3();

        it("merges machine code", () => {
            const data = new LC3Program({
                orig: 0x3000,
                machineCode: List([0x5260, 0x1468, 0x1262, 0x1642]),
            });
            const newLC3 = lc3.loadProgram(data);

            expect(newLC3).to.be.ok;
            expect(newLC3.memory.slice(0x2FFE, 0x3006)).
                to.equal(List([0, 0, 0x5260, 0x1468, 0x1262, 0x1642, 0, 0]));

            const data2 = new LC3Program({
                orig: 0x3002,
                machineCode: List([0xABCD, 0xBCDE, 0xCDEF]),
            });
            const newerLC3 = newLC3.loadProgram(data2);

            expect(newerLC3).to.be.ok;
            expect(newerLC3.memory.slice(0x2FFE, 0x3006)).
                to.equal(List(
                    [0, 0, 0x5260, 0x1468, 0xABCD, 0xBCDE, 0xCDEF, 0]
                ));
        });

        it("merges a symbol table", () => {
            const data = new LC3Program({
                orig: 0x3000,
                machineCode: List([]),
                symbolTable: Map({
                    "START": 0x3000,
                    "DATA": 0x3100,
                }),
            });
            const newLC3 = lc3.loadProgram(data);

            expect(newLC3).to.be.ok;
            expect(newLC3.symbolTable.get("START")).to.equal(0x3000);
            expect(newLC3.symbolTable.get("DATA")).to.equal(0x3100);

            const data2 = new LC3Program({
                orig: 0x3002,
                machineCode: List([]),
                symbolTable: Map({
                    "DATA": 0x3200,
                    "MORE": 0x3300,
                }),
            });
            const newerLC3 = newLC3.loadProgram(data2);

            expect(newerLC3).to.be.ok;
            expect(newerLC3.symbolTable.get("START")).to.equal(0x3000);
            expect(newerLC3.symbolTable.get("DATA")).to.equal(0x3200);
            expect(newerLC3.symbolTable.get("MORE")).to.equal(0x3300);
        });

        it("jumps the PC when merging machine code", () => {
            const data = new LC3Program({
                orig: 0x4321,
                machineCode: List([0x5260, 0x1468, 0x1262, 0x1642]),
                symbolTable: {
                    "HELLO": 0x1234,
                },
            });
            const newLC3 = lc3.setIn(["registers", "pc"], 0x1111)
                .loadProgram(data);

            expect(newLC3).to.be.ok;
            expect(newLC3.registers.pc).to.equal(0x4321);
        });

        it("leaves the PC alone when not merging machine code", () => {
            const data = new LC3Program({
                orig: 0x4321,
                machineCode: List([]),
                symbolTable: {
                    "HELLO": 0x1234,
                },
            });
            const newLC3 = lc3.setIn(["registers", "pc"], 0x1111)
                .loadProgram(data);

            expect(newLC3).to.be.ok;
            expect(newLC3.registers.pc).to.equal(0x1111);
        });

    });

    describe('formatAddress', () => {

        const lc3 = new LC3({
            symbolTable: Map({
                "START": 0x3001,
                "DATA": 0x4000,
                "STUFF": 0x4000,
            }),
        });

        it("should return an unsigned hex string when no label exists", () => {
            expect(lc3.formatAddress(0x9000)).to.equal("x9000");
        });

        it("should return the unique label when there is one", () => {
            expect(lc3.formatAddress(0x3001)).to.equal("START");
        });

        it("should return the unique label when there is one", () => {
            expect(["DATA", "STUFF"]).to.contain(lc3.formatAddress(0x4000));
        });

    });

    describe('getConditionCode', () => {
        const lc3 = new LC3();

        const test = (psr, expectedCC) => () => {
            expect(lc3
                .update("registers", rs => rs.set("psr", psr))
                .getConditionCode()).to.equal(expectedCC);
        };

        it("works when the condition code is negative", test(0x8004, -1));
        it("works when the condition code is zero", test(0x8002, 0));
        it("works when the condition code is positive", test(0x8001, 1));

        it("works when the first few PSR bits are non-standard",
            test(0b1010111100001001, 1));

        it("works when invalid (unset)", test(0x8000, null));
        it("works when invalid (multiple)", test(0x8007, null));
    });

    describe('formatConditionCode', () => {
        const lc3 = new LC3();

        const test = (psr, expectedCC) => () => {
            expect(lc3
                .update("registers", rs => rs.set("psr", psr))
                .formatConditionCode()).to.equal(expectedCC);
        };

        it("works when the condition code is negative", test(0x8004, "N"));
        it("works when the condition code is zero", test(0x8002, "Z"));
        it("works when the condition code is positive", test(0x8001, "P"));

        it("works when the first few PSR bits are non-standard",
            test(0b1010111100001001, "P"));

        it("works when invalid (unset)", test(0x8000, "Invalid"));
        it("works when invalid (multiple)", test(0x8007, "Invalid"));
    });

    describe('step', () => {

        const lc3 = new LC3();
        const execute = (instruction, lc3 = new LC3()) => lc3
            .setIn(["memory", lc3.registers.pc], instruction)
            .step();
        const expectIO = (machine, whether) =>
            expect(machine.batchState.interactedWithIO).to.equal(whether);

        describe("should handle ADD", () => {

            it("in immediate-mode with a positive argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 10);
                const instruction = 0b0001011010100001;  // ADD R3, R2, #1
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(10);
                expect(newMachine.registers.r3).to.equal(11);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("in immediate-mode with a negative argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 10);
                const instruction = 0b0001011010111000;  // ADD R3, R2, #-8
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(10);
                expect(newMachine.registers.r3).to.equal(2);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("in immediate-mode with a negative result", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 4);
                const instruction = 0b0001011010111000;  // ADD R3, R2, #-8
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(4);
                expect(newMachine.registers.r3).to.equal(-4 + 0x10000);
                expect(newMachine.getConditionCode()).to.equal(-1);
                expectIO(newMachine, false);
            });

            it("in register mode", () => {
                const oldMachine = lc3.update("registers", rs =>
                    rs.setNumeric(4, 0x89).setNumeric(5, 0xAB));
                const instruction = 0b0001111100000101;  // ADD R7, R4, R5
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r4).to.equal(0x89);
                expect(newMachine.registers.r5).to.equal(0xAB);
                expect(newMachine.registers.r7).to.equal(0x89 + 0xAB);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

        });

        describe("should handle AND", () => {

            it("when used to clear a register", () => {
                const oldMachine = lc3.setIn(["registers", "r3"], 0b1010);
                const instruction = 0b0101011011100000;  // AND R3, R3, #0
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r3).to.equal(0);
                expect(newMachine.getConditionCode()).to.equal(0);
                expectIO(newMachine, false);
            });

            it("in immediate-mode with a positive argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 0b1010);
                const instruction = 0b0101011010100011;  // AND R3, R2, x3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(0b1010);
                expect(newMachine.registers.r3).to.equal(0b0010);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("in immediate-mode with a negative argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 0b1010);
                const instruction = 0b0101011010111100;  // ADD R3, R2, x-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(0b1010);
                expect(newMachine.registers.r3).to.equal(0b1000);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("in register mode", () => {
                const oldMachine = lc3.update("registers", rs =>
                    rs.setNumeric(4, 0xABCD).setNumeric(5, 0xBCDE));
                const instruction = 0b0101111100000101;  // AND R7, R4, R5
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r4).to.equal(0xABCD);
                expect(newMachine.registers.r5).to.equal(0xBCDE);
                expect(newMachine.registers.r7).to.equal(0xABCD & 0xBCDE);
                expect(newMachine.getConditionCode()).to.equal(-1);
                expectIO(newMachine, false);
            });

        });

        describe("should handle BR0 (unconditional \"don't branch\")", () => {
            [0x8004, 0x8002, 0x8001].forEach(psr => {
                const oldMachine = lc3.setIn(["registers", "psr"], psr);
                const instruction = 0b0000000000001000;  // BR 0x10
                const newMachine = execute(instruction, oldMachine);
                it("when the PSR is " + toHexString(psr), () => {
                    expect(newMachine.registers.pc).to.equal(
                        oldMachine.registers.pc + 1)
                    expectIO(newMachine, false);
                });
            });
        });

        describe("should handle BRnp", () => {
            const test = (psr, shouldGo) => {
                const oldMachine = lc3.setIn(["registers", "psr"], psr);
                const instruction = 0b0000101000010000;  // BRnp 0x10
                const newMachine = execute(instruction, oldMachine);

                const expectedPC = oldMachine.registers.pc +
                    (shouldGo ? 0x11 : 0x01);

                it(`by ${shouldGo ? "branching" : "not branching"} ` +
                   `when the PSR is ${toHexString(psr)}`,
                   () => {
                       expect(newMachine.registers.pc).to.equal(expectedPC);
                       expectIO(newMachine, false);
                   });
            };
            test(0x8004, true);
            test(0x8002, false);
            test(0x8001, true);
        });

        describe("should handle BRz", () => {
            const test = (psr, shouldGo) => {
                const oldMachine = lc3.setIn(["registers", "psr"], psr);
                const instruction = 0b0000010000010000;  // BRz 0x10
                const newMachine = execute(instruction, oldMachine);

                const expectedPC = oldMachine.registers.pc +
                    (shouldGo ? 0x11 : 0x01);

                it(`by ${shouldGo ? "branching" : "not branching"} ` +
                   `when the PSR is ${toHexString(psr)}`,
                   () => {
                       expect(newMachine.registers.pc).to.equal(expectedPC);
                       expectIO(newMachine, false);
                   });
            };
            test(0x8004, false);
            test(0x8002, true);
            test(0x8001, false);
        });

        describe("should handle JMP", () => {

            it("as JMP R3", () => {
                const oldMachine = lc3
                    .setIn(["registers", "r3"], 0x1234)
                    .setIn(["batchState", "currentSubroutineLevel"], 10);
                const instruction = 0b1100000011000000;  // JMP R3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x1234);
                expect(newMachine.batchState.currentSubroutineLevel)
                    .to.equal(10);  // no change (not a RET)
                expectIO(newMachine, false);
            });

            it("as JMP R7 (RET)", () => {
                const oldMachine = lc3
                    .setIn(["registers", "r7"], 0xFDEC)
                    .setIn(["batchState", "currentSubroutineLevel"], 10);
                const instruction = 0b1100000111000000;  // JMP R7 (RET)
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0xFDEC);
                expect(newMachine.batchState.currentSubroutineLevel)
                    .to.equal(9);
                expectIO(newMachine, false);
            });

        });

        describe("should handle subroutine instructions", () => {

            it("such as JSR", () => {
                const oldMachine = lc3
                    .update("registers", rs => rs
                        .setNumeric(7, 0x8888)
                        .set("pc", 0x3333))
                    .setIn(["batchState", "currentSubroutineLevel"], 10);
                const instruction = 0b0100111111111100;  // JSR #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3330);
                expect(newMachine.registers.r7).to.equal(0x3334);
                expect(newMachine.batchState.currentSubroutineLevel)
                    .to.equal(11);
                expectIO(newMachine, false);
            });

            it("such as JSRR", () => {
                const oldMachine = lc3
                    .update("registers", rs => rs
                        .setNumeric(4, 0x6666)
                        .setNumeric(7, 0x8888)
                        .set("pc", 0x9999))
                    .setIn(["batchState", "currentSubroutineLevel"], 10);
                const instruction = 0b0100000100000000;  // JSRR R4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x6666);
                expect(newMachine.registers.r7).to.equal(0x999A);
                expect(newMachine.batchState.currentSubroutineLevel)
                    .to.equal(11);
                expectIO(newMachine, false);
            });

        });

        describe("should handle loading instructions", () => {

            it("such as LD", () => {
                const oldMachine = lc3
                    .update("memory", m => m.set(0x3330, 0x2345))
                    .update("registers", rs => rs
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b0010011111111100;  // LD R3, #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r3).to.equal(0x2345);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("such as LDI", () => {
                const oldMachine = lc3
                    .update("memory", m => m
                        .set(0x3330, 0x2345)
                        .set(0x2345, 0x890A))
                    .update("registers", rs => rs
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b1010011111111100;  // LDI R3, #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r3).to.equal(0x890A);
                expect(newMachine.getConditionCode()).to.equal(-1);
                expectIO(newMachine, false);
            });

            it("such as LDR", () => {
                const oldMachine = lc3
                    .update("memory", m => m.set(0x1234, 0x2345))
                    .update("registers", rs => rs
                        .setNumeric(1, 0x1235)
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b0110011001111111;  // LDR R3, R1, #-1
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r1).to.equal(0x1235);
                expect(newMachine.registers.r3).to.equal(0x2345);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

        });

        describe("should handle LEA", () => {

            const test = (instruction, pc, expected, expectedCC) => () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .set("pc", pc)
                    .setNumeric(1, 0x1234));
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(pc + 1);
                expect(newMachine.registers.r1).to.equal(expected);
                expect(newMachine.getConditionCode()).to.equal(expectedCC);
                expectIO(newMachine, false);
            };

            // Sample LEA instructions with positive and negative offsets.
            const positive = 0b1110001000010000;  // LEA R1, #16
            const negative = 0b1110001111110000;  // LEA R1, #-16

            it("with a positive offset", test(positive, 0x7FFE, 0x800F, -1));
            it("with a negative offset", test(negative, 0x800E, 0x7FFF, 1));
            it("when underflowing", test(negative, 0x0002, 0xFFF3, -1));
            it("when overflowing", test(positive, 0xFFF0, 0x0001, 1));
            it("when setting to zero", test(positive, 0xFFEF, 0x0000, 0));

        });

        describe("should handle NOT", () => {

            it("when the output is positive", () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .setNumeric(2, 0b1010101010101010)
                    .setNumeric(3, 0x0000));
                const instruction = 0b1001011010111111;  // NOT R2, R3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2)
                    .to.equal(0b1010101010101010);
                expect(newMachine.registers.r3)
                    .to.equal(0b0101010101010101);
                expect(newMachine.getConditionCode()).to.equal(1);
                expectIO(newMachine, false);
            });

            it("when the output is negative", () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .setNumeric(2, 0b0101010101010101)
                    .setNumeric(3, 0x0000));
                const instruction = 0b1001011010111111;  // NOT R2, R3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2)
                    .to.equal(0b0101010101010101);
                expect(newMachine.registers.r3)
                    .to.equal(0b1010101010101010);
                expect(newMachine.getConditionCode()).to.equal(-1);
                expectIO(newMachine, false);
            });

        });

        describe("should handle storing instructions", () => {

            it("such as ST", () => {
                const oldMachine = lc3
                    .update("memory", m => m.set(0x3330, 0x2345))
                    .update("registers", rs => rs
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b0011011111111100;  // ST R3, #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r3).to.equal(0x2222);
                expect(newMachine.memory.get(0x3330)).to.equal(0x2222);
                expectIO(newMachine, false);
            });

            it("such as STI", () => {
                const oldMachine = lc3
                    .update("memory", m => m
                        .set(0x3330, 0x2345)
                        .set(0x2345, 0x3456))
                    .update("registers", rs => rs
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b1011011111111100;  // STI R3, #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r3).to.equal(0x2222);
                expect(newMachine.memory.get(0x3330)).to.equal(0x2345);
                expect(newMachine.memory.get(0x2345)).to.equal(0x2222);
                expectIO(newMachine, false);
            });

            it("such as STR", () => {
                const oldMachine = lc3
                    .update("memory", m => m.set(0x1234, 0x2345))
                    .update("registers", rs => rs
                        .setNumeric(1, 0x1235)
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b0111011001111111;  // STR R3, R1, #-1
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r1).to.equal(0x1235);
                expect(newMachine.registers.r3).to.equal(0x2222);
                expect(newMachine.memory.get(0x1234)).to.equal(0x2222);
                expectIO(newMachine, false);
            });

        });

        describe("should handle TRAP", () => {

            const oldMachine = lc3
                .update("memory", m => m.set(0x0020, 0x0234))
                .update("registers", rs => rs
                    .set("pc", 0x3333)
                    .setNumeric(7, 0x8888));
            const instruction = 0b1111000000100000;  // TRAP x20
            const newMachine = execute(instruction, oldMachine);

            it("and set the PC to " +
                "the address stored in the trap vector table", () =>
                expect(newMachine.registers.pc).to.equal(0x0234));

            it("and set R7 to the return address", () =>
                expect(newMachine.registers.r7).to.equal(0x3334));

            it("without triggering an I/O interaction", () =>
                expectIO(newMachine, false));

        });

        describe("in managing the KBSR and KBDR", () => {
            const {KBSR, KBDR} = Constants.HARDWARE_ADDRESSES;
            const result1 = execute(
                0b0001000000100001,  // ADD R0, R0, #1
                lc3
                    .update("console", c => c.set("stdin","Hello"))
                    .update("memory", m => m
                        .set(KBSR, 0x1234)
                        .set(KBDR, 0x5555)));

            it("should process an instruction and KBSR/KBDR together", () =>
                expect(result1.registers.r0).to.equal(lc3.registers.r0 + 1));
            it("should set the high bit of the KBSR", () =>
                expect(result1.memory.get(KBSR)).to.equal(0x1234 | 0x8000));
            it("should set the least significant byte of the KBDR", () =>
                expect(result1.memory.get(KBDR)).to.equal(0x5548));
            it("should take a character off the stdin buffer", () =>
                expect(result1.getIn(["console", "stdin"])).to.equal("ello"));


            // Nothing more should happen.
            const result2 = execute(0b0001000000100001,
                result1.setIn(["memory", KBSR], 0x89AB));

            it("should process an instruction when the KBSR is ready", () =>
                expect(result2.registers.r0).to.equal(
                    result1.registers.r0 + 1));
            it("should not touch the KBSR while it is ready", () =>
                expect(result2.memory.get(KBSR)).to.equal(0x89AB));
            it("should not touch the KBDR while the KBSR is ready", () =>
                expect(result2.memory.get(KBDR)).to.equal(0x5548));
            it("should not touch stdin while the KBSR is ready", () =>
                expect(result2.getIn(["console", "stdin"])).to.equal("ello"));
        });

        describe("in managing the DSR and DDR", () => {
            const {DSR, DDR} = Constants.HARDWARE_ADDRESSES;
            const result1 = execute(
                0b0001000000100001,  // ADD R0, R0, #1
                lc3
                    .update("console", c => c.set("stdout", "LC-"))
                    .update("memory", m => m
                        .set(DSR, 0x1234)
                        .set(DDR, 0x5533)));

            it("should process an instruction and DSR/DDR together", () =>
                expect(result1.registers.r0).to.equal(lc3.registers.r0 + 1));
            it("should set the high bit of the DSR", () =>
                expect(result1.memory.get(DSR)).to.equal(0x1234 | 0x8000));
            it("should push a character onto the stdout buffer", () =>
                expect(result1.getIn(["console", "stdout"])).to.equal("LC-3"));


            // Nothing more should happen.
            const result2 = execute(0b0001000000100001,
                result1.setIn(["memory", DSR], 0x89AB));

            it("should process an instruction when the DSR is ready", () =>
                expect(result2.registers.r0).to.equal(
                    result1.registers.r0 + 1));
            it("should not touch the DSR while it is ready", () =>
                expect(result2.memory.get(DSR)).to.equal(0x89AB));
            it("should not touch the DDR while the DSR is ready", () =>
                expect(result2.memory.get(DDR)).to.equal(0x5533));
            it("should not touch stdout while the DSR is ready", () =>
                expect(result2.getIn(["console", "stdout"])).to.equal("LC-3"));
        });

        describe("should properly watch memory-mapped device registers", () => {
            const {KBSR, KBDR, DSR, DDR} = Constants.HARDWARE_ADDRESSES;

            describe("and clear the KBSR when you read the KBDR", () => {
                const baseMachine = execute(
                    0x0000,  // NOP; just trigger the stdin handling
                    lc3.setIn(["console", "stdin"], "LC-3"));
                const [first, second] = [0x004C, 0x0043];  // 'L', 'C'

                it("via a LD", () => {
                    const instruction = 0b0010000011111111;  // LD R0, xFF
                    const pc = KBDR - 0x100;
                    const machine = baseMachine.setIn(["registers", "pc"], pc);
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.registers.r0).to.equal(first);
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8000);
                    expect(newMachine.memory.get(KBDR)).to.equal(second);
                    expectIO(newMachine, true);
                });

                it("via an LDR", () => {
                    const instruction = 0b0110000001000001;  // LDR R0, R1, #1
                    const machine = baseMachine.update("registers", rs => rs
                        .setNumeric(1, KBDR - 1));
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.registers.r0).to.equal(first);
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8000);
                    expect(newMachine.memory.get(KBDR)).to.equal(second);
                    expectIO(newMachine, true);
                });

                it("via an LDI whose final address is the KBDR", () => {
                    const instruction = 0b1010000000000000;  // LDI R0, #0
                    const machine = baseMachine.setIn(
                        ["memory", baseMachine.registers.pc + 1], KBDR);
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.registers.r0).to.equal(first);
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8000);
                    expect(newMachine.memory.get(KBDR)).to.equal(second);
                    expectIO(newMachine, true);
                });

                it("via an LDI that goes through the KBDR", () => {
                    const instruction = 0b1010000011111111;  // LDI R0, xFF
                    const pc = KBDR - 0x100;
                    const machine = baseMachine
                        .setIn(["registers", "pc"], pc)
                        .update("memory", m => m
                            .set(KBDR, KBSR)  // why not?
                            .set(KBSR, 0x8765));
                    const newMachine = execute(instruction, machine);

                    // The process should be:
                    //  1. Read KBDR as the first indirection.
                    //  2. Because the KBDR was read, clear the KBSR.
                    //  3. Use the address from the first read,
                    //     which is the value stored in the KBDR,
                    //     which is the address of the KBSR,
                    //     to perform the next read, reading the KBSR.
                    //     We should see the cleared value.
                    //  4. Automatically load another character from stdin,
                    //     readying the KBSR.
                    expect(newMachine.registers.r0).to.equal(0x0765);
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8765);
                    expect(newMachine.memory.get(KBDR)).to.equal(
                        0xFE00 | second);
                    expectIO(newMachine, true);
                });

                it("via an STI that goes through the KBDR", () => {
                    const instruction = 0b1011000011111111;  // STI R0, xFF
                    const pc = KBDR - 0x100;
                    const machine = baseMachine
                        .setIn(["registers", "pc"], pc)
                        .update("memory", m => m
                            .set(KBDR, 0x4000)
                            .set(KBSR, 0x8765));
                    const newMachine = execute(instruction, machine);

                    // The process should be:
                    //  1. Read KBDR as the first indirection.
                    //  2. Because the KBDR was read, clear the KBSR.
                    //  3. Use the address from the first read,
                    //     which is the value stored in the KBDR,
                    //     which is the address of the KBSR,
                    //     to perform the store, writing into x4000.
                    //  4. Automatically load another character from stdin,
                    //     readying the KBSR.
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8765);
                    expect(newMachine.memory.get(KBDR)).to.equal(
                        0x4000 | second);
                    expectIO(newMachine, true);
                });

                it("but not via LEAs, which don't really read memory", () => {
                    const instruction = 0b1110000011111111;  // LEA R0, xFF
                    const pc = KBDR - 0x100;
                    const machine = baseMachine.setIn(["registers", "pc"], pc);
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.registers.r0).to.equal(KBDR);
                    expect(newMachine.memory.get(KBSR)).to.equal(0x8000);
                    expect(newMachine.memory.get(KBDR)).to.equal(first);
                    expectIO(newMachine, false);
                });

            });

            describe("and clear the DSR when you write to the DDR", () => {
                const baseMachine = execute(
                    0x0000,  // NOP; just trigger the stdin handling
                    lc3
                        .setIn(["console", "stdout"], "LC-")
                        .update("registers", rs => rs.setNumeric(0, 0x0033)));

                it("via a ST", () => {
                    const instruction = 0b0011000011111111;  // ST R0, xFF
                    const pc = DDR - 0x100;
                    const machine = baseMachine.setIn(["registers", "pc"], pc);
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.console.get("stdout")).to.equal("LC-3");
                    expectIO(newMachine, true);
                });

                it("via a STR", () => {
                    const instruction = 0b0111000001000001;  // STR R0, R1, #1
                    const machine = baseMachine.update("registers", rs => rs
                        .setNumeric(1, DDR - 1));
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.console.get("stdout")).to.equal("LC-3");
                    expectIO(newMachine, true);
                });

                it("via an STI", () => {
                    const instruction = 0b1011000000000000;  // STI R0, #0
                    const pc = baseMachine.registers.pc;
                    const machine = baseMachine.setIn(["memory", pc + 1], DDR);
                    const newMachine = execute(instruction, machine);
                    expect(newMachine.console.get("stdout")).to.equal("LC-3");
                    expectIO(newMachine, true);
                });
            });

        });

    });

    describe("readMemory", () => {
        it("watches you read the KBDR and clears the KBSR", () => {
            const {KBSR, KBDR} = Constants.HARDWARE_ADDRESSES;
            const machine = new LC3()
                .update("memory", m => m
                    .set(KBSR, 0x9234)
                    .set(KBDR, 0x4321));
            expect(machine.readMemory(KBDR).memory.get(KBSR))
                .to.equal(0x1234);
        });
    });

    describe("writeMemory", () => {
        it("watches you write to the DDR and clears the DSR", () => {
            const {DSR, DDR} = Constants.HARDWARE_ADDRESSES;
            const machine = new LC3()
                .update("memory", m => m
                    .set(DSR, 0x9234)
                    .set(DDR, 0x4321));
            expect(machine.writeMemory(DDR, 0x4321).memory.get(DSR))
                .to.equal(0x1234);
        });
    });

    describe('formatInstructionAtAddress', () => {

        const lc3 = new LC3();

        const pc = 0x4000;
        const test = (instruction, expected, machine=lc3) => () => {
            expect(machine
                .setIn(["registers", "pc"], pc)
                .setIn(["memory", pc], instruction)
                .formatInstructionAtAddress(pc))
            .to.equal(expected);
        };

        it("should give NOP for 0x0000", test(0x0000, "NOP"));

        describe("should be capable of basic formatting", () => {

            it("for immediate-mode ADD",
                test(0b0001001010100111, "ADD R1, R2, #7"));
            it("for negative-immediate-mode ADD",
                test(0b0001001010111001, "ADD R1, R2, #-7"));
            it("for register-mode ADD",
                test(0b0001001010000101, "ADD R1, R2, R5"));

            it("for immediate-mode AND",
                test(0b0101001010100111, "AND R1, R2, #7"));
            it("for negative-immediate-mode AND",
                test(0b0101001010111001, "AND R1, R2, #-7"));
            it("for register-mode AND",
                test(0b0101001010000101, "AND R1, R2, R5"));

            it("for BR (break-never), which should be a NOP",
                test(0b0000000000000111, "NOP"));
            it("for BRz",
                test(0b0000010111111001, "BRz x3FFA"));
            it("for BRnp",
                test(0b0000101010101010, "BRnp x40AB"));

            it("for JMP R0", test(0b1100000000000000, "JMP R0"));
            it("for JMP R1", test(0b1100000001000000, "JMP R1"));
            it("for RET (JMP R7)", test(0b1100000111000000, "RET"));

            it("for JSR", test(0b0100100000101010, "JSR x402B"));
            it("for JSRR", test(0b0100000101000000, "JSRR R5"));

            it("for LD", test(0b0010000111111110, "LD R0, x3FFF"));
            it("for LDI", test(0b1010000000000111, "LDI R0, x4008"));
            it("for LDR", test(0b0110000001111111, "LDR R0, R1, #-1"));

            it("for LEA", test(0b1110111000000111, "LEA R7, x4008"));

            it("for NOT", test(0b1001010101111111, "NOT R2, R5"));

            it("for RTI", test(0b1000000000000000, "RTI"));

            it("for ST", test(0b0011000111111110, "ST R0, x3FFF"));
            it("for STI", test(0b1011000000000111, "STI R0, x4008"));
            it("for STR", test(0b0111000001111111, "STR R0, R1, #-1"));

            it("for TRAP", test(0b1111000010101111, "TRAP xAF"));

        });

        describe("should use the symbol table when appropriate", () => {
            const machine = lc3.update("symbolTable", st => st
                .set("HERE", 0x4000)     // current PC
                .set("THERE", 0x4010)    // not the current PC
                .set("GETLINE", 0x0030)  // user-defined TRAP instruction
            );

            it("for JSR", test(0b0100100000001111, "JSR THERE", machine));

            it("for LD", test(0b0010000111111111, "LD R0, HERE", machine));
            it("for LDI", test(0b1010001111111111, "LDI R1, HERE", machine));

            it("for LEA", test(0b1110111111111111, "LEA R7, HERE", machine));

            it("for ST", test(0b0011000000001111, "ST R0, THERE", machine));
            it("for STI", test(0b1011001000001111, "STI R1, THERE", machine));

            it("for TRAP", test(0b1111000000110000, "TRAP GETLINE", machine));
        });

        describe("should give .FILL when not strictValid", () => {

            it("for register-mode ADD",
                test(0b0001000111011000, ".FILL x11D8"));
            it("for register-mode AND",
                test(0b0101000111011000, ".FILL x51D8"));

            it("for 1-invalid JMP",
                test(0b1100111000000000, ".FILL xCE00"));
            it("for 2-invalid JMP",
                test(0b1100000000111111, ".FILL xC03F"));
            it("for 1,2-invalid JMP",
                test(0b1100111000111111, ".FILL xCE3F"));

            it("for 1-invalid RET",
                test(0b1100111111000000, ".FILL xCFC0"));
            it("for 2-invalid RET",
                test(0b1100000111111111, ".FILL xC1FF"));
            it("for 1,2-invalid RET",
                test(0b1100111111111111, ".FILL xCFFF"));

            it("for 1-invalid JSRR",
                test(0b0100011000000000, ".FILL x4600"));
            it("for 2-invalid JSRR",
                test(0b0100000000110011, ".FILL x4033"));
            it("for 1,2-invalid JSRR",
                test(0b0100011000110011, ".FILL x4633"));

            it("for NOT", test(0b1001010101000000, ".FILL x9540"));

            it("for RTI", test(0b1000100010001000, ".FILL x8888"));

            it("for TRAP", test(0b1111010100100101, ".FILL xF525"));

            it("for the reserved instruction",
                test(0b1101000000000001, ".FILL xD001"));

        });

        describe("should use special names for TRAP I/O", () => {

            const entries = {
                0xF020: "GETC",
                0xF021: "OUT",
                0xF022: "PUTS",
                0xF023: "IN",
                0xF024: "PUTSP",
                0xF025: "HALT",
            };

            Object.keys(entries).forEach(instruction => {
                const name = entries[instruction];
                it(`for ${name}`, test(instruction, name));
            });

        });

    });

});
