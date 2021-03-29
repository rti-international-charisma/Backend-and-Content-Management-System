import { BaseException } from './base';
import { Range } from '@directus/drive';
export declare class RangeNotSatisfiableException extends BaseException {
    constructor(range: Range);
}
