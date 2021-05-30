import { ethers } from 'ethers';
import { checkController } from './checks';
import { errorBlock } from './errors';
import { noteDataProgramCounter } from './notes';
import {
    DUP5,
    DUP4,
    SWAP1,
    SWAP2,
    SWAP3,
    EXTCODECOPY,
    EXTCODESIZE,
    MLOAD,
    ADDMOD,
    MUL,
    CALLDATASIZE,
    CALLDATACOPY,
    GAS,
    DELEGATECALL,
    ADD,
    CALLDATALOAD,
    DIV,
    DUP1,
    DUP2,
    ISZERO,
    JUMPI,
    POP,
    PUSH1,
    PUSH20,
    PUSH32,
    RETURN,
    RETURNDATASIZE,
    EQ,
    SWAP7,
    NOT,
    SHR,
    AND,
    SWAP5,
    PUSH2,
    RETURNDATACOPY,
    DUP3
} from './opcodes';
import { sdBlock } from './sd';
import {
    errorBlockProgramCounter,
    runtimeCodeLength,
    sdBlockProgramCounter,
    selectorDiv,
    setupCode
} from './utils';

export function daemonCode(noteAddress: string, controller: string) {
    checkController(controller);

    return (
        '0x' +
        setupCode(runtimeCodeLength(coreCodeLength, 0)) +
        coreCode(
            noteAddress,
            sdBlockProgramCounter(coreCodeLength),
            errorBlockProgramCounter(coreCodeLength)
        ) +
        sdBlock(controller, errorBlockProgramCounter(coreCodeLength)) +
        errorBlock
    );
}
// 0x3d61016b80600b3d3981f36001605d7f00000001000000000000000000000000000000000000000000000000000000003d350414602f576058565b336002817370997970c51812dc3a010c7d01b50e0d17dc79c8141560585750ff605d3d5260203df35b7fee000000000000000000000000000000000000000000000000000000000000000160005260206000fd000000000000000000000000000000000000000000000000000000000000000ae7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512e7f1725e7734ce288f8367e1bb143e90bb3f0512
export const coreCodeLength = '80';

