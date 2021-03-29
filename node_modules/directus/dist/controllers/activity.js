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
const services_1 = require("../services");
const types_1 = require("../types");
const exceptions_1 = require("../exceptions");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
router.use(use_collection_1.default('directus_activity'));
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ActivityService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const records = yield service.readByQuery(req.sanitizedQuery);
    const meta = yield metaService.getMetaForQuery('directus_activity', req.sanitizedQuery);
    res.locals.payload = {
        data: records || null,
        meta,
    };
    return next();
})), respond_1.respond);
router.get('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ActivityService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const record = yield service.readByKey(req.params.pk, req.sanitizedQuery);
    res.locals.payload = {
        data: record || null,
    };
    return next();
})), respond_1.respond);
const createCommentSchema = joi_1.default.object({
    comment: joi_1.default.string().required(),
    collection: joi_1.default.string().required(),
    item: [joi_1.default.number().required(), joi_1.default.string().required()],
});
router.post('/comment', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const service = new services_1.ActivityService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const { error } = createCommentSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.InvalidPayloadException(error.message);
    }
    const primaryKey = yield service.create(Object.assign(Object.assign({}, req.body), { action: types_1.Action.COMMENT, user: (_a = req.accountability) === null || _a === void 0 ? void 0 : _a.user, ip: req.ip, user_agent: req.get('user-agent') }));
    try {
        const record = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = {
            data: record || null,
        };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
const updateCommentSchema = joi_1.default.object({
    comment: joi_1.default.string().required(),
});
router.patch('/comment/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ActivityService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const { error } = updateCommentSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.InvalidPayloadException(error.message);
    }
    const primaryKey = yield service.update(req.body, req.params.pk);
    try {
        const record = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = {
            data: record || null,
        };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.delete('/comment/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ActivityService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const adminService = new services_1.ActivityService({
        schema: req.schema,
    });
    const item = yield adminService.readByKey(req.params.pk, { fields: ['action'] });
    if (!item || item.action !== 'comment') {
        throw new exceptions_1.ForbiddenException();
    }
    yield service.delete(req.params.pk);
    return next();
})), respond_1.respond);
exports.default = router;
