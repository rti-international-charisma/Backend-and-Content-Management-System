"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitRateLimitException = void 0;
const base_1 = require("./base");
class HitRateLimitException extends base_1.BaseException {
    constructor(message, extensions) {
        super(message, 429, 'REQUESTS_EXCEEDED', extensions);
    }
}
exports.HitRateLimitException = HitRateLimitException;
