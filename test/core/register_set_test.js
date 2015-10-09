import {describe, it} from 'mocha';
import {expect} from 'chai';

import RegisterSet from '../../src/core/register_set';

describe('RegisterSet', () => {

    describe('getNumeric', () => {
        const rs = new RegisterSet();

        it("gets R0 with the default value", () => {
            expect(rs.getNumeric(0)).to.equal(0);
        });

        it("gets R1 after setting it manually", () => {
            expect(rs.set("r1", 2).getNumeric(1)).to.equal(2);
        });

        it("gets R2's default after setting R1 manually", () => {
            expect(rs.set("r1", 2).getNumeric(2)).to.equal(0);
        });

        it("throws on the non-existent R8", () => {
            expect(() => rs.getNumeric(8)).to.throw(Error);
        });

        it("throws on the non-existent R(-1)", () => {
            expect(() => rs.getNumeric(-1)).to.throw(Error);
        });
    });

    describe('setNumeric', () => {
        const rs = new RegisterSet();

        it("sets R0 from a clean slate", () => {
            expect(rs.setNumeric(0, 10).get("r0")).to.equal(10);
        });

        it("sets R1 after setting it manually", () => {
            expect(rs.set("r1", 2).setNumeric(1, 3).get("r1")).to.equal(3);
        });

        it("sets R2 after setting R1 manually", () => {
            const rs2 = rs.set("r1", 100).setNumeric(2, 200);
            expect(rs2.get("r1")).to.equal(100);
            expect(rs2.get("r2")).to.equal(200);
        });

        it("throws on the non-existent R8", () => {
            expect(() => rs.setNumeric(8)).to.throw(Error);
        });

        it("throws on the non-existent R(-1)", () => {
            expect(() => rs.setNumeric(-1)).to.throw(Error);
        });
    });

});
