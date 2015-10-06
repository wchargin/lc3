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

export function setMemoryBlock(program) {
    return {
        type: "SET_MEMORY_BLOCK",
        program: program.toJS(),
    };
}
