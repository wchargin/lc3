import {expect} from 'chai';
import {fromJS, List, Map} from 'immutable';

import Constants from '../../src/core/constants';

describe('Constants', () => {

    describe('Constants.REGISTER_NAMES', () => {
        const names = Constants.REGISTER_NAMES;

        it("should exist", () => {
            expect(names).to.be.ok;
        });

        it("should have an 'all' field", () => {
            expect(names.get("all")).to.be.ok;
        });

        it("should have 'all' be the union of all other fields", () => {
            const all = names.get("all");
            names.forEach(list => {
                expect(list.isSubset(all)).to.be.true;
            });
        });
    });

});
