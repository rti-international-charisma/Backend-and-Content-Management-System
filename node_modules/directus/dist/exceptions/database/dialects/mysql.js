"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractError = void 0;
const invalid_foreign_key_1 = require("../invalid-foreign-key");
const not_null_violation_1 = require("../not-null-violation");
const record_not_unique_1 = require("../record-not-unique");
const value_too_long_1 = require("../value-too-long");
const value_out_of_range_1 = require("../value-out-of-range");
var MySQLErrorCodes;
(function (MySQLErrorCodes) {
    MySQLErrorCodes["UNIQUE_VIOLATION"] = "ER_DUP_ENTRY";
    MySQLErrorCodes["NUMERIC_VALUE_OUT_OF_RANGE"] = "ER_WARN_DATA_OUT_OF_RANGE";
    MySQLErrorCodes["ER_DATA_TOO_LONG"] = "ER_DATA_TOO_LONG";
    MySQLErrorCodes["NOT_NULL_VIOLATION"] = "ER_BAD_NULL_ERROR";
    MySQLErrorCodes["FOREIGN_KEY_VIOLATION"] = "ER_NO_REFERENCED_ROW_2";
})(MySQLErrorCodes || (MySQLErrorCodes = {}));
function extractError(error) {
    switch (error.code) {
        case MySQLErrorCodes.UNIQUE_VIOLATION:
            return uniqueViolation(error);
        case MySQLErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
            return numericValueOutOfRange(error);
        case MySQLErrorCodes.ER_DATA_TOO_LONG:
            return valueLimitViolation(error);
        case MySQLErrorCodes.NOT_NULL_VIOLATION:
            return notNullViolation(error);
        case MySQLErrorCodes.FOREIGN_KEY_VIOLATION:
            return foreignKeyViolation(error);
    }
    return error;
}
exports.extractError = extractError;
function uniqueViolation(error) {
    const betweenQuotes = /\'([^\']+)\'/g;
    const matches = error.sqlMessage.match(betweenQuotes);
    if (!matches)
        return error;
    const collection = matches[1].slice(1, -1).split('.')[0];
    const field = matches[1].slice(1, -1).split('.')[1];
    const invalid = matches[0].slice(1, -1);
    return new record_not_unique_1.RecordNotUniqueException(field, {
        collection,
        field,
        invalid,
    });
}
function numericValueOutOfRange(error) {
    const betweenTicks = /\`([^\`]+)\`/g;
    const betweenQuotes = /\'([^\']+)\'/g;
    const tickMatches = error.sql.match(betweenTicks);
    const quoteMatches = error.sqlMessage.match(betweenQuotes);
    if (!tickMatches || !quoteMatches)
        return error;
    const collection = tickMatches[0].slice(1, -1);
    const field = quoteMatches[0].slice(1, -1);
    return new value_out_of_range_1.ValueOutOfRangeException(field, {
        collection,
        field,
    });
}
function valueLimitViolation(error) {
    const betweenTicks = /\`([^\`]+)\`/g;
    const betweenQuotes = /\'([^\']+)\'/g;
    const tickMatches = error.sql.match(betweenTicks);
    const quoteMatches = error.sqlMessage.match(betweenQuotes);
    if (!tickMatches || !quoteMatches)
        return error;
    const collection = tickMatches[0].slice(1, -1);
    const field = quoteMatches[0].slice(1, -1);
    return new value_too_long_1.ValueTooLongException(field, {
        collection,
        field,
    });
}
function notNullViolation(error) {
    const betweenTicks = /\`([^\`]+)\`/g;
    const betweenQuotes = /\'([^\']+)\'/g;
    const tickMatches = error.sql.match(betweenTicks);
    const quoteMatches = error.sqlMessage.match(betweenQuotes);
    if (!tickMatches || !quoteMatches)
        return error;
    const collection = tickMatches[0].slice(1, -1);
    const field = quoteMatches[0].slice(1, -1);
    return new not_null_violation_1.NotNullViolationException(field, {
        collection,
        field,
    });
}
function foreignKeyViolation(error) {
    const betweenTicks = /\`([^\`]+)\`/g;
    const betweenParens = /\(([^\)]+)\)/g;
    const tickMatches = error.sqlMessage.match(betweenTicks);
    const parenMatches = error.sql.match(betweenParens);
    if (!tickMatches || !parenMatches)
        return error;
    const collection = tickMatches[1].slice(1, -1);
    const field = tickMatches[3].slice(1, -1);
    const invalid = parenMatches[1].slice(1, -1);
    return new invalid_foreign_key_1.InvalidForeignKeyException(field, {
        collection,
        field,
        invalid,
    });
}
