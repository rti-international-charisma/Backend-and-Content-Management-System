import { RuntimeException } from 'node-exceptions';
export declare class UnknownException extends RuntimeException {
    raw: Error;
    constructor(err: Error, errorCode: string, path: string);
}
