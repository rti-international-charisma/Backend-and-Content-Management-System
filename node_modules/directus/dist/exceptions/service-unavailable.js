"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableException = void 0;
const base_1 = require("./base");
class ServiceUnavailableException extends base_1.BaseException {
    constructor(message, extensions) {
        super(message, 503, 'SERVICE_UNAVAILABLE', extensions);
    }
}
exports.ServiceUnavailableException = ServiceUnavailableException;
