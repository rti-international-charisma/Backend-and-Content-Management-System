import { BaseException } from './base';
import { ValidationErrorItem } from 'joi';
export declare class FailedValidationException extends BaseException {
    constructor(error: ValidationErrorItem);
}
