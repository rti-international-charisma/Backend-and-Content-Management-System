import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';
declare type MySQLError = {
    message: string;
    code: string;
    errno: number;
    sqlMessage: string;
    sqlState: string;
    index: number;
    sql: string;
};
export declare function extractError(error: MySQLError): InvalidForeignKeyException | NotNullViolationException | RecordNotUniqueException | ValueTooLongException | ValueOutOfRangeException | MySQLError;
export {};
