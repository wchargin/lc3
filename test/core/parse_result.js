import {describe, it} from 'mocha';
import {expect} from 'chai';

import LC3Program from '../../src/core/program';
import ParseResult from '../../src/core/parse_result';

describe('ParseResult', () => {

    describe('constructor', () => {

        it("should accept a successful parse", () => {
            const program = new LC3Program({
                orig: 0x3000,
                machineCode: [0x1234, 0xFEDC],
                symbolTable: {"START": 0x3001},
            });
            const pr = new ParseResult({
                success: true,
                program,
            });

            expect(pr).to.be.ok;
            expect(pr.success).to.be.true;
            expect(pr.program).to.equal(program);
            expect(pr.errorMessage).to.be.null;
        });

        it("should discard error message in a successful parse", () => {
            const program = new LC3Program({
                orig: 0x3000,
                machineCode: [0x1234, 0xFEDC],
                symbolTable: {"START": 0x3001},
            });
            const pr = new ParseResult({
                success: true,
                errorMessage: "Yay! It works!",
                program,
            });

            expect(pr).to.be.ok;
            expect(pr.success).to.be.true;
            expect(pr.program).to.equal(program);
            expect(pr.errorMessage).to.be.null;
        });

        it("should accept a failed parse", () => {
            const pr = new ParseResult({
                success: false,
                errorMessage: "You made a mistake!",
            });

            expect(pr).to.be.ok;
            expect(pr.success).to.be.false;
            expect(pr.errorMessage).to.equal("You made a mistake!");
            expect(pr.program).to.be.null;
        });

        it("should discard program in a failed parse", () => {
            const pr = new ParseResult({
                success: false,
                errorMessage: "You made a mistake!",
                program: new LC3Program(),
            });

            expect(pr).to.be.ok;
            expect(pr.success).to.be.false;
            expect(pr.errorMessage).to.equal("You made a mistake!");
            expect(pr.program).to.be.null;
        });

        it("should fail when no parameters are passed", () => {
            expect(() => new ParseResult()).to.throw(Error);
        });

        it("should fail when 'success' is not a boolean", () => {
            expect(() => new ParseResult({
                success: "success",
                program: new LC3Program(),
            })).to.throw(/success/);
        });

        it("should fail when we're missing a program", () => {
            expect(() => new ParseResult({
                success: true,
            })).to.throw(/program/);
        });

        it("should fail when the program isn't an LC3Program", () => {
            expect(() => new ParseResult({
                success: true,
                program: [0x1234, 0x2345],
            })).to.throw(/program/);
        });

        it("should fail when we're missing an error message", () => {
            expect(() => new ParseResult({
                success: false,
            })).to.throw(/errorMessage/);
        });

        it("should fail when the error message isn't a string", () => {
            expect(() => new ParseResult({
                success: false,
                errorMessage: ["one thing", "two things"],
            })).to.throw(/errorMessage/);
        });

    });

    describe('fromJS', () => {

        it("deserializes JavaScript objects properly", () => {
            const pr = ParseResult.fromJS({
                success: true,
                errorMessage: null,
                program: {
                    orig: 0x3000,
                    machineCode: [0x1234, 0xFEDC],
                    symbolTable: {"START": 0x3001},
                },
            });

            expect(pr).to.be.ok;
            expect(pr.success).to.be.true;
            expect(pr.errorMessage).to.be.null;
            expect(pr.program).to.be.an.instanceof(LC3Program);
            expect(pr.program.orig).to.equal(0x3000);
            expect(pr.program.machineCode.toJS()).to.deep.equal(
                [0x1234, 0xFEDC]);
            expect(pr.program.symbolTable.toJS()).to.deep.equal(
                {"START": 0x3001});
        });

    });

});
