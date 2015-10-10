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

        it("starts with an empty console buffer", () => {
            const consoleBuffer = lc3.consoleBuffer;
            expect(consoleBuffer).to.equal("");
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

    describe('step', () => {

        const lc3 = new LC3();
        const execute = (instruction, lc3 = new LC3()) => lc3
            .setIn(["memory", lc3.registers.pc], instruction)
            .step();

        describe("should handle ADD", () => {

            it("in immediate-mode with a positive argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 10);
                const instruction = 0b0001011010100001;  // ADD R3, R2, #1
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(10);
                expect(newMachine.registers.r3).to.equal(11);
            });

            it("in immediate-mode with a negative argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 10);
                const instruction = 0b0001011010111000;  // ADD R3, R2, #-8
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(10);
                expect(newMachine.registers.r3).to.equal(2);
            });

            it("in immediate-mode with a negative result", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 4);
                const instruction = 0b0001011010111000;  // ADD R3, R2, #-8
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(4);
                expect(newMachine.registers.r3).to.equal(-4 + 0x10000);
            });

            it("in register mode", () => {
                const oldMachine = lc3.update("registers", rs =>
                    rs.setNumeric(4, 0x89).setNumeric(5, 0xAB));
                const instruction = 0b0001111100000101;  // ADD R7, R4, R5
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r4).to.equal(0x89);
                expect(newMachine.registers.r5).to.equal(0xAB);
                expect(newMachine.registers.r7).to.equal(0x89 + 0xAB);
            });

        });

        describe("should handle AND", () => {

            it("in immediate-mode with a positive argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 0b1010);
                const instruction = 0b0101011010100011;  // AND R3, R2, x3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(0b1010);
                expect(newMachine.registers.r3).to.equal(0b0010);
            });

            it("in immediate-mode with a negative argument", () => {
                const oldMachine = lc3.setIn(["registers", "r2"], 0b1010);
                const instruction = 0b0101011010111100;  // ADD R3, R2, x-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r2).to.equal(0b1010);
                expect(newMachine.registers.r3).to.equal(0b1000);
            });

            it("in register mode", () => {
                const oldMachine = lc3.update("registers", rs =>
                    rs.setNumeric(4, 0xABCD).setNumeric(5, 0xBCDE));
                const instruction = 0b0101111100000101;  // AND R7, R4, R5
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.r4).to.equal(0xABCD);
                expect(newMachine.registers.r5).to.equal(0xBCDE);
                expect(newMachine.registers.r7).to.equal(0xABCD & 0xBCDE);
            });

        });

        describe("should handle BR0 (unconditional \"don't branch\")", () => {
            [0x8004, 0x8002, 0x8001].forEach(psr => {
                const oldMachine = lc3.setIn(["registers", "psr"], psr);
                const instruction = 0b0000000000001000;  // BR 0x10
                const newMachine = execute(instruction, oldMachine);
                it("when the PSR is " + toHexString(psr), () =>
                    expect(newMachine.registers.pc).to.equal(
                        oldMachine.registers.pc + 1));
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
                   `when the PSR is ${toHexString(psr)}`, () =>
                    expect(newMachine.registers.pc).to.equal(expectedPC));
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
                   `when the PSR is ${toHexString(psr)}`, () =>
                    expect(newMachine.registers.pc).to.equal(expectedPC));
            };
            test(0x8004, false);
            test(0x8002, true);
            test(0x8001, false);
        });

        describe("should handle JMP", () => {

            it("as JMP R3", () => {
                const oldMachine = lc3.setIn(["registers", "r3"], 0x1234);
                const instruction = 0b1100000011000000;  // JMP R3
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x1234);
            });

            it("as JMP R7 (RET)", () => {
                const oldMachine = lc3.setIn(["registers", "r7"], 0xFDEC);
                const instruction = 0b1100000111000000;  // JMP R7 (RET)
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0xFDEC);
            });

        });

        describe("should handle subroutine instructions", () => {

            it("such as JSR", () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .setNumeric(7, 0x8888)
                    .set("pc", 0x3333));
                const instruction = 0b0100111111111100;  // JSR #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3330);
                expect(newMachine.registers.r7).to.equal(0x3334);
            });

            it("such as JSRR", () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .setNumeric(4, 0x6666)
                    .setNumeric(7, 0x8888)
                    .set("pc", 0x9999));
                const instruction = 0b0100000100000000;  // JSRR R4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x6666);
                expect(newMachine.registers.r7).to.equal(0x999A);
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
            });

            it("such as LDI", () => {
                const oldMachine = lc3
                    .update("memory", m => m
                        .set(0x3330, 0x2345)
                        .set(0x2345, 0x3456))
                    .update("registers", rs => rs
                        .setNumeric(3, 0x2222)
                        .set("pc", 0x3333));
                const instruction = 0b1010011111111100;  // LDI R3, #-4
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(0x3334);
                expect(newMachine.registers.r3).to.equal(0x3456);
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
            });

        });

        describe("should handle LEA", () => {

            const test = (instruction, pc, expected) => () => {
                const oldMachine = lc3.update("registers", rs => rs
                    .set("pc", pc)
                    .setNumeric(1, 0x0000));
                const newMachine = execute(instruction, oldMachine);
                expect(newMachine.registers.pc).to.equal(pc + 1);
                expect(newMachine.registers.r1).to.equal(expected);
            };

            // Sample LEA instructions with positive and negative offsets.
            const positive = 0b1110001000010000;  // LEA R1, #16
            const negative = 0b1110001111110000;  // LEA R1, #-16

            it("with a positive offset", test(positive, 0x7FFE, 0x800F));
            it("with a negative offset", test(negative, 0x800E, 0x7FFF));
            it("when underflowing", test(negative, 0x0002, 0xFFF3));
            it("when overflowing", test(positive, 0xFFF0, 0x0001));

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

        });

    });

    describe('step-many', () => {

        it("should be able to step through consecutive instructions", () => {
            const instructions = [
                0b0101000000100000,  // AND R0, R0, #0
                0b0001001000100100,  // ADD R1, R0, #4
                0b0001010000100110,  // ADD R2, R0, #6
                0b0001000001000010,  // ADD R0, R1, R2
                0b1001000000111111,  // NOT R0, R0
            ];
            const oldMachine = new LC3()
                .loadProgram(Map({
                    orig: 0x4000,
                    machineCode: List(instructions),
                }))
                .update("registers", rs => rs
                    .setNumeric(0, 123)
                    .setNumeric(1, 234)
                    .setNumeric(2, 345));
            const newMachine = oldMachine.step(5);
            expect(newMachine.registers.pc).to.equal(0x4005);
            expect(newMachine.registers.r0).to.equal(0xFFF5);
            expect(newMachine.registers.r1).to.equal(0x0004);
            expect(newMachine.registers.r2).to.equal(0x0006);
        });

        it("should be able to branch based on condition codes", () => {
            const instructions = [
                // R1 = 0; for (R0 = 3; R0 > 0; R0--) R1 += 10;
                0b0101001001100000,  // AND R1, R1, #0
                0b0001000001100011,  // ADD R0, R0, #3
                0b0001001001101010,  // ADD R1, R1, #10
                0b0001000000111111,  // ADD R0, R0, #-1
                0b0000001111111101,  // BRzp #-3
            ];
            const oldMachine = new LC3()
                .loadProgram(Map({
                    orig: 0x4000,
                    machineCode: List(instructions),
                }))
                .update("registers", rs => rs
                    .setNumeric(0, 123)
                    .setNumeric(1, 234)
                    .setNumeric(2, 345));

            const initializationSteps = 2;
            const eachLoopSteps = 3;
            const loopIterations = 3;
            const steps = initializationSteps + eachLoopSteps * loopIterations;
            const newMachine = oldMachine.step(steps);

            expect(newMachine.registers.pc).to.equal(0x4005);
            expect(newMachine.registers.r0).to.equal(0x0000);
            expect(newMachine.registers.r1).to.equal(30);
        });

    });

});
