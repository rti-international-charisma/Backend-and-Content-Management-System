"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueTooLongException = void 0;
const base_1 = require("../base");
class ValueTooLongException extends base_1.BaseException {
    constructor(field, extensions) {
        if (field) {
            super(`Value for field "${field}" is too long.`, 400, 'VALUE_TOO_LONG', extensions);
        }
        else {
            super(`Value is too long.`, 400, 'VALUE_TOO_LONG', extensions);
        }
    }
}
exports.ValueTooLongException = ValueTooLongException;
