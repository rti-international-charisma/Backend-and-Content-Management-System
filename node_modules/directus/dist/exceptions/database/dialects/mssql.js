"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractError = void 0;
const invalid_foreign_key_1 = require("../invalid-foreign-key");
const not_null_violation_1 = require("../not-null-violation");
const record_not_unique_1 = require("../record-not-unique");
const value_too_long_1 = require("../value-too-long");
const value_out_of_range_1 = require("../value-out-of-range");
const database_1 = __importDefault(require("../../../database"));
var MSSQLErrorCodes;
(function (MSSQLErrorCodes) {
    MSSQLErrorCodes[MSSQLErrorCodes["FOREIGN_KEY_VIOLATION"] = 547] = "FOREIGN_KEY_VIOLATION";
    MSSQLErrorCodes[MSSQLErrorCodes["NOT_NULL_VIOLATION"] = 515] = "NOT_NULL_VIOLATION";
    MSSQLErrorCodes[MSSQLErrorCodes["NUMERIC_VALUE_OUT_OF_RANGE"] = 220] = "NUMERIC_VALUE_OUT_OF_RANGE";
    MSSQLErrorCodes[MSSQLErrorCodes["UNIQUE_VIOLATION"] = 2601] = "UNIQUE_VIOLATION";
    MSSQLErrorCodes[MSSQLErrorCodes["VALUE_LIMIT_VIOLATION"] = 2628] = "VALUE_LIMIT_VIOLATION";
})(MSSQLErrorCodes || (MSSQLErrorCodes = {}));
function extractError(error) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (error.number) {
            case MSSQLErrorCodes.UNIQUE_VIOLATION:
            case 2627:
                return yield uniqueViolation(error);
            case MSSQLErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
                return numericValueOutOfRange(error);
            case MSSQLErrorCodes.VALUE_LIMIT_VIOLATION:
                return valueLimitViolation(error);
            case MSSQLErrorCodes.NOT_NULL_VIOLATION:
                return notNullViolation(error);
            case MSSQLErrorCodes.FOREIGN_KEY_VIOLATION:
                return foreignKeyViolation(error);
        }
        return error;
    });
}
exports.extractError = extractError;
function uniqueViolation(error) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * NOTE:
         * SQL Server doesn't return the name of the offending column when a unique constraint is thrown:
         *
         * insert into [articles] ([unique]) values (@p0)
         * - Violation of UNIQUE KEY constraint 'UQ__articles__5A062640242004EB'.
         * Cannot insert duplicate key in object 'dbo.articles'. The duplicate key value is (rijk).
         *
         * While it's not ideal, the best next thing we can do is extract the column name from
         * information_schema when this happens
         */
        const betweenQuotes = /\'([^\']+)\'/;
        const betweenParens = /\(([^\)]+)\)/g;
        const quoteMatches = error.message.match(betweenQuotes);
        const parenMatches = error.message.match(betweenParens);
        if (!quoteMatches || !parenMatches)
            return error;
        const keyName = quoteMatches[1];
        const constraintUsage = yield database_1.default
            .select('*')
            .from('INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE')
            .where({
            CONSTRAINT_NAME: keyName,
        })
            .first();
        const collection = constraintUsage.TABLE_NAME;
        const field = constraintUsage.COLUMN_NAME;
        const invalid = parenMatches[parenMatches.length - 1].slice(1, -1);
        return new record_not_unique_1.RecordNotUniqueException(field, {
            collection,
            field,
            invalid,
        });
    });
}
function numericValueOutOfRange(error) {
    const betweenBrackets = /\[([^\]]+)\]/g;
    const bracketMatches = error.message.match(betweenBrackets);
    if (!bracketMatches)
        return error;
    const collection = bracketMatches[0].slice(1, -1);
    /**
     * NOTE
     * MS SQL Doesn't return the offending column name in the error, nor any other identifying information
     * we can use to extract the column name :(
     *
     * insert into [test1] ([small]) values (@p0)
     * - Arithmetic overflow error for data type tinyint, value = 50000.
     */
    const field = null;
    const parts = error.message.split(' ');
    const invalid = parts[parts.length - 1].slice(0, -1);
    return new value_out_of_range_1.ValueOutOfRangeException(field, {
        collection,
        field,
        invalid,
    });
}
function valueLimitViolation(error) {
    const betweenBrackets = /\[([^\]]+)\]/g;
    const betweenQuotes = /\'([^\']+)\'/g;
    const bracketMatches = error.message.match(betweenBrackets);
    const quoteMatches = error.message.match(betweenQuotes);
    if (!bracketMatches || !quoteMatches)
        return error;
    const collection = bracketMatches[0].slice(1, -1);
    const field = quoteMatches[1].slice(1, -1);
    return new value_too_long_1.ValueTooLongException(field, {
        collection,
        field,
    });
}
function notNullViolation(error) {
    const betweenBrackets = /\[([^\]]+)\]/g;
    const betweenQuotes = /\'([^\']+)\'/g;
    const bracketMatches = error.message.match(betweenBrackets);
    const quoteMatches = error.message.match(betweenQuotes);
    if (!bracketMatches || !quoteMatches)
        return error;
    const collection = bracketMatches[0].slice(1, -1);
    const field = quoteMatches[0].slice(1, -1);
    return new not_null_violation_1.NotNullViolationException(field, {
        collection,
        field,
    });
}
function foreignKeyViolation(error) {
    const betweenUnderscores = /\_\_(.+)\_\_/g;
    const betweenParens = /\(([^\)]+)\)/g;
    // NOTE:
    // Seeing that MS SQL doesn't return the offending column name, we have to extract it from the
    // foreign key constraint name as generated by the database. This'll probably fail if you have
    // custom names for whatever reason.
    const underscoreMatches = error.message.match(betweenUnderscores);
    const parenMatches = error.message.match(betweenParens);
    if (!underscoreMatches || !parenMatches)
        return error;
    const underscoreParts = underscoreMatches[0].split('__');
    const collection = underscoreParts[1];
    const field = underscoreParts[2];
    return new invalid_foreign_key_1.InvalidForeignKeyException(field, {
        collection,
        field,
    });
}
