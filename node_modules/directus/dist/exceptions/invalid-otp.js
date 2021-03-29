"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidOTPException = void 0;
const base_1 = require("./base");
class InvalidOTPException extends base_1.BaseException {
    constructor(message = 'Invalid user OTP.') {
        super(message, 401, 'INVALID_OTP');
    }
}
exports.InvalidOTPException = InvalidOTPException;
