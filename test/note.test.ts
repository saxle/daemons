import * as chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { noteCode } from '../src';
import { ethers } from 'hardhat';
import { FactoryMock, FallbackLogger } from '../types/typechain';
import { Signer } from '@ethersproject/abstract-signer';

chai.use(solidity);
chai.should();

describe('Note', () => {
    let factory: FactoryMock;
    let fallbackLogger: FallbackLogger;
    let signer: Signer;

    before(async () => {
        signer = ethers.provider.getSigner(0);

        factory = (await (await ethers.getContractFactory('FactoryMock'))
            .connect(signer)
            .deploy()) as FactoryMock;

        fallbackLogger = (await (
            await ethers.getContractFactory('FallbackLogger')
        )
            .connect(signer)
            .deploy()) as FallbackLogger;
    });

    it('Should be properly made', async () => {
        const numTargets = 10;
        const targets: string[] = [
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address,
            fallbackLogger.address
        ];
        const controller = ethers.provider.getSigner(1);
        const initCode = noteCode(
            targets,
            BigInt(numTargets),
            await controller.getAddress()
        );
        const implementTx = await factory['implement(bytes)'](initCode);
        const implementRx = await implementTx.wait();
        const noteImplementation = ethers.utils.hexStripZeros(
            implementRx.logs[0].topics[1]
        );
        const deployedCode = await ethers.provider.getCode(noteImplementation);
        deployedCode.substr(2).should.eq(initCode.substr(24));
        const sdTx = await controller.sendTransaction({
            to: noteImplementation,
            data: '0x0000005d00000000000000000000000000000000000000000000000000000000'
        });
        await sdTx.wait();
        const deployedCodeAfterSd = await ethers.provider.getCode(
            noteImplementation
        );
        deployedCodeAfterSd.should.eq('0x');
    });
});
