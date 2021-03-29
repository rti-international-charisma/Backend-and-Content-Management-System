import { BaseException } from '../base';
declare type Extensions = {
    collection: string;
    field: string;
    invalid?: string;
};
export declare class RecordNotUniqueException extends BaseException {
    constructor(field: string, extensions?: Extensions);
}
export {};
