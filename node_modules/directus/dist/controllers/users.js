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
const express_1 = __importDefault(require("express"));
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const joi_1 = __importDefault(require("joi"));
const exceptions_1 = require("../exceptions");
const services_1 = require("../services");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const router = express_1.default.Router();
router.use(use_collection_1.default('directus_users'));
router.post('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const primaryKey = yield service.create(req.body);
    try {
        const item = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = { data: item || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const item = yield service.readByQuery(req.sanitizedQuery);
    const meta = yield metaService.getMetaForQuery('directus_users', req.sanitizedQuery);
    res.locals.payload = { data: item || null, meta };
    return next();
})), respond_1.respond);
router.get('/me', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.user)) {
        throw new exceptions_1.InvalidCredentialsException();
    }
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    try {
        const item = yield service.readByKey(req.accountability.user, req.sanitizedQuery);
        res.locals.payload = { data: item || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            res.locals.payload = { data: { id: req.accountability.user } };
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.get('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.path.endsWith('me'))
        return next();
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const items = yield service.readByKey(req.params.pk, req.sanitizedQuery);
    res.locals.payload = { data: items || null };
    return next();
})), respond_1.respond);
router.patch('/me', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if (!((_b = req.accountability) === null || _b === void 0 ? void 0 : _b.user)) {
        throw new exceptions_1.InvalidCredentialsException();
    }
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const primaryKey = yield service.update(req.body, req.accountability.user);
    const item = yield service.readByKey(primaryKey, req.sanitizedQuery);
    res.locals.payload = { data: item || null };
    return next();
})), respond_1.respond);
router.patch('/me/track/page', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    if (!((_c = req.accountability) === null || _c === void 0 ? void 0 : _c.user)) {
        throw new exceptions_1.InvalidCredentialsException();
    }
    if (!req.body.last_page) {
        throw new exceptions_1.InvalidPayloadException(`"last_page" key is required.`);
    }
    const service = new services_1.UsersService({ schema: req.schema });
    yield service.update({ last_page: req.body.last_page }, req.accountability.user);
    return next();
})), respond_1.respond);
router.patch('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const primaryKey = yield service.update(req.body, req.params.pk);
    try {
        const item = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = { data: item || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.delete('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || Array.isArray(req.body) === false) {
        throw new exceptions_1.InvalidPayloadException(`Body has to be an array of primary keys`);
    }
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.body);
    return next();
})), respond_1.respond);
router.delete('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.params.pk);
    return next();
})), respond_1.respond);
const inviteSchema = joi_1.default.object({
    email: joi_1.default.alternatives(joi_1.default.string().email(), joi_1.default.array().items(joi_1.default.string().email())).required(),
    role: joi_1.default.string().uuid({ version: 'uuidv4' }).required(),
    invite_url: joi_1.default.string().uri(),
});
router.post('/invite', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = inviteSchema.validate(req.body);
    if (error)
        throw new exceptions_1.InvalidPayloadException(error.message);
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.inviteUser(req.body.email, req.body.role, req.body.invite_url || null);
    return next();
})), respond_1.respond);
const acceptInviteSchema = joi_1.default.object({
    token: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
});
router.post('/invite/accept', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = acceptInviteSchema.validate(req.body);
    if (error)
        throw new exceptions_1.InvalidPayloadException(error.message);
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.acceptInvite(req.body.token, req.body.password);
    return next();
})), respond_1.respond);
router.post('/me/tfa/enable/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    if (!((_d = req.accountability) === null || _d === void 0 ? void 0 : _d.user)) {
        throw new exceptions_1.InvalidCredentialsException();
    }
    if (!req.body.password) {
        throw new exceptions_1.InvalidPayloadException(`"password" is required`);
    }
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const authService = new services_1.AuthenticationService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield authService.verifyPassword(req.accountability.user, req.body.password);
    const { url, secret } = yield service.enableTFA(req.accountability.user);
    res.locals.payload = { data: { secret, otpauth_url: url } };
    return next();
})), respond_1.respond);
router.post('/me/tfa/disable', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    if (!((_e = req.accountability) === null || _e === void 0 ? void 0 : _e.user)) {
        throw new exceptions_1.InvalidCredentialsException();
    }
    if (!req.body.otp) {
        throw new exceptions_1.InvalidPayloadException(`"otp" is required`);
    }
    const service = new services_1.UsersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const authService = new services_1.AuthenticationService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const otpValid = yield authService.verifyOTP(req.accountability.user, req.body.otp);
    if (otpValid === false) {
        throw new exceptions_1.InvalidPayloadException(`"otp" is invalid`);
    }
    yield service.disableTFA(req.accountability.user);
    return next();
})), respond_1.respond);
exports.default = router;
