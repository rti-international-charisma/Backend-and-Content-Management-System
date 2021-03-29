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
const exceptions_1 = require("../exceptions");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
router.use(use_collection_1.default('directus_folders'));
router.post('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const primaryKey = yield service.create(req.body);
    try {
        const record = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = { data: record || null };
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
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const records = yield service.readByQuery(req.sanitizedQuery);
    const meta = yield metaService.getMetaForQuery('directus_files', req.sanitizedQuery);
    res.locals.payload = { data: records || null, meta };
    return next();
})), respond_1.respond);
router.get('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const record = yield service.readByKey(req.params.pk, req.sanitizedQuery);
    res.locals.payload = { data: record || null };
    return next();
})), respond_1.respond);
router.patch('/:collection', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    if (Array.isArray(req.body)) {
        const primaryKeys = yield service.update(req.body);
        try {
            const result = yield service.readByKey(primaryKeys, req.sanitizedQuery);
            res.locals.payload = { data: result || null };
        }
        catch (error) {
            if (error instanceof exceptions_1.ForbiddenException) {
                return next();
            }
            throw error;
        }
        return next();
    }
    const updateSchema = joi_1.default.object({
        keys: joi_1.default.array().items(joi_1.default.alternatives(joi_1.default.string(), joi_1.default.number())).required(),
        data: joi_1.default.object().required().unknown(),
    });
    const { error } = updateSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.FailedValidationException(error.details[0]);
    }
    const primaryKeys = yield service.update(req.body.data, req.body.keys);
    try {
        const result = yield service.readByKey(primaryKeys, req.sanitizedQuery);
        res.locals.payload = { data: result || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.patch('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const primaryKey = yield service.update(req.body, req.params.pk);
    try {
        const record = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = { data: record || null };
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
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.body);
    return next();
})), respond_1.respond);
router.delete('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FoldersService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.params.pk);
    return next();
})), respond_1.respond);
exports.default = router;
