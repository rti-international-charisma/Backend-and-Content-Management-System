"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKey = void 0;
const url_1 = __importDefault(require("url"));
function getCacheKey(req) {
    var _a;
    const path = url_1.default.parse(req.originalUrl).pathname;
    const key = `${((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.user) || 'null'}-${path}-${JSON.stringify(req.sanitizedQuery)}`;
    return key;
}
exports.getCacheKey = getCacheKey;
