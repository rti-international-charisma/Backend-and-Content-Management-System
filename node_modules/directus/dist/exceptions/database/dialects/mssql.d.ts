import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';
declare type MSSQLError = {
    message: string;
    code: 'EREQUEST';
    number: number;
    state: number;
    class: number;
    serverName: string;
    procName: string;
    lineNumber: number;
};
export declare function extractError(error: MSSQLError): Promise<InvalidForeignKeyException | NotNullViolationException | RecordNotUniqueException | ValueTooLongException | ValueOutOfRangeException | MSSQLError>;
export {};
