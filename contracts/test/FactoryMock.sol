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

import { Factory } from '../Factory.sol';

contract FactoryMock is Factory {
    function clone(address target, bytes32 id)
        public
        returns (address instance)
    {
        return _clone(target, id);
    }

    function makeNote(bytes memory initCode, bytes32 id)
        public
        returns (address note)
    {
        return _makeNote(initCode, id);
    }

    function makeDaemon(bytes memory initCode, bytes32 id)
        public
        returns (address daemon)
    {
        return _makeDaemon(initCode, id);
    }

    function deploy(bytes32 id) public returns (address deployment) {
        return _deploy(id);
    }

    function implement(bytes memory initCode)
        public
        returns (address implementation)
    {
        return _implement(initCode);
    }

    function storeImplementation(address implementation) public {
        return _storeImplementation(implementation);
    }
}
