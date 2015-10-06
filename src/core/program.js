import {Record, List, Map, fromJS} from 'immutable';

/*
 * A description of an LC3 program.
 * Includes the address at which the program starts,
 * the actual instructions (starting from that address),
 * and a (possibly empty) map of labels to their addresses.
 */
export default class LC3Program extends Record({
    orig: 0,
    machineCode: List([]),
    symbolTable: Map({}),
}) {

    static fromJS(js) {
        return new LC3Program(fromJS(js));
    }

}
