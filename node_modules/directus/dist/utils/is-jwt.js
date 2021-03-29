"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atob_1 = __importDefault(require("atob"));
const logger_1 = __importDefault(require("../logger"));
/**
 * Check if a given string conforms to the structure of a JWT.
 */
function isJWT(string) {
    const parts = string.split('.');
    // JWTs have the structure header.payload.signature
    if (parts.length !== 3)
        return false;
    // Check if all segments are base64 encoded
    try {
        atob_1.default(parts[0]);
        atob_1.default(parts[1]);
        atob_1.default(parts[2]);
    }
    catch (err) {
        logger_1.default.error(err);
        return false;
    }
    // Check if the header and payload are valid JSON
    try {
        JSON.parse(atob_1.default(parts[0]));
        JSON.parse(atob_1.default(parts[1]));
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.default = isJWT;
