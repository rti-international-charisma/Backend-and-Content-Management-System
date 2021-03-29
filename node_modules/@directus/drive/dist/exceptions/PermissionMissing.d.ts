import { RuntimeException } from 'node-exceptions';
export declare class PermissionMissing extends RuntimeException {
    raw: Error;
    constructor(err: Error, path: string);
}
