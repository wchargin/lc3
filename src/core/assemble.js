import Utils from './utils'; 

export function handleErrors(callback, errfmt) {
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

export function parseRegister(text) {
    const match = text.match(/^[Rr]([0-7])$/);
    if (match) {
        return parseInt(match[1]);
    } else {
        throw new Error(`Invalid register specification: '${text}'`);
    }
}

export function parseLiteral(text) {
    const e = new Error(`Invalid numeric literal: '${text}'`);
    const first = text.charAt(0);
    if (first !== '#' && first.toLowerCase() !== 'x') {
        throw e;
    }

    // Standard decimal or hexadecimal literal.
    const isDecimal = (first === '#');
    const negate = (text.charAt(1) === '-');
    const toParse = isDecimal ?
        text.substring(negate ? 2 : 1) :
        (negate ? first + text.substring(2) : text);

    const num = Utils.parseNumber(toParse);
    if (isNaN(num)) {
        throw e;
    }
    if (negate && num < 0) {
        // No double negatives.
        throw e;
    }
    return negate ? -num : num;
}

/*
 * Tokenize the given document.
 * Returns an array of lines; each line is an array of tokens.
 * Comma-separated operands are smashed into one token.
 * Comments are stripped.
 *
 * Sample tokenizations:
 *   - '.ORIG x3000' goes to [[".ORIG", "x3000"]]
 *   - 'ADD R1, R2, R3' goes to [["ADD", "R1,R2,R3"]]
 *   - '.STRINGZ "with spaces"' goes to [[".STRINGZ", "\"with spaces\""]]
 *   - 'RET  ; go back' goes to [["RET"]]
 *   - '; thing \n RET ; thing \n ; thing' goes to [[], ["RET"], []]
 */
export function tokenize(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
        // Remove the comment, if any.
        const semi = line.indexOf(';');
        const trimmed = (semi === -1) ? line : line.substring(0, semi);

        // First, chomp all white space,
        // and consolidate comma groups: 'R1, R2, #1' -> 'R1,R2,#1'
        const squash = trimmed.replace(/\s+/g, ' ');
        const commaSquash = squash.replace(/\s?,\s?/g, ',');

        // Then, split on whitespace, except for quoted strings.
        // Quote escaping with a backslash is considered.
        // From: http://stackoverflow.com/a/4032642/732016
        // Explanation:
        //   globally match
        //     groups of at least one okay character; or
        //     quotes around
        //       groups of at least one
        //         quote, preceded by (?:) a (literal) backslash, or
        //         non-quote character.
        // If the quotes are unbalanced,
        // the leading quote will be stripped
        // and the "contents" will not be treated atomically:
        // for example, '"A B C' goes to three tokens A, B, and C.
        const regex = /[A-Za-z0-9_#x,.-]+|"(?:\\"|[^"])+"/g;
        const tokens = commaSquash.match(regex);

        return tokens || [];  // even if empty (to keep line numbers)
    });
}

/*
 * Attempt to find the .ORIG directive.
 * 
 * On success, the return value is an object with the fields
 *   - orig: the origin address specified in the .ORIG directive
 *   - begin: (zero-based) index of the first line after the .ORIG
 *
 * Throws an error message on failure.
 */
export function findOrig(tokenizedLines) {
    // The .ORIG directive needs to be on the first non-blank line
    // (after tokenizing, which strips whitespace and comments).
    const lineNumber = tokenizedLines.findIndex(line => line.length > 0);
    if (lineNumber === -1) {
        throw new Error("Looks like your program's empty!" +
            "You need at least an .ORIG directive and an .END directive.");
    }
    const line = tokenizedLines[lineNumber];

    // Check if there's an .ORIG directive anywhere in the line.
    const hasOrig = line.some(token => token.toUpperCase() === ".ORIG");
    if (!hasOrig) {
        throw new Error(
            "The first non-empty, non-comment line of your program " +
            "needs to have an .ORIG directive!");
    }

    // There's a directive somewhere.
    // If it's not the first, then there's a label. Not allowed.
    if (line[0].toUpperCase() !== ".ORIG") {
        throw new Error(".ORIG directive cannot have a label!");
    }

    // If there's additional junk, that's not okay.
    // If there's no operand, that's not okay, either.
    const operands = line.length - 1;
    if (operands !== 1) {
        throw new Error(`The .ORIG directive expects exactly one operand, ` +
            `but it looks like you have ${operands}!`);
    }

    // Well, there's something. Is it a number? Is it in range?
    const operand = line[1];
    const orig = parseLiteral(operand);
    if (isNaN(orig)) {
        throw new Error(`.ORIG operand (${operand}) must be ` +
            `a decimal or hexadecimal literal!`);
    }
    if (orig !== Utils.toUint16(orig)) {
        throw new Error(`.ORIG operand (${operand}) is out of range! ` +
            `It should be between 0 and 0xFFFF, inclusive.`);
    }

    // Looks like we're good.
    return {
        orig: orig,
        begin: lineNumber + 1,
    };
}
