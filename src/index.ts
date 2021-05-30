import { ethers } from 'ethers';

// Opcodes hex byte notation.
const JUMPDEST = '5b';
const PUSH32 = '7f';
const ADD = '01';
const PUSH1 = '60';
const MSTORE = '52';
const REVERT = 'fd';
const CALLER = '33';
const DUP2 = '81';
const EQ = '14';
const ISZERO = '15';
const JUMPI = '57';
const POP = '50';
const SELFDESTRUCT = 'ff';
const RETURNDATASIZE = '3d';
const PUSH2 = '61';
const DUP1 = '80';
const CODECOPY = '39';
const RETURN = 'f3';
const PUSH20 = '73';
const JUMP = '56';
const CALLDATALOAD = '35';
const DIV = '04';

// Constant used to extract the selector from the first word of calldata.
const selectorDiv =
    '0000000100000000000000000000000000000000000000000000000000000000';

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

    // If the provided controller address isn't valid, throw.
    if (!ethers.utils.isAddress(controller)) {
        throw 'Controller address invalid ' + controller;
    }

    // Length of the core code. See `coreCode`.
    const coreCodeLength = '2f';
    // const coreCodeLength = '00';

    // Where the error block starts in the runtime code.
    // Padding to 1 byte in case the program counter is smaller than 2 ** 4 -1.
    // This value is equal to the length of the runtime code minus the length
    // of the error block, so the core code's length and the sd block's length.
    const errorBlockProgramCounter = ethers.utils
        .hexZeroPad(
            '0x' +
                (
                    Number('0x' + coreCodeLength) + Number('0x' + sdBlockLength)
                ).toString(16),
            1
        )
        .substr(2);

    const errorBlockLength = '2b';

    // Hexadecimal, padded to 2 bytes, length of the runtime code in bytes.
    // The runtime code is everything except the setup code.
    // It's what's returned by the constructor of a normal contract.
    // In our case the setup code returns the rest of the code, so the runtime
    // code's length is the sum of the length of the core code, sd block, error
    // block and data block.

    const runtimeCodeLength = ethers.utils
        .hexZeroPad(
            '0x' +
                (
                    Number('0x' + coreCodeLength) +
                    Number('0x' + sdBlockLength) +
                    Number('0x' + errorBlockLength) +
                    dataBlock.length / 2
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
    const setupCode =
        // Push a zero to the stack.
        RETURNDATASIZE +
        // Push the runtime code length to the stack.
        PUSH2 +
        runtimeCodeLength +
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
    const sdBlockProgramCounter = coreCodeLength;

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
        sdBlockProgramCounter +
        // Jump to the sd block if they are equal.
        JUMPI +
        // Push the error block program counter to the stack.
        PUSH1 +
        errorBlockProgramCounter +
        // Jump to the error block.
        JUMP;

    // The runtime code.
    return (
        '0x' +
        setupCode +
        coreCode +
        sdBlock(controller, errorBlockProgramCounter) +
        errorBlock +
        dataBlock
    );
}

// This constant is added with whatever value is at the top of the stack when
// the error block is run and the sum is used as the reversion value.
const errBase =
    'ee00000000000000000000000000000000000000000000000000000000000000';

// Error code for bad selector, used by the note since it only supports the '5d'
// selector.
const badSelectorErr = '01';
const wrongCallerErr = '02';

const errorBlock =
    JUMPDEST +
    PUSH32 +
    errBase +
    ADD +
    PUSH1 +
    '00' +
    MSTORE +
    PUSH1 +
    '20' +
    PUSH1 +
    '00' +
    REVERT;

const sdBlockLength = '29';

const sdBlock = (controller: string, errorBlockProgramCounter: string) => {
    if (!ethers.utils.isAddress(controller)) {
        throw 'Invalid controller ' + controller;
    }

    return (
        JUMPDEST +
        CALLER +
        PUSH1 +
        wrongCallerErr +
        DUP2 +
        PUSH20 +
        controller.substr(2).toLowerCase() +
        EQ +
        ISZERO +
        PUSH1 +
        errorBlockProgramCounter +
        JUMPI +
        POP +
        SELFDESTRUCT +
        PUSH1 +
        '5d' +
        RETURNDATASIZE +
        MSTORE +
        PUSH1 +
        '20' +
        RETURNDATASIZE +
        RETURN
    );
};

/**
 * 3d
 * 61
 * 0161
 * 80
 * 60
 * 0b
 * 3d
 * 39
 * 81
 * f3
 * 60
 * 01
 * 60
 * 5d
 * 7f
 * 0000000100000000000000000000000000000000000000000000000000000000
 * 3d
 * 35
 * 04
 * 14
 * 60
 * 2f
 * 57
 * 60
 * 58
 * 56
 * 5b
 * 33
 * 60
 * 02
 * 81
 * 73
 * 5B38Da6a701c568545dCfcB03FcB875f56beddC4
 * 14
 * 15
 * 60
 * 58
 * 57
 * 50
 * ff
 * 60
 * 5d
 * 3d
 * 52
 * 60
 * 20
 * 3d
 * f3
 * 5b
 * 7f
 * ee00000000000000000000000000000000000000000000000000000000000000
 * 01
 * 60
 * 00
 * 52
 * 60
 * 20
 * 60
 * 00
 * fd
 * 000000000000000000000000000000000000000000000000000000000000000a
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 * D7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 */

//  3d61016180600b3d3981f36001605d7f00000001000000000000000000000000000000000000000000000000000000003d350414602f576058565b33600281735B38Da6a701c568545dCfcB03FcB875f56beddC4141560585750ff605d3d5260203df35b7fee000000000000000000000000000000000000000000000000000000000000000160005260206000fd000000000000000000000000000000000000000000000000000000000000000aD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B

/**
 *
 * Core Block
 * 3d61016180600b3d3981f36001605d7f00000001000000000000000000000000000000000000000000000000000000003d350414602f57605856
 */
/**
 *
 * SD Block
 * 5b33600281735B38Da6a701c568545dCfcB03FcB875f56beddC4141560585750ff605d3d5260203df3
 */

/**
 *
 * Error Block
 * 5b7fee000000000000000000000000000000000000000000000000000000000000000160005260206000fd
 */

/**
 * Data Block
 * 000000000000000000000000000000000000000000000000000000000000000aD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 */
