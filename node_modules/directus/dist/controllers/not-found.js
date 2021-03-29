"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
const emitter_1 = __importDefault(require("../emitter"));
/**
 * Handles not found routes.
 *
 * - If a hook throws an error, the error gets forwarded to the error handler.
 * - If a hook returns true, the handler assumes the response has been
 *   processed and won't generate a response.
 *
 * @param req
 * @param res
 * @param next
 */
const notFound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ret = yield emitter_1.default.emitAsync('request.not_found', req, res);
        if (ret.reduce((prev, current) => current || prev, false)) {
            return next();
        }
        next(new exceptions_1.RouteNotFoundException(req.path));
    }
    catch (err) {
        next(err);
    }
});
exports.default = notFound;
