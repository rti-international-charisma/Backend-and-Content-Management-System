"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const is_jwt_1 = __importDefault(require("../utils/is-jwt"));
const database_1 = __importDefault(require("../database"));
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const exceptions_1 = require("../exceptions");
const env_1 = __importDefault(require("../env"));
/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    req.accountability = {
        user: null,
        role: null,
        admin: false,
        app: false,
        ip: req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip,
        userAgent: req.get('user-agent'),
    };
    if (!req.token)
        return next();
    if (is_jwt_1.default(req.token)) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(req.token, env_1.default.SECRET);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                throw new exceptions_1.InvalidCredentialsException('Token expired.');
            }
            else if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
                throw new exceptions_1.InvalidCredentialsException('Token invalid.');
            }
            else {
                throw err;
            }
        }
        const user = yield database_1.default
            .select('role', 'directus_roles.admin_access', 'directus_roles.app_access')
            .from('directus_users')
            .leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
            .where({
            'directus_users.id': payload.id,
            status: 'active',
        })
            .first();
        if (!user) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        req.accountability.user = payload.id;
        req.accountability.role = user.role;
        req.accountability.admin = user.admin_access === true || user.admin_access == 1;
        req.accountability.app = user.app_access === true || user.app_access == 1;
    }
    else {
        // Try finding the user with the provided token
        const user = yield database_1.default
            .select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
            .from('directus_users')
            .leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
            .where({
            'directus_users.token': req.token,
            status: 'active',
        })
            .first();
        if (!user) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        req.accountability.user = user.id;
        req.accountability.role = user.role;
        req.accountability.admin = user.admin_access === true || user.admin_access == 1;
        req.accountability.app = user.app_access === true || user.app_access == 1;
    }
    if ((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.user) {
        yield database_1.default('directus_users').update({ last_access: new Date() }).where({ id: req.accountability.user });
    }
    return next();
}));
exports.default = authenticate;
