/*
 * This utility function lets us specify descriptions of action creators
 * instead of defining imperative functions for each action creator.
 * Then, we can create the action creators all at once!
 * Are we meta yet?
 *
 * An action creator description is an object with
 *
 *   - a "type" field, containing a string value,
 *     which will be assigned to each action created;
 *   - an optional "parameters" array of strings (default: []),
 *     indicating the names of the fields in the created action
 *     to which the arguments of the action creator should map; and
 *   - an optional "parameterTransforms" object
 *     whose keys are parameter names
 *     and whose functions will be applied to the action creator's arguments
 *     before the results are stored on the action itself.
 *
 * For example, the action creator description
 *
 *     { type: "FOO",
 *       parameters: ["one", "two"],
 *       parameterTransforms: { two: (x) => x + 1 } }
 *
 * would result in an action creator "foo" that could be invoked as
 *
 *     foo(100, 200)
 *
 * to create the action object
 *
 *     { type: "FOO",
 *       one: 100,
 *       two: 201 }.
 *
 * This system does not currently allow default arguments,
 * and if the argument count is not the expected count
 * then an error will be thrown at action creation time.
 */
function createActionCreator(description) {
    const {type, parameters = [], parameterTransforms = {}} = description;
    return function actionCreator(...args) {
        if (args.length !== parameters.length) {
            throw new Error(
                `Expected ${parameters.length} arguments ` +
                `in action creator ${type}, `
                `but found ${args.length}`);
        }
        return parameters.reduce((acc, key, idx) => {
            const transformer = parameterTransforms[key] || (x => x);
            return {
                ...acc,
               [key]: transformer(args[idx]),
            };
        }, {type});
    };
}

/*
 * Map an object whose keys are action creator names
 * and whose values are action creator descriptions
 * to an object whose keys are the same names
 * but whose values are the actual action creator functions.
 */
function createActionCreators(descriptions) {
    return Object.keys(descriptions).reduce((acc, key) => {
        return {
            ...acc,
           [key]: createActionCreator(descriptions[key]),
        };
    }, {});
}

const actionCreatorDescriptions = {
    setPC: {
        type: "SET_PC",
        parameters: ["newPC"],
    },
    setMemory: {
        type: "SET_MEMORY",
        parameters: ["address", "value"],
    },
    setRegister: {
        type: "SET_REGISTER",
        parameters: ["name", "value"],
    },
    loadProgram: {
        type: "LOAD_PROGRAM",
        parameters: ["program"],
        parameterTransforms: {
            "program": p => p.toJS(),
        },
    },
    scrollTo: {
        type: "SCROLL_TO",
        parameters: ["address"],
    },
    scrollToPC: {
        type: "SCROLL_TO_PC",
    },
    scrollBy: {
        type: "SCROLL_BY",
        parameters: ["delta"],
    },
    step: {
        type: "STEP",
    },
    stepBatch: {
        type: "STEP_BATCH",
    },
    enterBatchMode: {
        type: "ENTER_BATCH_MODE",
        parameters: ["style"],
    },
    exitBatchMode: {
        type: "EXIT_BATCH_MODE",
    },
    enqueueStdin: {
        type: "ENQUEUE_STDIN",
        parameters: ["text"],
    },
    clearStdin: {
        type: "CLEAR_STDIN",
    },
    clearStdout: {
        type: "CLEAR_STDOUT",
    },
    setNewlineMode: {
        type: "SET_NEWLINE_MODE",
        parameters: ["newlineMode"],
    },
};

const actionCreators = createActionCreators(actionCreatorDescriptions);
export default actionCreators;
