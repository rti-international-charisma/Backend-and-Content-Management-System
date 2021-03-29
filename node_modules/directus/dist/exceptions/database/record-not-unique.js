"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordNotUniqueException = void 0;
const base_1 = require("../base");
class RecordNotUniqueException extends base_1.BaseException {
    constructor(field, extensions) {
        super(`Field "${field}" has to be unique.`, 400, 'RECORD_NOT_UNIQUE', extensions);
    }
}
exports.RecordNotUniqueException = RecordNotUniqueException;
