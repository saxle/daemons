// This constant is added with whatever value is at the top of the stack when

import { ADD, JUMPDEST, MSTORE, PUSH1, PUSH32, REVERT } from './opcodes';

// the error block is run and the sum is used as the reversion value.
export const errBase =
    'ee00000000000000000000000000000000000000000000000000000000000000';

// Error code for bad selector, used by the note since it only supports the '5d'
// selector.
export const badSelectorErr = '01';
export const wrongCallerErr = '02';

export const errorBlockLength = '2b';

export const errorBlock =
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
