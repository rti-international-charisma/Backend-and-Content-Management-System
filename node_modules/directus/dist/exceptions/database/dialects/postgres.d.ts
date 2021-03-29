import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';
declare type PostgresError = {
    message: string;
    length: number;
    code: string;
    detail: string;
    schema: string;
    table: string;
    column?: string;
    dataType?: string;
    constraint?: string;
};
export declare function extractError(error: PostgresError): InvalidForeignKeyException | NotNullViolationException | RecordNotUniqueException | ValueTooLongException | ValueOutOfRangeException | PostgresError;
export {};
