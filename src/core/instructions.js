/*
 * Decode a binary representation of an instruction
 * to a more structured form.
 */
import {Map, List, Record} from 'immutable';
import Utils from './utils';

/*
 * Given a 16-bit instruction as an integer, decode the instruction,
 * extracting the various fields and returning an Immutable Map.
 */
export default function decode(instruction) {
    instruction = Utils.toUint16(instruction);

    const opcode = instruction >> 12 & 0xF;
    let op = {
        raw: instruction,
        strictValid: true,
        opcode: opcode,
    };

    const bits = List(Array(16)).map((_, i) => (instruction >> i) & 0x1).toJS();

    // Commonly used subsequences of bits, as numbers.
    const bits05 = instruction & 0x3F;
    const bits68 = (instruction >> 6) & 0x7;
    const bits08 = instruction & 0x1FF;
    const bits911 = (instruction >> 9) & 0x7;
    const bits010 = instruction & 0x7FF;

    switch (opcode) {
        case 0b0001:  // ADD
        case 0b0101:  // ADD
            op.opname = op.opcode === 1 ? 'ADD' : 'AND';
            op.dr = bits911;
            op.sr1 = bits68;
            op.mode = "none";
            if (bits[5] === 0) {
                op.arithmeticMode = "register";
                op.sr2 = instruction & 0x7;
                if (bits[4] !== 0 || bits[3] !== 0) {
                    op.strictValid = false;
                }
            } else {
                op.arithmeticMode = "immediate";
                op.immediateField = Utils.signExtend16(instruction & 0x1F, 5);
            }
            break;

        case 0b0000:  // BR
            op.opname = "BR";
            op.mode = "pcOffset";
            op.offset = Utils.signExtend16(bits08, 9);
            op.strictValid = true;
            [op.n, op.z, op.p] = [11, 10, 9].map(b => !!bits[b]);
            break;

        case 0b1100:  // JMP, RET
            op.opname = (bits68 === 0b111) ? "RET" : "JMP";  // RET = JMP R7
            op.mode = "baseOffset",
            op.baseR = bits68;
            op.offset = 0;
            if (bits911 !== 0 || bits05 !== 0) {
                op.strictValid = false;
            }
            break;

        case 0b0100:  // JSR, JSRR
            if (bits[11] === 0) {
                op.opname = "JSRR";
                op.mode = "baseOffset";
                op.baseR = bits68;
                op.offset = 0;
                if (bits911 !== 0 || bits05 !== 0) {
                    op.strictValid = false;
                }
            } else {
                op.opname = "JSR";
                op.mode = "pcOffset";
                op.offset = Utils.signExtend16(bits010, 11);
            }
            break;

        case 0b0010:  // LD
        case 0b1010:  // LDI
        case 0b1110:  // LEA
            op.opname = ({
                0b0010: "LD",
                0b1010: "LDI",
                0b1110: "LEA",
            })[opcode];
            op.mode = "pcOffset";
            op.dr = bits911;
            op.offset = Utils.signExtend16(bits08, 9);
            break;

        case 0b0110:  // LDR
            op.opname = "LDR";
            op.mode = "baseOffset";
            op.dr = bits911;
            op.baseR = bits68;
            op.offset = Utils.signExtend16(bits05, 6);
            break;

        case 0b1001:  // NOT
            op.opname = "NOT";
            op.mode = "none";
            op.dr = bits911;
            op.sr = bits68;
            if ((instruction & 0b111111) !== 0b111111) {
                op.strictValid = false;
            }
            break;

        case 0b0011:  // ST
        case 0b1011:  // STI
            op.opname = (op.opcode === 0b0011) ? "ST" : "STI";
            op.mode = "pcOffset";
            op.sr = bits911;
            op.offset = Utils.signExtend16(bits08, 9);
            break;

        case 0b0111:  // STR
            op.opname = "STR";
            op.mode = "baseOffset";
            op.sr = bits911;
            op.baseR = bits68;
            op.offset = Utils.signExtend16(bits05, 6);
            break;

        case 0b1111:  // TRAP
            op.opname = "TRAP";
            op.mode = "trap";
            op.trapVector = instruction & 0xFF;
            if (instruction & 0x0F00) {
                op.strictValid = false;
            }
            break;

        case 0b1000:  // RTI
            op.opname = "RTI";
            op.mode = "none";
            if (instruction !== 0x8000) {
                op.strictValid = false;
            }
            break;

        case 0b1101:  // RSRV (the reserved instruction)
            op.opname = "RSRV";
            op.mode = "none";
            op.strictValid = false;
            break;

        default:
            throw new Error(`Unrecognized opcode: ${opcode}`);
    }

    return Map(op);
}
