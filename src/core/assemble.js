import Constants from './constants';
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
 * Strings are resolved, and an error is thrown if they are invalid.
 *
 * Sample tokenizations:
 *   - '.ORIG x3000' goes to [[".ORIG", "x3000"]]
 *   - 'ADD R1, R2, R3' goes to [["ADD", "R1,R2,R3"]]
 *   - '.STRINGZ "with spaces"' goes to [[".STRINGZ", "with spaces"]]
 *   - 'RET  ; go back' goes to [["RET"]]
 *   - '; thing \n RET ; thing \n ; thing' goes to [[], ["RET"], []]
 */
export function tokenize(text) {
    return text.split(/\r?\n/).map(tokenizeLine);
}

// See documentation for tokenize.
function tokenizeLine(line, lineIndex) {
    // Trim leading whitespace.
    // We can't trim trailing or interior whitespace or comments at this point
    // because those might belong to string literals.
    const trimmed = line.trimLeft();

    // Include the line number when we parse string literals
    // so that error messages are more helpful.
    const parseStringCtx = withContext(parseString,
        `on line ${lineIndex + 1}`);

    // Now we execute a small state machine.
    // At any point, we can be
    //   * ready to start a new token;
    //   * in the middle of a token; or
    //   * in the middle of a string.
    const [IDLE, TOKEN, STRING] = [0, 1, 2];
    let state = IDLE;

    // These are the list of tokens/strings we've collected so far
    // (which will be the return value of this function)
    // and the value of the token/string currently being built.
    let tokens = [];
    let current = "";

    for (let i = 0; i < line.length; i++) {
        const here = trimmed.charAt(i);
        const isWhitespace = !!here.match(/\s/);
        const isComma = here === ',';
        const isQuote = here === '"';

        if (state === IDLE) {
            if (isWhitespace || isComma) {
                continue;
            } else {
                state = isQuote ? STRING : TOKEN;
            }
        }

        // Break at comments, unless we're inside a string.
        if (here === ';' && state !== STRING) {
            break;
        }

        if (state === TOKEN) {
            // Break tokens at commas and whitespace.
            if (isWhitespace || isComma) {
                tokens.push(current);
                state = IDLE;
                current = "";
            } else {
                current += here;
            }
        } else if (state === STRING) {
            current += here;  // includes the quotation marks
            if (here === '\\') {
                // All our escape sequences are just one character,
                // so we can just read that in. Easy.
                current += trimmed.charAt(++i);
            } else if (isQuote && current.length > 1) {
                tokens.push(parseStringCtx(current));
                state = IDLE;
                current = "";
            }
        }
    }

    // Finally, add any tokens that extended to the end of the line.
    if (current.length > 0) {
        if (state === TOKEN) {
            tokens.push(current);
        } else if (state === STRING) {
            tokens.push(parseStringCtx(current));
        }
    }

    return tokens;
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
        throw new Error("Looks like your program's empty! " +
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
 * The command should be a string like ".FILL" or "BRnp".
 *
 * The operand should be a number for .FILL or .BLKW,
 * a string value for .STRINGZ,
 * or null (or any other value) if it's an instruction
 * (because the operand of an instruction doesn't influence its size).
 *
 * Special cases like ".ORIG" and ".END" are not supported by this function.
 * You should process those separately.
 */
export function determineRequiredMemory(command, operand) {
    switch (command) {
        case ".FILL":
            return 1;
        case ".BLKW":
            if (operand < 0) {
                throw new Error(
                    `a .BLKW needs to have a non-negative length, ` +
                    `but I found ${operand}`);
            }
            return operand;
        case ".STRINGZ":
            return operand.length + 1;  // for the null-terminator
        default:
            // Assume it's a normal instruction.
            return 1;
    }
}

export function buildSymbolTable(tokenizedLines, orig, begin) {
    // These two fields will be used to compute the return value.
    let symbols = {};
    let address = orig;

    // Here are all the things that can come at the start of a line.
    // We use these to determine whether the first token in a line
    // is a label or an actual operation of some kind.
    const trapVectors = "GETC OUT PUTS IN PUTSP HALT".split(' ');
    const instructions = [
        "ADD", "AND", "NOT",
        "BR", "BRP", "BRZ", "BRZP", "BRN", "BRNP", "BRNZ", "BRNZP",
        "JMP", "RET",
        "JSR", "JSRR",
        "LD", "LDI", "LDR",
        "LEA",
        "RTI",
        "ST", "STI", "STR",
        "TRAP",
    ];
    const directives = [".FILL", ".BLKW", ".STRINGZ"];
    const commands = [...trapVectors, ...instructions, ...directives];

    const initialState = {
        symbols: {},
        address: orig,
        seenEndDirective: false,
    };
    const programLines = tokenizedLines.slice(begin);
    const result = programLines.reduce((state, line, lineIndex) => {
        const ctx = `at line ${lineIndex + begin + 1}`;
        const error = message => {
            throw new Error(`${ctx}: ${message}`);
        };
        const oob = (address) => error(
            `currently at address ${Utils.toHexString(address)}, ` +
            `which is past the memory limit ` +
            `of ${Utils.toHexString(Constants.MEMORY_SIZE)}`);

        // Empty lines are totally fine:
        // maybe they originally had comments,
        // or maybe they were just empty.
        // In either case, let it pass through.
        if (line.length === 0) {
            return state;
        }

        // We'll also silently ignore anything after the .END directive.
        if (state.seenEndDirective) {
            return state;
        }

        // Check for the .END directive.
        if (line.some(x => x.toUpperCase() === '.END')) {
            return {
                ...state,
                seenEndDirective: true,
            };
        }

        // Make sure we haven't gone out of the memory bounds.
        if (state.address >= Constants.MEMORY_SIZE) {
            oob(state.address);
        }

        // Looks good so far. Let's take a look at the data.
        let newState = { ...state };

        const fst = line[0];

        // This could either be a label and then maybe some things
        // or just some things.
        // We take the policy that it's only a label if it has to be.
        const hasLabel = !commands.includes(fst.toUpperCase());
        if (hasLabel) {
            const labelName = fst;

            // That's a label! Perform some validity checks.
            if (!isValidLabelName(labelName)) {
                error(`this line looks like a label, ` +
                    `but '${labelName}' is not a valid label name; ` +
                    `you either misspelled an instruction ` +
                    `or entered an invalid name for a label`);
            } else if (labelName in newState.symbols) {
                const existingLocation = newState.symbols[labelName];
                error(`label name ${labelName} already exists; ` +
                    `it points to ${Utils.toHexString(existingLocation)}`);
            } else {
                // Go ahead and add it to the symbol table!
                newState.symbols = {
                    ...newState.symbols,
                    [labelName]: newState.address,
                };
            }
        }

        const rest = line.slice(hasLabel ? 1 : 0);
        if (rest.length === 0) {
            // It's a label-only line. No problem.
        } else {
            const command = rest[0].toUpperCase();
            const operands = rest.slice(1);

            // For assembly directives,
            // we might need the argument to see how much space to allocate.
            const operand = (() => {
                switch (command) {
                    case ".BLKW":
                    case ".FILL":
                        if (operands.length !== 1) {
                            error(`expected ${command} directive ` +
                                `to have exactly one operand, ` +
                                `but found ${operands.length}`);
                        }
                        return withContext(parseLiteral, ctx)(operands[0]);
                    case ".STRINGZ":
                        if (operands.length !== 1) {
                            error(`expected ${command} directive ` +
                                `to have exactly one operand, ` +
                                `but found ${operands.length}`);
                        }
                        return operands[0];  // already a string, from tokenize
                    default:
                        return null;  // doesn't matter for instructions
                }
            })();

            newState.address += determineRequiredMemory(command, operand);

            // Make sure this wasn't, e.g., a .BLKW on the edge of memory.
            if (newState.address > Constants.MEMORY_SIZE) {
                oob(newState.address);
            }
        }

        return newState;
    }, initialState);

    if (!result.seenEndDirective) {
        error("no .END directive found!");
    }

    return {
        symbolTable: result.symbols,
        programLength: result.address - orig,
    };
}

/*
 * Parse a PC-relative offset, provided in either literal or label form.
 * The result is an integer offset from the provided PC location.
 * For example, if PC is 0x3000 and the operand points to a label at 0x2FFF,
 * the return value will be -1.
 *
 * If the signed offset does not fit into the given number of bits,
 * or if the operand refers to a label that does not exist,
 * an error will be thrown.
 */
export function parseOffset(pc, operand, symbols, bits) {
    const ensureInRange = (x) => {
        const min = -(1 << (bits - 1));
        const max = (1 << (bits - 1)) - 1;
        if (!(min <= x && x <= max)) {
            throw new Error(`offset ${x} is out of range; ` +
                `it must fit into ${bits} bits, ` +
                `so it should be between ${min} and ${max}, inclusive`);
        }
        return x;
    };

    // First, see if it's a valid literal.
    const asLiteral = handleErrors(parseLiteral)(operand);
    if (asLiteral.success) {
        return ensureInRange(asLiteral.result);
    }

    // If it's not a literal, it must be a symbol to be valid.
    if (!(operand in symbols)) {
        throw new Error(
            `the offset '${operand}' is not a valid numeric literal, ` +
            `but I can't find it in the symbol table either; ` +
            `did you misspell a label name?`);
    }

    const symbolAddress = symbols[operand];
    return ensureInRange(symbolAddress - pc);
}

/*
 * Generate the machine code output for an assembly directive.
 * The tokens parameter should be a single tokenized line, excluding any label.
 * The result is an array of LC-3 machine words (integers)
 * to be appended to the machine code.
 *
 * Assembly directives don't depend on the current PC or the symbol table,
 * so these don't need to be passed in as arguments.
 */
export function encodeDirective(tokens) {
    const directive = tokens[0];
    const operand = tokens[1];

    switch (directive.toUpperCase()) {
        case ".FILL":
            return [Utils.toUint16(parseLiteral(operand))];
        case ".BLKW":
            return new Array(Utils.toUint16(parseLiteral(operand))).fill(0);
        case ".STRINGZ":
            return operand.split('').map(c => c.charCodeAt(0)).concat([0]);
        default:
            throw new Error(`unrecognized directive: ${directive}`);
    }
}
