import {expect} from 'chai';
import {fromJS, List, Map} from 'immutable';

import Constants from '../../src/core/constants';

describe('Constants', () => {

    describe('Constants.REGISTER_NAMES', () => {
        const names = Constants.REGISTER_NAMES;

        it("exists", () => {
            expect(names).to.be.ok;
        });

        it("has an 'all' field", () => {
            expect(names.get("all")).to.be.ok;
        });

        it("has 'all' be the union of all other fields", () => {
            const all = names.get("all");
            names.forEach(list => {
                expect(list.isSubset(all)).to.be.true;
            });
        });
    });

});
