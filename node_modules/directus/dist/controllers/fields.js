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
const express_1 = require("express");
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const fields_1 = require("../services/fields");
const collection_exists_1 = __importDefault(require("../middleware/collection-exists"));
const exceptions_1 = require("../exceptions");
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../types");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const constants_1 = require("../constants");
const router = express_1.Router();
router.use(use_collection_1.default('directus_fields'));
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const fields = yield service.readAll();
    res.locals.payload = { data: fields || null };
    return next();
})), respond_1.respond);
router.get('/:collection', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const fields = yield service.readAll(req.params.collection);
    res.locals.payload = { data: fields || null };
    return next();
})), respond_1.respond);
router.get('/:collection/:field', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    if (req.params.field in req.schema.tables[req.params.collection].columns === false)
        throw new exceptions_1.ForbiddenException();
    const field = yield service.readOne(req.params.collection, req.params.field);
    res.locals.payload = { data: field || null };
    return next();
})), respond_1.respond);
const newFieldSchema = joi_1.default.object({
    collection: joi_1.default.string().optional(),
    field: joi_1.default.string().required(),
    type: joi_1.default.string()
        .valid(...types_1.types, ...constants_1.ALIAS_TYPES)
        .allow(null)
        .required(),
    schema: joi_1.default.object({
        default_value: joi_1.default.any(),
        max_length: [joi_1.default.number(), joi_1.default.string(), joi_1.default.valid(null)],
        is_nullable: joi_1.default.bool(),
    })
        .unknown()
        .allow(null),
    meta: joi_1.default.any(),
});
router.post('/:collection', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const { error } = newFieldSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.InvalidPayloadException(error.message);
    }
    const field = req.body;
    yield service.createField(req.params.collection, field);
    try {
        const createdField = yield service.readOne(req.params.collection, field.field);
        res.locals.payload = { data: createdField || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.patch('/:collection', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    if (Array.isArray(req.body) === false) {
        throw new exceptions_1.InvalidPayloadException('Submitted body has to be an array.');
    }
    for (const field of req.body) {
        yield service.updateField(req.params.collection, field);
    }
    try {
        let results = [];
        for (const field of req.body) {
            const updatedField = yield service.readOne(req.params.collection, field.field);
            results.push(updatedField);
            res.locals.payload = { data: results || null };
        }
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
const updateSchema = joi_1.default.object({
    type: joi_1.default.string()
        .valid(...types_1.types, ...constants_1.ALIAS_TYPES)
        .allow(null),
    schema: joi_1.default.object({
        default_value: joi_1.default.any(),
        max_length: [joi_1.default.number(), joi_1.default.string(), joi_1.default.valid(null)],
        is_nullable: joi_1.default.bool(),
    })
        .unknown()
        .allow(null),
    meta: joi_1.default.any(),
}).unknown();
router.patch('/:collection/:field', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const { error } = updateSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.InvalidPayloadException(error.message);
    }
    if (req.body.schema && !req.body.type) {
        throw new exceptions_1.InvalidPayloadException(`You need to provide "type" when providing "schema".`);
    }
    const fieldData = req.body;
    if (!fieldData.field)
        fieldData.field = req.params.field;
    yield service.updateField(req.params.collection, fieldData);
    try {
        const updatedField = yield service.readOne(req.params.collection, req.params.field);
        res.locals.payload = { data: updatedField || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.delete('/:collection/:field', collection_exists_1.default, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new fields_1.FieldsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.deleteField(req.params.collection, req.params.field);
    return next();
})), respond_1.respond);
exports.default = router;
