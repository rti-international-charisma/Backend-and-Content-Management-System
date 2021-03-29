"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnprocessableEntityException = void 0;
const base_1 = require("./base");
class UnprocessableEntityException extends base_1.BaseException {
    constructor(message) {
        super(message, 422, 'UNPROCESSABLE_ENTITY');
    }
}
exports.UnprocessableEntityException = UnprocessableEntityException;
