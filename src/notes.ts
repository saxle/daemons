import { ethers } from 'ethers';
import { badSelectorErr, errorBlock, errorBlockLength } from './errors';
import { sdBlock, sdBlockLength } from './sd';
import {
    CALLDATALOAD,
    CODECOPY,
    DIV,
    DUP1,
    DUP2,
    EQ,
    JUMP,
    JUMPI,
    PUSH1,
    PUSH2,
    PUSH32,
    RETURN,
    RETURNDATASIZE
} from './opcodes';
import {
    runtimeCodeLength,
    sdBlockProgramCounter,
    selectorDiv,
    setupCode
} from './utils';
import { checkController } from './checks';

export const noteDataProgramCounter = '83'; // 131

export function noteCode(
    targets: string[],
    k: bigint,
    controller: string
): string {
    // 24 kb constant for checking if note exceeds max contract size.
    const kb_24 = 24n * 8n * 1000n;

    // Throw if contract would be bigger than max contract size.
    if (k * 20n - 100n > kb_24) {
        throw 'k too large ' + k;
    }

    // Data block starts off with 32 bytes of big-endian number constant k.
    let dataBlock = ethers.utils
        .hexZeroPad('0x' + k.toString(16), 32)
        .substr(2);

    // For each target, check that the address is valid.
    // Then, append the address' bytes to the data block.
    targets.forEach((target) => {
        if (!ethers.utils.isAddress(target)) {
            throw 'Target isnt valid address ' + target;
        }
        dataBlock += target.substr(2).toLowerCase();
    });

    checkController(controller);

    // Length of the core code. See `coreCode`.
    const coreCodeLength = '2f';

    const errorBlockProgramCounter = ethers.utils
        .hexZeroPad(
            '0x' +
                (
                    Number('0x' + coreCodeLength) + Number('0x' + sdBlockLength)
                ).toString(16),
            1
        )
        .substr(2);

    // The core code.
    /**
     * What the stack does:
     * [badSelectorErr]
     * [badSelectorErr, '5d']
     * [badSelectorErr, '5d', selectorDiv]
     * [badSelectorErr, '5d', selectorDiv, 0]
     * [badSelectorErr, '5d', selectorDiv, calldataWord]
     * [badSelectorErr, '5d', selector]
     * [badSelectorErr, sdSelector?]
     * [badSelectorErr, sdSelector?, sdBlockProgramCounter]
     * [badSelectorErr] (sd block is agnostic to the stack)
     * [badSelectorErr, errorBlockProgramCounter]
     * [badSelectorErr] (error block needs this stack variable)
     */
    const coreCode =
        // Push the bad selector error code to the stack.
        PUSH1 +
        badSelectorErr +
        // Push the control word to the stack.
        PUSH1 +
        '5d' +
        // Push the selector div constant to the stack.
        PUSH32 +
        selectorDiv +
        // Push the first 32 bytes of calldata to the stack.
        RETURNDATASIZE +
        CALLDATALOAD +
        // Divide the first 32 bytes of calldata by the selector div constant.
        DIV +
        // Check if selector and control word are equal.
        EQ +
        // Push the program counter of the sd block to the stack.
        PUSH1 +
        sdBlockProgramCounter(coreCodeLength) +
        // Jump to the sd block if they are equal.
        JUMPI +
        // Push the error block program counter to the stack.
        PUSH1 +
        errorBlockProgramCounter +
        // Jump to the error block.
        JUMP;

    // The init code.
    return (
        '0x' +
        setupCode(runtimeCodeLength(coreCodeLength, dataBlock.length / 2)) +
        coreCode +
        sdBlock(controller, errorBlockProgramCounter) +
        errorBlock +
        dataBlock
    );
}
