import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { RecordNotUniqueException } from '../record-not-unique';
import { NotNullViolationException } from '../not-null-violation';
declare type SQLiteError = {
    message: string;
    errno: number;
    code: string;
};
export declare function extractError(error: SQLiteError): InvalidForeignKeyException | NotNullViolationException | RecordNotUniqueException | SQLiteError;
export {};
