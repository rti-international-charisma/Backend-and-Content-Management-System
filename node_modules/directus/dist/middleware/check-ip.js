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
exports.checkIP = void 0;
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
exports.checkIP = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield database_1.default
        .select('ip_access')
        .from('directus_roles')
        .where({ id: req.accountability.role })
        .first();
    const ipAllowlist = ((role === null || role === void 0 ? void 0 : role.ip_access) || '').split(',').filter((ip) => ip);
    if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability.ip) === false)
        throw new exceptions_1.InvalidIPException();
    return next();
}));