const coreCode = (
    noteAddress: string,
    sdProgramCounter: string,
    errorProgramCounter: string
): string => {
    return (
        /**
         * Get selector.
         * What the stack does:
         *   [selectorDiv]
         *   [selectorDiv, 0]
         *   [selectorDiv, calldataWord]
         *   [selector]
         */
        PUSH32 +
        selectorDiv + //33
        RETURNDATASIZE +
        CALLDATALOAD +
        DIV +
        /**
         * Setup EXTCODECOPY for k.
         * What the stack does:
         *   [selector, 32]
         *   [selector, 32, noteDataPC]
         *   [selector, 32, noteDataPC, 0]
         *   [selector, 32, noteDataPC, 0, noteAddress]
         */
        PUSH1 +
        '20' +
        PUSH1 +
        noteDataProgramCounter + //40
        RETURNDATASIZE +
        PUSH20 +
        noteAddress.substr(2).toLowerCase() + //62
        /**
         * SD if selector == 0.
         * What the stack does:
         *   [selector, 32, noteDataPC, 0, noteAddress, selector]
         *   [selector, 32, noteDataPC, 0, noteAddress, selector, 0x5d]
         *   [selector, 32, noteDataPC, 0, noteAddress, sd?]
         *   [selector, 32, noteDataPC, 0, noteAddress, sd?, sdPC]
         *   [selector, 32, noteDataPC, 0, noteAddress]
         */
        DUP5 + //69
        PUSH1 +
        '5d' +
        EQ +
        PUSH1 +
        sdProgramCounter +
        JUMPI +
        /**
         * Get k constant.
         * What the stack does:
         *   [selector, 32, noteDataPC, 0, noteAddress, 32]
         *   [selector, 32, noteDataPC, 0, noteAddress, 32, noteDataPC]
         *   [selector, 32, noteDataPC, 0, noteAddress, 32, noteDataPC, 0]
         *   [selector, 32, noteDataPC, 0, noteAddress, 32, noteDataPC, 0, noteAddress]
         *   [selector, 32, noteDataPC, 0, noteAddress] {k}
         */
        DUP4 +
        DUP4 +
        RETURNDATASIZE +
        DUP4 +
        EXTCODECOPY +
        /**
         * Compute target index.
         * What the stack does:
         *   [selector, 32, noteDataPC, 0, noteAddress, 0] {k}
         *   [selector, 32, noteDataPC, 0, noteAddress, k]
         *   [selector, 32, noteDataPC, 0, noteAddress, k, k]
         *   [selector, 32, noteDataPC, 0, noteAddress, k, k, 0]
         *   [0, 32, noteDataPC, 0, noteAddress, k, k, selector]
         *   [0, 32, noteDataPC, 0, noteAddress, index]
         */
        RETURNDATASIZE +
        MLOAD +
        DUP1 +
        RETURNDATASIZE +
        SWAP7 +
        ADDMOD +
        /**
         * Get target address.
         * What the stack does:
         *   [0, 32, noteDataPC, 0, noteAddress, index, 20]
         *   [0, 32, noteDataPC, 0, noteAddress, offset]
         *   [0, 32, noteDataPC, 0, offset, noteAddress]
         *   [0, 32, noteAddress, 0, offset, noteDataPC]
         *   [0, 32, noteAddress, 0, loc]
         *   [0, 32, loc, 0, noteAddress]
         *   [0] {target}
         */
        PUSH1 +
        '14' +
        MUL +
        SWAP1 +
        SWAP3 +
        ADD +
        SWAP2 +
        EXTCODECOPY + //88
        /**
         * Error if note's CODESIZE == 0
         * What the stack does:
         *   [0] {target}
         *   [0, ...target]
         *   [0, ...target, 0]
         *   [0, ...target, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff]
         *   [0, ...target, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff, 96]
         *   [0, ...target, 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff]
         *   [0, target]
         *   [0, target, 2]
         *   [0, target, 2, target]
         *   [0, target, 2, size]
         *   [0, target, 2, empty?]
         *   [0, target, 2, empty?, errorPC]
         *   [0, target, 2]
         *   [0, target]
         *   [0, target, calldatasize]
         *   [0, target, calldatasize, 0]
         *   [0, target, calldatasize, 0, 0]
         *   [0, target] {calldata}
         */
        RETURNDATASIZE +
        MLOAD +
        RETURNDATASIZE +
        NOT +
        PUSH1 +
        '60' +
        SHR +
        AND +
        PUSH1 +
        '02' +
        DUP2 +
        EXTCODESIZE + //100
        ISZERO +
        PUSH1 +
        errorProgramCounter +
        JUMPI +
        POP +
        CALLDATASIZE +
        RETURNDATASIZE +
        RETURNDATASIZE +
        CALLDATACOPY +
        /**
         * Setup DELEGATECALL.
         * What the stack does:
         *   [0, target, 0]
         *   [0, target, 0, 0]
         *   [0, target, 0, 0, calldatasize]
         *   [0, target, 0, 0, calldatasize, 0]
         *   [0, target, 0, 0, calldatasize, 0, 0]
         *   [0, 0, 0, 0, calldatasize, 0, target]
         *   [0, 0, 0, 0, calldatasize, 0, target, gas]
         *   [0, 0, success]
         */
        RETURNDATASIZE +
        RETURNDATASIZE +
        CALLDATASIZE +
        RETURNDATASIZE +
        RETURNDATASIZE +
        SWAP5 +
        GAS +
        DELEGATECALL +
        /**
         *  Handle DELEGATECALL result.
         *  What the stack does:
         *    [0, 0, failure?]
         *    [0, 0, failure?, errPC]
         *    [0, 0]
         *    [0, 0, 0]
         *    [0, 0, 0, returndatasize]
         *    [0, returndatasize, 0, 0]
         *    [0] {returndata}
         *    [0, returndatasize]
         *    [returndatasize, 0]
         *    []
         */
        ISZERO +
        DUP1 +
        PUSH1 +
        errorProgramCounter +
        JUMPI +
        DUP1 +
        RETURNDATASIZE +
        SWAP2 +
        RETURNDATACOPY +
        RETURNDATASIZE +
        SWAP1 +
        RETURN
    );
};
