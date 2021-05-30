/**
    EXTCODECOPY msg.sender in a similar fashion.
    The last 32 bytes of the daemon's code should contain its ID.
    This works well because that contract is already loaded.
    Also, it uses the same mechanism as the daemon on the note.
    Theoretically we could build a module which allows people to switch into
    bytecode mode depending on the selector. Maybe some mechanism called in the
    fallback function would be iedal.
 */

/**
      This function gets called in the consumer's fallback if they can detect
      anything.
  */
function handleDaemon() returns (address note, bytes32 id) {
    // EXTCODECOPY msg.sender to get the note address.
    assembly {
        function _id2ad() -> addy {

        }
        let csize := codesize()
        codecopy(address())
        extcodecopy(caller(), 0, daemonCodeIdPC, 32)
        let selector := div(
            calldataload(0),
            0x100000000000000000000000000000000000000000000000000000000000000000000000
        )
    }

    // function _id2ad(bytes32 id) internal view returns (address addy) {
    //     return
    //         address(
    //             uint160(
    //                 uint256(
    //                     keccak256(
    //                         abi.encodePacked(
    //                             hex'ff',
    //                             address(this),
    //                             id,
    //                             mmCodeHash
    //                         )
    //                     )
    //                 )
    //             )
    //         );
    // }
}
