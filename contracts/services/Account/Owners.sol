import { Config } from '../Config.sol';

contract Owners {
    function example() public {
        // This function requires getting config and doing something with it.
        bytes memory _config = Config(address(this)).getConfig();
        // We can also treat it like a library function so we can directly
        // EXTCODECOPY(msg.sender), a relatively cheap operation atm.
        Config.getConfig();
    }
}
