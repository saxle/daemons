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

// https://github.com/0age/metamorphic/blob/master/contracts/MetamorphicContractFactory.sol
bytes constant mmCode = hex'5860208158601c335a63aaf10f428752fa158151803b80938091923cf3';
bytes32 constant mmCodeHash = keccak256(mmCode);

contract Factory {
    bytes32 public constant IMPLEMENTATION_SLOT =
        keccak256('daemons.implementationSlot');

    function clone(address target, bytes32 id)
        internal
        returns (address instance)
    {
        storeImplementation(target);
        instance = deploy(id);
    }

    function makeNote(bytes memory initCode, bytes32 id)
        internal
        returns (address note)
    {
        storeImplementation(implement(initCode));
        note = deploy(id);
    }

    /**
        Makes a daemon from initCode and an id.
        @dev Please make sure to run the correct TypeScript function to generate
        the initCode.
        @dev Although daemons are deployed using the metamorphic strategy, in
        almost all cases it should never be destroyed and redeployed. This would
        delete the contract's storage. A valid redeployment reason would be if
        the context doesn't need storage persistence or if the storage is
        properly transferred to the new context (ethers.provider.getStorage()).
        @param initCode bytes memory Initialization code for the daemon. Must
        be properly generated in TypeScript, i.e. contains the note address and
        controller.
        @return daemon address
     */
    function makeDaemon(bytes memory initCode, bytes32 id)
        internal
        returns (address daemon)
    {
        storeImplementation(implement(initCode));
        daemon = deploy(id);
    }

    function deploy(bytes32 id) internal returns (address deployment) {
        bytes memory initCode = mmCode;
        assembly {
            deployment := create2(0, add(initCode, 0x20), mload(initCode), id)
        }
        if (deployment != id2ad(id)) revert('Bad deployment');
    }

    function implement(bytes memory initCode)
        internal
        returns (address implementation)
    {
        assembly {
            implementation := create(0, add(initCode, 0x20), mload(initCode))
        }
        if (implementation == address(0)) revert('Bad deployment');
    }

    function storeImplementation(address implementation) internal {
        bytes32 implementationSlot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(implementationSlot, implementation)
        }
    }

    function id2ad(bytes32 id) internal view returns (address addy) {
        return
            address(
                uint160(
                    bytes20(
                        keccak256(
                            abi.encodePacked(
                                hex'ff',
                                address(this),
                                mmCodeHash,
                                id
                            )
                        )
                    )
                )
            );
    }
}
