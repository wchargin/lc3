import Utils from './utils'; 
import {handleErrors, withContext} from './error_utils';

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
 * Parse a raw string as it appears in the assembly source code---
 * in the form including the outer quotation marks---
 * into what it should represent in machine code.
 * In particular, this includes stripping the outer quotes
 * and performing backslash-escapes.
 * If the string is invalid, an error will be thrown.
 */
export function parseString(text) {
    const error = (message) => {
        throw new Error(`while parsing the string ${text}: ${message}`);
    };

    if (text.length < 2) {
        error(`this string is way too short! ` +
            "You need at least two characters just for the quote marks.");
    }

    const quote = '"';
    if (text.charAt(0) !== quote || text.charAt(text.length - 1) !== quote) {
        error(`the string needs to start and end with ` +
            `double quotation marks (e.g.: ${quote}I'm a string${quote}).`);
    }

    // We'll build up this list of single-character strings,
    // then join them at the end.
    // (This might end up being a tad sparse if we skip some backslashes;
    // that's okay, because Array.join will deal with these holes fine.)
    let chars = new Array(text.length - 2);

    // This has to be a mutable-style for loop instead of a call to map
    // because we need to be able to conditionally move the iterator
    // (e.g., read the next character to process and escape sequence).
    let i;
    for (i = 1; i < text.length - 1; i++) {
        const here = text.charAt(i);
        const errorHere = (message) => error(`at index ${i}: ${message}`);

        if (here === '"') {
            errorHere(`unescaped double quote found before end of string`);
        }

        if (here === '\\') {
            // Supported escape sequences: \0, \n, \r, \", \\.
            const escapeSequence = text.charAt(++i);

            // Note: if the backslash is the last character of the string,
            // meaning that the closing quote is escaped
            // and the string is invalid,
            // this particular character will just resolve to a quote,
            // and no error will be raised.
            // We check for this case separately down below.
            const escaped = ({
                '0': '\0',
                'n': '\n',
                'r': '\r',
                '"': '\"',
                '\\': '\\',
            })[escapeSequence];

            if (escapeSequence === undefined) {
                errorHere(`unsupported escape character '${escapeSequence}'`);
            }
            chars[i] = (escaped);
        } else {
            chars[i] = here;
        }
    }

    // Now make sure that the last body character wasn't a backslash,
    // which would mean that we escaped the final closing quote.
    if (i >= text.length || text.charAt(i) !== '"') {
        error("unterminated string literal! " +
            "Did you accidentally backslash-escape the closing quote?");
    }

    return chars.join('');
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

    // Well, there's something. Is it a number?
    const operand = line[1];
    const orig = withContext(parseLiteral,
        "while parsing .ORIG directive operand")(operand);

    // Is it in range?
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

/*
 * Test whether the given string might be a valid label name.
 * Note that this does not check for name clashes with existing labels.
 */
export function isValidLabelName(label) {
    if (label.match(/[^A-Za-z0-9_]/)) {
        // Invalid characters.
        return false;
    }

    const asLiteral = handleErrors(parseLiteral)(label);
    if (asLiteral.success) {
        // Valid literal; could be ambiguous.
        return false;
    }

    return true;
}

/*
 * Determine how many words of LC-3 memory
 * the given instruction or directive will require to be allocated.
 *
 * The command should be a string like ".FILL" or "BRnp";
 *
 * the operand should be a number for .FILL or .BLKW,
 * a string value for .STRINGZ,
 * or null (or any other value) if it's an instruction
 * (because the operand of an instruction doesn't influence its size).
 */
export function determineRequiredMemory(command, operand) {
}
