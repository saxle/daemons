import { ethers } from 'ethers';

// If the provided controller address isn't valid, throw.
export const checkController = (controller: string) => {
    if (!ethers.utils.isAddress(controller)) {
        throw 'Controller address invalid ' + controller;
    }
};
