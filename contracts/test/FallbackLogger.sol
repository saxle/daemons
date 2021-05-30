// SPDX-License-Identifier: MIT
/*
    Copyright 2021 Jeremi Gendron <jeremig@saxle.io> Permission is hereby
    granted, free of charge, to any person obtaining a copy of this software and
    associated documentation files (the "Software"), to deal in the Software
    without restriction, including without limitation the rights to use, copy,
    modify, merge, publish, distribute, sublicense, and/or sell copies of the
    Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions: The above copyright notice and this
    permission notice shall be included in all copies or substantial portions of
    the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
    KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
    EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
pragma solidity ^0.8.4;

import { console } from 'hardhat/console.sol';

contract FallbackLogger {
    fallback() external {
        console.log(string(msg.data));
        assembly {
            mstore(0, calldataload(0))
            return(0, 0x20)
        }
    }
}

/**
0x3d61016b80600b3d3981f36001605d7f00000001000000000000000000000000000000000000000000000000000000003d350414602f576058565b336002817370997970c51812dc3a010c7d01b50e0d17dc79c8141560585750ff605d3d5260203df35b7fee000000000000000000000000000000000000000000000000000000000000000160005260206000fd000000000000000000000000000000000000000000000000000000000000000aD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771BD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B
 */
