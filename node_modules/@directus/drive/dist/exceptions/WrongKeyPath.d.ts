import { RuntimeException } from 'node-exceptions';
export declare class WrongKeyPath extends RuntimeException {
    raw: Error;
    constructor(err: Error, path: string);
}
