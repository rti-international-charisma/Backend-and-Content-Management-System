import { BaseException } from './base';
import { Permission } from '../types';
declare type Extensions = {
    field?: string;
    collection?: string;
    item?: string | number | (string | number)[];
    action?: Permission['action'];
};
export declare class ForbiddenException extends BaseException {
    constructor(message?: string, extensions?: Extensions);
}
export {};
