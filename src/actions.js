export function setPC(newPC) {
    return {
        type: "SET_PC",
        newPC,
    };
}

export function setMemory(address, value) {
    return {
        type: "SET_MEMORY",
        address,
        value,
    };
}

export function loadProgram(program) {
    return {
        type: "LOAD_PROGRAM",
        program: program.toJS(),
    };
}

export function scrollToPC() {
    return {
        type: "SCROLL_TO_PC",
    };
}

export function scrollBy(delta) {
    return {
        type: "SCROLL_BY",
        delta,
    };
}

export function step() {
    return {
        type: "STEP",
    };
}
