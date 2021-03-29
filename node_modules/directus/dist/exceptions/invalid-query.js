"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidQueryException = void 0;
const base_1 = require("./base");
class InvalidQueryException extends base_1.BaseException {
    constructor(message) {
        super(message, 400, 'INVALID_QUERY');
    }
}
exports.InvalidQueryException = InvalidQueryException;
