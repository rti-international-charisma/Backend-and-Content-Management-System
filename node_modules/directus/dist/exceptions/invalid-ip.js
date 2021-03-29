"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidIPException = void 0;
const base_1 = require("./base");
class InvalidIPException extends base_1.BaseException {
    constructor(message = 'Invalid IP address.') {
        super(message, 401, 'INVALID_IP');
    }
}
exports.InvalidIPException = InvalidIPException;
