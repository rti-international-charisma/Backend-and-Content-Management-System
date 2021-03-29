"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPayloadException = void 0;
const base_1 = require("./base");
class InvalidPayloadException extends base_1.BaseException {
    constructor(message) {
        super(message, 400, 'INVALID_PAYLOAD');
    }
}
exports.InvalidPayloadException = InvalidPayloadException;
