"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractError = void 0;
const invalid_foreign_key_1 = require("../invalid-foreign-key");
const record_not_unique_1 = require("../record-not-unique");
const not_null_violation_1 = require("../not-null-violation");
// NOTE:
// - Sqlite doesn't have varchar with length support, so no ValueTooLongException
// - Sqlite doesn't have a max range for numbers, so no ValueOutOfRangeException
function extractError(error) {
    if (error.message.includes('SQLITE_CONSTRAINT: NOT NULL')) {
        return notNullConstraint(error);
    }
    if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
        const errorParts = error.message.split(' ');
        const [table, column] = errorParts[errorParts.length - 1].split('.');
        if (!table || !column)
            return error;
        return new record_not_unique_1.RecordNotUniqueException(column, {
            collection: table,
            field: column,
        });
    }
    if (error.message.includes('SQLITE_CONSTRAINT: FOREIGN KEY')) {
        /**
         * NOTE:
         * SQLite doesn't return any useful information in it's foreign key constraint failed error, so
         * we can't extract the table/column/value accurately
         */
        return new invalid_foreign_key_1.InvalidForeignKeyException(null);
    }
    return error;
}
exports.extractError = extractError;
function notNullConstraint(error) {
    const errorParts = error.message.split(' ');
    const [table, column] = errorParts[errorParts.length - 1].split('.');
    if (table && column) {
        return new not_null_violation_1.NotNullViolationException(column, {
            collection: table,
            field: column,
        });
    }
    return error;
}
