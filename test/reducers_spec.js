import {expect} from 'chai';

import reducer from '../src/reducers';

describe('reducer', () => {

    it("should provide an initial state", () => {
        const dummyAction = {
            type: "Ignore me; I'm not a real action",
        };

        const initialState = reducer(undefined, dummyAction);
        expect(initialState).to.be.ok;

        expect(initialState.get("lc3")).to.be.ok;
    });

});
