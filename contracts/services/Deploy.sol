import { Factory } from '../Factory.sol';

/**
    These functions are only supposed to be called by authorized parties.
    This means we can restrict the sender to address(this) so it can only be
    invoked by self-calling.
    We can have a custom upgrade function which deploys contracts.
 */
contract Deploy is Factory {
    function deploy() public returns (address) {
        assembly {

        }
    }
}
