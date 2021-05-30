import { ethers } from 'ethers';
import { wrongCallerErr } from './errors';
import {
    CALLER,
    DUP2,
    EQ,
    ISZERO,
    JUMPDEST,
    JUMPI,
    MSTORE,
    POP,
    PUSH1,
    PUSH20,
    RETURN,
    RETURNDATASIZE,
    SELFDESTRUCT
} from './opcodes';

export const sdBlockLength = '29';

export const sdBlock = (
    controller: string,
    errorBlockProgramCounter: string
) => {
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
