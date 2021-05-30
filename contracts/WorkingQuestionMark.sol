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
bytes32 constant mmCodeHash = keccak256(abi.encodePacked(mmCode));

abstract contract Factory {
    bytes32 public constant IMPLEMENTATION_SLOT =
        keccak256('daemons.implementationSlot');

    function getImplementation() public view returns (address implementation) {
        bytes32 implementationSlot = IMPLEMENTATION_SLOT;
        assembly {
            implementation := sload(implementationSlot)
        }
    }

    function _clone(address target, bytes32 id)
        internal
        returns (address instance)
    {
        _storeImplementation(target);
        instance = _deploy(id);
    }

    function _makeNote(bytes memory initCode, bytes32 id)
        internal
        returns (address note)
    {
        _storeImplementation(_implement(initCode));
        note = _deploy(id);
    }

    /**
        Makes a daemon from initCode and an id.
        @dev Please make sure to run the correct TypeScript function _to generate
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
    function _makeDaemon(bytes memory initCode, bytes32 id)
        internal
        returns (address daemon)
    {
        _storeImplementation(_implement(initCode));
        daemon = _deploy(id);
    }

    function _deploy(bytes32 id) internal returns (address deployment) {
        bytes memory mmInitCode = mmCode;
        assembly {
            deployment := create2(
                0,
                add(0x20, mmInitCode),
                mload(mmInitCode),
                id
            )
            // Alternative check here, though it doesn't guard against bad code.
            // Not sure which one costs more gas, leaving both in.
            // if iszero(extcodesize(deployment)) {
            //     revert(0, 0)
            // }
        }
        if (deployment != _id2ad(id)) revert('Bad deployment');
    }

    function _implement(bytes memory initCode)
        internal
        returns (address implementation)
    {
        assembly {
            implementation := create(0, add(initCode, 0x20), mload(initCode))
        }
        if (implementation == address(0)) revert('Bad deployment');
    }

    function _storeImplementation(address implementation) internal {
        bytes32 implementationSlot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(implementationSlot, implementation)
        }
    }

    function _id2ad(bytes32 id) internal view returns (address addy) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                hex'ff',
                                address(this),
                                id,
                                mmCodeHash
                            )
                        )
                    )
                )
            );
    }
}
