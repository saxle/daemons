import * as chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { noteCode } from '../src';
import { ethers } from 'hardhat';
import { FactoryMock, FallbackLogger } from '../types/typechain';
import { Signer } from '@ethersproject/abstract-signer';
import { expect } from 'chai';

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

    it.only('Deploy with makeNoteDetailed, check that bytecode makes sense, verify that address is computable, fail to destroy using signer, destroy using controller, redeploy by cloning, verify bytecode and address again.', async () => {
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
        const id = ethers.utils.solidityKeccak256(
            ['string'],
            ['test.id.note.thing']
        );
        const makeNoteTx = await factory['makeNoteDetailed'](initCode, id);
        const makeNoteRx = await makeNoteTx.wait();
        const noteImplementationAddress = ethers.utils.getAddress(
            ethers.utils.hexStripZeros(makeNoteRx.logs[0].topics[1])
        );
        const noteMetamorphicAddress = ethers.utils.getAddress(
            ethers.utils.hexStripZeros(makeNoteRx.logs[1].topics[1])
        );
        const noteRuntimeCode = await ethers.provider.getCode(
            noteMetamorphicAddress
        );
        noteRuntimeCode.substr(2).should.eq(initCode.substr(24));
        const expectedAddress = ethers.utils.getAddress(
            await factory['id2ad'](id)
        );
        noteMetamorphicAddress.should.eq(expectedAddress);
        const sdTxObj = {
            to: noteMetamorphicAddress,
            data: '0x0000005d00000000000000000000000000000000000000000000000000000000'
        };
        await signer.sendTransaction(sdTxObj).should.revertedWith('');
        await (await controller.sendTransaction(sdTxObj)).wait();
        const codeAfterSd = await ethers.provider.getCode(
            noteMetamorphicAddress
        );
        codeAfterSd.should.eq('0x');
        const cloneTx = await factory.clone(noteImplementationAddress, id);
        const cloneRx = await cloneTx.wait();
        const redeployedNoteAddress = ethers.utils.getAddress(
            ethers.utils.hexStripZeros(cloneRx.logs[0].topics[1])
        );
        redeployedNoteAddress.should.eq(noteMetamorphicAddress);
        const redeployedCode = await ethers.provider.getCode(
            redeployedNoteAddress
        );
        redeployedCode.should.eq(noteRuntimeCode);
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
        const sdTxObj = {
            to: noteImplementation,
            data: '0x0000005d00000000000000000000000000000000000000000000000000000000'
        };
        // Fails because sender isn't controller.
        await signer.sendTransaction(sdTxObj).should.revertedWith('');
        const cloneTx = await factory['clone(address,bytes32)'](
            noteImplementation,
            ethers.utils.formatBytes32String('note.test.id')
        );
        const cloneRx = await cloneTx.wait();
        const sdTx = await controller.sendTransaction(sdTxObj);
        await sdTx.wait();
        const deployedCodeAfterSd = await ethers.provider.getCode(
            noteImplementation
        );
        deployedCodeAfterSd.should.eq('0x');
    });
});
