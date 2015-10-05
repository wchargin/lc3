/*
 * Parse raw binary or hexadecimal data.
 */

export default function parseRaw(data) {
    const contents = removeComments(data);

    const maybeInputType = guessInputType(contents);
    if (maybeInputType.status === "error") {
        return maybeInputType;
    }
    const inputType = maybeInputType.type;

    const answer = extractData(contents, inputType);
    return answer;
}

/*
 * Remove comments, preserving empty lines (for error reporting, etc.).
 */
function removeComments(text) {
    return (text || "").split("\n").map(function(line) {
        // Split on the comment character, and just take the first part
        // (i.e., everything before the comment starts).
        return line.split(";")[0];
    }).join("\n");
};

/*
 * Guess whether this is binary or hex, or fail if neither matches.
 * Returns either { error: <error message string> }
 * or { type: "hex" | "binary" }.
 */
function guessInputType(input) {
    // Make sure the input doesn't have invalid characters.
    const lines = input.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/[^\s0-9A-Fa-f]/);
        if (!match) {
            continue;
        }

        const badCharacter = match[0];
        const charCode = badCharacter.charCodeAt(0);
        const message =
            `It looks like you have an invalid character at line ${i + 1}: ` +
            `namely, "${badCharacter}" (code point ${charCode}). ` +
            "Your input should only contain ones and zeros " +
            "(if you're writing binary) " +
            "or digits and letters A through F " +
            "(if you're writing hexadecimal). " +
            "If you're trying to write a comment, " +
            "remember to start it with a semicolon.";
        return {
            status: "error",
            message,
        };
    }

    const justData = input.replace(/\s/g, "");
    const isHex = !!justData.match(/[^01]/);

    const shouldDivide = isHex ? 4 : 16;
    if (justData.length % shouldDivide !== 0) {
        const characterNoun = justData.length === 1 ?
            "character" : "characters";
        const dataType = isHex ? "hexadecimal" : "binary";
        const message =
            `I count a total of ${justData.length} ${characterNoun}, ` +
            `but I expected to find some multiple of ${shouldDivide} ` +
            `for ${dataType} data. ` +
            "You either left out some part of an instruction " +
            "or have a few extras hanging around!";
        return {
            status: "error",
            message,
        };
    }

    return {
        status: "success",
        type: isHex ? "hex" : "binary",
    };
};

function extractData(lines, inputType) {
    const justData = lines.replace(/\s/g, "");

    const charsPerWord = inputType === "hex" ? 4 : 16;
    const words = new Array(justData.length / charsPerWord);
    if (words.length === 0) {
        const message = "Your raw data is empty! " +
            "You need to at least have an origin (.ORIG) address.";
        return {
            status: "error",
            message,
        };
    }

    for (let i = 0; i < words.length; i++) {
        const start = charsPerWord * i;
        words[i] = justData.substr(start, charsPerWord);
    }

    const base = inputType === "hex" ? 16 : 2;
    const machineCode = words.map(word => parseInt(word, base));
    return {
        status: "success",
        result: {
            orig: machineCode[0],
            machineCode: machineCode.slice(1),
            symbolTable: {},
        },
    };
};
