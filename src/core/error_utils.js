export default {
    handleErrors,
    withContext,
};

/*
 * Decorate the given function such that it will always return
 * an object with a boolean "success" key
 * and either a "result" or "errorMessage" key
 * containing either the result of a successful invocation
 * or the text of the error thrown during a failed invocation.
 *
 * For example, if f = handleErrors((x) => x.y),
 * then f({ y: 1 }) = { success: true, result: 1 },
 * and f(null) = { success: false, errorMessage: "Cannot read property..." }.
 */
export function handleErrors(callback, errfmt = x => x) {
    return (...args) => {
        try {
            return {
                success: true,
                result: callback(...args),
            };
        } catch (e) {
            return {
                success: false,
                errorMessage: errfmt(e.message),
            };
        }
    };
}

/*
 * Decorate the given callback such that any error messages it throws
 * will have the given context and ": " prepended.
 *
 * For example, if context is "while doing a thing"
 * and the callback ends up throwing an error "something happened,"
 * the caller will see the error "while doing a thing: something happened."
 */
export function withContext(callback, context) {
    return (...args) => {
        try {
            return callback(...args);
        } catch (e) {
            throw new Error(`${context}: ${e.message}`);
        }
    };
}
