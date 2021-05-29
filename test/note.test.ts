import * as chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { noteCode } from '../src';

chai.use(solidity);
chai.should();

describe('Note', () => {
    it('', async () => {
        const targets = [''];
        const controller = '';
        const initCode = noteCode(targets, 10n, controller);
    });
});
