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

/**
    @title Factory
    @author Jeremi G. <jeremig@saxle.io>
    Package containing all necessary functions to work with daemons/metamorphic
    contracts.
 */
abstract contract Factory {
    bytes32 internal constant IMPLEMENTATION_SLOT =
        keccak256('daemon.factory.implementationSlot');

    /**
        Get the implementation currently stored in IMPLEMENTATION_SLOT.
        @dev This function is called in the initialization code of a metamorphic
        contract to get the address from which to copy runtime code.
     */
    function getImplementation() public view returns (address implementation) {
        bytes32 implementationSlot = IMPLEMENTATION_SLOT;
        assembly {
            implementation := sload(implementationSlot)
        }
    }

    /**
        Make a new metamorphic contract.
        @param initCode bytes memory
        @param id bytes32
     */
    function _make(bytes memory initCode, bytes32 id)
        internal
        returns (address metamorphic)
    {
        _storeImplementation(_implement(initCode));
        metamorphic = _deploy(id);
    }

    /**
        Deploys a metamorphic contract.
        @dev The implementation contract's address must be stored. This can be
        achieved by calling _storeImplementation, which is done by either the
        _make or the _clone function. If those functions are not called before
        this one, you can also call _storeImplementation directly.
        @param id bytes32
     */
    function _deploy(bytes32 id) internal returns (address deployment) {
        bytes memory mmInitCode = mmCode;
        assembly {
            deployment := create2(
                0,
                add(0x20, mmInitCode),
                mload(mmInitCode),
                id
            )
        }
        if (deployment != _id2ad(id)) revert('Bad deployment');
    }

    /**
        Implement a contract.
        @dev Implementation code is meant to be copied by the initialization
        code of a metamorphic contract and returned as its runtime code.
        @param initCode bytes memory initialization code of the implementation.
     */
    function _implement(bytes memory initCode)
        internal
        returns (address implementation)
    {
        assembly {
            implementation := create(0, add(initCode, 0x20), mload(initCode))
        }
        if (implementation == address(0)) revert('Bad deployment');
    }

    /**
        Make a metamorphic contract without implementing bytecode.
        @param target address of the contract with bytecode the metamorphic
        contract will copy.
        @param id bytes32
     */
    function _clone(address target, bytes32 id)
        internal
        returns (address instance)
    {
        _storeImplementation(target);
        instance = _deploy(id);
    }

    /**
        Store an implementation address in a pre-determined slot.
        @param implementation address
     */
    function _storeImplementation(address implementation) internal {
        bytes32 implementationSlot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(implementationSlot, implementation)
        }
    }

    /**
        Compute the address of a metamorphic contract deployed by this contract.
        @param id bytes32
     */
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
