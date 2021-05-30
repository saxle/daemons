import { ethers } from 'ethers';
import { errorBlockLength } from './errors';
import {
    CODECOPY,
    DUP1,
    DUP2,
    PUSH1,
    PUSH2,
    RETURN,
    RETURNDATASIZE
} from './opcodes';
import { sdBlockLength } from './sd';

// Constant used to extract the selector from the first word of calldata.
export const selectorDiv =
    '0000000100000000000000000000000000000000000000000000000000000000';

// Hexadecimal, padded to 2 bytes, length of the runtime code in bytes.
// The runtime code is everything except the setup code.
// It's what's returned by the constructor of a normal contract.
export const runtimeCodeLength = (coreCodeLength: string, extra: number) =>
    ethers.utils
        .hexZeroPad(
            '0x' +
                (
                    Number('0x' + coreCodeLength) +
                    Number('0x' + sdBlockLength) +
                    Number('0x' + errorBlockLength) +
                    extra
                ).toString(16),
            2
        )
        .substr(2);

// Hexadecimal length of the setup code in bytes.
const setupCodeLength = '0b';

/**
 * The setup code.
 * What the stack does:
 *   [0]
 *   [0, runtimeCodeLength]
 *   [0, runtimeCodeLength, runtimeCodeLength]
 *   [0, runtimeCodeLength, runtimeCodeLength, setupCodeLength]
 *   [0, runtimeCodeLength, runtimeCodeLength, setupCodeLength, 0]
 *   [0, runtimeCodeLength] {runtimeCode}
 *   [0, runtimeCodeLength, 0] {runtimeCode}
 *   [0]
 */
export const setupCode = (runtimeLength: string) =>
    // Push a zero to the stack.
    RETURNDATASIZE +
    // Push the runtime code length to the stack.
    PUSH2 +
    runtimeLength +
    // Duplicate the runtime code length.
    DUP1 +
    // Push the setup code length to the stack.
    PUSH1 +
    setupCodeLength +
    // Push a zero to the stack.
    RETURNDATASIZE +
    // Copy runtime code length number of bytes into the 0 memory address
    // starting from the end of the setup code.
    CODECOPY +
    // Duplicate the zero.
    DUP2 +
    // Return the runtime code.
    RETURN;

// Where the sd block starts in the runtime code.
// Equal to the core code's length because it immediately follows it in
// the runtime code.
export const sdBlockProgramCounter = (coreCodeLength: string) => coreCodeLength;

// Where the error block starts in the runtime code.
// Padding to 1 byte in case the program counter is smaller than 2 ** 4 -1.
// This value is equal to the length of the runtime code minus the length
// of the error block, so the core code's length and the sd block's length.
export const errorBlockProgramCounter = (coreCodeLength: string) =>
    ethers.utils
        .hexZeroPad(
            '0x' +
                (
                    Number('0x' + coreCodeLength) + Number('0x' + sdBlockLength)
                ).toString(16),
            1
        )
        .substr(2);
