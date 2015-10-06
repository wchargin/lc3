import {Record, fromJS} from 'immutable';

import LC3Program from './program';

/*
 * Result of parsing some input representing a program.
 * (For example, this should be the output of trying to parse
 * both binary/hex raw data and also assembly code.)
 * Indicates whether the parse was successful,
 * and contains either the output program
 * (as an LC3Program record; see ./program)
 * or an error message describing what went wrong.
 *
 * The success flag should be a boolean,
 * If success is true, the errorMessage will be ignored;
 * if it is false, the program will be ignored.
 */
export default class ParseResult extends Record({
    success: null,
    errorMessage: null,
    program: null,
}) {

    constructor(values) {
        if (!values) {
            throw new Error(
                "ParseResult constructor expected an object " +
                "containing the values for this result, " +
                "but instead got " + values);
        }

        const {success, errorMessage, program} = values;
        let sanitizedValues = {success, errorMessage, program};

        // Make sure success is a boolean.
        if (success !== !!success) {
            throw new Error(
                `expected success to be a boolean, ` +
                `but found ${values.success}`);
        }

        if (success) {
            if (!(program instanceof LC3Program)) {
                throw new Error(
                    `when creating a successful parse, ` +
                    `expected "program" to be an LC3Program, ` +
                    `but found ${program}`);
            }
            sanitizedValues.errorMessage = null;
        } else {
            if (typeof errorMessage !== "string") {
                throw new Error(
                    `when creating a failed parse, ` +
                    `expected "errorMessage" to be a string, ` +
                    `but found ${errorMessage}`);
            }
            sanitizedValues.program = null;
        }

        super(sanitizedValues);
    }

    static fromJS(js) {
        return new ParseResult({
            success: js.success,
            errorMessage: js.errorMessage,
            program: LC3Program.fromJS(js.program),
        });
    }

}
