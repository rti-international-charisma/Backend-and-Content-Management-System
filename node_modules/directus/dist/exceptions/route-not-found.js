"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteNotFoundException = void 0;
const base_1 = require("./base");
class RouteNotFoundException extends base_1.BaseException {
    constructor(path) {
        super(`Route ${path} doesn't exist.`, 404, 'ROUTE_NOT_FOUND');
    }
}
exports.RouteNotFoundException = RouteNotFoundException;
