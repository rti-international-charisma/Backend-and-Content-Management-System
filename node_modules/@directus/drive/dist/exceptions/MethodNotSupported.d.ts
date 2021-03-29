import { RuntimeException } from 'node-exceptions';
export declare class MethodNotSupported extends RuntimeException {
    constructor(name: string, driver: string);
}
