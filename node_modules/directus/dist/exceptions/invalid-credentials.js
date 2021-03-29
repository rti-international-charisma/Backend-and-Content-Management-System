"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialsException = void 0;
const base_1 = require("./base");
class InvalidCredentialsException extends base_1.BaseException {
    constructor(message = 'Invalid user credentials.') {
        super(message, 401, 'INVALID_CREDENTIALS');
    }
}
exports.InvalidCredentialsException = InvalidCredentialsException;
