contract Config {
    function sign() public view returns (bytes32 sig) {
        require(msg.sender = owner());
    }

    function getConfig() public view returns (bytes memory config_) {
        assembly {
            let csize := codesize()
            codecopy(0, sub(csize, 32), 32)
            let configSize := mload(0)
            codecopy(config_, sub(csize, add(32, configSize)), configSize)
        }
    }

    function callerConfig() public view returns (bytes memory config_) {}

    function resolve(bytes4 selector) public returns (bytes24 meme) {
        assembly {
            extcodecopy()
        }
    }

    function controller(bytes memory config_)
        public
        pure
        returns (address account_)
    {
        assembly {
            account_ := mload(add(32, config_))
        }
    }

    function id() public pure returns (bytes32 id_) {
        assembly {
            id_ := mload(add(40, config_))
        }
    }
}
