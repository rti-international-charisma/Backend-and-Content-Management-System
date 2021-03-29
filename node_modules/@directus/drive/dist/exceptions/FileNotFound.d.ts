import { RuntimeException } from 'node-exceptions';
export declare class FileNotFound extends RuntimeException {
    raw: Error;
    constructor(err: Error, path: string);
}
