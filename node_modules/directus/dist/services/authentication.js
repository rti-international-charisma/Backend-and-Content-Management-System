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
exports.AuthenticationService = void 0;
const database_1 = __importDefault(require("../database"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const argon2_1 = __importDefault(require("argon2"));
const nanoid_1 = require("nanoid");
const ms_1 = __importDefault(require("ms"));
const exceptions_1 = require("../exceptions");
const types_1 = require("../types");
const activity_1 = require("../services/activity");
const env_1 = __importDefault(require("../env"));
const otplib_1 = require("otplib");
const emitter_1 = __importStar(require("../emitter"));
const lodash_1 = require("lodash");
class AuthenticationService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.activityService = new activity_1.ActivityService({ knex: this.knex, schema: options.schema });
        this.schema = options.schema;
    }
    /**
     * Retrieve the tokens for a given user email.
     *
     * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
     * to handle password existence checks elsewhere
     */
    authenticate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, ip, userAgent, otp } = options;
            const hookPayload = lodash_1.omit(options, 'password', 'otp');
            const user = yield database_1.default
                .select('id', 'password', 'role', 'tfa_secret', 'status')
                .from('directus_users')
                .where({ email })
                .first();
            yield emitter_1.default.emitAsync('auth.login.before', hookPayload, {
                event: 'auth.login.before',
                action: 'login',
                schema: this.schema,
                payload: hookPayload,
                accountability: this.accountability,
                status: 'pending',
                user: user === null || user === void 0 ? void 0 : user.id,
            });
            const emitStatus = (status) => {
                emitter_1.emitAsyncSafe('auth.login', hookPayload, {
                    event: 'auth.login',
                    action: 'login',
                    schema: this.schema,
                    payload: hookPayload,
                    accountability: this.accountability,
                    status,
                    user: user === null || user === void 0 ? void 0 : user.id,
                });
            };
            if (!user || user.status !== 'active') {
                emitStatus('fail');
                throw new exceptions_1.InvalidCredentialsException();
            }
            if (password !== undefined) {
                if (!user.password) {
                    emitStatus('fail');
                    throw new exceptions_1.InvalidCredentialsException();
                }
                if ((yield argon2_1.default.verify(user.password, password)) === false) {
                    emitStatus('fail');
                    throw new exceptions_1.InvalidCredentialsException();
                }
            }
            if (user.tfa_secret && !otp) {
                emitStatus('fail');
                throw new exceptions_1.InvalidOTPException(`"otp" is required`);
            }
            if (user.tfa_secret && otp) {
                const otpValid = yield this.verifyOTP(user.id, otp);
                if (otpValid === false) {
                    emitStatus('fail');
                    throw new exceptions_1.InvalidOTPException(`"otp" is invalid`);
                }
            }
            const payload = {
                id: user.id,
            };
            /**
             * @TODO
             * Sign token with combination of server secret + user password hash
             * That way, old tokens are immediately invalidated whenever the user changes their password
             */
            const accessToken = jsonwebtoken_1.default.sign(payload, env_1.default.SECRET, {
                expiresIn: env_1.default.ACCESS_TOKEN_TTL,
            });
            const refreshToken = nanoid_1.nanoid(64);
            const refreshTokenExpiration = new Date(Date.now() + ms_1.default(env_1.default.REFRESH_TOKEN_TTL));
            yield database_1.default('directus_sessions').insert({
                token: refreshToken,
                user: user.id,
                expires: refreshTokenExpiration,
                ip,
                user_agent: userAgent,
            });
            yield database_1.default('directus_sessions').delete().where('expires', '<', new Date());
            if (this.accountability) {
                yield this.activityService.create({
                    action: types_1.Action.AUTHENTICATE,
                    user: user.id,
                    ip: this.accountability.ip,
                    user_agent: this.accountability.userAgent,
                    collection: 'directus_users',
                    item: user.id,
                });
            }
            emitStatus('success');
            return {
                accessToken,
                refreshToken,
                expires: ms_1.default(env_1.default.ACCESS_TOKEN_TTL),
                id: user.id,
            };
        });
    }
    refresh(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!refreshToken) {
                throw new exceptions_1.InvalidCredentialsException();
            }
            const record = yield database_1.default
                .select('directus_sessions.*', 'directus_users.email', 'directus_users.id')
                .from('directus_sessions')
                .where({ 'directus_sessions.token': refreshToken })
                .leftJoin('directus_users', 'directus_sessions.user', 'directus_users.id')
                .first();
            if (!record || !record.email || record.expires < new Date()) {
                throw new exceptions_1.InvalidCredentialsException();
            }
            const accessToken = jsonwebtoken_1.default.sign({ id: record.id }, env_1.default.SECRET, {
                expiresIn: env_1.default.ACCESS_TOKEN_TTL,
            });
            const newRefreshToken = nanoid_1.nanoid(64);
            const refreshTokenExpiration = new Date(Date.now() + ms_1.default(env_1.default.REFRESH_TOKEN_TTL));
            yield this.knex('directus_sessions')
                .update({ token: newRefreshToken, expires: refreshTokenExpiration })
                .where({ token: refreshToken });
            return {
                accessToken,
                refreshToken: newRefreshToken,
                expires: ms_1.default(env_1.default.ACCESS_TOKEN_TTL),
                id: record.id,
            };
        });
    }
    logout(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.knex.delete().from('directus_sessions').where({ token: refreshToken });
        });
    }
    generateTFASecret() {
        const secret = otplib_1.authenticator.generateSecret();
        return secret;
    }
    generateOTPAuthURL(pk, secret) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.knex.select('first_name', 'last_name').from('directus_users').where({ id: pk }).first();
            const name = `${user.first_name} ${user.last_name}`;
            return otplib_1.authenticator.keyuri(name, 'Directus', secret);
        });
    }
    verifyOTP(pk, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();
            if (!user.tfa_secret) {
                throw new exceptions_1.InvalidPayloadException(`User "${pk}" doesn't have TFA enabled.`);
            }
            const secret = user.tfa_secret;
            return otplib_1.authenticator.check(otp, secret);
        });
    }
    verifyPassword(pk, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRecord = yield this.knex.select('password').from('directus_users').where({ id: pk }).first();
            if (!userRecord || !userRecord.password) {
                throw new exceptions_1.InvalidCredentialsException();
            }
            if ((yield argon2_1.default.verify(userRecord.password, password)) === false) {
                throw new exceptions_1.InvalidCredentialsException();
            }
            return true;
        });
    }
}
exports.AuthenticationService = AuthenticationService;
