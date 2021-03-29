import { RuntimeException } from 'node-exceptions';
export declare class NoSuchBucket extends RuntimeException {
    raw: Error;
    constructor(err: Error, bucket: string);
}
