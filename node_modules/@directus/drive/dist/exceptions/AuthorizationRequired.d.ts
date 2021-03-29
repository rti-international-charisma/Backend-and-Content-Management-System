import { RuntimeException } from 'node-exceptions';
export declare class AuthorizationRequired extends RuntimeException {
    raw: Error;
    constructor(err: Error, path: string);
}
